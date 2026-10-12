# Registro verificable de despliegues

Después de cada despliegue, crea `<red>.json` y confírmalo en Git. No guardes llaves secretas ni frases semilla.

```json
{
  "network": "testnet",
  "networkPassphrase": "Test SDF Network ; September 2015",
  "contractId": "C...",
  "wasmSha256": "64 caracteres hexadecimales",
  "deployTransactionHash": "64 caracteres hexadecimales",
  "deployedAt": "fecha ISO-8601",
  "sourceCommit": "SHA de Git"
}
```

Verifica que el hash corresponda al artefacto compilado desde `sourceCommit` y que `deployTransactionHash` cree exactamente `contractId` en la red indicada. El manifiesto real no se incluye hasta disponer de una transacción verificable; nunca se deben inventar estos valores.
