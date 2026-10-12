#[cfg(test)]
mod tests {
    use community_impact::{
        CommunityImpactContract, CommunityImpactContractClient, CredentialStatus,
    };
    use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, Symbol};

    fn bytes(env: &Env, value: u8) -> BytesN<32> {
        BytesN::from_array(env, &[value; 32])
    }

    #[test]
    fn issue_and_revoke_updates_non_transferable_score() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(CommunityImpactContract, (&admin,));
        let client = CommunityImpactContractClient::new(&env, &contract_id);
        let subject = bytes(&env, 1);
        let credential_id = bytes(&env, 2);

        let credential = client.issue(
            &admin,
            &subject,
            &credential_id,
            &Symbol::new(&env, "neighbor_help"),
            &100,
            &1,
            &bytes(&env, 3),
            &1_800_000_000,
        );

        assert_eq!(credential.status, CredentialStatus::Active);
        assert_eq!(client.score(&subject), 100);
        client.revoke(&admin, &credential_id);
        assert_eq!(client.score(&subject), 0);
        assert_eq!(
            client.get_credential(&credential_id).unwrap().status,
            CredentialStatus::Revoked
        );
    }

    #[test]
    fn rejects_unknown_issuer_and_duplicate_credential() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(CommunityImpactContract, (&admin,));
        let client = CommunityImpactContractClient::new(&env, &contract_id);
        let stranger = Address::generate(&env);
        let subject = bytes(&env, 4);
        let credential_id = bytes(&env, 5);

        assert!(client
            .try_issue(
                &stranger,
                &subject,
                &credential_id,
                &Symbol::new(&env, "item_share"),
                &50,
                &1,
                &bytes(&env, 6),
                &1_800_000_000,
            )
            .is_err());

        client.issue(
            &admin,
            &subject,
            &credential_id,
            &Symbol::new(&env, "item_share"),
            &50,
            &1,
            &bytes(&env, 6),
            &1_800_000_000,
        );
        assert!(client
            .try_issue(
                &admin,
                &subject,
                &credential_id,
                &Symbol::new(&env, "item_share"),
                &50,
                &1,
                &bytes(&env, 6),
                &1_800_000_000,
            )
            .is_err());
    }

    #[test]
    fn disabled_issuer_cannot_issue_but_admin_can_revoke_its_credential() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let contract_id = env.register(CommunityImpactContract, (&admin,));
        let client = CommunityImpactContractClient::new(&env, &contract_id);
        let subject = bytes(&env, 7);
        let first_id = bytes(&env, 8);

        client.set_issuer(&admin, &issuer, &true);
        client.issue(
            &issuer,
            &subject,
            &first_id,
            &Symbol::new(&env, "community_activity"),
            &150,
            &1,
            &bytes(&env, 9),
            &1_800_000_000,
        );
        client.set_issuer(&admin, &issuer, &false);
        assert!(client
            .try_issue(
                &issuer,
                &subject,
                &bytes(&env, 10),
                &Symbol::new(&env, "community_activity"),
                &150,
                &1,
                &bytes(&env, 11),
                &1_800_000_001,
            )
            .is_err());

        client.admin_revoke(&admin, &first_id);
        assert_eq!(client.score(&subject), 0);
        assert_eq!(
            client.get_credential(&first_id).unwrap().status,
            CredentialStatus::Revoked
        );
    }

    #[test]
    fn admin_rotation_requires_acceptance_and_enables_new_admin() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let new_admin = Address::generate(&env);
        let stranger = Address::generate(&env);
        let contract_id = env.register(CommunityImpactContract, (&admin,));
        let client = CommunityImpactContractClient::new(&env, &contract_id);

        client.propose_admin(&admin, &new_admin);
        assert!(client.try_accept_admin(&stranger).is_err());
        client.accept_admin(&new_admin);
        assert!(client.try_set_issuer(&admin, &stranger, &true).is_err());
        client.set_issuer(&new_admin, &stranger, &true);
        assert!(client
            .try_issue(
                &admin,
                &bytes(&env, 19),
                &bytes(&env, 20),
                &Symbol::new(&env, "neighbor_help"),
                &100,
                &1,
                &bytes(&env, 21),
                &1_800_000_000,
            )
            .is_err());
    }

    #[test]
    fn initiative_proof_is_immutable_and_points_must_be_positive() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(CommunityImpactContract, (&admin,));
        let client = CommunityImpactContractClient::new(&env, &contract_id);
        let proof_id = bytes(&env, 12);

        let proof = client.publish_initiative_proof(
            &admin,
            &proof_id,
            &bytes(&env, 13),
            &bytes(&env, 14),
            &Symbol::new(&env, "evidence"),
            &bytes(&env, 15),
            &1_800_000_000,
        );
        assert_eq!(client.get_initiative_proof(&proof_id), Some(proof));
        assert!(client
            .try_publish_initiative_proof(
                &admin,
                &proof_id,
                &bytes(&env, 13),
                &bytes(&env, 14),
                &Symbol::new(&env, "evidence"),
                &bytes(&env, 15),
                &1_800_000_000,
            )
            .is_err());
        assert!(client
            .try_issue(
                &admin,
                &bytes(&env, 16),
                &bytes(&env, 17),
                &Symbol::new(&env, "item_share"),
                &0,
                &1,
                &bytes(&env, 18),
                &1_800_000_000,
            )
            .is_err());
    }

    #[test]
    fn privileged_calls_require_the_signers_authorization() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let contract_id = env.register(CommunityImpactContract, (&admin,));
        let client = CommunityImpactContractClient::new(&env, &contract_id);

        assert!(client.try_set_issuer(&admin, &issuer, &true).is_err());
        assert!(client.try_propose_admin(&admin, &issuer).is_err());
    }
}
