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
        let contract_id = env.register(CommunityImpactContract, ());
        let client = CommunityImpactContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let subject = bytes(&env, 1);
        let credential_id = bytes(&env, 2);

        client.initialize(&admin);
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
        let contract_id = env.register(CommunityImpactContract, ());
        let client = CommunityImpactContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let stranger = Address::generate(&env);
        let subject = bytes(&env, 4);
        let credential_id = bytes(&env, 5);

        client.initialize(&admin);
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
}
