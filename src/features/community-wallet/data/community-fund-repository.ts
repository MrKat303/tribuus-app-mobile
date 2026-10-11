import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CommunityFundEntry,
  CommunityFundEntryType,
  CreateCommunityFundEntryInput,
} from '@/features/community-wallet/model/communityWallet';
import { supabase } from '@/shared/infrastructure/supabase/client';

// El schema generado se actualizará después de aplicar la migración remota.
// El cast queda confinado a este adaptador mientras tanto.
const fundDb = supabase as unknown as SupabaseClient;

type CommunityFundEntryRow = {
  amount_clp: number | string;
  community_id: string;
  counterparty: string | null;
  created_at: string;
  entry_type: string;
  id: string;
  initiative_id: string | null;
  occurred_at: string;
  recorded_by: string;
  title: string;
};

function mapCommunityFundEntry(row: CommunityFundEntryRow): CommunityFundEntry {
  return {
    amountClp: Number(row.amount_clp),
    communityId: row.community_id,
    counterparty: row.counterparty,
    createdAt: row.created_at,
    id: row.id,
    initiativeId: row.initiative_id,
    occurredAt: row.occurred_at,
    recordedBy: row.recorded_by,
    title: row.title,
    type: row.entry_type as CommunityFundEntryType,
  };
}

export async function listCommunityFundEntries(communityId: string): Promise<CommunityFundEntry[]> {
  const result = await fundDb
    .from('community_fund_entries')
    .select('id, community_id, initiative_id, recorded_by, entry_type, amount_clp, title, counterparty, occurred_at, created_at')
    .eq('community_id', communityId)
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (result.error) throw new Error(result.error.message);
  return ((result.data ?? []) as CommunityFundEntryRow[]).map(mapCommunityFundEntry);
}

export async function createCommunityFundEntry(
  userId: string,
  communityId: string,
  input: CreateCommunityFundEntryInput,
) {
  const result = await fundDb
    .from('community_fund_entries')
    .insert({
      amount_clp: input.amountClp,
      community_id: communityId,
      counterparty: input.counterparty?.trim() || null,
      entry_type: input.type,
      initiative_id: input.initiativeId || null,
      occurred_at: input.occurredAt,
      recorded_by: userId,
      title: input.title.trim(),
    })
    .select('id')
    .single();

  if (result.error) throw new Error(result.error.message);
  return (result.data as { id: string }).id;
}
