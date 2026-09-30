import { useLocalSearchParams } from 'expo-router';

import ChatScreen from '@/features/chat/screens/ChatScreen';

export default function ConversationRoute() {
  const params = useLocalSearchParams<{ conversationId?: string | string[] }>();
  const conversationId = Array.isArray(params.conversationId) ? params.conversationId[0] : params.conversationId;

  return <ChatScreen conversationId={conversationId} />;
}
