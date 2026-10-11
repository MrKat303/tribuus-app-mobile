-- Feed visibility is membership-based. These helpers live outside the exposed
-- schemas so they can inspect membership without being affected by the caller's
-- RLS visibility on the lookup tables.
create or replace function private.is_community_member(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.community_members as membership
      where membership.community_id = p_community_id
        and membership.user_id = (select auth.uid())
    );
$$;

create or replace function private.can_read_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      p_profile_id = (select auth.uid())
      or exists (
        select 1
        from public.community_members as viewer
        join public.community_members as subject
          on subject.community_id = viewer.community_id
        where viewer.user_id = (select auth.uid())
          and subject.user_id = p_profile_id
      )
      or exists (
        select 1
        from public.chat_conversation_members as viewer
        join public.chat_conversation_members as subject
          on subject.conversation_id = viewer.conversation_id
        where viewer.user_id = (select auth.uid())
          and subject.user_id = p_profile_id
      )
    );
$$;

create or replace function private.can_access_feed_post(p_post_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.posts as post
      where post.id = p_post_id
        and (
          post.author_id = (select auth.uid())
          or (
            post.status = 'published'
            and exists (
              select 1
              from public.community_members as membership
              where membership.community_id = post.community_id
                and membership.user_id = (select auth.uid())
            )
          )
        )
    );
$$;

revoke all on function private.is_community_member(uuid) from public, anon, authenticated;
revoke all on function private.can_read_profile(uuid) from public, anon, authenticated;
revoke all on function private.can_access_feed_post(bigint) from public, anon, authenticated;
grant execute on function private.is_community_member(uuid) to authenticated;
grant execute on function private.can_read_profile(uuid) to authenticated;
grant execute on function private.can_access_feed_post(bigint) to authenticated;

-- Published community content is no longer exposed to unauthenticated callers.
revoke select on table public.profiles, public.posts, public.post_comments,
  public.post_polls, public.poll_options from anon;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read_related
  on public.profiles for select to authenticated
  using (private.can_read_profile(id));

drop policy if exists posts_read_public_or_own on public.posts;
create policy posts_read_member_or_own
  on public.posts for select to authenticated
  using (
    author_id = (select auth.uid())
    or (status = 'published' and private.is_community_member(community_id))
  );

drop policy if exists comments_read_published_or_own on public.post_comments;
create policy comments_read_post_member
  on public.post_comments for select to authenticated
  using (private.can_access_feed_post(post_id));

drop policy if exists polls_read on public.post_polls;
create policy polls_read_post_member
  on public.post_polls for select to authenticated
  using (private.can_access_feed_post(post_id));

drop policy if exists poll_options_read on public.poll_options;
create policy poll_options_read_post_member
  on public.poll_options for select to authenticated
  using (private.can_access_feed_post(post_id));

drop policy if exists post_images_read_published_or_own on public.post_images;
create policy post_images_read_post_member
  on public.post_images for select to authenticated
  using (private.can_access_feed_post(post_id));

-- Application callers may only create drafts and may never write aggregate
-- counters or tenant ownership columns during an update.
drop policy if exists posts_insert_member on public.posts;
create policy posts_insert_member_draft
  on public.posts for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'draft'
    and published_at is null
    and like_count = 0
    and comment_count = 0
    and private.is_community_member(community_id)
  );

drop policy if exists posts_update_own on public.posts;

revoke insert, update on table public.posts from authenticated;
grant insert (
  author_id, category, community_id, content, has_poll, location, status, title
) on table public.posts to authenticated;

-- Comments are currently immutable after creation. Counts remain trigger-owned.
revoke update on table public.post_comments from authenticated;
drop policy if exists comments_update_own on public.post_comments;

-- Poll structure and image metadata are written only while finalizing a draft.
-- Aggregate vote counts remain writable solely by their SECURITY DEFINER trigger.
revoke insert, update, delete on table public.post_polls, public.poll_options, public.post_images
  from authenticated;
drop policy if exists polls_insert_own_post on public.post_polls;
drop policy if exists polls_update_own_post on public.post_polls;
drop policy if exists polls_delete_own_post on public.post_polls;
drop policy if exists poll_options_insert_own_post on public.poll_options;
drop policy if exists poll_options_update_own_post on public.poll_options;
drop policy if exists poll_options_delete_own_post on public.poll_options;
drop policy if exists post_images_insert_own_post on public.post_images;
drop policy if exists post_images_update_own_post on public.post_images;
drop policy if exists post_images_delete_own_post on public.post_images;

