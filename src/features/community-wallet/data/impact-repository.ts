import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CommunityRole,
  ImpactAction,
  ImpactActionStatus,
  ImpactActionTypeCode,
  ImpactCredential,
  ImpactCredentialStatus,
  ImpactRule,
  PendingImpactAction,
  SubmitImpactActionInput,
} from '@/features/community-wallet/model/communityWallet';
import { supabase } from '@/shared/infrastructure/supabase/client';

// La migración de impacto todavía no forma parte del archivo generado. Este cast queda
// confinado al adaptador y se elimina al regenerar database.types.ts tras aplicar la migración.
const impactDb = supabase as unknown as SupabaseClient;

type RuleRow = {
  code: string;
  description: string;
  is_active: boolean;
  label: string;
  points: number;
  rule_version: number;
  verification_policy: string;
};

type ActionRow = {
  action_type_code: string;
  actor_id: string;
  confirmation_note: string | null;
  description: string;
  id: string;
  occurred_at: string;
  status: string;
  submitted_at: string;
};

type CredentialRow = {
  action_type_code: string;
  anchored_at: string | null;
  claim_hash: string;
  contract_id: string | null;
  id: string;
  issued_at: string;
  onchain_credential_id: string;
  points: number;
  rule_version: number;
  status: string;
  stellar_network: string;
  stellar_transaction_hash: string | null;
};

type MembershipRow = { role: string };

export type CommunityImpactSnapshot = {
  actions: ImpactAction[];
  credentials: ImpactCredential[];
  pendingReview: PendingImpactAction[];
  role: CommunityRole;
  rules: ImpactRule[];
};

function mapRule(row: RuleRow): ImpactRule {
  return {
    code: row.code as ImpactActionTypeCode,
    description: row.description,
    isActive: row.is_active,
    label: row.label,
    points: row.points,
    ruleVersion: row.rule_version,
    verificationPolicy: row.verification_policy,
  };
}

function mapAction(row: ActionRow): ImpactAction {
  return {
    actionTypeCode: row.action_type_code as ImpactActionTypeCode,
    confirmationNote: row.confirmation_note,
    description: row.description,
    id: row.id,
    occurredAt: row.occurred_at,
    status: row.status as ImpactActionStatus,
    submittedAt: row.submitted_at,
  };
}

function mapCredential(row: CredentialRow): ImpactCredential {
  return {
    actionTypeCode: row.action_type_code as ImpactActionTypeCode,
    anchoredAt: row.anchored_at,
    claimHash: row.claim_hash,
    contractId: row.contract_id,
    id: row.id,
    issuedAt: row.issued_at,
    network: row.stellar_network as 'testnet' | 'public',
    onchainCredentialId: row.onchain_credential_id,
    points: row.points,
    ruleVersion: row.rule_version,
    status: row.status as ImpactCredentialStatus,
    transactionHash: row.stellar_transaction_hash,
  };
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function loadCommunityImpact(userId: string, communityId: string): Promise<CommunityImpactSnapshot> {
  const membershipResult = await impactDb
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();
  throwIfError(membershipResult.error);
  const role = ((membershipResult.data as MembershipRow | null)?.role ?? 'member') as CommunityRole;
  const canReview = role === 'moderator' || role === 'admin';

  const pendingRequest = canReview
    ? impactDb
      .from('impact_actions')
      .select('id, actor_id, action_type_code, description, confirmation_note, status, occurred_at, submitted_at')
      .eq('community_id', communityId)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true })
    : Promise.resolve({ data: [], error: null });

  const [rulesResult, actionsResult, credentialsResult, pendingResult] = await Promise.all([
    impactDb
      .from('impact_action_types')
      .select('code, label, description, points, verification_policy, rule_version, is_active')
      .eq('is_active', true)
      .order('points', { ascending: true }),
    impactDb
      .from('impact_actions')
      .select('id, actor_id, action_type_code, description, confirmation_note, status, occurred_at, submitted_at')
      .eq('community_id', communityId)
      .eq('actor_id', userId)
      .order('submitted_at', { ascending: false }),
    impactDb
      .from('impact_credentials')
      .select('id, action_type_code, points, rule_version, claim_hash, onchain_credential_id, stellar_network, contract_id, stellar_transaction_hash, status, issued_at, anchored_at')
      .eq('community_id', communityId)
      .eq('subject_id', userId)
      .order('issued_at', { ascending: false }),
    pendingRequest,
  ]);

  [rulesResult.error, actionsResult.error, credentialsResult.error, pendingResult.error].forEach(throwIfError);

  return {
    actions: ((actionsResult.data ?? []) as ActionRow[]).map(mapAction),
    credentials: ((credentialsResult.data ?? []) as CredentialRow[]).map(mapCredential),
    pendingReview: ((pendingResult.data ?? []) as ActionRow[]).map((row) => ({ ...mapAction(row), actorId: row.actor_id })),
    role,
    rules: ((rulesResult.data ?? []) as RuleRow[]).map(mapRule),
  };
}

export async function submitImpactAction(
  userId: string,
  communityId: string,
  input: SubmitImpactActionInput,
) {
  const result = await impactDb
    .from('impact_actions')
    .insert({
      action_type_code: input.actionTypeCode,
      actor_id: userId,
      community_id: communityId,
      confirmation_note: input.confirmationNote?.trim() || null,
      description: input.description.trim(),
      occurred_at: input.occurredAt,
    })
    .select('id')
    .single();
  throwIfError(result.error);
  return (result.data as { id: string }).id;
}

export async function reviewImpactAction(actionId: string, decision: 'approved' | 'rejected', note?: string) {
  const result = await impactDb.functions.invoke('anchor-impact-credential', {
    body: { actionId, decision, note: note?.trim() || null },
  });
  if (result.error) throw new Error(result.error.message);
  if (result.data?.error) throw new Error(String(result.data.error));
}
