#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, BytesN, Env,
    Symbol,
};

const TTL_THRESHOLD: u32 = 17_280;
const TTL_BUMP: u32 = 518_400;

#[contract]
pub struct CommunityImpactContract;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Credential(BytesN<32>),
    InitiativeProof(BytesN<32>),
    Issuer(Address),
    Score(BytesN<32>),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CredentialStatus {
    Active,
    Revoked,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Credential {
    pub action_type: Symbol,
    pub claim_hash: BytesN<32>,
    pub credential_id: BytesN<32>,
    pub issued_at: u64,
    pub issuer: Address,
    pub points: u32,
    pub rule_version: u32,
    pub status: CredentialStatus,
    pub subject: BytesN<32>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InitiativeProof {
    pub community: BytesN<32>,
    pub evidence_hash: BytesN<32>,
    pub initiative_hash: BytesN<32>,
    pub issuer: Address,
    pub proof_id: BytesN<32>,
    pub proof_type: Symbol,
    pub published_at: u64,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    AlreadyExists = 4,
    NotFound = 5,
    InvalidPoints = 6,
    AlreadyRevoked = 7,
    ArithmeticOverflow = 8,
}

#[contractevent]
pub struct CredentialIssued {
    #[topic]
    pub credential_id: BytesN<32>,
    #[topic]
    pub issuer: Address,
    pub action_type: Symbol,
    pub claim_hash: BytesN<32>,
    pub points: u32,
    pub rule_version: u32,
    pub subject: BytesN<32>,
}

#[contractevent]
pub struct CredentialRevoked {
    #[topic]
    pub credential_id: BytesN<32>,
    #[topic]
    pub issuer: Address,
    pub subject: BytesN<32>,
}

#[contractevent]
pub struct InitiativeProofPublished {
    #[topic]
    pub proof_id: BytesN<32>,
    #[topic]
    pub issuer: Address,
    pub community: BytesN<32>,
    pub evidence_hash: BytesN<32>,
    pub initiative_hash: BytesN<32>,
    pub proof_type: Symbol,
}

fn extend_instance_ttl(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(TTL_THRESHOLD, TTL_BUMP);
}

fn require_issuer(env: &Env, issuer: &Address) -> Result<(), Error> {
    issuer.require_auth();
    let enabled = env
        .storage()
        .instance()
        .get::<_, bool>(&DataKey::Issuer(issuer.clone()))
        .unwrap_or(false);
    if !enabled {
        return Err(Error::NotAuthorized);
    }
    Ok(())
}

#[contractimpl]
impl CommunityImpactContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::Issuer(admin.clone()), &true);
        extend_instance_ttl(&env);
        Ok(())
    }

    pub fn set_issuer(
        env: Env,
        admin: Address,
        issuer: Address,
        enabled: bool,
    ) -> Result<(), Error> {
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        if admin != stored_admin {
            return Err(Error::NotAuthorized);
        }
        admin.require_auth();
        env.storage()
            .instance()
            .set(&DataKey::Issuer(issuer), &enabled);
        extend_instance_ttl(&env);
        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub fn issue(
        env: Env,
        issuer: Address,
        subject: BytesN<32>,
        credential_id: BytesN<32>,
        action_type: Symbol,
        points: u32,
        rule_version: u32,
        claim_hash: BytesN<32>,
        issued_at: u64,
    ) -> Result<Credential, Error> {
        require_issuer(&env, &issuer)?;
        if points == 0 {
            return Err(Error::InvalidPoints);
        }

        let credential_key = DataKey::Credential(credential_id.clone());
        if env.storage().persistent().has(&credential_key) {
            return Err(Error::AlreadyExists);
        }

        let score_key = DataKey::Score(subject.clone());
        let score = env
            .storage()
            .persistent()
            .get::<_, u32>(&score_key)
            .unwrap_or(0);
        let next_score = score
            .checked_add(points)
            .ok_or(Error::ArithmeticOverflow)?;
        let credential = Credential {
            action_type: action_type.clone(),
            claim_hash: claim_hash.clone(),
            credential_id: credential_id.clone(),
            issued_at,
            issuer: issuer.clone(),
            points,
            rule_version,
            status: CredentialStatus::Active,
            subject: subject.clone(),
        };

        env.storage().persistent().set(&credential_key, &credential);
        env.storage().persistent().set(&score_key, &next_score);
        env.storage()
            .persistent()
            .extend_ttl(&credential_key, TTL_THRESHOLD, TTL_BUMP);
        env.storage()
            .persistent()
            .extend_ttl(&score_key, TTL_THRESHOLD, TTL_BUMP);
        extend_instance_ttl(&env);

        CredentialIssued {
            action_type,
            claim_hash,
            credential_id,
            issuer,
            points,
            rule_version,
            subject,
        }
        .publish(&env);
        Ok(credential)
    }

    pub fn revoke(
        env: Env,
        issuer: Address,
        credential_id: BytesN<32>,
    ) -> Result<(), Error> {
        require_issuer(&env, &issuer)?;
        let credential_key = DataKey::Credential(credential_id.clone());
        let mut credential = env
            .storage()
            .persistent()
            .get::<_, Credential>(&credential_key)
            .ok_or(Error::NotFound)?;
        if credential.issuer != issuer {
            return Err(Error::NotAuthorized);
        }
        if credential.status == CredentialStatus::Revoked {
            return Err(Error::AlreadyRevoked);
        }

        let score_key = DataKey::Score(credential.subject.clone());
        let score = env
            .storage()
            .persistent()
            .get::<_, u32>(&score_key)
            .unwrap_or(0);
        credential.status = CredentialStatus::Revoked;
        env.storage().persistent().set(&credential_key, &credential);
        env.storage()
            .persistent()
            .set(&score_key, &score.saturating_sub(credential.points));
        env.storage()
            .persistent()
            .extend_ttl(&credential_key, TTL_THRESHOLD, TTL_BUMP);
        env.storage()
            .persistent()
            .extend_ttl(&score_key, TTL_THRESHOLD, TTL_BUMP);

        CredentialRevoked {
            credential_id,
            issuer,
            subject: credential.subject,
        }
        .publish(&env);
        Ok(())
    }

    #[allow(clippy::too_many_arguments)]
    pub fn publish_initiative_proof(
        env: Env,
        issuer: Address,
        proof_id: BytesN<32>,
        community: BytesN<32>,
        initiative_hash: BytesN<32>,
        proof_type: Symbol,
        evidence_hash: BytesN<32>,
        published_at: u64,
    ) -> Result<InitiativeProof, Error> {
        require_issuer(&env, &issuer)?;
        let proof_key = DataKey::InitiativeProof(proof_id.clone());
        if env.storage().persistent().has(&proof_key) {
            return Err(Error::AlreadyExists);
        }
        let proof = InitiativeProof {
            community: community.clone(),
            evidence_hash: evidence_hash.clone(),
            initiative_hash: initiative_hash.clone(),
            issuer: issuer.clone(),
            proof_id: proof_id.clone(),
            proof_type: proof_type.clone(),
            published_at,
        };
        env.storage().persistent().set(&proof_key, &proof);
        env.storage()
            .persistent()
            .extend_ttl(&proof_key, TTL_THRESHOLD, TTL_BUMP);
        InitiativeProofPublished {
            community,
            evidence_hash,
            initiative_hash,
            issuer,
            proof_id,
            proof_type,
        }
        .publish(&env);
        Ok(proof)
    }

    pub fn get_credential(env: Env, credential_id: BytesN<32>) -> Option<Credential> {
        let key = DataKey::Credential(credential_id);
        let credential = env.storage().persistent().get(&key);
        if credential.is_some() {
            env.storage()
                .persistent()
                .extend_ttl(&key, TTL_THRESHOLD, TTL_BUMP);
        }
        credential
    }

    pub fn get_initiative_proof(env: Env, proof_id: BytesN<32>) -> Option<InitiativeProof> {
        let key = DataKey::InitiativeProof(proof_id);
        let proof = env.storage().persistent().get(&key);
        if proof.is_some() {
            env.storage()
                .persistent()
                .extend_ttl(&key, TTL_THRESHOLD, TTL_BUMP);
        }
        proof
    }

    pub fn score(env: Env, subject: BytesN<32>) -> u32 {
        let key = DataKey::Score(subject);
        let score = env.storage().persistent().get(&key).unwrap_or(0);
        if score > 0 {
            env.storage()
                .persistent()
                .extend_ttl(&key, TTL_THRESHOLD, TTL_BUMP);
        }
        score
    }
}
