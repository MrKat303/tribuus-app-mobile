-- PostgreSQL does not automatically index the referencing side of foreign keys.
-- These indexes keep joins and ON DELETE CASCADE checks efficient as data grows.
create index if not exists places_owner_id_idx
  on public.places (owner_id);

create index if not exists chat_message_reactions_user_id_idx
  on public.chat_message_reactions (user_id);
