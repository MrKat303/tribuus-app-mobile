/* eslint-disable import/no-unresolved -- Deno resuelve imports npm: en runtime. */
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import {
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  nativeToScVal,
  rpc,
  TransactionBuilder,
  xdr,
} from 'npm:@stellar/stellar-sdk@17.2.1';

import { classifySubmissionStatus } from './stellar-status.ts';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

type ReviewBody = {
  actionId?: string;
  decision?: 'approved' | 'rejected';
  note?: string | null;
};

type CredentialDraft = {
  action_id: string;
  action_type_code: string;
  claim_hash: string;
  credential_id: string;
  issued_at: string;
  onchain_credential_id: string;
  points: number;
  rule_version: number;
  subject_commitment: string;
  credential_status: 'pending_anchor' | 'anchor_submitted' | 'active' | 'anchor_failed';
  stellar_transaction_hash: string | null;
};

type AnchorResult =
  | { status: 'active'; transactionHash: string }
  | { status: 'anchor_submitted'; transactionHash: string };

type AdminClient = {
  rpc: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Falta configurar ${name}.`);
  return value;
}

function readNamedKey(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) return null;

  try {
    const keys = JSON.parse(value) as Record<string, string>;
    return keys.default ?? Object.values(keys).find(Boolean) ?? null;
  } catch {
    throw new Error(`${name} no contiene un objeto JSON válido.`);
  }
}

function supabaseRuntimeKey(kind: 'publishable' | 'secret') {
  if (kind === 'publishable') {
    return Deno.env.get('SUPABASE_PUBLISHABLE_KEY')?.trim()
      || readNamedKey('SUPABASE_PUBLISHABLE_KEYS')
      || Deno.env.get('SUPABASE_ANON_KEY')?.trim()
      || requiredEnv('SUPABASE_PUBLISHABLE_KEY');
  }

  return Deno.env.get('SUPABASE_SECRET_KEY')?.trim()
    || readNamedKey('SUPABASE_SECRET_KEYS')
    || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
    || requiredEnv('SUPABASE_SECRET_KEY');
}

function hexToBytes(value: string) {
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error('Hash de credencial inválido.');
  return Uint8Array.from(value.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)));
}

function bytesToHex(value: Uint8Array) {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function stellarNetwork() {
  const value = requiredEnv('STELLAR_NETWORK');
  if (value !== 'testnet' && value !== 'public') {
    throw new Error('STELLAR_NETWORK debe ser testnet o public.');
  }
  return value;
}

async function callRpc(client: AdminClient, name: string, args: Record<string, unknown>) {
  const result = await client.rpc(name, args);
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

async function waitForTransaction(server: rpc.Server, transactionHash: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const result = await server.getTransaction(transactionHash);
    if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) return 'success' as const;
    if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
      return 'failed' as const;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return 'pending' as const;
}

async function publishCredential(draft: CredentialDraft, adminClient: AdminClient): Promise<AnchorResult> {
  const secret = requiredEnv('STELLAR_ISSUER_SECRET');
  const contractId = requiredEnv('STELLAR_IMPACT_CONTRACT_ID');
  const rpcUrl = Deno.env.get('STELLAR_RPC_URL')?.trim() || 'https://soroban-testnet.stellar.org';
  const network = stellarNetwork();
  const networkPassphrase = network === 'public' ? Networks.PUBLIC : Networks.TESTNET;
  const issuer = Keypair.fromSecret(secret);
  const server = new rpc.Server(rpcUrl);
  const contract = new Contract(contractId);
  const operation = contract.call(
    'issue',
    Address.fromString(issuer.publicKey()).toScVal(),
    xdr.ScVal.scvBytes(hexToBytes(draft.subject_commitment)),
    xdr.ScVal.scvBytes(hexToBytes(draft.onchain_credential_id)),
    nativeToScVal(draft.action_type_code, { type: 'symbol' }),
    nativeToScVal(draft.points, { type: 'u32' }),
    nativeToScVal(draft.rule_version, { type: 'u32' }),
    xdr.ScVal.scvBytes(hexToBytes(draft.claim_hash)),
    nativeToScVal(BigInt(Math.floor(new Date(draft.issued_at).getTime() / 1000)), { type: 'u64' }),
  );
  if (draft.stellar_transaction_hash) {
    const existing = await waitForTransaction(server, draft.stellar_transaction_hash);
    if (existing === 'success') {
      await callRpc(adminClient, 'complete_impact_anchor', { p_credential_id: draft.credential_id });
      return { status: 'active', transactionHash: draft.stellar_transaction_hash };
    }
    await callRpc(adminClient, 'fail_impact_anchor', {
      p_credential_id: draft.credential_id,
      p_error: existing === 'failed'
        ? 'La transacción previa falló en Stellar.'
        : 'La transacción previa expiró sin entrar al ledger.',
    });
  }

  for (let buildAttempt = 0; buildAttempt < 3; buildAttempt += 1) {
    const source = await server.getAccount(issuer.publicKey());
    const transaction = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase,
    }).addOperation(operation).setTimeout(30).build();
    const prepared = await server.prepareTransaction(transaction);
    prepared.sign(issuer);
    const transactionHash = bytesToHex(prepared.hash());

    await callRpc(adminClient, 'mark_impact_anchor_submitted', {
      p_contract_id: contractId,
      p_credential_id: draft.credential_id,
      p_stellar_network: network,
      p_transaction_hash: transactionHash,
    });

    let submissionStatus = 'TRY_AGAIN_LATER';
    for (let sendAttempt = 0; sendAttempt < 4; sendAttempt += 1) {
      const submitted = await server.sendTransaction(prepared);
      submissionStatus = submitted.status;
      if (classifySubmissionStatus(submissionStatus) !== 'retry') break;
      await new Promise((resolve) => setTimeout(resolve, 750 * (sendAttempt + 1)));
    }

    if (classifySubmissionStatus(submissionStatus) === 'accepted') {
      const finalStatus = await waitForTransaction(server, transactionHash);
      if (finalStatus === 'success') {
        await callRpc(adminClient, 'complete_impact_anchor', { p_credential_id: draft.credential_id });
        return { status: 'active', transactionHash };
      }
      if (finalStatus === 'pending') return { status: 'anchor_submitted', transactionHash };
    }

    if (classifySubmissionStatus(submissionStatus) === 'retry') {
      return { status: 'anchor_submitted', transactionHash };
    }

    await callRpc(adminClient, 'fail_impact_anchor', {
      p_credential_id: draft.credential_id,
      p_error: classifySubmissionStatus(submissionStatus) === 'rejected'
        ? 'Stellar rechazó la transacción preparada.'
        : 'La transacción falló al ejecutarse en Stellar.',
    });
  }

  throw new Error('Stellar rechazó la acreditación después de varios intentos.');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Sesión requerida.' }, 401);
  const accessToken = authorization.slice('Bearer '.length).trim();
  if (!accessToken) return json({ error: 'Sesión requerida.' }, 401);

  try {
    const body = await request.json() as ReviewBody;
    if (!body.actionId || !/^[0-9a-f-]{36}$/i.test(body.actionId)) return json({ error: 'Acción inválida.' }, 400);
    if (body.decision !== 'approved' && body.decision !== 'rejected') return json({ error: 'Decisión inválida.' }, 400);

    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const publishableKey = supabaseRuntimeKey('publishable');
    const secretKey = supabaseRuntimeKey('secret');
    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const adminClient = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false },
    }) as unknown as AdminClient;

    const { data: userData, error: userError } = await userClient.auth.getUser(accessToken);
    if (userError || !userData.user) return json({ error: 'Sesión inválida.' }, 401);

    const network = stellarNetwork();
    const review = await adminClient.rpc('review_impact_action', {
      p_action_id: body.actionId,
      p_decision: body.decision,
      p_note: body.note?.slice(0, 500) || null,
      p_reviewer_user_id: userData.user.id,
      p_stellar_network: network,
    });
    if (review.error) throw new Error(review.error.message);
    if (body.decision === 'rejected') return json({ status: 'rejected' });

    const draft = (review.data as CredentialDraft[] | null)?.[0];
    if (!draft) throw new Error('No se creó la credencial pendiente.');
    if (draft.credential_status === 'active' && draft.stellar_transaction_hash) {
      return json({ credentialId: draft.credential_id, status: 'active', transactionHash: draft.stellar_transaction_hash });
    }

    const stellar = await publishCredential(draft, adminClient);
    return json(
      { credentialId: draft.credential_id, status: stellar.status, transactionHash: stellar.transactionHash },
      stellar.status === 'active' ? 200 : 202,
    );
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'No pudimos confirmar el aporte.';
    console.error('No fue posible completar la acreditación técnica.', cause);
    return json({ error: 'No pudimos confirmar el aporte. Inténtalo nuevamente.' }, 400);
  }
});
