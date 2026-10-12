# Arquitectura del cliente móvil

## Objetivo

La arquitectura prioriza tres propiedades: rutas delgadas, ownership por capacidad de producto y dependencias dirigidas hacia lógica estable. No intenta imponer Clean Architecture completa a cada pantalla; aplica separación solo donde reduce acoplamiento, tamaño o coste de prueba.

## Capas y responsabilidades

### `src/app`: adaptadores de navegación

Expo Router requiere que las rutas existan en `src/app`. Esos archivos son puntos de entrada, no pantallas de producto. Una ruta debe limitarse a una de estas formas:

- reexportar la pantalla de una feature;
- leer parámetros de navegación y pasarlos a una pantalla;
- montar un provider cuyo ciclo de vida pertenece exclusivamente a esa ruta;
- declarar layouts y opciones de navegación.

La excepción deliberada es `src/app/_layout.tsx`, que actúa como composition root de la aplicación: bootstrap, fuentes, tema, sesión, guards y stack raíz.

### `src/features`: módulos verticales

Cada feature agrupa todo lo que cambia por la misma razón. La estructura interna recomendada es:

| Carpeta | Responsabilidad | Puede depender de |
| --- | --- | --- |
| `domain/`, `model/` | tipos, invariantes, reducers y cálculo determinista | TypeScript y `shared` puro |
| `application/` | casos de uso, estado coordinado y providers | model/domain, data, shared |
| `data/`, `services/` | APIs, storage, DTO, mappers y repositories | infraestructura compartida, model/domain |
| `screens/` | composición de una pantalla navegable | todas las capas de su feature y UI compartida |
| `components/`, `hooks/`, `ui/` | presentación y comportamiento reutilizable dentro de la feature | application/model y UI compartida |

No se crean carpetas vacías para cumplir una plantilla. Una feature pequeña puede contener solo `screens/`.

### `src/shared`: primitivas transversales

Contiene código estable y sin semántica de producto. Ejemplos actuales:

- `geo.ts`: coordenadas, bounding boxes y cálculos geográficos;
- `infrastructure/supabase/client.ts`: construcción y lifecycle del cliente Supabase.

`shared` nunca importa una feature ni una ruta. Si una utilidad solo tiene un consumidor de producto, se queda dentro de esa feature.

### `src/components/ui` y `src/theme`: sistema visual

`components/ui` contiene primitivas visuales reutilizables. `theme` contiene tokens, apariencia y adaptadores visuales globales. Ninguna de estas capas conoce reglas de producto.

### `src/bootstrap`: composición transversal

Contiene el arranque previo a render y la composición de providers autenticados. No contiene reglas de negocio. Los providers siguen definidos dentro de sus features; bootstrap solo decide su orden y ciclo de vida global cuando realmente debe ser global.

## Grafo de dependencias esperado

```text
Expo Router (`app`)
        |
        v
feature screens/UI ------> application ------> domain/model
        |                       |                    ^
        |                       v                    |
        +--------------------> data/services -------+
        |                       |
        v                       v
components/ui + theme        shared infrastructure
        \______________________/
                   |
                   v
             shared primitives
```

Una dependencia entre features es aceptable solo cuando representa composición explícita y unidireccional. El mapa consume lugares porque presenta y edita lugares; `places` no conoce `map`. Las primitivas geográficas que ambos necesitan viven en `shared/geo.ts`, evitando el ciclo anterior.

## Estado y providers

El provider se monta en el límite más pequeño compatible con su estado:

- `AppearanceProvider` y `AuthProvider`: raíz, porque afectan a toda la aplicación.
- `ProfileProvider` y `FeedProvider`: árbol autenticado, porque varias rutas los consumen.
- `PlacesProvider`: ruta de mapa, su único consumidor actual.
- `CommunityWalletProvider`: layout anidado `community-wallet`; carga reglas, acciones, credenciales y cola de revisión solo mientras el usuario está dentro del Pasaporte de Impacto.

`FeedProvider` es deliberadamente un composition root del módulo, no el dueño de cada operación. Conserva el filtro activo porque este forma parte de la consulta y delega en:

