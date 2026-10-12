create table public.community_fund_entries (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  initiative_id uuid references public.community_initiatives(id) on delete set null,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  entry_type text not null check (entry_type in ('donation', 'expense')),
  amount_clp bigint not null check (amount_clp between 1 and 9007199254740991),
  title text not null check (char_length(title) between 4 and 120),
  counterparty text check (counterparty is null or char_length(counterparty) between 2 and 120),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.community_fund_entries is
  'Registro contable append-only de donaciones y gastos ya realizados en CLP; no procesa pagos.';

create index community_fund_entries_community_occurred_idx
on public.community_fund_entries(community_id, occurred_at desc, created_at desc);

create index community_fund_entries_initiative_idx
on public.community_fund_entries(initiative_id)
where initiative_id is not null;

alter table public.community_fund_entries enable row level security;

revoke all on public.community_fund_entries from anon, authenticated;

grant select on public.community_fund_entries to authenticated;
grant insert (
  community_id,
  initiative_id,
  recorded_by,
  entry_type,
  amount_clp,
  title,
  counterparty,
  occurred_at
) on public.community_fund_entries to authenticated;

create policy community_fund_entries_read_member
on public.community_fund_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.community_members as membership
    where membership.community_id = community_fund_entries.community_id
      and membership.user_id = (select auth.uid())
  )
);

create policy community_fund_entries_insert_reviewer
on public.community_fund_entries
for insert
to authenticated
with check (
  recorded_by = (select auth.uid())
  and exists (
    select 1
    from public.community_members as membership
    where membership.community_id = community_fund_entries.community_id
      and membership.user_id = (select auth.uid())
      and membership.role in ('moderator', 'admin')
  )
  and (
    initiative_id is null
    or exists (
      select 1
      from public.community_initiatives as initiative
      where initiative.id = community_fund_entries.initiative_id
        and initiative.community_id = community_fund_entries.community_id
    )
  )
);
