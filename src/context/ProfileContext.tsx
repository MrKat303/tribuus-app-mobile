import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Profile = {
  bio: string;
  name: string;
};

type ProfileContextValue = {
  profile: Profile;
  updateProfile: (profile: Profile) => Promise<void>;
};

const PROFILE_STORAGE_KEY = '@tribuus/profile';

const defaultProfile: Profile = {
  bio: 'Conectando con las personas y lugares que hacen comunidad.',
  name: 'Jaime M.',
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState(defaultProfile);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(PROFILE_STORAGE_KEY)
      .then((storedProfile) => {
        if (!active || !storedProfile) return;
        const parsed = JSON.parse(storedProfile) as Partial<Profile>;
        if (typeof parsed.name !== 'string' || typeof parsed.bio !== 'string') return;
        setProfile({ name: parsed.name, bio: parsed.bio });
      })
      .catch(() => {
        // Keep the safe defaults if local storage cannot be read.
      });

    return () => {
      active = false;
    };
  }, []);

  const updateProfile = useCallback(async (nextProfile: Profile) => {
    const normalizedProfile = {
      name: nextProfile.name.trim(),
      bio: nextProfile.bio.trim(),
    };

    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalizedProfile));
    setProfile(normalizedProfile);
  }, []);

  const value = useMemo(() => ({ profile, updateProfile }), [profile, updateProfile]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('useProfile debe usarse dentro de ProfileProvider.');
  return context;
}
