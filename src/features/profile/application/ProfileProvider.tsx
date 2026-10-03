import { createContext, type PropsWithChildren, useCallback, useContext, useMemo } from 'react';

import { useAuth } from '@/features/auth/application/AuthProvider';
import { supabase } from '@/shared/infrastructure/supabase/client';

export type Profile = {
  bio: string;
  location: string;
  name: string;
  username: string;
};

type ProfileContextValue = {
  profile: Profile;
  updateProfile: (profile: Profile) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: PropsWithChildren) {
  const { profile: authProfile, refreshProfile, session } = useAuth();
  const profile = useMemo<Profile>(() => ({
    bio: authProfile?.bio ?? '',
    location: authProfile?.location ?? 'Providencia',
    name: authProfile?.displayName ?? 'Miembro de Tribus',
    username: authProfile?.username ?? '',
  }), [authProfile]);

  const updateProfile = useCallback(async (nextProfile: Profile) => {
    const userId = session?.user.id;
    if (!userId) throw new Error('Tu sesión ya no está activa.');
    const name = nextProfile.name.trim();
    const username = nextProfile.username.trim().toLowerCase();
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'V';
    const result = await supabase.from('profiles').update({
      bio: nextProfile.bio.trim(),
      display_name: name,
      initials,
      location: nextProfile.location.trim(),
      username,
    }).eq('id', userId);
    if (result.error) throw new Error(result.error.message);
    await refreshProfile();
  }, [refreshProfile, session?.user.id]);

  const value = useMemo(() => ({ profile, updateProfile }), [profile, updateProfile]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile debe usarse dentro de ProfileProvider.');
  return context;
}
