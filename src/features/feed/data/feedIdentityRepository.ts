import { supabase } from '@/shared/infrastructure/supabase/client';

export type FeedIdentity = {
  displayName: string;
  initials: string;
  location: string;
};

export function assertNoFeedError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function ensureFeedIdentity(_identity: FeedIdentity) {
  const currentSession = await supabase.auth.getSession();
  assertNoFeedError(currentSession.error);
  const user = currentSession.data.session?.user;
  if (!user) throw new Error('Inicia sesión para participar en la comunidad.');
  return user;
}

export async function getFeedAccount() {
  const user = await ensureFeedIdentity({ displayName: '', initials: '', location: '' });
  const profileResult = await supabase
    .from('profiles')
    .select('primary_community_id')
    .eq('id', user.id)
    .single();
  assertNoFeedError(profileResult.error);
  const communityId = profileResult.data?.primary_community_id as string | null | undefined;
  if (!communityId) throw new Error('Completa tu perfil y elige una comunidad para ver el feed.');
  return { communityId, user };
}
