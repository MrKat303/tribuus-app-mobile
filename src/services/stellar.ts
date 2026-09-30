import type { CommunityWalletActivity } from '@/features/community-wallet/model/communityWallet';

const PUBLIC_NETWORK_PASSPHRASE = 'Public Global Stellar Network ; September 2015';
const TESTNET_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

type HorizonAccount = {
  balances?: { asset_type: string; balance: string }[];
};

type HorizonPayment = {
  amount?: string;
  asset_type?: string;
  created_at: string;
  from?: string;
  id: string;
  source_account?: string;
  to?: string;
  transaction_hash?: string;
  type: string;
};

type HorizonPaymentsResponse = {
  _embedded?: { records?: HorizonPayment[] };
};

type StellarPriceResponse = {
  stellar?: { clp?: number };
};

export type StellarNetwork = 'public' | 'testnet';

export const stellarConfig = (() => {
  const network: StellarNetwork = process.env.EXPO_PUBLIC_STELLAR_NETWORK === 'public' ? 'public' : 'testnet';
  const defaultHorizon = network === 'public' ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org';
  return {
    accountId: process.env.EXPO_PUBLIC_STELLAR_COMMUNITY_ACCOUNT?.trim() ?? '',
    horizonUrl: (process.env.EXPO_PUBLIC_STELLAR_HORIZON_URL?.trim() || defaultHorizon).replace(/\/$/, ''),
    network,
  };
})();

export function isValidStellarAccount(accountId: string) {
  return /^G[A-Z2-7]{55}$/.test(accountId);
}

export function isStellarConfigured() {
  return isValidStellarAccount(stellarConfig.accountId);
}

export async function fetchXlmClpRate(signal?: AbortSignal) {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=clp', { signal });
  if (!response.ok) throw new Error('No se pudo obtener la conversión a pesos chilenos.');
  const payload = await response.json() as StellarPriceResponse;
  const rate = payload.stellar?.clp;
  if (!rate || !Number.isFinite(rate) || rate <= 0) throw new Error('La conversión CLP disponible no es válida.');
  return rate;
}

function shortAddress(address?: string) {
  if (!address) return 'Cuenta Stellar';
  return `${address.slice(0, 5)}…${address.slice(-5)}`;
}

export async function fetchCommunityBalance(signal?: AbortSignal) {
  if (!isStellarConfigured()) return null;
  const [response, xlmClpRate] = await Promise.all([
    fetch(`${stellarConfig.horizonUrl}/accounts/${stellarConfig.accountId}`, { signal }),
    fetchXlmClpRate(signal),
  ]);
  if (!response.ok) throw new Error('No se pudo consultar el saldo comunitario en Stellar.');
  const account = await response.json() as HorizonAccount;
  const nativeBalance = account.balances?.find((balance) => balance.asset_type === 'native');
  return nativeBalance ? Math.round(Number(nativeBalance.balance) * xlmClpRate) : 0;
}

export async function fetchCommunityActivity(signal?: AbortSignal): Promise<CommunityWalletActivity[]> {
  if (!isStellarConfigured()) return [];
  const url = `${stellarConfig.horizonUrl}/accounts/${stellarConfig.accountId}/payments?order=desc&limit=30`;
  const [response, xlmClpRate] = await Promise.all([fetch(url, { signal }), fetchXlmClpRate(signal)]);
  if (!response.ok) throw new Error('No se pudo consultar el historial de Stellar.');
  const payload = await response.json() as HorizonPaymentsResponse;

  return (payload._embedded?.records ?? [])
    .filter((record) => ['payment', 'path_payment_strict_receive', 'path_payment_strict_send'].includes(record.type))
    .filter((record) => record.asset_type === 'native' && typeof record.amount === 'string')
    .map((record) => {
      const incoming = record.to === stellarConfig.accountId;
      return {
        amountClp: Math.round(Number(record.amount) * xlmClpRate),
        counterparty: incoming ? shortAddress(record.from ?? record.source_account) : shortAddress(record.to),
        createdAt: record.created_at,
        direction: incoming ? 'incoming' : 'outgoing',
        id: record.id,
        label: incoming ? 'Donación a la comunidad' : 'Gasto comunitario',
        transactionHash: record.transaction_hash,
      } satisfies CommunityWalletActivity;
    });
}

export function buildStellarDonationUri({ amountClp, anonymous, initiativeId, xlmClpRate }: { amountClp: number; anonymous: boolean; initiativeId?: string; xlmClpRate: number }) {
  if (!isStellarConfigured()) throw new Error('Falta configurar la cuenta Stellar de la comunidad.');
  if (!Number.isFinite(amountClp) || amountClp <= 0) throw new Error('El monto debe ser mayor que cero.');
  if (!Number.isFinite(xlmClpRate) || xlmClpRate <= 0) throw new Error('No hay una conversión CLP válida.');

  const amountXlm = amountClp / xlmClpRate;

  const memo = `TRB:${(initiativeId ?? 'general').slice(-8)}:${anonymous ? 'A' : 'P'}`.slice(0, 28);
  const params = new URLSearchParams({
    amount: amountXlm.toFixed(7).replace(/0+$/, '').replace(/\.$/, ''),
    destination: stellarConfig.accountId,
    memo,
    memo_type: 'MEMO_TEXT',
    msg: anonymous
      ? 'Donación a la comunidad. Se mostrará anónima en Tribus; la transacción seguirá siendo pública en Stellar.'
      : 'Donación a la comunidad de Tribus.',
  });

  if (stellarConfig.network === 'testnet') params.set('network_passphrase', TESTNET_NETWORK_PASSPHRASE);
  return `web+stellar:pay?${params.toString()}`;
}

export function stellarExplorerTransactionUrl(hash: string) {
  const network = stellarConfig.network === 'public' ? 'public' : 'testnet';
  return `https://stellar.expert/explorer/${network}/tx/${encodeURIComponent(hash)}`;
}

export const stellarNetworkPassphrase = stellarConfig.network === 'public' ? PUBLIC_NETWORK_PASSPHRASE : TESTNET_NETWORK_PASSPHRASE;
