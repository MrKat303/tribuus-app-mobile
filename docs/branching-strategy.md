# Estrategia de ramas

El proyecto usa un flujo trunk-based: `main` es la única rama permanente. Cada cambio se desarrolla en una rama corta y se integra a `main` mediante pull request. No se mantienen ramas permanentes `develop`, `feature` o `ux`; separar ramas por categoría alarga la integración y deja trabajo sin promover.

## Nombres de ramas

Usa un prefijo por tipo de cambio, un área concreta y, si existe, el número del issue:

```text
<tipo>/<área>-<issue>-<descripción-corta>
```

| Prefijo | Uso | Ejemplo |
| --- | --- | --- |
| `feat/` | Capacidad nueva del producto | `feat/community-42-badges` |
| `ux/` | Usabilidad, interacción o accesibilidad | `ux/map-51-search-empty-state` |
| `fix/` | Corrección de comportamiento | `fix/audio-63-recording-cleanup` |
| `refactor/` | Reorganización sin cambiar el comportamiento esperado | `refactor/feed-72-shared-composer` |
| `test/` | Cobertura o infraestructura de pruebas | `test/map-81-search-cases` |
| `perf/` | Rendimiento medido | `perf/map-93-marker-rendering` |
| `chore/` | Dependencias, tooling o configuración | `chore/repo-104-github-protection` |
| `docs/` | Documentación | `docs/setup-110-local-environment` |

Usa una rama por cambio revisable. Mantén el prefijo en minúsculas, evita espacios y elimina la rama al integrar el pull request.

## Integración y protección de `main`

1. Crea la rama desde la versión más reciente de `main`.
2. Abre un pull request con base `main` y completa `.github/pull_request_template.md`.
3. No integres el cambio hasta que pasen los checks `ESLint`, `TypeScript` y `Tests`.
4. En GitHub, protege `main`: exige pull request, los tres checks requeridos, al menos una aprobación de otra persona del equipo y resolución de conversaciones. Bloquea force-push y borrado de la rama; desactiva bypass administrativo salvo una excepción deliberada.
5. Usa squash merge y habilita la eliminación automática de ramas tras el merge.

Los prefijos son nombres de ramas de trabajo, no ramas remotas permanentes. La auditoría técnica sirve para priorizar issues; antes de abrir una rama, confirma que el hallazgo siga vigente y enlázala a un issue concreto.
