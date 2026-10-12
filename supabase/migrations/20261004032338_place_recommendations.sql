create table public.place_recommendations (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(trim(text)) between 12 and 420),
  tags text[] not null default '{}',
  photo_uri text,
  confidence real not null default 1 check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (place_id, author_id)
);

create index place_recommendations_place_created_at_idx
  on public.place_recommendations (place_id, created_at desc, id);
create index place_recommendations_author_id_idx
  on public.place_recommendations (author_id);

create trigger place_recommendations_set_updated_at before update on public.place_recommendations
for each row execute function private.set_updated_at();

alter table public.place_recommendations enable row level security;

revoke all on table public.place_recommendations from anon, authenticated;
grant select, insert, delete on table public.place_recommendations to authenticated;
grant update (text, tags, photo_uri, updated_at) on table public.place_recommendations to authenticated;

create policy place_recommendations_read_authenticated
  on public.place_recommendations for select to authenticated
  using (exists (
    select 1 from public.places as place
    where place.id = place_recommendations.place_id
      and place.status = 'active'
  ));

create policy place_recommendations_insert_own
  on public.place_recommendations for insert to authenticated
  with check (author_id = (select auth.uid()));

create policy place_recommendations_update_own
  on public.place_recommendations for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy place_recommendations_delete_own
  on public.place_recommendations for delete to authenticated
  using (author_id = (select auth.uid()));

create or replace function private.refresh_place_recommendation_metrics()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_place_id uuid := case when tg_op = 'DELETE' then old.place_id else new.place_id end;
begin
  update public.places
  set
    popularity = (
      select count(*)
      from public.place_recommendations
      where place_id = affected_place_id
    ),
    activity_score = case
      when tg_op = 'DELETE' then activity_score
      else least(1, activity_score + 0.08)
    end,
    updated_at = now()
  where id = affected_place_id;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.refresh_place_recommendation_metrics() from public, anon, authenticated;

create trigger place_recommendations_refresh_metrics
after insert or update or delete on public.place_recommendations
for each row execute function private.refresh_place_recommendation_metrics();

create or replace function public.upsert_place_recommendation(
  p_place_id uuid,
  p_text text,
  p_tags text[],
  p_photo_uri text default null
)
returns public.place_recommendations
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  recommendation public.place_recommendations;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.places
    where id = p_place_id and status = 'active'
  ) then
    raise exception 'place is not available' using errcode = '22023';
  end if;

  insert into public.place_recommendations (place_id, author_id, text, tags, photo_uri)
  values (p_place_id, current_user_id, trim(p_text), coalesce(p_tags, '{}'), p_photo_uri)
  on conflict (place_id, author_id) do update set
    text = excluded.text,
    tags = excluded.tags,
    photo_uri = excluded.photo_uri,
    updated_at = now()
  returning * into recommendation;

  return recommendation;
end;
$$;

revoke all on function public.upsert_place_recommendation(uuid, text, text[], text) from public, anon;
grant execute on function public.upsert_place_recommendation(uuid, text, text[], text) to authenticated;
