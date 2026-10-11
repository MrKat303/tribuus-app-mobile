export type ImpactActionTypeCode =
  | 'neighbor_help'
  | 'item_share'
  | 'community_activity'
  | 'initiative_complete'
  | 'organization_validated';

export type ImpactActionStatus = 'pending' | 'validated' | 'rejected';
export type ImpactCredentialStatus = 'pending_anchor' | 'active' | 'anchor_failed' | 'revoked';
export type CommunityRole = 'member' | 'moderator' | 'admin';

export type InitiativeContributionKind = 'item' | 'time' | 'skill' | 'mixed';
export type CommunityInitiativeStatus = 'review' | 'open' | 'completed' | 'cancelled';
export type CommunityFundEntryType = 'donation' | 'expense';

export type CommunityFundEntry = {
  amountClp: number;
  communityId: string;
  counterparty: string | null;
  createdAt: string;
  id: string;
  initiativeId: string | null;
  occurredAt: string;
  recordedBy: string;
  title: string;
  type: CommunityFundEntryType;
};

export type CreateCommunityFundEntryInput = {
  amountClp: number;
  counterparty?: string;
  initiativeId?: string;
  occurredAt: string;
  title: string;
  type: CommunityFundEntryType;
};

export type CommunityFundSummary = {
  cashBalanceClp: number;
  donationsTotalClp: number;
  expensesTotalClp: number;
};

export type CommunityInitiative = {
  communityId: string;
  contributionKind: InitiativeContributionKind;
  createdAt: string;
  creatorId: string;
  endsAt: string | null;
  id: string;
  location: string | null;
  startsAt: string | null;
  status: CommunityInitiativeStatus;
  summary: string;
  supporterCount: number;
  title: string;
  updatedAt: string;
};

export type ImpactRule = {
  code: ImpactActionTypeCode;
  description: string;
  isActive: boolean;
  label: string;
  points: number;
  ruleVersion: number;
  verificationPolicy: string;
};

export type ImpactAction = {
  actionTypeCode: ImpactActionTypeCode;
  confirmationNote: string | null;
  description: string;
  id: string;
  occurredAt: string;
  status: ImpactActionStatus;
  submittedAt: string;
};

export type ImpactCredential = {
  actionTypeCode: ImpactActionTypeCode;
  anchoredAt: string | null;
  claimHash: string;
  contractId: string | null;
  id: string;
  issuedAt: string;
  network: 'testnet' | 'public';
  onchainCredentialId: string;
  points: number;
  ruleVersion: number;
  status: ImpactCredentialStatus;
  transactionHash: string | null;
};

export type PendingImpactAction = ImpactAction & {
  actorId: string;
};

export type SubmitImpactActionInput = {
  actionTypeCode: ImpactActionTypeCode;
  confirmationNote?: string;
  description: string;
  occurredAt: string;
};

export type ImpactSummary = {
  activeCredentials: number;
  pendingActions: number;
  totalPoints: number;
};

export function summarizeImpact(actions: ImpactAction[], credentials: ImpactCredential[]): ImpactSummary {
  const activeCredentials = credentials.filter((credential) => credential.status === 'active');
  return {
    activeCredentials: activeCredentials.length,
    pendingActions: actions.filter((action) => action.status === 'pending').length,
    totalPoints: activeCredentials.reduce((total, credential) => total + credential.points, 0),
  };
}

export function summarizeCommunityFund(entries: CommunityFundEntry[]): CommunityFundSummary {
  const donationsTotalClp = entries
    .filter((entry) => entry.type === 'donation')
    .reduce((total, entry) => total + entry.amountClp, 0);
  const expensesTotalClp = entries
    .filter((entry) => entry.type === 'expense')
    .reduce((total, entry) => total + entry.amountClp, 0);

  return {
    cashBalanceClp: donationsTotalClp - expensesTotalClp,
    donationsTotalClp,
    expensesTotalClp,
  };
}
