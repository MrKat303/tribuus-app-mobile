alter table public.profiles
  add column username text,
  add column bio text not null default '',
  add column primary_community_id uuid references public.communities(id) on delete set null,
  add column onboarding_completed_at timestamptz;

insert into public.communities (id, slug, name, location)
values
  ('00000000-0000-4000-8000-000000000002', 'nunoa', 'Comunidad Ñuñoa', 'Ñuñoa'),
  ('00000000-0000-4000-8000-000000000003', 'santiago', 'Comunidad Santiago', 'Santiago'),
  ('00000000-0000-4000-8000-000000000004', 'las-condes', 'Comunidad Las Condes', 'Las Condes'),
  ('00000000-0000-4000-8000-000000000005', 'vitacura', 'Comunidad Vitacura', 'Vitacura'),
  ('00000000-0000-4000-8000-000000000006', 'la-reina', 'Comunidad La Reina', 'La Reina'),
  ('00000000-0000-4000-8000-000000000007', 'macul', 'Comunidad Macul', 'Macul'),
  ('00000000-0000-4000-8000-000000000008', 'penalolen', 'Comunidad Peñalolén', 'Peñalolén'),
  ('00000000-0000-4000-8000-000000000009', 'la-florida', 'Comunidad La Florida', 'La Florida'),
  ('00000000-0000-4000-8000-000000000010', 'san-miguel', 'Comunidad San Miguel', 'San Miguel'),
  ('00000000-0000-4000-8000-000000000011', 'recoleta', 'Comunidad Recoleta', 'Recoleta'),
  ('00000000-0000-4000-8000-000000000012', 'independencia', 'Comunidad Independencia', 'Independencia')
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  location = excluded.location;

update public.profiles
set username = 'tribu_' || substr(replace(id::text, '-', ''), 1, 12)
where username is null;

insert into public.profiles (id, display_name, initials, location, username)
select
  users.id,
  left(coalesce(nullif(trim(users.raw_user_meta_data ->> 'display_name'), ''), 'Nuevo miembro'), 80),
  upper(left(coalesce(nullif(trim(users.raw_user_meta_data ->> 'display_name'), ''), 'N'), 2)),
  'Providencia',
  'tribu_' || substr(replace(users.id::text, '-', ''), 1, 12)
from auth.users as users
on conflict (id) do nothing;

alter table public.profiles
  alter column username set not null,
  add constraint profiles_username_format_check
    check (username = lower(username) and username ~ '^[a-z0-9_]{3,30}$'),
  add constraint profiles_bio_length_check check (char_length(bio) <= 160);

create unique index profiles_username_lower_idx on public.profiles(lower(username));
create index profiles_primary_community_id_idx on public.profiles(primary_community_id);

create table public.user_locations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  accuracy_m double precision,
  locality text not null check (char_length(locality) between 2 and 120),
  region text,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  source text not null check (source in ('device', 'manual')),
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_locations_coordinates_together check (
    (latitude is null and longitude is null) or (latitude is not null and longitude is not null)
  ),
  constraint user_locations_latitude_check check (latitude is null or latitude between -90 and 90),
  constraint user_locations_longitude_check check (longitude is null or longitude between -180 and 180),
  constraint user_locations_accuracy_check check (accuracy_m is null or accuracy_m between 0 and 100000)
);

create table public.profile_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  interest text not null check (interest in (
    'barrio', 'cultura', 'deporte', 'emprendimiento', 'familia', 'mascotas',
    'medioambiente', 'seguridad', 'voluntariado'
  )),
  created_at timestamptz not null default now(),
  primary key (user_id, interest)
);

create index profile_interests_interest_idx on public.profile_interests(interest);

