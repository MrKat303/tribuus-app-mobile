export type ConversationKind = 'friend' | 'group';

export type InboxFilter = 'all' | 'friends' | 'groups' | 'unread';

export type Conversation = {
  accent: string;
  id: string;
  initials: string;
  kind: ConversationKind;
  lastMessage: string;
  name: string;
  online?: boolean;
  time: string;
  unread?: number;
};

export const inboxFilters: readonly { id: InboxFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'unread', label: 'No leídos' },
  { id: 'groups', label: 'Grupos' },
  { id: 'friends', label: 'Amigos' },
];

export function filterConversations(
  conversations: readonly Conversation[],
  filter: InboxFilter,
  query: string,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase('es');

  return conversations.filter((conversation) => {
    const matchesCategory = filter === 'all'
      || (filter === 'unread' && Boolean(conversation.unread))
      || (filter === 'groups' && conversation.kind === 'group')
      || (filter === 'friends' && conversation.kind === 'friend');
    const matchesQuery = !normalizedQuery
      || `${conversation.name} ${conversation.lastMessage}`.toLocaleLowerCase('es').includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}
