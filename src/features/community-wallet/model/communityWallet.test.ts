import { summarizeCommunityFund, summarizeImpact } from './communityWallet';

describe('community impact summary', () => {
  it('only counts active achievements', () => {
    const result = summarizeImpact(
      [
        { actionTypeCode: 'neighbor_help', confirmationNote: null, description: 'Ayuda entregada', id: 'a1', occurredAt: '2026-10-01', status: 'pending', submittedAt: '2026-10-01' },
        { actionTypeCode: 'item_share', confirmationNote: null, description: 'Objeto compartido', id: 'a2', occurredAt: '2026-10-01', status: 'validated', submittedAt: '2026-10-01' },
      ],
      [
        { actionTypeCode: 'neighbor_help', anchoredAt: '2026-10-02', claimHash: 'a', contractId: 'c', id: 'c1', issuedAt: '2026-10-02', network: 'testnet', onchainCredentialId: 'o1', points: 100, ruleVersion: 1, status: 'active', transactionHash: 't1' },
        { actionTypeCode: 'item_share', anchoredAt: null, claimHash: 'b', contractId: null, id: 'c2', issuedAt: '2026-10-02', network: 'testnet', onchainCredentialId: 'o2', points: 50, ruleVersion: 1, status: 'pending_anchor', transactionHash: null },
      ],
    );

    expect(result).toEqual({ activeCredentials: 1, pendingActions: 1, totalPoints: 100 });
  });
});

describe('community fund summary', () => {
  it('calculates cash from donations minus expenses', () => {
    const shared = {
      communityId: 'community-1',
      counterparty: null,
      createdAt: '2026-10-11T10:00:00.000Z',
      initiativeId: null,
      occurredAt: '2026-10-11T10:00:00.000Z',
      recordedBy: 'user-1',
    };
    const result = summarizeCommunityFund([
      { ...shared, amountClp: 150000, id: 'entry-1', title: 'Donación vecinal', type: 'donation' },
      { ...shared, amountClp: 45000, id: 'entry-2', title: 'Compra de materiales', type: 'expense' },
      { ...shared, amountClp: 20000, id: 'entry-3', title: 'Aporte local', type: 'donation' },
    ]);

    expect(result).toEqual({
      cashBalanceClp: 125000,
      donationsTotalClp: 170000,
      expensesTotalClp: 45000,
    });
  });
});