- `useFeedQuery`: páginas y cursores independientes por categoría, primera carga, refresh, sincronización individual y estado de error/loading;
- `useFeedMutations`: optimistic updates, persistencia y rollback de posts e interacciones del feed;
- `useFeedRealtime`: lifecycle de suscripciones e invalidación agrupada por post.
- `usePostComments`: consulta paginada, mutaciones optimistas y realtime acotados a la pantalla de comentarios.

El contexto conserva el contrato consumido por las pantallas, por lo que estas responsabilidades pueden evolucionar sin propagar detalles de Supabase ni estados intermedios a la UI.

Antes de elevar estado, comprobar si realmente debe sobrevivir a la navegación. Evitar contextos “globales” por conveniencia: amplían renders, ocultan dependencias y dificultan pruebas aisladas.

## Integraciones y datos

Los adaptadores externos pertenecen al módulo que los usa:

- Mapbox search: `features/places/data`;
- Supabase para impacto: `features/community-wallet/data`; el cliente nunca firma operaciones Stellar;
- Stellar/Soroban: `supabase/functions/anchor-impact-credential` y `stellar/contracts/community-impact`, detrás de la validación autorizada;
- feed: repositorios enfocados de posts, comentarios, interacciones, media, identidad y realtime en `features/feed/data`;
- cliente Supabase común: `shared/infrastructure/supabase`.

Un repository puede coordinar consultas, pero debe delegar transformaciones y storage cuando crezca. Los componentes consumen modelos de aplicación/dominio, no filas sin procesar.

La lectura de una página del feed no hidrata comentarios. Cada filtro consulta Supabase y conserva su propio cursor compuesto; no se filtra una página incompleta en memoria. Cada post recibe el `comment_count` mantenido por triggers y solo consulta el estado de interacciones; dentro del repositorio de interacciones, likes, bookmarks y votos se consultan en paralelo. La pantalla de comentarios obtiene los 20 comentarios más recientes y pagina hacia atrás mediante cursor compuesto `(created_at, id)`, respaldado por un índice `(post_id, created_at desc, id desc)`. Una actualización Realtime de la primera página fusiona los comentarios recientes sin descartar páginas antiguas ya cargadas. `feedRepository` compone los posts y `services/postsRepository.ts` permanece como fachada temporal de compatibilidad, sin implementación propia.

El acceso al feed se autoriza por membresía de comunidad en RLS; el filtro del cliente nunca actúa como frontera de seguridad. Los agregados (`like_count`, `comment_count` y `vote_count`) pertenecen a triggers y no son editables por clientes autenticados. La publicación parte de un borrador propio y se finaliza mediante `publish_feed_post`, que inserta metadata de imágenes, encuesta y estado publicado en una sola transacción. Si la respuesta del RPC se pierde, el cliente verifica el estado autoritativo antes de compensar; nunca borra una publicación confirmada por un timeout ambiguo. El bucket `post-media` es privado y el repositorio firma en lote únicamente los paths visibles para la sesión actual. Un adjunto faltante se omite sin invalidar los demás posts de la página.

Los tipos de base de datos de Supabase se generan desde el proyecto real en `shared/infrastructure/supabase/database.types.ts` mediante `npm run supabase:types` y se pasan como genérico a `createClient<Database>`. El archivo generado se versiona, pero no se edita manualmente ni se reemplaza con tipos que solo aparenten representar el schema remoto.

### Frontera de confianza del impacto comunitario

Stellar no es la fuente de verdad del hecho social. Tribus o un emisor autorizado valida la evidencia fuera de la cadena. El contrato Soroban demuestra después que una credencial fue emitida por una dirección autorizada, con puntos y versión de regla concretos, y permite revocarla sin transferirla.

La app autenticada solo puede insertar acciones propias en estado `pending`. RLS impide autoasignarse puntos o editar validaciones. `review_impact_action` vuelve atómica la decisión del moderador y la creación de la credencial pendiente; la Edge Function mantiene la clave emisora fuera del bundle, ancla la credencial y guarda el hash de transacción. Solo las credenciales con estado `active` cuentan en el total mostrado.

