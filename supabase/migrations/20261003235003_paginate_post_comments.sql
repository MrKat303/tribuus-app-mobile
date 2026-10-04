-- Supports stable keyset pagination for a single post's newest comments.
create index if not exists post_comments_post_created_id_idx
on public.post_comments (post_id, created_at desc, id desc);
