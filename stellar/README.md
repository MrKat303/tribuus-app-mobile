# Tribus Community Impact — Soroban

Este contrato registra acreditaciones comunitarias no transferibles y pruebas de iniciativas. No es un token, no custodia fondos y no convierte CLP a XLM.

## Qué se publica

- un compromiso opaco del usuario (`subject`), nunca su UUID ni su nombre;
- el identificador y hash de la credencial;
- tipo de acción, puntos y versión de la regla;
- emisor autorizado, fecha y estado activo/revocado;
- hashes de evidencia de iniciativas, sin documentos ni datos personales.

La evidencia completa y la validación del mundo real permanecen en Tribus/Supabase. El contrato solo hace verificable que un emisor autorizado acreditó el hecho.

## Desarrollo

Requisitos: Rust 1.84 o superior, target `wasm32v1-none` y Stellar CLI 28.

```sh
rustup target add wasm32v1-none
cd stellar
cargo test -p community-impact-tests
stellar contract build
```

El administrador se entrega al constructor durante el despliegue. No existe un paso de inicialización separado que otra cuenta pueda interceptar. Configura el ID resultante como `STELLAR_IMPACT_CONTRACT_ID` y conserva `STELLAR_ISSUER_SECRET` únicamente como secreto de la Edge Function.

Cada despliegue debe registrar su red, hash del WASM, ID del contrato, transacción y commit de origen en `deployments/<red>.json`, siguiendo [deployments/README.md](deployments/README.md). El cambio de constructor exige desplegar un contrato nuevo; no apuntes la Edge Function al nuevo ID hasta verificar su transacción y configurar el emisor.

La administración se rota en dos pasos (`propose_admin` y `accept_admin`). `admin_revoke` permite revocar una credencial aunque su emisor original haya sido suspendido o haya perdido su llave.

La cuenta emisora necesita XLM solo para pagar las tarifas de red. Las personas usuarias nunca reciben, compran ni administran XLM desde Tribus.