La cadena almacena compromisos SHA-256, no UUID de usuario, descripciones, nombres ni evidencia. Supabase mantiene los datos privados y funciona como índice porque los eventos RPC no son una base histórica permanente.

### Realtime del feed

Realtime se usa como señal de invalidación, no como una segunda fuente de verdad:

- cambios en posts visibles invalidan únicamente el post afectado; un `INSERT` o un `UPDATE` de un ID aún no visible refresca la primera página sin anteponer la fila ni alterar el orden del servidor;
- `post_images`, `post_polls` y `poll_options` se escuchan solo para los IDs visibles, con un máximo de 100 IDs por filtro;
- `post_comments` se escucha exclusivamente mientras está abierta la pantalla de comentarios;
- likes, bookmarks, votos y likes de comentarios mantienen actualización optimista y rollback; los triggers actualizan las filas agregadas (`posts`, `post_comments` o `poll_options`) que luego emiten la invalidación;
- invalidaciones cercanas se agrupan durante 100 ms para evitar refetch duplicado por una mutación y su trigger.

Las tablas escuchadas deben pertenecer a la publicación `supabase_realtime`; esta condición forma parte de las migraciones y no se configura manualmente desde el cliente.

Supabase no permite filtrar eventos `DELETE` de Postgres Changes. Por eso las tablas hijas se escuchan solo para `INSERT` y `UPDATE`; cualquier futura operación que elimine imágenes, polls o comentarios de forma independiente debe actualizar también la fila padre o emitir un Broadcast autorizado. Los flujos actuales eliminan el post completo o actualizan contadores mediante triggers.

## Criterios de modularización

Dividir un archivo cuando se cumpla al menos una condición:

- mezcla más de una responsabilidad (consulta, mapping, upload, estado y UI);
- tiene una sección estable que puede probarse sin React;
- una parte cambia por una razón distinta al resto;
- duplica conocimiento en otra feature;
- supera aproximadamente 250–300 líneas y presenta límites semánticos claros;
- obliga a importar una capa de mayor nivel desde una capa inferior.

No dividir por conteo de líneas únicamente. Un mapa de estilos grande pero cohesivo puede permanecer unido; una función de 60 líneas que mezcla autenticación, deep linking y parsing de errores debe separarse.

## Enforcement

ESLint bloquea actualmente:

- imports desde `app` o `features` hacia `shared`, `components/ui` y `theme`;
- imports desde una feature hacia `app` o `bootstrap`;
- imports de React, React Native, Expo, navegación visual o theme desde `domain` y `model`.

La protección debe ampliarse cuando aparezcan nuevos patrones repetidos, evitando reglas tan rígidas que obliguen a abstraer prematuramente.

Todo cambio arquitectónico debe pasar:

```powershell
npm run lint
npm run typecheck
npm run test
```

## Deuda técnica priorizada

1. Extraer subcomponentes y lógica de `MapScreen`, `OnboardingScreen`, `MessageBubble` y `DiscoverDetailScreen` cuando se modifiquen; son los hotspots visuales restantes.
2. Añadir pruebas de integración de los hooks de aplicación y repositories del feed. Las pruebas actuales cubren principalmente dominio determinista y parsing de eventos realtime.
3. Medir el coste real de hidratación por página antes de consolidar lecturas en una función SQL/RPC o migrar señales de Postgres Changes a Broadcast. La separación actual permite hacerlo sin modificar el contrato de UI.

## Checklist para nuevas features

- La ruta es un adaptador corto y la pantalla vive en la feature.
- El dominio no importa React, Expo ni UI.
- La red/persistencia está detrás de un adapter o repository de la feature.
- Los DTO se mapean antes de llegar a UI.
- El provider está montado en el límite mínimo necesario.
- No existe una dependencia circular entre features.
- El código transversal es realmente reutilizable antes de moverlo a `shared`.
- Lint, TypeScript y pruebas pasan.
