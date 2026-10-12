import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CommunityInitiative,
  CommunityInitiativeStatus,
  InitiativeContributionKind,
} from '@/features/community-wallet/model/communityWallet';
import { supabase } from '@/shared/infrastructure/supabase/client';

// La tabla se tipará desde el schema remoto cuando esta migración sea aplicada.
// Hasta entonces, el cast queda limitado a este adaptador de infraestructura.
const initiativesDb = supabase as unknown as SupabaseClient;

type CommunityInitiativeRow = {
  community_id: string;
  contribution_kind: string;
  created_at: string;
  creator_id: string;
  ends_at: string | null;
  id: string;
  location: string | null;
  starts_at: string | null;
  status: string;
  summary: string;
  supporter_count: number;
  title: string;
  updated_at: string;
};

function mapCommunityInitiative(row: CommunityInitiativeRow): CommunityInitiative {
  return {
    communityId: row.community_id,
    contributionKind: row.contribution_kind as InitiativeContributionKind,
    createdAt: row.created_at,
    creatorId: row.creator_id,
    endsAt: row.ends_at,
    id: row.id,
    location: row.location,
    startsAt: row.starts_at,
    status: row.status as CommunityInitiativeStatus,
    summary: row.summary,
    supporterCount: row.supporter_count,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

export async function listCommunityInitiatives(communityId: string): Promise<CommunityInitiative[]> {
  const result = await initiativesDb
    .from('community_initiatives')
    .select('id, community_id, creator_id, title, summary, contribution_kind, location, starts_at, ends_at, status, supporter_count, created_at, updated_at')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });

  if (result.error) throw new Error(result.error.message);
  return ((result.data ?? []) as CommunityInitiativeRow[]).map(mapCommunityInitiative);
}
