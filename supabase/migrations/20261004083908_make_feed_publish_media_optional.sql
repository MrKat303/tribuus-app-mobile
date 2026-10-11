-- PostgREST derives RPC argument optionality from PostgreSQL defaults. Media
-- and poll payloads are nullable by design, so expose that contract explicitly
-- instead of forcing clients to lie to generated TypeScript types.
create or replace function public.publish_feed_post(
  p_post_id bigint,
  p_image_paths text[] default array[]::text[],
  p_audio_path text default null,
  p_audio_name text default null,
  p_poll_question text default null,
  p_poll_options text[] default array[]::text[]
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
