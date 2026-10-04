-- The cursor index has the same leading columns and also guarantees stable
-- ordering by id, so keeping this shorter index would only duplicate writes.
drop index if exists public.post_comments_post_created_idx;
