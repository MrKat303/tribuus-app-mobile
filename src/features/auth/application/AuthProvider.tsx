import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/shared/infrastructure/supabase/client';

import { authErrorMessage } from './authErrors';
import { consumeAuthUrl } from './authLinking';

export type AuthProfile = {
  bio: string;
  displayName: string;
  id: string;
  initials: string;
  location: string;
  onboardingCompletedAt: string | null;
  primaryCommunityId: string | null;
  username: string;
};

export type OnboardingPayload = {
  accuracyM?: number;
  bio: string;
  communityId: string;
  countryCode?: string;
  displayName: string;
  interests: string[];
  latitude?: number;
  locationLabel: string;
  locationSource: 'device' | 'manual';
  longitude?: number;
  region?: string;
  username: string;
};

type AuthResult = { needsEmailConfirmation: boolean };

type AuthContextValue = {
  completeOnboarding: (payload: OnboardingPayload) => Promise<void>;
  error: string | null;
  isLoading: boolean;
  isOnboarded: boolean;
  profile: AuthProfile | null;
  refreshProfile: () => Promise<void>;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (displayName: string, email: string, password: string) => Promise<AuthResult>;
};

type ProfileRow = {
  bio: string;
  display_name: string;
  id: string;
  initials: string;
  location: string;
  onboarding_completed_at: string | null;
  primary_community_id: string | null;
  username: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapProfile(row: ProfileRow): AuthProfile {
  return {
    bio: row.bio,
    displayName: row.display_name,
    id: row.id,
    initials: row.initials,
    location: row.location,
    onboardingCompletedAt: row.onboarding_completed_at,
    primaryCommunityId: row.primary_community_id,
    username: row.username,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const result = await supabase
      .from('profiles')
      .select('id, display_name, initials, username, bio, location, primary_community_id, onboarding_completed_at')
      .eq('id', userId)
      .maybeSingle();
    if (result.error) throw result.error;
    setProfile(result.data ? mapProfile(result.data as ProfileRow) : null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user.id);
  }, [loadProfile, session?.user.id]);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession()
      .then(async ({ data, error: sessionError }) => {
        if (sessionError) throw sessionError;
        if (!active) return;
        setSession(data.session);
        await loadProfile(data.session?.user.id);
      })
      .catch((cause) => {
        if (active) setError(authErrorMessage(cause));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const authSubscription = supabase.auth.onAuthStateChange((event, nextSession) => {
      // getSession() es la única fuente del bootstrap inicial. Evita duplicar la carga
      // de perfil cuando Supabase emite INITIAL_SESSION al registrar el listener.
      if (event === 'INITIAL_SESSION') return;
      if (!active) return;
      setSession(nextSession);
      setIsLoading(true);
      setTimeout(() => {
        if (!active) return;
        void loadProfile(nextSession?.user.id)
          .catch((cause) => setError(authErrorMessage(cause)))
          .finally(() => setIsLoading(false));
      }, 0);
    });

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void consumeAuthUrl(url).catch((cause) => setError(authErrorMessage(cause)));
    });

    void Linking.getInitialURL().then((url) => {
      if (url && active) void consumeAuthUrl(url).catch((cause) => setError(authErrorMessage(cause)));
    });

    return () => {
      active = false;
      authSubscription.data.subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const result = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (result.error) {
      const message = authErrorMessage(result.error);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signUp = useCallback(async (displayName: string, email: string, password: string) => {
    setError(null);
    const result = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: Linking.createURL('/auth/callback'),
      },
      password,
    });
    if (result.error) {
      const message = authErrorMessage(result.error);
      setError(message);
      throw new Error(message);
    }
    return { needsEmailConfirmation: !result.data.session };
  }, []);

  const signOut = useCallback(async () => {
    const result = await supabase.auth.signOut();
    if (result.error) throw new Error(authErrorMessage(result.error));
    setProfile(null);
  }, []);

  const completeOnboarding = useCallback(async (payload: OnboardingPayload) => {
    const result = await supabase.rpc('complete_onboarding', {
      p_accuracy_m: payload.accuracyM ?? null,
      p_bio: payload.bio,
      p_community_id: payload.communityId,
      p_country_code: payload.countryCode ?? null,
      p_display_name: payload.displayName,
      p_interests: payload.interests,
      p_latitude: payload.latitude ?? null,
      p_location_label: payload.locationLabel,
      p_location_source: payload.locationSource,
      p_longitude: payload.longitude ?? null,
      p_region: payload.region ?? null,
      p_username: payload.username,
    });
    if (result.error) {
      const message = authErrorMessage(result.error);
      setError(message);
      throw new Error(message);
    }
    if (result.data) setProfile(mapProfile(result.data as ProfileRow));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    completeOnboarding,
    error,
    isLoading,
    isOnboarded: Boolean(profile?.onboardingCompletedAt),
    profile,
    refreshProfile,
    session,
    signIn,
    signOut,
    signUp,
  }), [completeOnboarding, error, isLoading, profile, refreshProfile, session, signIn, signOut, signUp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return context;
}