create trigger user_locations_set_updated_at before update on public.user_locations
for each row execute function private.set_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated_name text;
begin
  generated_name := left(
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Nuevo miembro'),
    80
  );

  insert into public.profiles (id, display_name, initials, location, username)
  values (
    new.id,
    generated_name,
    upper(left(generated_name, 2)),
    'Providencia',
    'tribu_' || substr(replace(new.id::text, '-', ''), 1, 12)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.user_locations enable row level security;
alter table public.profile_interests enable row level security;

revoke all on public.user_locations, public.profile_interests from anon, authenticated;
grant select, insert, update, delete on public.user_locations to authenticated;
grant select on public.profile_interests to anon, authenticated;
grant insert, delete on public.profile_interests to authenticated;

create policy user_locations_read_own on public.user_locations for select to authenticated
using ((select auth.uid()) = user_id);
create policy user_locations_insert_own on public.user_locations for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy user_locations_update_own on public.user_locations for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy user_locations_delete_own on public.user_locations for delete to authenticated
using ((select auth.uid()) = user_id);

create policy profile_interests_read on public.profile_interests for select to anon, authenticated
using (true);
create policy profile_interests_insert_own on public.profile_interests for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy profile_interests_delete_own on public.profile_interests for delete to authenticated
using ((select auth.uid()) = user_id);

create function public.complete_onboarding(
  p_display_name text,
  p_username text,
  p_bio text,
  p_community_id uuid,
  p_interests text[],
  p_location_label text,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_accuracy_m double precision default null,
  p_region text default null,
  p_country_code text default null,
  p_location_source text default 'manual'
)
returns public.profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_name text := trim(p_display_name);
  normalized_username text := lower(trim(p_username));
  normalized_location text := trim(p_location_label);
  profile_row public.profiles;
  profile_initials text;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if cardinality(coalesce(p_interests, array[]::text[])) > 5 then
    raise exception 'choose at most five interests' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.communities
    where id = p_community_id and is_open
  ) then
    raise exception 'community is not available' using errcode = '22023';
  end if;

  select string_agg(upper(left(name_part, 1)), '')
  into profile_initials
  from (
    select name_part
    from unnest(regexp_split_to_array(normalized_name, '\\s+')) as name_part
    where name_part <> ''
    limit 2
  ) as initials_source;

  insert into public.profiles (
    id, display_name, initials, location, username, bio, primary_community_id,
    onboarding_completed_at
  )
  values (
    current_user_id,
    normalized_name,
    coalesce(nullif(profile_initials, ''), 'V'),
    normalized_location,
    normalized_username,
    trim(coalesce(p_bio, '')),
    p_community_id,
    now()
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    initials = excluded.initials,
    location = excluded.location,
    username = excluded.username,
    bio = excluded.bio,
    primary_community_id = excluded.primary_community_id,
    onboarding_completed_at = excluded.onboarding_completed_at
  returning * into profile_row;

  insert into public.community_members (community_id, user_id, role)
  values (p_community_id, current_user_id, 'member')
  on conflict (community_id, user_id) do nothing;

  delete from public.profile_interests where user_id = current_user_id;
  insert into public.profile_interests (user_id, interest)
  select current_user_id, selected_interest
  from unnest(coalesce(p_interests, array[]::text[])) as selected_interest
  group by selected_interest;

  insert into public.user_locations (
    user_id, latitude, longitude, accuracy_m, locality, region, country_code,
    source, consented_at
  )
  values (
    current_user_id,
    p_latitude,
    p_longitude,
    p_accuracy_m,
    normalized_location,
    nullif(trim(coalesce(p_region, '')), ''),
    upper(nullif(trim(coalesce(p_country_code, '')), '')),
    p_location_source,
    case when p_location_source = 'device' then now() else null end
  )
  on conflict (user_id) do update set
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    accuracy_m = excluded.accuracy_m,
    locality = excluded.locality,
    region = excluded.region,
    country_code = excluded.country_code,
    source = excluded.source,
    consented_at = excluded.consented_at;

  return profile_row;
end;
$$;

revoke all on function public.complete_onboarding(
  text, text, text, uuid, text[], text, double precision, double precision,
  double precision, text, text, text
) from public, anon;
grant execute on function public.complete_onboarding(
  text, text, text, uuid, text[], text, double precision, double precision,
  double precision, text, text, text
) to authenticated;
