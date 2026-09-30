import { buildStellarDonationUri, isValidStellarAccount } from './stellar';

describe('Stellar community wallet helpers', () => {
  it('validates Stellar public account ids', () => {
    expect(isValidStellarAccount('G'.padEnd(56, 'A'))).toBe(true);
    expect(isValidStellarAccount('not-an-account')).toBe(false);
  });

  it('rejects donation URIs when the community account is not configured', () => {
    expect(() => buildStellarDonationUri({ amountClp: 10000, anonymous: true, xlmClpRate: 90 })).toThrow('Falta configurar');
  });
});
