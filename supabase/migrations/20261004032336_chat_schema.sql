create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('friend', 'group')),
  name text check (name is null or char_length(trim(name)) between 1 and 120),
  accent text not null default '#DDF4E5' check (accent ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_conversation_members (
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.chat_messages (
  id text primary key check (char_length(id) between 1 and 100),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  text text check (text is null or char_length(text) between 1 and 4000),
  image_uri text,
  aspect_ratio real check (aspect_ratio is null or aspect_ratio > 0),
  audio_uri text,
  audio_duration_ms integer check (audio_duration_ms is null or audio_duration_ms >= 0),
  audio_waveform jsonb,
  reply_to jsonb,
  reactions jsonb not null default '[]'::jsonb,
  sent_at timestamptz not null default now(),
  constraint chat_messages_has_content check (
    text is not null or image_uri is not null or audio_uri is not null
  )
);

create table public.chat_message_reactions (
  message_id text not null references public.chat_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create index chat_members_user_id_idx
  on public.chat_conversation_members (user_id, conversation_id);
create index chat_messages_conversation_sent_at_idx
  on public.chat_messages (conversation_id, sent_at, id);
create index chat_messages_sender_id_idx
  on public.chat_messages (sender_id);
create index chat_message_reactions_message_id_idx
  on public.chat_message_reactions (message_id);

create trigger chat_conversations_set_updated_at before update on public.chat_conversations
for each row execute function private.set_updated_at();

create or replace function private.touch_chat_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.chat_conversations
  set updated_at = greatest(updated_at, new.sent_at)
  where id = new.conversation_id;
  return new;
end;
$$;

revoke all on function private.touch_chat_conversation() from public, anon, authenticated;

create trigger chat_messages_touch_conversation
after insert on public.chat_messages
for each row execute function private.touch_chat_conversation();

create or replace function private.is_chat_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.chat_conversation_members as membership
      where membership.conversation_id = p_conversation_id
        and membership.user_id = (select auth.uid())
    );
$$;

revoke all on function private.is_chat_member(uuid) from public, anon, authenticated;
grant execute on function private.is_chat_member(uuid) to authenticated;

alter table public.chat_conversations enable row level security;
alter table public.chat_conversation_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_message_reactions enable row level security;

revoke all on table public.chat_conversations, public.chat_conversation_members, public.chat_messages, public.chat_message_reactions from anon, authenticated;
grant select on table public.chat_conversations to authenticated;
grant select, update (last_read_at) on table public.chat_conversation_members to authenticated;
grant select, insert, update, delete on table public.chat_messages to authenticated;
grant select, insert, delete on table public.chat_message_reactions to authenticated;

create policy chat_members_read_own
  on public.chat_conversation_members for select to authenticated
  using (private.is_chat_member(conversation_id));

create policy chat_members_mark_own_read
  on public.chat_conversation_members for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy chat_conversations_read_member
  on public.chat_conversations for select to authenticated
  using (private.is_chat_member(id));

create policy chat_messages_read_member
  on public.chat_messages for select to authenticated
  using (private.is_chat_member(conversation_id));

create policy chat_messages_insert_member
  on public.chat_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.is_chat_member(conversation_id)
  );

create policy chat_messages_update_own
  on public.chat_messages for update to authenticated
  using (sender_id = (select auth.uid()))
  with check (
    sender_id = (select auth.uid())
    and private.is_chat_member(conversation_id)
  );

create policy chat_messages_delete_own
  on public.chat_messages for delete to authenticated
  using (sender_id = (select auth.uid()));

create policy chat_reactions_read_member
  on public.chat_message_reactions for select to authenticated
  using (exists (
    select 1
    from public.chat_messages as message
    join public.chat_conversation_members as membership
      on membership.conversation_id = message.conversation_id
    where message.id = chat_message_reactions.message_id
      and membership.user_id = (select auth.uid())
  ));

create policy chat_reactions_insert_own
  on public.chat_message_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.chat_messages as message
      join public.chat_conversation_members as membership
        on membership.conversation_id = message.conversation_id
      where message.id = chat_message_reactions.message_id
        and membership.user_id = (select auth.uid())
    )
  );

create policy chat_reactions_delete_own
  on public.chat_message_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.list_chat_conversations()
returns table (
  id uuid,
  kind text,
  name text,
  initials text,
  accent text,
  online boolean,
  last_message text,
  unread_count bigint,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    conversation.id,
    conversation.kind,
    case
      when conversation.kind = 'group' then coalesce(conversation.name, 'Grupo')
      else coalesce(other_profile.display_name, 'Miembro de Tribus')
    end as name,
    case
      when conversation.kind = 'group' then upper(left(coalesce(conversation.name, 'GR'), 2))
      else coalesce(nullif(other_profile.initials, ''), '?')
    end as initials,
    conversation.accent,
    false as online,
    coalesce(latest_message.text, case when latest_message.image_uri is not null then 'Imagen' when latest_message.audio_uri is not null then 'Audio' else '' end) as last_message,
    (
      select count(*)
      from public.chat_messages as unread_message
      where unread_message.conversation_id = conversation.id
        and unread_message.sender_id <> (select auth.uid())
        and unread_message.sent_at > membership.last_read_at
    ) as unread_count,
    coalesce(latest_message.sent_at, conversation.updated_at) as updated_at
  from public.chat_conversation_members as membership
  join public.chat_conversations as conversation on conversation.id = membership.conversation_id
  left join lateral (
    select profile.display_name, profile.initials
    from public.chat_conversation_members as other_membership
    join public.profiles as profile on profile.id = other_membership.user_id
    where other_membership.conversation_id = conversation.id
      and other_membership.user_id <> (select auth.uid())
    order by other_membership.joined_at, other_membership.user_id
    limit 1
  ) as other_profile on true
  left join lateral (
    select message.text, message.image_uri, message.audio_uri, message.sent_at
    from public.chat_messages as message
    where message.conversation_id = conversation.id
    order by message.sent_at desc, message.id desc
    limit 1
  ) as latest_message on true
  where membership.user_id = (select auth.uid())
  order by coalesce(latest_message.sent_at, conversation.updated_at) desc, conversation.id;
$$;

revoke all on function public.list_chat_conversations() from public, anon;
grant execute on function public.list_chat_conversations() to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end;
$$;
