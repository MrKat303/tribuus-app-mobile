create table public.community_initiatives (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 100),
  summary text not null check (char_length(summary) between 20 and 800),
  contribution_kind text not null check (
    contribution_kind in ('item', 'time', 'skill', 'mixed')
  ),
  location text check (location is null or char_length(location) between 2 and 120),
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'review' check (
    status in ('review', 'open', 'completed', 'cancelled')
  ),
  supporter_count integer not null default 0 check (supporter_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_initiatives_dates_are_ordered check (
    starts_at is null or ends_at is null or ends_at > starts_at
  )
);

create index community_initiatives_community_status_created_idx
on public.community_initiatives(community_id, status, created_at desc);

create index community_initiatives_creator_created_idx
on public.community_initiatives(creator_id, created_at desc);

create trigger community_initiatives_set_updated_at
before update on public.community_initiatives
for each row execute function private.set_updated_at();

alter table public.community_initiatives enable row level security;

revoke all on public.community_initiatives from anon, authenticated;

grant select on public.community_initiatives to authenticated;
grant insert (
  community_id,
  creator_id,
  title,
  summary,
  contribution_kind,
  location,
  starts_at,
  ends_at
) on public.community_initiatives to authenticated;
grant update (
  title,
  summary,
  contribution_kind,
  location,
  starts_at,
  ends_at,
  status
) on public.community_initiatives to authenticated;

create policy community_initiatives_read_visible
on public.community_initiatives
for select
to authenticated
using (
  exists (
    select 1
    from public.community_members as membership
    where membership.community_id = community_initiatives.community_id
      and membership.user_id = (select auth.uid())
      and (
        community_initiatives.status in ('open', 'completed')
        or membership.role in ('moderator', 'admin')
      )
  )
);

create policy community_initiatives_create_review
on public.community_initiatives
for insert
to authenticated
with check (
  creator_id = (select auth.uid())
  and status = 'review'
  and supporter_count = 0
  and exists (
    select 1
    from public.community_members as membership
    where membership.community_id = community_initiatives.community_id
      and membership.user_id = (select auth.uid())
  )
);

create policy community_initiatives_moderate
on public.community_initiatives
for update
to authenticated
using (
  exists (
    select 1
    from public.community_members as membership
    where membership.community_id = community_initiatives.community_id
      and membership.user_id = (select auth.uid())
      and membership.role in ('moderator', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.community_members as membership
    where membership.community_id = community_initiatives.community_id
      and membership.user_id = (select auth.uid())
      and membership.role in ('moderator', 'admin')
  )
);
