create extension if not exists pgcrypto with schema extensions;

create table public.impact_action_types (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{2,39}$'),
  label text not null check (char_length(label) between 2 and 80),
  description text not null check (char_length(description) between 2 and 240),
  points integer not null check (points between 0 and 10000),
  verification_policy text not null check (char_length(verification_policy) between 2 and 240),
  rule_version integer not null default 1 check (rule_version > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.impact_issuers (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  stellar_address text check (stellar_address is null or stellar_address ~ '^G[A-Z2-7]{55}$'),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, name)
);

create table public.impact_actions (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action_type_code text not null references public.impact_action_types(code),
  description text not null check (char_length(description) between 10 and 500),
  confirmation_note text check (confirmation_note is null or char_length(confirmation_note) <= 300),
  evidence_digest text check (evidence_digest is null or evidence_digest ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending' check (status in ('pending', 'validated', 'rejected')),
  occurred_at timestamptz not null,
  submitted_at timestamptz not null default now(),
  validated_at timestamptz,
  constraint impact_actions_validation_time_matches_status check (
    (status = 'pending' and validated_at is null)
    or (status in ('validated', 'rejected') and validated_at is not null)
  )
);

create table public.impact_action_validations (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null unique references public.impact_actions(id) on delete cascade,
  validator_user_id uuid not null references public.profiles(id) on delete restrict,
  issuer_id uuid references public.impact_issuers(id) on delete restrict,
  decision text not null check (decision in ('approved', 'rejected')),
  note text check (note is null or char_length(note) <= 500),
  points_awarded integer not null default 0 check (points_awarded between 0 and 10000),
  rule_version integer not null check (rule_version > 0),
  created_at timestamptz not null default now(),
  constraint impact_validation_points_match_decision check (
    (decision = 'approved' and points_awarded > 0)
    or (decision = 'rejected' and points_awarded = 0)
  )
);

create table public.impact_credentials (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null unique references public.impact_actions(id) on delete restrict,
  community_id uuid not null references public.communities(id) on delete cascade,
  subject_id uuid not null references public.profiles(id) on delete cascade,
  action_type_code text not null references public.impact_action_types(code),
  issuer_id uuid references public.impact_issuers(id) on delete restrict,
  points integer not null check (points > 0 and points <= 10000),
  rule_version integer not null check (rule_version > 0),
  subject_commitment text not null check (subject_commitment ~ '^[0-9a-f]{64}$'),
  claim_hash text not null unique check (claim_hash ~ '^[0-9a-f]{64}$'),
  onchain_credential_id text not null unique check (onchain_credential_id ~ '^[0-9a-f]{64}$'),
  stellar_network text not null default 'testnet' check (stellar_network in ('testnet', 'public')),
  contract_id text check (contract_id is null or contract_id ~ '^C[A-Z2-7]{55}$'),
  stellar_transaction_hash text check (
    stellar_transaction_hash is null or stellar_transaction_hash ~ '^[0-9a-f]{64}$'
  ),
  status text not null default 'pending_anchor' check (
    status in ('pending_anchor', 'active', 'anchor_failed', 'revoked')
  ),
  issued_at timestamptz not null default now(),
  anchored_at timestamptz,
  revoked_at timestamptz,
  anchor_error text check (anchor_error is null or char_length(anchor_error) <= 500),
  constraint impact_credentials_anchor_state check (
    (status = 'active' and anchored_at is not null and stellar_transaction_hash is not null and contract_id is not null)
    or status <> 'active'
  ),
  constraint impact_credentials_revocation_state check (
    (status = 'revoked' and revoked_at is not null)
    or status <> 'revoked'
  )
);

create table public.initiative_proofs (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  initiative_ref text not null check (char_length(initiative_ref) between 2 and 120),
  proof_type text not null check (proof_type in ('contribution', 'expense', 'evidence', 'commitment')),
  description text not null check (char_length(description) between 2 and 300),
  evidence_hash text not null check (evidence_hash ~ '^[0-9a-f]{64}$'),
  onchain_proof_id text not null unique check (onchain_proof_id ~ '^[0-9a-f]{64}$'),
  stellar_network text not null default 'testnet' check (stellar_network in ('testnet', 'public')),
  contract_id text check (contract_id is null or contract_id ~ '^C[A-Z2-7]{55}$'),
  stellar_transaction_hash text check (
    stellar_transaction_hash is null or stellar_transaction_hash ~ '^[0-9a-f]{64}$'
  ),
  status text not null default 'pending_anchor' check (
    status in ('pending_anchor', 'active', 'anchor_failed', 'revoked')
  ),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  anchored_at timestamptz
);

create index impact_issuers_community_idx on public.impact_issuers(community_id, status);
create index impact_actions_actor_idx on public.impact_actions(actor_id, submitted_at desc);
create index impact_actions_review_queue_idx on public.impact_actions(community_id, submitted_at)
where status = 'pending';
create index impact_validations_validator_idx on public.impact_action_validations(validator_user_id, created_at desc);
create index impact_credentials_subject_idx on public.impact_credentials(subject_id, issued_at desc);
create index impact_credentials_community_idx on public.impact_credentials(community_id, issued_at desc);
create index initiative_proofs_community_idx on public.initiative_proofs(community_id, created_at desc);

create trigger impact_action_types_set_updated_at before update on public.impact_action_types
for each row execute function private.set_updated_at();
create trigger impact_issuers_set_updated_at before update on public.impact_issuers
for each row execute function private.set_updated_at();

insert into public.impact_action_types (code, label, description, points, verification_policy)
values
  ('neighbor_help', 'Ayudar a un vecino', 'Apoyo directo a una persona de la comunidad.', 100, 'La persona beneficiaria o un moderador confirma la ayuda.'),
  ('item_share', 'Compartir un objeto', 'Préstamo o regalo de un objeto útil a otro vecino.', 50, 'La persona receptora confirma la entrega.'),
  ('community_activity', 'Participar en una actividad', 'Participación comprobable en una actividad comunitaria.', 150, 'La organización o responsable de la actividad confirma la asistencia.'),
  ('initiative_complete', 'Completar una iniciativa', 'Ejecución satisfactoria de una iniciativa de la comunidad.', 300, 'Un moderador revisa la evidencia y confirma el cierre.'),
  ('organization_validated', 'Colaboración validada', 'Contribución reconocida por una organización autorizada.', 200, 'Una organización emisora autorizada confirma la colaboración.')
on conflict (code) do update set
  label = excluded.label,
  description = excluded.description,
  points = excluded.points,
  verification_policy = excluded.verification_policy,
  updated_at = now();

alter table public.impact_action_types enable row level security;
alter table public.impact_issuers enable row level security;
alter table public.impact_actions enable row level security;
alter table public.impact_action_validations enable row level security;
alter table public.impact_credentials enable row level security;
alter table public.initiative_proofs enable row level security;

revoke all on public.impact_action_types, public.impact_issuers, public.impact_actions,
  public.impact_action_validations, public.impact_credentials, public.initiative_proofs
from anon, authenticated;

grant select on public.impact_action_types, public.impact_issuers, public.impact_actions,
  public.impact_action_validations, public.impact_credentials, public.initiative_proofs
to authenticated;
grant insert (community_id, actor_id, action_type_code, description, confirmation_note, evidence_digest, occurred_at)
on public.impact_actions to authenticated;

create policy impact_action_types_read on public.impact_action_types for select to authenticated
using (is_active);

create policy impact_issuers_read_community on public.impact_issuers for select to authenticated
using (exists (
  select 1 from public.community_members as membership
  where membership.community_id = impact_issuers.community_id
    and membership.user_id = (select auth.uid())
));

create policy impact_actions_read_own_or_reviewer on public.impact_actions for select to authenticated
using (
  actor_id = (select auth.uid())
  or exists (
    select 1 from public.community_members as membership
    where membership.community_id = impact_actions.community_id
      and membership.user_id = (select auth.uid())
      and membership.role in ('moderator', 'admin')
  )
);

create policy impact_actions_submit_own on public.impact_actions for insert to authenticated
with check (
  actor_id = (select auth.uid())
  and status = 'pending'
  and validated_at is null
  and occurred_at <= now() + interval '5 minutes'
  and exists (
    select 1 from public.community_members as membership
    where membership.community_id = impact_actions.community_id
      and membership.user_id = (select auth.uid())
  )
  and exists (
    select 1 from public.impact_action_types as action_type
    where action_type.code = impact_actions.action_type_code
      and action_type.is_active
  )
);

create policy impact_validations_read_subject_or_reviewer on public.impact_action_validations for select to authenticated
using (exists (
  select 1 from public.impact_actions as action
  where action.id = impact_action_validations.action_id
    and (
      action.actor_id = (select auth.uid())
      or exists (
        select 1 from public.community_members as membership
        where membership.community_id = action.community_id
          and membership.user_id = (select auth.uid())
          and membership.role in ('moderator', 'admin')
      )
    )
));

create policy impact_credentials_read_community on public.impact_credentials for select to authenticated
using (exists (
  select 1 from public.community_members as membership
  where membership.community_id = impact_credentials.community_id
    and membership.user_id = (select auth.uid())
));

create policy initiative_proofs_read_community on public.initiative_proofs for select to authenticated
using (exists (
  select 1 from public.community_members as membership
  where membership.community_id = initiative_proofs.community_id
    and membership.user_id = (select auth.uid())
));

create or replace function public.review_impact_action(
  p_action_id uuid,
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
  issued_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  action_row public.impact_actions%rowtype;
  rule_row public.impact_action_types%rowtype;
  new_credential_id uuid;
  new_subject_commitment text;
  new_claim_hash text;
  new_onchain_credential_id text;
  reviewed_at timestamptz := now();
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
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
  if action_row.status <> 'pending' then
    raise exception 'impact action was already reviewed' using errcode = '23505';
  end if;
  if not exists (
    select 1 from public.community_members as membership
    where membership.community_id = action_row.community_id
      and membership.user_id = current_user_id
      and membership.role in ('moderator', 'admin')
  ) then
    raise exception 'reviewer is not authorized for this community' using errcode = '42501';
  end if;

  select * into strict rule_row
  from public.impact_action_types
  where code = action_row.action_type_code and is_active;

  update public.impact_actions
  set status = case when p_decision = 'approved' then 'validated' else 'rejected' end,
      validated_at = reviewed_at
  where id = action_row.id;

  insert into public.impact_action_validations (
    action_id, validator_user_id, decision, note, points_awarded, rule_version
  ) values (
    action_row.id,
    current_user_id,
    p_decision,
    nullif(btrim(p_note), ''),
    case when p_decision = 'approved' then rule_row.points else 0 end,
    rule_row.rule_version
  );

  if p_decision = 'rejected' then
    return;
  end if;

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
      'issued_at', reviewed_at,
      'points', rule_row.points,
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
  );

  return query select
    action_row.id,
    new_credential_id,
    action_row.actor_id,
    new_subject_commitment,
    action_row.action_type_code,
    rule_row.points,
    rule_row.rule_version,
    new_claim_hash,
    new_onchain_credential_id,
    reviewed_at;
end;
$$;

revoke all on function public.review_impact_action(uuid, text, text, text) from public, anon;
grant execute on function public.review_impact_action(uuid, text, text, text) to authenticated;
