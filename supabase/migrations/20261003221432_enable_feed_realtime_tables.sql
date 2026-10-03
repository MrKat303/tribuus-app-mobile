do $$
declare
  realtime_table text;
begin
  foreach realtime_table in array array[
    'post_comments',
    'post_images',
    'post_polls',
    'poll_options'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = realtime_table
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        realtime_table
      );
    end if;
  end loop;
end;
$$;
