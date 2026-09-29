create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

create table public.places (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('community', 'mapbox')),
  provider_id text,
  name text not null check (char_length(name) between 1 and 160),
  address text not null default '',
  neighborhood text,
  category text not null,
  status text not null default 'active' check (status in ('active', 'archived', 'pending')),
  location extensions.geography(point, 4326) not null,
  popularity integer not null default 0 check (popularity >= 0),
  activity_score real not null default 0 check (activity_score between 0 and 1),
  local_relevance real not null default 0 check (local_relevance between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index places_provider_id_unique
  on public.places (provider, provider_id)
  where provider_id is not null;

create index places_location_gist
  on public.places
  using gist (location);

create index places_active_created_at
  on public.places (created_at desc, id)
  where status = 'active';

alter table public.places enable row level security;

revoke all on table public.places from anon, authenticated;
grant select, insert, update on table public.places to authenticated;

create policy "Authenticated users can read active places"
  on public.places
  for select
  to authenticated
  using (status = 'active' or owner_id = (select auth.uid()));

create policy "Users can create their own places"
  on public.places
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Users can update their own places"
  on public.places
  for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create or replace function public.places_in_view(
  min_lat double precision,
  min_long double precision,
  max_lat double precision,
  max_long double precision,
  result_limit integer default 200
)
returns table (
  id uuid,
  owner_id uuid,
  provider text,
  provider_id text,
  name text,
  address text,
  neighborhood text,
  category text,
  longitude double precision,
  latitude double precision,
  popularity integer,
  activity_score real,
  local_relevance real,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    place.id,
    place.owner_id,
    place.provider,
    place.provider_id,
    place.name,
    place.address,
    place.neighborhood,
    place.category,
    extensions.st_x(place.location::extensions.geometry) as longitude,
    extensions.st_y(place.location::extensions.geometry) as latitude,
    place.popularity,
    place.activity_score,
    place.local_relevance,
    place.created_at
  from public.places as place
  where place.status = 'active'
    and place.location operator(extensions.&&) extensions.st_setsrid(
      extensions.st_makebox2d(
        extensions.st_point(min_long, min_lat),
        extensions.st_point(max_long, max_lat)
      ),
      4326
    )
  order by place.activity_score desc, place.popularity desc, place.id
  limit least(greatest(result_limit, 1), 500);
$$;

revoke all on function public.places_in_view(double precision, double precision, double precision, double precision, integer) from public, anon;
grant execute on function public.places_in_view(double precision, double precision, double precision, double precision, integer) to authenticated;
