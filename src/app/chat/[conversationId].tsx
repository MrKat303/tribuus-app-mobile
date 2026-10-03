import { useLocalSearchParams } from 'expo-router';

import ConversationScreen from '@/features/chat/ui/screens/ConversationScreen';

export default function ConversationRoute() {
  const params = useLocalSearchParams<{ conversationId?: string | string[] }>();
  const conversationId = Array.isArray(params.conversationId) ? params.conversationId[0] : params.conversationId;

  if (!conversationId) return null;

  return <ConversationScreen conversationId={conversationId} />;
}
