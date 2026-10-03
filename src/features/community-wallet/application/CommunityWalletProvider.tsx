import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { demoInitiatives, type CommunityInitiative, type InitiativeDraft } from '@/features/community-wallet/model/communityWallet';

const STORAGE_KEY = '@tribuus/community-wallet-v2';

type StoredWalletState = {
  initiatives: CommunityInitiative[];
};

type CommunityWalletContextValue = {
  createInitiative: (draft: InitiativeDraft, proposedBy: string) => string;
  initiatives: CommunityInitiative[];
  toggleSupport: (initiativeId: string) => void;
};

const CommunityWalletContext = createContext<CommunityWalletContextValue | null>(null);

export function CommunityWalletProvider({ children }: PropsWithChildren) {
  const [initiatives, setInitiatives] = useState(demoInitiatives);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!active || !value) return;
        const parsed = JSON.parse(value) as Partial<StoredWalletState>;
        if (Array.isArray(parsed.initiatives)) setInitiatives(parsed.initiatives);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const toggleSupport = useCallback((initiativeId: string) => {
    setInitiatives((current) => {
      const next = current.map((initiative) => initiative.id === initiativeId
        ? {
          ...initiative,
          supportedByMe: !initiative.supportedByMe,
          supporters: Math.max(0, initiative.supporters + (initiative.supportedByMe ? -1 : 1)),
        }
        : initiative);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ initiatives: next } satisfies StoredWalletState));
      return next;
    });
  }, []);

  const createInitiative = useCallback((draft: InitiativeDraft, proposedBy: string) => {
    const id = `initiative-${Date.now()}`;
    const initiative: CommunityInitiative = {
      ...draft,
      createdAt: new Date().toISOString(),
      daysLeft: 30,
      id,
      proposedBy,
      status: 'review',
      supportedByMe: true,
      supporters: 1,
    };
    setInitiatives((current) => {
      const next = [initiative, ...current];
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ initiatives: next } satisfies StoredWalletState));
      return next;
    });
    return id;
  }, []);

  const value = useMemo(() => ({ createInitiative, initiatives, toggleSupport }), [createInitiative, initiatives, toggleSupport]);
  return <CommunityWalletContext.Provider value={value}>{children}</CommunityWalletContext.Provider>;
}

export function useCommunityWallet() {
  const context = useContext(CommunityWalletContext);
  if (!context) throw new Error('useCommunityWallet debe usarse dentro de CommunityWalletProvider.');
  return context;
}