-- Finalizing a draft is one database transaction: image metadata, poll rows and
-- the published post become visible together or not at all.
create or replace function private.publish_feed_post(
  p_post_id bigint,
  p_image_paths text[],
  p_audio_path text,
  p_audio_name text,
  p_poll_question text,
  p_poll_options text[]
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_post public.posts;
  expected_path_prefix text;
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select *
  into current_post
  from public.posts
  where id = p_post_id
    and author_id = current_user_id
  for update;

  if not found then
    raise exception 'post draft not found' using errcode = 'P0002';
  end if;

  -- A retry after a committed response timeout is safe.
  if current_post.status = 'published' then
    return current_post.id;
  end if;

  if current_post.status <> 'draft' then
    raise exception 'post is not a draft' using errcode = '22023';
  end if;

  if not private.is_community_member(current_post.community_id) then
    raise exception 'community membership required' using errcode = '42501';
  end if;

  if cardinality(coalesce(p_image_paths, array[]::text[])) > 12 then
    raise exception 'a post supports at most 12 images' using errcode = '22023';
  end if;

  expected_path_prefix := current_user_id::text || '/' || p_post_id::text || '/';
  if exists (
    select 1
    from unnest(coalesce(p_image_paths, array[]::text[])) as image_path
    where image_path is null
      or image_path = ''
      or image_path not like expected_path_prefix || '%'
  ) then
    raise exception 'invalid post image path' using errcode = '22023';
  end if;

  if p_audio_path is not null and p_audio_path not like expected_path_prefix || '%' then
    raise exception 'invalid post audio path' using errcode = '22023';
  end if;

  if current_post.has_poll then
    if nullif(trim(coalesce(p_poll_question, '')), '') is null
      or cardinality(coalesce(p_poll_options, array[]::text[])) not between 2 and 4
      or exists (
        select 1 from unnest(coalesce(p_poll_options, array[]::text[])) as option_label
        where nullif(trim(option_label), '') is null
      )
    then
      raise exception 'a poll requires a question and two to four options' using errcode = '22023';
    end if;
  elsif p_poll_question is not null
    or cardinality(coalesce(p_poll_options, array[]::text[])) > 0
  then
    raise exception 'poll data does not match the post draft' using errcode = '22023';
  end if;

  insert into public.post_images (post_id, storage_path, position)
  select p_post_id, image_path, (ordinality - 1)::smallint
  from unnest(coalesce(p_image_paths, array[]::text[])) with ordinality
    as uploaded_image(image_path, ordinality);

  if current_post.has_poll then
    insert into public.post_polls (post_id, question)
    values (p_post_id, trim(p_poll_question));

    insert into public.poll_options (post_id, label, position)
    select p_post_id, trim(option_label), (ordinality - 1)::smallint
    from unnest(p_poll_options) with ordinality
      as poll_option(option_label, ordinality);
  end if;

  update public.posts
  set
    audio_name = nullif(trim(coalesce(p_audio_name, '')), ''),
    audio_path = p_audio_path,
    image_path = (coalesce(p_image_paths, array[]::text[]))[1],
    published_at = now(),
    status = 'published'
  where id = p_post_id;

  return p_post_id;
end;
$$;

revoke all on function private.publish_feed_post(bigint, text[], text, text, text, text[])
  from public, anon, authenticated;
grant execute on function private.publish_feed_post(bigint, text[], text, text, text, text[])
  to authenticated;

create or replace function public.publish_feed_post(
  p_post_id bigint,
  p_image_paths text[],
  p_audio_path text,
  p_audio_name text,
  p_poll_question text,
  p_poll_options text[]
)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  select private.publish_feed_post(
    p_post_id,
    p_image_paths,
    p_audio_path,
    p_audio_name,
    p_poll_question,
    p_poll_options
  );
$$;

revoke all on function public.publish_feed_post(bigint, text[], text, text, text, text[])
  from public, anon;
grant execute on function public.publish_feed_post(bigint, text[], text, text, text, text[])
  to authenticated;

-- Votes are also written through a validated operation so callers cannot move
-- an existing vote to an inaccessible post or write trigger-owned totals.
revoke insert, update, delete on table public.poll_votes from authenticated;
drop policy if exists poll_votes_insert_member on public.poll_votes;
drop policy if exists poll_votes_update_own on public.poll_votes;
drop policy if exists poll_votes_delete_own on public.poll_votes;

create or replace function private.set_feed_poll_vote(
  p_post_id bigint,
  p_option_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.poll_options as option
    join public.posts as post on post.id = option.post_id
    where option.id = p_option_id
      and option.post_id = p_post_id
      and post.status = 'published'
      and exists (
        select 1
        from public.community_members as membership
        where membership.community_id = post.community_id
          and membership.user_id = current_user_id
      )
  ) then
    raise exception 'poll option is not available' using errcode = '42501';
  end if;

  insert into public.poll_votes (post_id, option_id, user_id)
  values (p_post_id, p_option_id, current_user_id)
  on conflict (post_id, user_id) do update
  set option_id = excluded.option_id;
end;
$$;

revoke all on function private.set_feed_poll_vote(bigint, bigint)
  from public, anon, authenticated;
grant execute on function private.set_feed_poll_vote(bigint, bigint)
  to authenticated;

create or replace function public.set_feed_poll_vote(
  p_post_id bigint,
  p_option_id bigint
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.set_feed_poll_vote(p_post_id, p_option_id);
$$;

revoke all on function public.set_feed_poll_vote(bigint, bigint) from public, anon;
grant execute on function public.set_feed_poll_vote(bigint, bigint) to authenticated;

-- Media is private. A signed URL may be created by the owner or by a member who
-- can read the post encoded in the canonical <user>/<post>/<file> path.
update storage.buckets
set public = false
where id = 'post-media';

drop policy if exists post_media_select_own_folder on storage.objects;
create policy post_media_select_post_member
  on storage.objects for select to authenticated
  using (
    bucket_id = 'post-media'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or case
        when coalesce((storage.foldername(name))[2], '') ~ '^[1-9][0-9]*$'
        then private.can_access_feed_post(((storage.foldername(name))[2])::bigint)
        else false
      end
    )
  );
