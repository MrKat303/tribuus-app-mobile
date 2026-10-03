alter table public.post_comments
  add column parent_comment_id bigint references public.post_comments(id) on delete set null,
  add column like_count integer not null default 0 check (like_count >= 0);

create index post_comments_parent_idx on public.post_comments(parent_comment_id)
where parent_comment_id is not null;

create table public.comment_likes (
  comment_id bigint not null references public.post_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table public.post_images (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  storage_path text not null,
  position smallint not null check (position between 0 and 11),
  created_at timestamptz not null default now(),
  unique (post_id, position),
  unique (storage_path)
);

create index comment_likes_user_idx on public.comment_likes(user_id);
create index post_images_post_position_idx on public.post_images(post_id, position);

create or replace function public.validate_comment_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.parent_comment_id is not null and not exists (
    select 1 from public.post_comments parent
    where parent.id = new.parent_comment_id and parent.post_id = new.post_id
  ) then
    raise exception 'Parent comment must belong to the same post';
  end if;
  return new;
end;
$$;

create trigger post_comments_validate_parent
before insert or update of parent_comment_id, post_id on public.post_comments
for each row execute function public.validate_comment_parent();

create or replace function public.update_comment_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.post_comments
  set like_count = (
    select count(*)::integer from public.comment_likes
    where comment_id = coalesce(new.comment_id, old.comment_id)
  )
  where id = coalesce(new.comment_id, old.comment_id);
  return coalesce(new, old);
end;
$$;

create trigger comment_likes_update_count
after insert or delete on public.comment_likes
for each row execute function public.update_comment_like_count();

alter table public.comment_likes enable row level security;
alter table public.post_images enable row level security;

grant select on public.comment_likes, public.post_images to authenticated;
grant insert, delete on public.comment_likes to authenticated;
grant insert, update, delete on public.post_images to authenticated;
grant usage, select on sequence public.post_images_id_seq to authenticated;

create policy comment_likes_read_own on public.comment_likes for select to authenticated
using ((select auth.uid()) = user_id);
create policy comment_likes_insert_member on public.comment_likes for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.post_comments
    join public.posts on posts.id = post_comments.post_id
    join public.community_members on community_members.community_id = posts.community_id
    where post_comments.id = comment_likes.comment_id
      and posts.status = 'published'
      and community_members.user_id = (select auth.uid())
  )
);
create policy comment_likes_delete_own on public.comment_likes for delete to authenticated
using ((select auth.uid()) = user_id);

create policy post_images_read_published_or_own on public.post_images for select to authenticated
using (exists (
  select 1 from public.posts
  where posts.id = post_images.post_id
    and (posts.status = 'published' or posts.author_id = (select auth.uid()))
));
create policy post_images_insert_own_post on public.post_images for insert to authenticated
with check (exists (
  select 1 from public.posts
  where posts.id = post_images.post_id and posts.author_id = (select auth.uid())
));
create policy post_images_update_own_post on public.post_images for update to authenticated
using (exists (
  select 1 from public.posts
  where posts.id = post_images.post_id and posts.author_id = (select auth.uid())
)) with check (exists (
  select 1 from public.posts
  where posts.id = post_images.post_id and posts.author_id = (select auth.uid())
));
create policy post_images_delete_own_post on public.post_images for delete to authenticated
using (exists (
  select 1 from public.posts
  where posts.id = post_images.post_id and posts.author_id = (select auth.uid())
));

revoke execute on function public.validate_comment_parent() from public, anon, authenticated;
revoke execute on function public.update_comment_like_count() from public, anon, authenticated;
