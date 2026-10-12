-- Keep database values compatible with Soroban Symbol's 32-byte limit.
alter table public.impact_action_types
  drop constraint impact_action_types_code_check,
  add constraint impact_action_types_code_check
    check (code ~ '^[a-z][a-z0-9_]{2,31}$');

-- Represent the off-chain/on-chain hand-off explicitly so a failed or timed-out
-- request can be reconciled without issuing a second credential.
alter table public.impact_actions
  drop constraint impact_actions_status_check,
  drop constraint impact_actions_validation_time_matches_status,
  add constraint impact_actions_status_check
    check (status in ('pending', 'anchoring', 'anchor_failed', 'validated', 'rejected')),
  add constraint impact_actions_validation_time_matches_status check (
    (status in ('pending', 'anchoring', 'anchor_failed') and validated_at is null)
    or (status in ('validated', 'rejected') and validated_at is not null)
  );

alter table public.impact_credentials
  drop constraint impact_credentials_status_check,
  add constraint impact_credentials_status_check
    check (status in ('pending_anchor', 'anchor_submitted', 'active', 'anchor_failed', 'revoked'));

drop index if exists public.impact_actions_review_queue_idx;
create index impact_actions_review_queue_idx
  on public.impact_actions(community_id, submitted_at)
  where status in ('pending', 'anchoring', 'anchor_failed');

drop function if exists public.review_impact_action(uuid, text, text, text);

create function public.review_impact_action(
  p_action_id uuid,
  p_reviewer_user_id uuid,
  p_decision text,
  p_note text default null,
  p_stellar_network text default 'testnet'
)
returns table (
  action_id uuid,
  credential_id uuid,
  subject_id uuid,
  subject_commitment text,
  action_type_code text,
  points integer,
  rule_version integer,
  claim_hash text,
  onchain_credential_id text,
  issued_at timestamptz,
  credential_status text,
  stellar_transaction_hash text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  action_row public.impact_actions%rowtype;
  rule_row public.impact_action_types%rowtype;
  credential_row public.impact_credentials%rowtype;
  new_credential_id uuid;
  new_subject_commitment text;
  new_claim_hash text;
  new_onchain_credential_id text;
  reviewed_at timestamptz := now();
begin
  if p_reviewer_user_id is null then
    raise exception 'reviewer is required' using errcode = '22023';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'invalid review decision' using errcode = '22023';
  end if;
  if p_stellar_network not in ('testnet', 'public') then
    raise exception 'invalid Stellar network' using errcode = '22023';
  end if;
  if p_note is not null and char_length(p_note) > 500 then
    raise exception 'review note is too long' using errcode = '22001';
  end if;

  select * into action_row
  from public.impact_actions
  where id = p_action_id
  for update;

  if not found then
    raise exception 'impact action not found' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public.community_members as membership
    where membership.community_id = action_row.community_id
      and membership.user_id = p_reviewer_user_id
      and membership.role in ('moderator', 'admin')
  ) then
    raise exception 'reviewer is not authorized for this community' using errcode = '42501';
  end if;

  if action_row.status in ('anchoring', 'anchor_failed', 'validated') then
    if p_decision <> 'approved' then
      raise exception 'approved action cannot be rejected during anchoring' using errcode = '23505';
    end if;
    select * into strict credential_row
    from public.impact_credentials
    where action_id = action_row.id;

    if action_row.status <> 'validated' then
      update public.impact_actions set status = 'anchoring' where id = action_row.id;
    end if;

    return query select
      action_row.id,
      credential_row.id,
      credential_row.subject_id,
      credential_row.subject_commitment,
      credential_row.action_type_code,
      credential_row.points,
      credential_row.rule_version,
      credential_row.claim_hash,
      credential_row.onchain_credential_id,
      credential_row.issued_at,
      credential_row.status,
      credential_row.stellar_transaction_hash;
    return;
  end if;

  if action_row.status <> 'pending' then
    raise exception 'impact action was already reviewed' using errcode = '23505';
  end if;

  select * into strict rule_row
  from public.impact_action_types
  where code = action_row.action_type_code and is_active;

  insert into public.impact_action_validations (
    action_id, validator_user_id, decision, note, points_awarded, rule_version
  ) values (
    action_row.id,
    p_reviewer_user_id,
    p_decision,
    nullif(btrim(p_note), ''),
    case when p_decision = 'approved' then rule_row.points else 0 end,
    rule_row.rule_version
  );

  if p_decision = 'rejected' then
    update public.impact_actions
    set status = 'rejected', validated_at = reviewed_at
    where id = action_row.id;
    return;
  end if;

  update public.impact_actions
  set status = 'anchoring', validated_at = null
  where id = action_row.id;

  new_credential_id := gen_random_uuid();
  new_subject_commitment := encode(extensions.digest(
    action_row.community_id::text || ':' || action_row.actor_id::text || ':tribuus-impact-v1',
    'sha256'
  ), 'hex');
  new_onchain_credential_id := encode(extensions.digest(new_credential_id::text, 'sha256'), 'hex');
  new_claim_hash := encode(extensions.digest(
    jsonb_build_object(
      'action_id', action_row.id,
      'action_type', action_row.action_type_code,
      'community_id', action_row.community_id,
      'credential_id', new_credential_id,
      'decision', p_decision,
      'evidence_digest', action_row.evidence_digest,
      'issued_at', reviewed_at,
      'points', rule_row.points,
      'reviewer_id', p_reviewer_user_id,
      'rule_version', rule_row.rule_version,
      'subject_commitment', new_subject_commitment
    )::text,
    'sha256'
  ), 'hex');

  insert into public.impact_credentials (
    id, action_id, community_id, subject_id, action_type_code, points, rule_version,
    subject_commitment, claim_hash, onchain_credential_id, stellar_network, issued_at
  ) values (
    new_credential_id,
    action_row.id,
    action_row.community_id,
    action_row.actor_id,
    action_row.action_type_code,
    rule_row.points,
    rule_row.rule_version,
    new_subject_commitment,
    new_claim_hash,
    new_onchain_credential_id,
    p_stellar_network,
    reviewed_at
  ) returning * into credential_row;

  return query select
    action_row.id,
    credential_row.id,
    credential_row.subject_id,
    credential_row.subject_commitment,
    credential_row.action_type_code,
    credential_row.points,
    credential_row.rule_version,
    credential_row.claim_hash,
    credential_row.onchain_credential_id,
    credential_row.issued_at,
    credential_row.status,
    credential_row.stellar_transaction_hash;
