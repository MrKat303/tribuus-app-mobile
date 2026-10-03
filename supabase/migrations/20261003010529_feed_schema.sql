create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (char_length(name) between 2 and 80),
  location text not null check (char_length(location) between 2 and 120),
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  initials text not null check (char_length(initials) between 1 and 4),
  location text not null default 'Providencia' check (char_length(location) between 2 and 120),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'moderator', 'admin')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table public.posts (
  id bigint generated always as identity primary key,
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null default 'comunidad' check (category in ('evento', 'recomendación', 'comunidad')),
  title text not null default '' check (char_length(title) <= 100),
  content text not null default '' check (char_length(content) <= 350),
  location text check (location is null or char_length(location) between 2 and 120),
  image_path text,
  audio_path text,
  audio_name text check (audio_name is null or char_length(audio_name) <= 100),
  has_poll boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  like_count integer not null default 0 check (like_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_have_content check (
    content <> '' or image_path is not null or audio_path is not null or title <> '' or has_poll or status = 'draft'
  ),
  constraint posts_published_at_matches_status check (
    (status = 'published' and published_at is not null) or status <> 'published'
  )
);

create table public.post_comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_likes (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_bookmarks (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.post_polls (
  post_id bigint primary key references public.posts(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 100),
  created_at timestamptz not null default now()
);

create table public.poll_options (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.post_polls(post_id) on delete cascade,
  label text not null check (char_length(label) between 1 and 60),
  position smallint not null check (position between 0 and 3),
  vote_count integer not null default 0 check (vote_count >= 0),
  unique (post_id, id),
  unique (post_id, position)
);

create table public.poll_votes (
  post_id bigint not null,
  option_id bigint not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id),
  foreign key (post_id, option_id) references public.poll_options(post_id, id) on delete cascade
);

create index community_members_user_id_idx on public.community_members(user_id);
create index posts_feed_idx on public.posts(community_id, published_at desc, id desc) where status = 'published';
create index posts_author_id_idx on public.posts(author_id);
create index post_comments_post_created_idx on public.post_comments(post_id, created_at);
create index post_comments_author_id_idx on public.post_comments(author_id);
create index post_likes_user_id_idx on public.post_likes(user_id);
create index post_bookmarks_user_id_idx on public.post_bookmarks(user_id);
create index poll_options_post_id_idx on public.poll_options(post_id);
create index poll_votes_option_id_idx on public.poll_votes(option_id);
create index poll_votes_user_id_idx on public.poll_votes(user_id);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function private.update_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.posts
  set like_count = greatest(0, like_count + case when tg_op = 'INSERT' then 1 else -1 end)
  where id = coalesce(new.post_id, old.post_id);
  return coalesce(new, old);
end;
$$;

create function private.update_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.posts
  set comment_count = greatest(0, comment_count + case when tg_op = 'INSERT' then 1 else -1 end)
  where id = coalesce(new.post_id, old.post_id);
  return coalesce(new, old);
end;
$$;

create function private.update_poll_vote_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.option_id <> new.option_id then
    update public.poll_options set vote_count = greatest(0, vote_count - 1) where id = old.option_id;
    update public.poll_options set vote_count = vote_count + 1 where id = new.option_id;
  elsif tg_op = 'INSERT' then
    update public.poll_options set vote_count = vote_count + 1 where id = new.option_id;
  elsif tg_op = 'DELETE' then
    update public.poll_options set vote_count = greatest(0, vote_count - 1) where id = old.option_id;
  end if;
  return coalesce(new, old);
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;
revoke execute on function private.update_post_like_count() from public, anon, authenticated;
revoke execute on function private.update_post_comment_count() from public, anon, authenticated;
revoke execute on function private.update_poll_vote_count() from public, anon, authenticated;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger posts_set_updated_at before update on public.posts
for each row execute function private.set_updated_at();
create trigger post_comments_set_updated_at before update on public.post_comments
for each row execute function private.set_updated_at();
create trigger poll_votes_set_updated_at before update on public.poll_votes
for each row execute function private.set_updated_at();
create trigger post_likes_update_count after insert or delete on public.post_likes
for each row execute function private.update_post_like_count();
create trigger post_comments_update_count after insert or delete on public.post_comments
for each row execute function private.update_post_comment_count();
create trigger poll_votes_update_count after insert or update of option_id or delete on public.poll_votes
for each row execute function private.update_poll_vote_count();

insert into public.communities (id, slug, name, location)
values ('00000000-0000-4000-8000-000000000001', 'providencia', 'Comunidad Providencia', 'Providencia')
on conflict (id) do update set name = excluded.name, location = excluded.location;

alter table public.communities enable row level security;
alter table public.profiles enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_bookmarks enable row level security;
alter table public.post_polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

revoke all on public.communities, public.profiles, public.community_members, public.posts,
  public.post_comments, public.post_likes, public.post_bookmarks, public.post_polls,
  public.poll_options, public.poll_votes from anon, authenticated;

grant select on public.communities, public.profiles, public.posts, public.post_comments,
  public.post_polls, public.poll_options to anon;
grant select on public.communities, public.profiles, public.community_members, public.posts,
  public.post_comments, public.post_likes, public.post_bookmarks, public.post_polls,
  public.poll_options, public.poll_votes to authenticated;
grant insert, update on public.profiles to authenticated;
grant insert on public.community_members to authenticated;
grant insert, update, delete on public.posts, public.post_comments, public.post_likes,
  public.post_bookmarks, public.post_polls, public.poll_options, public.poll_votes to authenticated;
grant usage, select on all sequences in schema public to authenticated;

create policy communities_read on public.communities for select to anon, authenticated using (true);
create policy profiles_read on public.profiles for select to anon, authenticated using (true);
create policy profiles_insert_own on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy community_members_read_own on public.community_members for select to authenticated
using ((select auth.uid()) = user_id);
create policy community_members_join_open on public.community_members for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and role = 'member'
  and exists (select 1 from public.communities where id = community_id and is_open)
);

create policy posts_read_public_or_own on public.posts for select to anon, authenticated
using (status = 'published' or (select auth.uid()) = author_id);
create policy posts_insert_member on public.posts for insert to authenticated
with check (
  (select auth.uid()) = author_id
  and exists (
    select 1 from public.community_members
    where community_id = posts.community_id and user_id = (select auth.uid())
  )
);
create policy posts_update_own on public.posts for update to authenticated
using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy posts_delete_own on public.posts for delete to authenticated
using ((select auth.uid()) = author_id);

create policy comments_read_published_or_own on public.post_comments for select to anon, authenticated
using (exists (
  select 1 from public.posts
  where posts.id = post_comments.post_id
    and (posts.status = 'published' or posts.author_id = (select auth.uid()))
));
create policy comments_insert_member on public.post_comments for insert to authenticated
with check (
  (select auth.uid()) = author_id
  and exists (
    select 1 from public.posts
    join public.community_members on community_members.community_id = posts.community_id
    where posts.id = post_comments.post_id
      and posts.status = 'published'
      and community_members.user_id = (select auth.uid())
  )
);
create policy comments_update_own on public.post_comments for update to authenticated
using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy comments_delete_own on public.post_comments for delete to authenticated
using ((select auth.uid()) = author_id);

create policy likes_read_own on public.post_likes for select to authenticated
using ((select auth.uid()) = user_id);
create policy likes_insert_member on public.post_likes for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.posts
    join public.community_members on community_members.community_id = posts.community_id
    where posts.id = post_likes.post_id
      and posts.status = 'published'
      and community_members.user_id = (select auth.uid())
  )
);
create policy likes_delete_own on public.post_likes for delete to authenticated
using ((select auth.uid()) = user_id);

