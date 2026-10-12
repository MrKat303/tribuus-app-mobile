import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { listCommunityInitiatives } from '@/features/community-wallet/data/community-initiatives-repository';
import {
  createCommunityFundEntry as createCommunityFundEntryRequest,
  listCommunityFundEntries,
} from '@/features/community-wallet/data/community-fund-repository';
import {
  loadCommunityImpact,
  reviewImpactAction as reviewImpactActionRequest,
  submitImpactAction as submitImpactActionRequest,
} from '@/features/community-wallet/data/impact-repository';
import {
  type CommunityInitiative,
  type CommunityFundEntry,
  type CommunityRole,
  type CreateCommunityFundEntryInput,
  type ImpactAction,
  type ImpactCredential,
  type ImpactRule,
  type PendingImpactAction,
  type SubmitImpactActionInput,
  summarizeCommunityFund,
  summarizeImpact,
} from '@/features/community-wallet/model/communityWallet';
import { useAuth } from '@/features/auth/application/AuthProvider';

type CommunityWalletContextValue = {
  addFundEntry: (input: CreateCommunityFundEntryInput) => Promise<string>;
  actions: ImpactAction[];
  credentials: ImpactCredential[];
  error: string | null;
  fundEntries: CommunityFundEntry[];
  fundError: string | null;
  fundSummary: ReturnType<typeof summarizeCommunityFund>;
  initiatives: CommunityInitiative[];
  initiativesError: string | null;
  isLoading: boolean;
  pendingReview: PendingImpactAction[];
  refresh: () => Promise<void>;
  reviewAction: (actionId: string, decision: 'approved' | 'rejected', note?: string) => Promise<void>;
  role: CommunityRole;
  rules: ImpactRule[];
  submitAction: (input: SubmitImpactActionInput) => Promise<string>;
  summary: ReturnType<typeof summarizeImpact>;
};

const CommunityWalletContext = createContext<CommunityWalletContextValue | null>(null);

export function CommunityWalletProvider({ children }: PropsWithChildren) {
  const { profile, session } = useAuth();
  const [actions, setActions] = useState<ImpactAction[]>([]);
  const [credentials, setCredentials] = useState<ImpactCredential[]>([]);
  const [fundEntries, setFundEntries] = useState<CommunityFundEntry[]>([]);
  const [fundError, setFundError] = useState<string | null>(null);
  const [initiatives, setInitiatives] = useState<CommunityInitiative[]>([]);
  const [initiativesError, setInitiativesError] = useState<string | null>(null);
  const [pendingReview, setPendingReview] = useState<PendingImpactAction[]>([]);
  const [rules, setRules] = useState<ImpactRule[]>([]);
  const [role, setRole] = useState<CommunityRole>('member');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = session?.user.id;
  const communityId = profile?.primaryCommunityId;

  const refresh = useCallback(async () => {
    if (!userId || !communityId) {
      setActions([]);
      setCredentials([]);
      setFundEntries([]);
      setFundError(null);
      setInitiatives([]);
      setInitiativesError(null);
      setPendingReview([]);
      setRules([]);
      setRole('member');
      setError('Completa tu perfil y elige una comunidad para usar Community Wallet.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setFundError(null);
    setInitiativesError(null);

    const [impactResult, initiativesResult, fundResult] = await Promise.allSettled([
      loadCommunityImpact(userId, communityId),
      listCommunityInitiatives(communityId),
      listCommunityFundEntries(communityId),
    ]);

    if (impactResult.status === 'fulfilled') {
      const snapshot = impactResult.value;
      setActions(snapshot.actions);
      setCredentials(snapshot.credentials);
      setPendingReview(snapshot.pendingReview);
      setRules(snapshot.rules);
      setRole(snapshot.role);
    } else {
      setError('No pudimos cargar Community Wallet. Inténtalo nuevamente.');
    }

    if (initiativesResult.status === 'fulfilled') {
      setInitiatives(initiativesResult.value);
    } else {
      setInitiatives([]);
      setInitiativesError('No pudimos cargar las iniciativas del barrio.');
    }

    if (fundResult.status === 'fulfilled') {
      setFundEntries(fundResult.value);
    } else {
      setFundEntries([]);
      setFundError('No pudimos cargar la caja comunitaria.');
    }

    setIsLoading(false);
  }, [communityId, userId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timeout);
  }, [refresh]);

  const submitAction = useCallback(async (input: SubmitImpactActionInput) => {
    if (!userId || !communityId) throw new Error('Tu perfil no tiene una comunidad activa.');
    const actionId = await submitImpactActionRequest(userId, communityId, input);
    await refresh();
    return actionId;
  }, [communityId, refresh, userId]);

  const reviewAction = useCallback(async (actionId: string, decision: 'approved' | 'rejected', note?: string) => {
    await reviewImpactActionRequest(actionId, decision, note);
    await refresh();
  }, [refresh]);

  const addFundEntry = useCallback(async (input: CreateCommunityFundEntryInput) => {
    if (!userId || !communityId) throw new Error('Tu perfil no tiene una comunidad activa.');
    const entryId = await createCommunityFundEntryRequest(userId, communityId, input);
    await refresh();
    return entryId;
  }, [communityId, refresh, userId]);

  const fundSummary = useMemo(() => summarizeCommunityFund(fundEntries), [fundEntries]);
  const summary = useMemo(() => summarizeImpact(actions, credentials), [actions, credentials]);
  const value = useMemo<CommunityWalletContextValue>(() => ({
    addFundEntry,
    actions,
    credentials,
    error,
    fundEntries,
    fundError,
    fundSummary,
    initiatives,
    initiativesError,
    isLoading,
    pendingReview,
    refresh,
    reviewAction,
    role,
    rules,
    submitAction,
    summary,
  }), [addFundEntry, actions, credentials, error, fundEntries, fundError, fundSummary, initiatives, initiativesError, isLoading, pendingReview, refresh, reviewAction, role, rules, submitAction, summary]);

  return <CommunityWalletContext.Provider value={value}>{children}</CommunityWalletContext.Provider>;
}

export function useCommunityWallet() {
  const context = useContext(CommunityWalletContext);
  if (!context) throw new Error('useCommunityWallet debe usarse dentro de CommunityWalletProvider.');
  return context;
}
