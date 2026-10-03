create index poll_votes_post_option_idx on public.poll_votes(post_id, option_id);

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