create policy bookmarks_read_own on public.post_bookmarks for select to authenticated
using ((select auth.uid()) = user_id);
create policy bookmarks_insert_own on public.post_bookmarks for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.posts
    join public.community_members on community_members.community_id = posts.community_id
    where posts.id = post_bookmarks.post_id
      and posts.status = 'published'
      and community_members.user_id = (select auth.uid())
  )
);
create policy bookmarks_delete_own on public.post_bookmarks for delete to authenticated
using ((select auth.uid()) = user_id);

create policy polls_read on public.post_polls for select to anon, authenticated
using (exists (
  select 1 from public.posts where posts.id = post_polls.post_id
    and (posts.status = 'published' or posts.author_id = (select auth.uid()))
));
create policy polls_insert_own_post on public.post_polls for insert to authenticated
with check (exists (
  select 1 from public.posts where posts.id = post_polls.post_id and posts.author_id = (select auth.uid())
));
create policy polls_update_own_post on public.post_polls for update to authenticated
using (exists (
  select 1 from public.posts where posts.id = post_polls.post_id and posts.author_id = (select auth.uid())
));
create policy polls_delete_own_post on public.post_polls for delete to authenticated
using (exists (
  select 1 from public.posts where posts.id = post_polls.post_id and posts.author_id = (select auth.uid())
));

create policy poll_options_read on public.poll_options for select to anon, authenticated
using (exists (
  select 1 from public.posts where posts.id = poll_options.post_id
    and (posts.status = 'published' or posts.author_id = (select auth.uid()))
));
create policy poll_options_insert_own_post on public.poll_options for insert to authenticated
with check (exists (
  select 1 from public.posts where posts.id = poll_options.post_id and posts.author_id = (select auth.uid())
));
create policy poll_options_update_own_post on public.poll_options for update to authenticated
using (exists (
  select 1 from public.posts where posts.id = poll_options.post_id and posts.author_id = (select auth.uid())
));
create policy poll_options_delete_own_post on public.poll_options for delete to authenticated
using (exists (
  select 1 from public.posts where posts.id = poll_options.post_id and posts.author_id = (select auth.uid())
));

create policy poll_votes_read_own on public.poll_votes for select to authenticated
using ((select auth.uid()) = user_id);
create policy poll_votes_insert_member on public.poll_votes for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.posts
    join public.community_members on community_members.community_id = posts.community_id
    where posts.id = poll_votes.post_id
      and posts.status = 'published'
      and community_members.user_id = (select auth.uid())
  )
);
create policy poll_votes_update_own on public.poll_votes for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy poll_votes_delete_own on public.poll_votes for delete to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy post_media_insert_own_folder on storage.objects for insert to authenticated
with check (
  bucket_id = 'post-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy post_media_select_own_folder on storage.objects for select to authenticated
using (
  bucket_id = 'post-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy post_media_update_own_folder on storage.objects for update to authenticated
using (
  bucket_id = 'post-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'post-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy post_media_delete_own_folder on storage.objects for delete to authenticated
using (
  bucket_id = 'post-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end;
$$;