end;
$$;

revoke all on function public.review_impact_action(uuid, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.review_impact_action(uuid, uuid, text, text, text)
  to service_role;

create function public.mark_impact_anchor_submitted(
  p_credential_id uuid,
  p_contract_id text,
  p_transaction_hash text,
  p_stellar_network text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
  current_transaction_hash text;
begin
  if p_stellar_network not in ('testnet', 'public')
    or p_contract_id !~ '^C[A-Z2-7]{55}$'
    or p_transaction_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid Stellar anchor metadata' using errcode = '22023';
  end if;

  select status, stellar_transaction_hash
  into current_status, current_transaction_hash
  from public.impact_credentials
  where id = p_credential_id
  for update;

  if not found or current_status not in ('pending_anchor', 'anchor_failed', 'anchor_submitted') then
    raise exception 'credential is not awaiting an anchor' using errcode = 'P0002';
  end if;
  if current_status = 'anchor_submitted'
    and current_transaction_hash is distinct from p_transaction_hash then
    raise exception 'credential already has a different transaction in flight' using errcode = '23505';
  end if;

  update public.impact_credentials
  set status = 'anchor_submitted',
      contract_id = p_contract_id,
      stellar_network = p_stellar_network,
      stellar_transaction_hash = p_transaction_hash,
      anchor_error = null
  where id = p_credential_id;

  update public.impact_actions as action
  set status = 'anchoring', validated_at = null
  from public.impact_credentials as credential
  where credential.id = p_credential_id and action.id = credential.action_id;
end;
$$;

create function public.complete_impact_anchor(p_credential_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.impact_credentials
  set status = 'active', anchored_at = coalesce(anchored_at, now()), anchor_error = null
  where id = p_credential_id
    and status in ('anchor_submitted', 'active')
    and contract_id is not null
    and stellar_transaction_hash is not null;

  if not found then
    raise exception 'credential has no submitted anchor' using errcode = 'P0002';
  end if;

  update public.impact_actions as action
  set status = 'validated', validated_at = coalesce(validated_at, now())
  from public.impact_credentials as credential
  where credential.id = p_credential_id and action.id = credential.action_id;
end;
$$;

create function public.fail_impact_anchor(p_credential_id uuid, p_error text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if char_length(p_error) > 500 then
    raise exception 'anchor error is too long' using errcode = '22001';
  end if;

  update public.impact_credentials
  set status = 'anchor_failed', anchor_error = p_error
  where id = p_credential_id and status in ('pending_anchor', 'anchor_submitted', 'anchor_failed');

  if found then
    update public.impact_actions as action
    set status = 'anchor_failed', validated_at = null
    from public.impact_credentials as credential
    where credential.id = p_credential_id and action.id = credential.action_id;
  end if;
end;
$$;

revoke all on function public.mark_impact_anchor_submitted(uuid, text, text, text),
  public.complete_impact_anchor(uuid), public.fail_impact_anchor(uuid, text)
from public, anon, authenticated;
grant execute on function public.mark_impact_anchor_submitted(uuid, text, text, text),
  public.complete_impact_anchor(uuid), public.fail_impact_anchor(uuid, text)
to service_role;
