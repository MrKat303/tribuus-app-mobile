# Technical Audit — Tribuus Mobile

Fecha de auditoría: 2026-09-20  
Alcance: repositorio local, frontend/mobile, React Native + Expo SDK 57.  
Restricción respetada: no se modificó código ni configuración; este informe es el único archivo creado.

## 1. Executive Summary

**Veredicto corto:** sí, la app está siendo desarrollada con una base razonablemente profesional para su etapa, pero todavía no de forma suficientemente consistente como para abrir una beta externa con confianza.

El proyecto está por encima de un prototipo improvisado: usa Expo SDK 57 con versiones compatibles, Expo Router, TypeScript estricto, un lockfile, ESLint, Jest, CI, Dependabot, plantillas de issues/PR, safe areas, listas virtualizadas, `expo-image`, cancelación de búsquedas y una organización por features que ya empezó correctamente. `npm run check` pasó completo durante esta auditoría.

Los problemas principales no requieren rehacer la app. Son cinco:

1. Una misma entidad social tiene distintas fuentes de verdad entre feed y perfil.
2. La creación de publicaciones está implementada dos veces y ya diverge.
3. El modo oscuro se presenta como global, pero varias pantallas siguen fijadas al tema claro.
4. La señal automatizada de QA es demasiado estrecha: 1 suite, 4 tests y 3.23% de líneas medido sobre `src`.
5. La app aún no tiene una capa suficiente de recuperación/diagnóstico para beta: falta Error Boundary, observabilidad, timeouts y manejo consistente de algunas promesas y recursos de audio.

Además, Expo Doctor detectó una peer dependency nativa faltante: `expo-asset`, requerida por `expo-audio`. Es un arreglo pequeño, pero debe resolverse antes de seguir confiando en development builds.

**Nivel actual:**

| Etapa | Evaluación |
|---|---|
| Desarrollo local / prototipo | **GO** |
| Development build interno | **GO condicional**: falta verificar build e instalación en Android+iOS y corregir Expo Doctor |
| Preview/beta cerrada | **NO-GO hoy** |
| Stores / producción pública | **NO-GO** |

No se penaliza la ausencia de Supabase, auth, RLS, migrations, push real o infraestructura de backend: todavía no corresponden a una auditoría profunda. Sí se señalan las fronteras que conviene preparar antes de conectarlos.

## 2. Is This App Being Developed Properly?

**Sí, en lo fundamental, pero de manera parcialmente inconsistente.**

La dirección técnica es buena: hay tipos estrictos, checks automatizados, CI y una intención clara de separar rutas, features, servicios y tema. No hay `any`, suppressions TypeScript, `console.*`, non-null assertions ni imports sin usar. Tampoco se detectaron ciclos de imports en `src`.

Lo que impide responder un “sí” completo es que algunas promesas arquitectónicas todavía no son ciertas en el código: las rutas no siempre son adaptadores finos, los contratos de servicios no se usan, el design system no gobierna toda la UI, los ajustes y la identidad se duplican, y los tests no protegen los flujos que más cambian.

La base es recuperable sin una reescritura. Si se corrigen los elementos **NOW** de este informe, se puede continuar construyendo con confianza.

## 3. Current Stack

| Área | Stack confirmado |
|---|---|
| Runtime | React 19.2.3, React Native 0.86.3 |
| Plataforma | Expo SDK 57.0.24 |
| Navegación | Expo Router 57.0.22, typed routes |
| Lenguaje | TypeScript 6.0.3, `strict: true` |
| UI/motion | Reanimated 4.5.1, Gesture Handler 2.32, Expo Image, Expo Audio |
| Mapas | `@rnmapbox/maps` 10.3.5, Mapbox Search API |
| Persistencia actual | Estado React + AsyncStorage opcional para tema |
| Tests | Jest 29 + `jest-expo` 57 |
| Calidad | ESLint 9 + `eslint-config-expo` |
| Builds | EAS con perfiles development/preview/production iniciales |
| Automatización | GitHub Actions + Dependabot |
| Backend | No implementado; Supabase no está integrado |

La combinación Expo 57 / RN 0.86 / React 19.2.3 coincide con la documentación versionada de Expo 57. Se consultaron, entre otras, las referencias oficiales de [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [app config](https://docs.expo.dev/versions/v57.0.0/config/app/), Location, Audio, Image Picker, Image, Splash Screen y Router de esa misma versión.

## 4. Project Structure

**Estado: PARTIAL / bien encaminada.**

La estructura tiene sentido:

```text
src/
  app/          rutas Expo Router
  components/   componentes compartidos
  context/      estado global de demo
  data/         datos locales
  features/     feed, map, places, settings
  services/     contratos y Mapbox Search
  theme/        tokens, navegación y estilo de mapa
  types/        tipos compartidos
```

Lo positivo es que `feed`, `map`, `places` y `settings` ya usan `components/hooks/model/screens`. `inicio.tsx`, `mapa.tsx` y `ajustes/[section].tsx` son adaptadores finos.

Lo parcial es que `chat`, `comunidad`, `publicar`, `perfil`, `news`, `shop`, `configuracion`, `notificaciones`, welcome y discover siguen implementando pantallas completas dentro de `src/app`. Esto contradice la convención documentada, pero no justifica una migración masiva: conviene mover cada ruta cuando vuelva a recibir trabajo sustancial.

## 5. Architecture

**Estado: PARTIAL.**

Fortalezas:

- Contextos separados por dominio; no existe un mega-contexto.
- Parte de la lógica algorítmica del mapa está extraída a módulos puros.
- Mapbox Search está separado del hook de UI.
- Hay componentes UI base y tokens reutilizables.
- No se detectaron imports circulares.

Deuda relevante:

- Posts, settings e identidad no tienen ownership único.
- La creación de publicaciones está duplicada.
- `MapScreen` concentra búsqueda, ranking, clustering, selección, cámara, reacciones y compositores.
- Algunos módulos `model` importan tipos/componentes de UI; `places` depende de primitivas geográficas de `map`.
- `services/contracts.ts` declara abstracciones que ningún consumidor usa, mientras Location/Storage/Mapbox se usan directamente.

No hace falta Redux ni “clean architecture” completa. Un reducer/contexto acotado para posts/settings y módulos puros para reglas compartidas son suficientes ahora.

## 6. Code Quality

**Estado: GOOD / PARTIAL.**

Resultado de checks:

- `npm run lint`: pasó.
- `npm run typecheck`: pasó.
- `npm run test`: pasó, 1 suite / 4 tests.
- Comprobación adicional de locales/parámetros no usados: pasó.
- Cero `any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, non-null assertions, `console.*`, `debugger`, TODO/FIXME/HACK detectados.

La deuda está en mantenibilidad, no en compilación. Hay componentes grandes y JSX extremadamente comprimido: se contaron 738 líneas TS/TSX mayores a 120 caracteres y 329 mayores a 180; una línea llega a 3,247 caracteres. Un formatter resolvería un problema real de review y conflictos, no solo una preferencia estética.

## 7. React Native / Expo

**Estado: GOOD / PARTIAL.**

Bien implementado:

- `react-native-reanimated` se importa primero.
- Splash se retiene en scope global y se oculta tras fuentes/error.
- Safe areas y offsets inferiores están considerados.
- Feed/chat/notificaciones usan listas virtualizadas.
- Imágenes usan `expo-image` y dimensiones/aspect ratio.
- Búsqueda aplica debounce, abort y cleanup.
- Location usa permiso foreground; no se pide background innecesario.
- CNG y carpetas nativas ignoradas son apropiados.

Pendientes reales:

- Restaurar el modo global de audio después de grabar y sincronizar playback con el estado real del player.
- Corregir `expo-asset` faltante como dependencia directa de `expo-audio`.
- Revisar capacidades/permisos generados por Audio/Image Picker y localizar sus purpose strings.
- Validar deep links fríos, back fallback, teclado y swipe de tabs en dispositivo.
- Definir build numbers/version codes antes del primer track de store.

No se recomienda migrar automáticamente todo a FlashList, añadir background location ni habilitar OTA todavía.

## 8. UI & Design System

**Estado: PARTIAL; PROBLEM en dark mode.**

Sí existe un design system embrionario: paletas semánticas light/dark, spacing base 4/8, tipografías, `AppText`, `AppIcon`, `AppButton`, `Card` y `Screen`.

Todavía no es una fuente de verdad. Muchos botones, cards, headers, inputs, radios, tamaños y sombras se reconstruyen localmente. Hay al menos 19 radios literales fuera de la escala y numerosas sobreescrituras de tipografía.

La falla objetiva es el theming: `colors` es un alias fijo de `lightColors`, y pantallas como publicar, comunidad, shop, welcome y los compositores de lugares lo usan mientras `AppText` sí puede cambiar a texto claro. Esto puede producir texto claro sobre superficies claras.

No se realizó inspección visual en simulador. Contraste real, clipping, Dynamic Type, paisaje, alineación óptica y motion quedan **NOT VERIFIED**.

## 9. UX & Accessibility

**Estado: PARTIAL / NOT VERIFIED en runtime.**

Fortalezas:

- Hay loading, empty states y alerts en varios flujos.
- Los controles principales suelen tener feedback de presión.
- Muchos icon buttons tienen labels e hitSlop.
- Chat y modales principales usan keyboard avoidance.
- Switch nativo se usa para toggles.

Riesgos por código:

- Existen affordances sin acción: “Ver todo”, varias cards de Discover, nuevo mensaje, adjuntar y opciones de chat parecen botones pero no ejecutan nada.
- Se contaron 103 `Pressable`, 33 roles y 56 labels. No toda diferencia es un defecto, pero chips, opciones de encuesta, markers y controles críticos carecen frecuentemente de `accessibilityRole`/`accessibilityState`.
- Varios `TextInput` dependen del placeholder o de un `Text` hermano, sin nombre accesible estable.
- Hay controles de 30–38 pt sin hitSlop y chips por debajo del objetivo móvil de 44 pt.
- Existen textos de 7–10 pt y contenedores de altura fija; Dynamic Type puede recortar contenido.
- Formularios largos basados en `Screen scroll` no ajustan necesariamente los insets del teclado.
- El compositor manual de lugares no ofrece “Atrás” entre sus tres pasos y conserva step/campos al cerrarse y reabrirse.
- “Reducir movimiento” e “Informes de errores” aparecen como ajustes funcionales, pero hoy solo cambian estado local y no controlan el comportamiento prometido.

Antes de beta se necesita una pasada manual con VoiceOver/TalkBack, Dynamic Type grande, teclado, modo oscuro y hardware back.

## 10. State & Data Management

**Estado: PARTIAL.**

El estado actual es apropiadamente simple para datos demo. No se necesita introducir Zustand/Redux/TanStack Query mientras no exista servidor real.

Debe corregirse desde ahora:

- Posts: entidad y acciones por `postId` en una sola fuente de verdad.
- Settings: modelo tipado compartido entre overview y detail.
- Current user/profile: una fuente mínima para nombre, initials y comuna.
- UI efímera debe seguir local: drafts, focus, sheet open, animaciones.

Cuando exista backend, el estado servidor deberá vivir en una capa de fetching/cache y no en contextos manuales. Supabase/RLS/migrations no se auditan todavía porque no existen.

## 11. Performance

**Estado: GOOD para prototipo / NOT VERIFIED por medición.**

Buenas decisiones: FlatList/SectionList, keys estables, presupuestos y clustering de markers, debounce/abort, limpieza de timers/audio, imports dinámicos de media y `expo-image`.

Riesgo principal: `onCameraChanged` actualiza `mapCenter` y `zoomLevel` en cada callback. Eso invalida ranking, filtros, clustering, distancias y arrays de markers durante el gesto. El patrón está confirmado; el impacto FPS no. Antes de aumentar la densidad real, perfilar en release y, solo si se reproduce, comprometer estado en idle/throttle/epsilon y separar overlays costosos.

Otros riesgos potenciales: PanResponder del swipe cruza el hilo JS; fotos de cámara no tienen pipeline explícito de redimensionado; Profile usa ScrollView + `.map` para posts y deberá virtualizarse cuando el volumen sea real.

No hay baseline de TTI, FPS, memoria o bundle. No se afirma que estén mal.

## 12. Testing & QA

**Estado: MISSING para beta; PARTIAL para prototipo.**

### WHAT EXISTS

- Jest 29 + `jest-expo`.
- Una suite: `src/features/map/model/map.test.ts`.
- Cuatro tests deterministas de distancia/bounds/clamp.
- CI ejecuta tests en PR y push a `main`.
- Cobertura medida: 2.76% statements, 0.54% branches, 0.76% functions, 3.23% lines.

Los tests existentes sí tienen valor; no son decorativos. La señal es simplemente demasiado pequeña.

### WHAT IS MISSING

- Tests de servicios y hooks.
- Component tests con React Native Testing Library.
- Integration tests de providers/flows.
- Smoke nativo Android+iOS.
- E2E.
- Umbral incremental de cobertura.

### WHAT SHOULD BE TESTED NOW

| Prioridad | Tipo | Casos |
|---|---|---|
| P0 | Unit | clustering, relevance, ranking, budgets, normalización/categorización |
| P0 | Unit/service | Mapbox URL/encoding, HTTP error, JSON inválido/vacío, país externo, coordenadas |
| P0 | Hook | debounce/abort/race/error de búsqueda; location granted/denied/outside/error; camera clamp |
| P0 | Domain/state | duplicados de lugares, recomendación idempotente, creación sin duplicar |
| P1 | Component/integration | composer valida/publica/resetea; feed filtra/añade; card like/comment/poll/audio cleanup |
| P1 | Integration | tema persiste y degrada sin storage; estado compartido feed/perfil |

### WHAT CAN WAIT

- Maestro/Detox completo hasta estabilizar auth/backend. Antes de beta sí debe existir un smoke mínimo: launch → tabs → publicar → feed; mapa → permiso/búsqueda/recomendación; settings/theme; cold deep link/back.
- Visual regression masiva.
- Load/offline/contracts de APIs que todavía no existen.

Evitar snapshots de pantallas completas, tests de estilos internos, timers reales, GPS/red Mapbox reales y IDs/fechas sin reloj controlado.

## 13. Development Workflow

**Estado: GOOD / PARTIAL.**

### CURRENT WORKFLOW

Issue → branch → implementación/tests → `npm run check` → PR → CI → review → squash merge.

Está documentado y respaldado por plantillas, CI y Dependabot. Node 22.13 está fijado en `.nvmrc`, npm 11.6.2 en `packageManager`, y CI usa `npm ci`.

### PROBLEMS

- README está desactualizado.
- CI no ejecuta Expo Doctor.
- CI no prueba bundle/build nativo.
- Un commit reciente mezcló 86 archivos y tooling/producto, dificultando review/bisect.
- `origin/master` sigue un commit detrás de `origin/main`.
- La protección de `main` está declarada, pero no pudo verificarse desde el checkout.

### MISSING AUTOMATION

- Expo Doctor en PR.
- `format:check` una vez acordado el formatter.
- Preview build en cambios nativos/hitos de release, no en cada commit.
- Smoke E2E cuando los flujos se estabilicen.

### RECOMMENDED WORKFLOW

Mantener CI como barrera compartida. No es necesario Husky/lint-staged/commitlint todavía. Si se agrega formatter, ejecutarlo automáticamente en editor y verificarlo en CI; un hook local debe ser opcional.

## 14. Git & Repository Hygiene

**Estado: GOOD.**

- Worktree limpio al inicio y tras los checks.
- Lockfile versionado.
- `.gitignore` cubre dependencias, caches, nativos generados, `.env`, certificados y coverage.
- No se detectaron credenciales privadas rastreadas.
- Commits usan prefijos `feat/fix/chore`.
- Dependabot agrupa Expo/RN y Actions.

Pendientes menores: confirmar default branch, retirar `origin/master` si está obsoleta y mantener PRs más pequeños.

## 15. Error Handling & Reliability

**Estado: PARTIAL.**

La app degrada bien ante varios fallos esperables: HTTP no-OK, búsqueda fuera del país, GPS, módulos opcionales y almacenamiento ausente. Sin embargo:

- No hay Error Boundary global.
- `requestForegroundPermissionsAsync()` queda fuera del `try`.
- Suggest errors se convierten silenciosamente en “sin resultados”.
- Requests no tienen timeout; retrieve no se cancela y puede resolver fuera de orden.
- Publicar no siempre libera/nullifica recorder; los catch de grabación no limpian todo.
- Share, Linking y splash usan promesas fire-and-forget sin catch.
- Playback puede quedar desincronizado o retener un player inválido.

Para esta etapa no hace falta una plataforma de resiliencia compleja. Sí hacen falta errores tipados, timeout/cancelación, `finally` para recursos y un fallback global.

## 16. Monitoring / Sentry

**Estado: MISSING; aceptable solo mientras sea demo interna.**

No hay SDK, plugin, init, captura, release/environment, sourcemaps, breadcrumbs ni contexto de dispositivo/ruta. Si hoy un usuario dice “se cerró al hacer X”, solo se puede intentar reproducir manualmente.

Antes de beta externa:

1. Integrar una sola solución (Sentry ya está en roadmap).
2. Inicializar temprano y añadir Error Boundary.
3. Separar development/preview/production.
4. Validar un error intencional simbolicado en release.
5. Adjuntar solo route, plataforma, app/build/update version y clase/status de error.
6. Nunca adjuntar texto de posts/chat, media, token ni coordenada exacta.

Performance tracing, replay, SLOs y dashboards avanzados pueden esperar.

## 17. Dependencies & Tooling

**Estado: PARTIAL.**

Fortalezas:

- Expo/RN/React y módulos SDK están alineados.
- `npx expo install --check` reportó dependencias actualizadas.
- Una sola copia principal de React/RN/Expo/Reanimated.
- Lockfile v3 y npm fijado.
- Los defaults de Babel/Metro son suficientes; su ausencia no es un defecto.

Pendientes:

- Expo Doctor: 20/21 checks; falta declarar `expo-asset`, peer de `expo-audio`.
- Token Mapbox duplicado en EAS y código; variable adicional no usada en `.env.example`.
- `expo-device` y `expo-document-picker` no tienen usos detectados; confirmar y retirar si no son inmediatos.
- `npm audit --omit=dev`: 15 moderadas, 0 high/critical, principalmente transitivas del toolchain sin fix compatible. No usar `npm audit fix --force`.
- `@emnapi/wasi-threads` aparece extraneous solo en `node_modules` local; `npm ci` lo limpia y no es deuda del repo.

Se descartó una conclusión de subagente que decía que Node no estaba fijado: `.nvmrc` sí existe y CI lo consume.

## 18. Documentation

**Estado: PROBLEM.**

README afirma que no hay mapas/permisos/notificaciones, que no se han decidido IDs y que no hay proyecto externo vinculado. El código ya contiene Mapbox, Location, permisos, bundle/package IDs, owner y EAS projectId. La paleta documentada tampoco coincide con tokens actuales.

También describe `services` y rutas como arquitectura vigente cuando parte es aspiracional. La documentación debe separar claramente:

- Implementado y verificado.
- Configurado pero no verificado externamente.
- Planificado.
- Fuera de alcance actual.

## 19. Production Readiness

**Estado: MISSING para publicación; apropiado para prototipo.**

### GOOD

- Identificadores nativos, scheme y perfiles EAS iniciales.
- CI, checks, lockfile y hygiene de secretos.
- Permiso foreground de ubicación localizado.

### PARTIAL

- Ambientes EAS.
- Permisos/capacidades efectivas.
- Versionado de builds.
- Manejo de errores.
- UI/theme.

### MISSING

- Build/install/smoke Android+iOS verificados.
- Activos oficiales.
- Crash reporting + sourcemaps.
- Tests de flujos críticos.
- Runtime/release/rollback policy.
- Backend/auth/datos persistentes necesarios para el producto real.
- Privacy/store disclosures según las features finales.

### NOT VERIFIED

- Credenciales y restricciones remotas de Mapbox/EAS.
- Branch protection.
- Universal links.
- Device matrix, store metadata y políticas legales.

## 20. Technical Debt

| Deuda | Riesgo | Acción |
|---|---|---|
| Estado social local por card | Inconsistencia funcional | Now |
| Dos compositores de posts | Reglas divergentes | Now |
| Dark mode parcial | UI ilegible/inconsistente | Now |
| Cobertura mínima | Regresiones silenciosas | Now/Soon |
| Audio lifecycle | Recursos/ruta de audio incorrectos | Now |
| Rutas/screens grandes | Mantenibilidad | Soon, incremental |
| Settings/identidad duplicados | Drift al conectar backend | Soon |
| Design tokens no autoritativos | UI difícil de evolucionar | Soon |
| Docs obsoletas | Builds/reviews con supuestos falsos | Now |
| Observabilidad ausente | Crashes no diagnosticables | Soon, antes de beta |

La deuda preocupante es la que crea múltiples fuentes de verdad. La deuda de estructura/estilo aún es manejable si se corrige al tocar cada feature.

## 21. Missing Engineering Practices

| Practice | Exists? | Needed Now? | Why | Recommendation |
|---|---:|---:|---|---|
| Testing unitario | Parcial | Sí | Solo 4 tests | Priorizar dominio/Mapbox/location |
| Component/integration tests | No | Sí | Flujos interactivos sin protección | Añadir RNTL compatible con Expo 57 |
| E2E | No | Soon | Validar nativo y navegación | Smoke Maestro antes de beta |
| ESLint | Sí | Sí | Barrera útil | Mantener |
| Formatter | No | Sí/Soon | JSX/líneas extremas dificultan review | PR mecánico separado + `format:check` |
| TypeScript strict | Sí | Sí | Está funcionando bien | Mantener; validar JSON runtime |
| CI | Sí | Sí | Impide merge roto básico | Añadir Expo Doctor |
| Dependabot | Sí | Sí | Actualizaciones agrupadas | Mantener, revisar manualmente |
| Pre-commit hooks | No | No | CI ya es barrera compartida | Opcional, no obligatorio |
| Sentry | No | Soon | Necesario para beta | Integración mínima + sourcemaps |
| Error Boundary | No | Soon | Recuperación global | Añadir con observabilidad |
| Design System | Parcial | Sí | Dark/theme y patrones divergen | Consolidación incremental |
| Environment separation | Parcial | Sí antes de preview | Evitar fallbacks silenciosos | EAS env explícito por perfil |
| Release/rollback runbook | No | Later/Soon | Necesario para stores/OTA | Crear al definir releases |
| Supabase/RLS/migrations | No | No todavía | Backend aún no existe | Introducir al comenzar esa feature |
| Analytics de producto | No | No todavía | No resuelve crashes | Esperar preguntas de producto reales |

## 22. Recommended Development Workflow

Flujo adaptado al proyecto:

1. Crear issue con resultado, criterios de aceptación, estados empty/loading/error y plataformas afectadas.
2. Crear rama pequeña desde `main`; separar tooling/config de una feature si pueden revisarse por separado.
3. Antes de UI, ubicar la lógica en `features/<feature>/model|hooks|services`; dejar la ruta como composición.
4. Implementar una sola fuente de verdad y una sola validación por caso de uso.
5. Añadir primero tests P0 de lógica/servicio y después tests del comportamiento del componente afectado.
6. Probar manualmente light/dark, teclado, back, permisos y error/offline del flujo.
7. Ejecutar tests afectados durante el trabajo; antes de push ejecutar `npm run check` y Expo Doctor.
8. Abrir PR con issue, evidencia visual cuando corresponda, riesgos y pasos de prueba.
9. CI: `npm ci` → lint → format check → typecheck → Jest → Expo Doctor.
10. Review debe verificar ownership de estado, accesibilidad, errores y config nativa, no solo happy path.
11. Para cambios de módulo/config nativa o hitos: EAS preview build + smoke Android/iOS.
12. Para release: build number, env production, changelog, build firmado, smoke, rollout limitado y monitorización.
13. Después de release: revisar crashes/regresiones durante 24–48 h y mantener un rollback/hotfix claro.

## 23. NOW / SOON / LATER

### NOW

1. Añadir `expo-asset` con la versión recomendada por Expo y dejar Expo Doctor verde.
2. Unificar ownership de posts y los dos compositores de publicación.
3. Completar dark mode en pantallas/composers que usan `colors` estático.
4. Corregir audio mode, cleanup y playback status.
5. Encapsular permiso Location completo en try/catch; añadir timeout/error/race handling a Mapbox.
6. Añadir tests P0 de Mapbox, location/camera, ranking/clustering y estado de lugares.
7. Actualizar README y ambientes/token Mapbox.
8. Corregir u ocultar ajustes ficticios de crash reports/reduce motion.
9. Adoptar formato consistente en un PR separado.

### SOON

1. RNTL para composer/feed/card/theme.
2. Modelo compartido de settings e identidad actual.
3. Error Boundary + Sentry + sourcemaps antes de beta.
4. Revisar permisos/capacidades nativas generadas.
5. Estrategia de deep links/back y validación de teclado/swipes.
6. EAS build numbers, preview builds y smoke en dispositivos.
7. Consolidar headers/buttons/cards/tokens de forma incremental.
8. Perfilar el mapa en release antes de escalar datos.

### LATER

1. Maestro E2E más amplio cuando auth/backend estén estables.
2. OTA/runtime policy y runbook de rollback.
3. Media pipeline con thumbnails al existir upload real.
4. Analytics y performance tracing cuando haya usuarios/preguntas concretas.
5. Virtualizar Profile cuando el volumen de posts lo justifique.

## 24. What NOT To Do Yet

- No introducir Redux/Zustand solo por “escalar”; primero arreglar ownership con reducer/contexto acotado.
- No crear microservicios, GraphQL, Docker, Kubernetes, Terraform, Redis ni monorepo.
- No diseñar una capa Supabase/RLS/migrations sin features de backend reales.
- No perseguir 100% coverage ni snapshots masivos.
- No ejecutar `npm audit fix --force` ni actualizar Expo fuera de su matriz compatible.
- No migrar todas las listas a FlashList sin volumen/profiling.
- No habilitar background location, background audio u OTA si el producto no lo necesita.
- No instrumentar Sentry + otra plataforma de crashes al mismo tiempo.
- No hacer una refactorización masiva de todas las rutas o todos los estilos.
- No automatizar submission/release completo antes de tener una cadencia real.

## 25. Final Assessment

1. **¿Estoy desarrollando bien la app actualmente?** Sí, con buenas bases, pero con inconsistencias que deben corregirse ahora.
2. **¿Qué estoy haciendo bien?** Stack compatible, TypeScript estricto, checks limpios, CI, Dependabot, Expo Router, safe areas, listas, imágenes y estructura feature inicial.
3. **¿Qué estoy haciendo mal?** Duplicar ownership/reglas, declarar capacidades de UI que no funcionan completamente y dejar docs atrás del código.
4. **¿Qué prácticas profesionales faltan?** Tests focalizados, formatter, Expo Doctor en CI, observabilidad, Error Boundary, ambientes y release discipline.
5. **¿Me faltan tests?** Sí; la cobertura actual es real pero demasiado estrecha.
6. **¿Cuáles necesito realmente?** Mapbox, location/camera, ranking/clustering, places state, composer/feed/card/theme; smoke nativo antes de beta.
7. **¿Mi workflow es bueno?** Sí para esta etapa; debe sumar Expo Doctor, docs confiables y preview builds por hitos.
8. **¿Mi arquitectura está bien?** La dirección es buena; ownership de posts/settings/identity y composer duplicado deben corregirse.
9. **¿Mi organización está bien?** Parcial: features buenos, varias rutas aún contienen la feature completa.
10. **¿Mi UI está construida de forma mantenible?** Parcial: existe un kit real, pero no gobierna dark mode ni patrones comunes.
11. **¿Hay deuda técnica preocupante?** Sí, concentrada en fuentes de verdad duplicadas y falta de QA/diagnóstico; aún es manejable.
12. **¿Estoy acumulando problemas caros?** Sí si conectas backend antes de unificar estado y casos de uso; no si corriges ahora.
13. **¿Qué debería cambiar desde hoy?** Ejecutar la lista NOW, especialmente posts/composer/theme/audio/tests/docs.
14. **¿Qué no necesito todavía?** Infraestructura enterprise, backend complejo, 100% coverage, OTA, APM avanzado o state manager grande.
15. **¿Puedo seguir desarrollando sobre esta base con confianza?** **Sí, de forma condicional:** resuelve primero los NOW y no abras beta externa hasta cerrar tests, builds nativos, observabilidad, permisos y versionado.

---

# Consolidated Findings

Los siguientes hallazgos son la lista deduplicada y priorizada. Los High fueron verificados nuevamente por el Tech Lead contra el código/configuración.

### TA-001

**SEVERITY:** High  
**CONFIDENCE:** Confirmed  
**AREA:** Architecture / state ownership  
**FILE:** `src/components/CommunityPostCard.tsx`, `src/context/PostsContext.tsx`, `src/features/feed/screens/FeedScreen.tsx`, `src/app/(tabs)/perfil.tsx`  
**LINE/SYMBOL:** Card 29–80; Context 6–20; Feed 48–50; Profile 92–96

**PROBLEM:** Likes, bookmarks, comments y votos viven dentro de cada instancia de card.  
**WHY IT MATTERS:** La misma publicación en feed y perfil puede mostrar estados diferentes y perderlos al desmontar.  
**EVIDENCE:** El context solo expone `addPost`; cada card inicializa/muta copias locales.  
**RECOMMENDED FIX:** Card controlada + acciones por `postId` en reducer/store/repositorio único; conservar local solo UI efímera.  
**WHEN:** Now  
**EFFORT:** M

### TA-002

**SEVERITY:** High  
**CONFIDENCE:** Confirmed  
**AREA:** Architecture / duplicated use case  
**FILE:** `src/features/feed/components/InlineFeedComposer.tsx`, `src/app/(tabs)/publicar.tsx`  
**LINE/SYMBOL:** Inline 26–163; Publish 30–105

**PROBLEM:** Crear publicación está implementado dos veces con validaciones divergentes.  
**WHY IT MATTERS:** Media, permisos, encuestas, eventos y metadata evolucionarán de forma distinta.  
**EVIDENCE:** 250 vs 350 caracteres; exactamente 2 vs >=2 opciones; evento solo inline; creación de entidad duplicada.  
**RECOMMENDED FIX:** `PostDraft` y controlador/validator compartido, manteniendo shells visuales distintos.  
**WHEN:** Now  
**EFFORT:** M

### TA-003

**SEVERITY:** High  
**CONFIDENCE:** Confirmed  
**AREA:** UI / dark mode  
**FILE:** `src/theme/tokens.ts` y pantallas/composers que importan `colors`  
**LINE/SYMBOL:** tokens 49; ManualPlaceComposer 43–74; RecommendationComposer 25–71; publicar 30+; comunidad 67+; shop 25+; index 16+

**PROBLEM:** El alias `colors` siempre apunta a `lightColors`, aunque textos/provider cambian a dark.  
**WHY IT MATTERS:** Puede generar texto claro sobre superficies claras y rompe el ajuste global.  
**EVIDENCE:** Superficies `#FFFFFF/#F7F5EF` fijas en flujos completos sin `useAppAppearance`.  
**RECOMMENDED FIX:** Consumir tokens semánticos dinámicos; prueba light/dark por flujo.  
**WHEN:** Now  
**EFFORT:** M

### TA-004

**SEVERITY:** High  
**CONFIDENCE:** Confirmed  
**AREA:** Expo dependencies  
**FILE:** `package.json`  
**LINE/SYMBOL:** dependencies / `expo-audio`

**PROBLEM:** Falta declarar `expo-asset`, peer nativa de `expo-audio`.  
**WHY IT MATTERS:** Expo Doctor advierte posible crash fuera de Expo Go; la presencia transitiva no sustituye la declaración directa.  
**EVIDENCE:** Expo Doctor 20/21; `npm ls` muestra `expo-asset` transitiva, no raíz.  
**RECOMMENDED FIX:** Instalar con `npx expo install expo-asset` y volver a ejecutar Doctor.  
**WHEN:** Now  
**EFFORT:** XS

### TA-005

**SEVERITY:** High  
**CONFIDENCE:** Confirmed  
**AREA:** Testing / regression risk  
**FILE:** `package.json`, `src/features/map/model/map.test.ts`, CI  
**LINE/SYMBOL:** package 60–69; test 9–29; CI 24–31

**PROBLEM:** La barrera verde depende de una sola suite con cuatro tests.  
**WHY IT MATTERS:** Estado, permisos, Mapbox, publicación, theme y lifecycle pueden romperse sin señal.  
**EVIDENCE:** 3.23% de líneas; no RNTL, integration, E2E ni smoke nativo.  
**RECOMMENDED FIX:** Implementar la matriz P0/P1 de la sección 12; umbral incremental, no 80% global inmediato.  
**WHEN:** Now  
**EFFORT:** M

### TA-006

**SEVERITY:** Medium  
**CONFIDENCE:** Confirmed  
**AREA:** Audio reliability  
**FILE:** InlineFeedComposer, publicar, CommunityPostCard  
**LINE/SYMBOL:** Inline 98–133; Publish 65–90; Card 86–100

**PROBLEM:** Modo de grabación global no se restaura; cleanup y playback status son incompletos.  
**WHY IT MATTERS:** Ruta de audio incorrecta, recursos retenidos y UI desincronizada.  
**EVIDENCE:** `setAudioModeAsync(allowsRecording:true)` sin reset; publish no libera/nullifica al detener; player no escucha fin/interrupción.  
**RECOMMENDED FIX:** Controlador único con cleanup/finally, restore audio mode y estado derivado del player.  
**WHEN:** Now  
**EFFORT:** S–M

### TA-007

**SEVERITY:** Medium  
**CONFIDENCE:** Confirmed  
**AREA:** Reliability / network and permissions  
**FILE:** `useUserLocation.ts`, `useMapSearch.ts`, `mapboxSearch.ts`  
**LINE/SYMBOL:** Location 25–53; Search 36–98; Service 48–126

**PROBLEM:** Permiso fuera de try/catch; errores de suggest silenciosos; sin timeout; retrieve sin cancelación/race guard.  
**WHY IT MATTERS:** Rechazos no manejados, carga colgada, resultados fuera de orden y “sin red” indistinguible de “sin resultados”.  
**EVIDENCE:** Flujo y catches citados.  
**RECOMMENDED FIX:** Estado error/retry, timeout, AbortController/request-id y try/catch de todo el permiso.  
**WHEN:** Now  
**EFFORT:** M

### TA-008

**SEVERITY:** Medium  
**CONFIDENCE:** Confirmed  
**AREA:** Type safety at external boundary  
**FILE:** `src/services/mapboxSearch.ts`  
**LINE/SYMBOL:** 48–50, 108–126

**PROBLEM:** JSON externo se castea a `T` sin validación runtime.  
**WHY IT MATTERS:** TypeScript aparenta garantías que no existen ante respuestas inesperadas.  
**EVIDENCE:** `response.json() as Promise<T>` y tuple de coordenadas forzada.  
**RECOMMENDED FIX:** Parsear como `unknown` y validar forma mínima/números finitos con guards, sin framework si no hace falta.  
**WHEN:** Now  
**EFFORT:** S

### TA-009

**SEVERITY:** Medium ahora; High antes de beta  
**CONFIDENCE:** Confirmed  
**AREA:** Observability / recovery  
**FILE:** `package.json`, `app.json`, `src/app/_layout.tsx`, `eas.json`  
**LINE/SYMBOL:** ausencia en package/config; layout 23–72

**PROBLEM:** No hay crash reporting, sourcemaps, release correlation ni Error Boundary.  
**WHY IT MATTERS:** Un crash de usuario no es diagnosticable ni recuperable.  
**EVIDENCE:** Sentry solo figura como futuro en README.  
**RECOMMENDED FIX:** Integración mínima antes de beta, prueba simbolicada y política PII.  
**WHEN:** Soon  
**EFFORT:** M

### TA-010

**SEVERITY:** Medium  
**CONFIDENCE:** Confirmed  
**AREA:** UX / accessibility  
**FILE:** Discover, Chat, MapMarkers, composers y settings  
**LINE/SYMBOL:** comunidad 43–63, 98–125; chat 79,104,132,166; MapMarkers 55–95; Recommendation 30–36

**PROBLEM:** Affordances muertas, inputs sin nombre accesible estable, roles/states incompletos, varios touch targets pequeños y un modal multipaso sin back/reset claro.  
**WHY IT MATTERS:** Confunde a usuarios y degrada VoiceOver/TalkBack.  
**EVIDENCE:** Pressables sin `onPress`; 103 Pressables vs 33 roles/56 labels; controles 30–38 pt sin hitSlop; labels visuales no asociados; ManualPlaceComposer conserva estado interno.  
**RECOMMENDED FIX:** Cablear/desactivar explícitamente; añadir labels/semántica/selected/disabled y target >=44; definir back y política de borrador del modal.  
**WHEN:** Now/Soon  
**EFFORT:** M

### TA-011

**SEVERITY:** Medium  
**CONFIDENCE:** Confirmed  
**AREA:** Workflow / documentation  
**FILE:** `README.md`, `app.json`, `package.json`  
**LINE/SYMBOL:** README 7,56,81,85–91

**PROBLEM:** README contradice mapas/permisos/EAS/IDs/paleta actuales.  
**WHY IT MATTERS:** Onboarding y releases se basan en supuestos falsos.  
**EVIDENCE:** owner/projectId/IDs/permisos y Mapbox existen en config/código.  
**RECOMMENDED FIX:** Actualizar y separar implementado/configurado/verificado/planificado.  
**WHEN:** Now  
**EFFORT:** S

### TA-012

**SEVERITY:** Medium  
**CONFIDENCE:** Confirmed  
**AREA:** Environments / release  
**FILE:** `eas.json`, `.env.example`, `map.ts`, `app.json`  
**LINE/SYMBOL:** EAS 3–18; map 5; env 1–6; app 6,11–19

**PROBLEM:** Token Mapbox duplicado/fallback; preview/prod vacíos; build numbers no definidos.  
**WHY IT MATTERS:** Fallback oculta config ausente y stores pueden rechazar uploads repetidos.  
**EVIDENCE:** Solo development declara env; `appVersionSource:local`; no buildNumber/versionCode/autoIncrement.  
**RECOMMENDED FIX:** EAS env explícito, token público restringido, fail-fast y estrategia de versionado.  
**WHEN:** Now antes de preview / Soon antes de stores  
**EFFORT:** S

### TA-013

**SEVERITY:** Medium  
**CONFIDENCE:** Confirmed  
**AREA:** Maintainability  
**FILE:** MapScreen, SettingsDetailScreen, InlineFeedComposer y estilos distribuidos  
**LINE/SYMBOL:** Map 60–324; Settings 62–263; Inline 26–225

**PROBLEM:** Componentes con muchas responsabilidades y formato extremo.  
**WHY IT MATTERS:** Review, pruebas, merge y cambios seguros se vuelven costosos.  
**EVIDENCE:** funciones de 200–265 líneas antes de estilos; 738 líneas >120 caracteres.  
**RECOMMENDED FIX:** Extraer reglas/subcomponentes al tocar cada feature y adoptar formatter en PR separado.  
**WHEN:** Now para formato / Soon para división incremental  
**EFFORT:** S–M

### TA-014

**SEVERITY:** Medium  
**CONFIDENCE:** Potential  
**AREA:** Performance / map hot path  
**FILE:** `useMapCamera.ts`, `MapScreen.tsx`, `MapMarkers.tsx`  
**LINE/SYMBOL:** Camera 37–43; Screen 81–153,193–223; Markers 52–95

**PROBLEM:** Cada camera change actualiza React y recalcula derivaciones/markers durante el gesto.  
**WHY IT MATTERS:** Puede provocar dropped frames con datos reales.  
**EVIDENCE:** Dependencias de memos y arrays nuevos confirmadas; FPS no medido.  
**RECOMMENDED FIX:** Perfilar release; si se confirma, ref + idle/throttle/epsilon y separación de overlays.  
**WHEN:** Now antes de escalar densidad  
**EFFORT:** M

### TA-015

**SEVERITY:** Low  
**CONFIDENCE:** Confirmed  
**AREA:** Dependency hygiene  
**FILE:** `package.json`  
**LINE/SYMBOL:** `expo-device`, `expo-document-picker`

**PROBLEM:** Dos módulos directos no tienen uso detectado.  
**WHY IT MATTERS:** Superficie de actualización/autolinking innecesaria.  
**EVIDENCE:** Sin imports ni plugins; dependencias solo desde root.  
**RECOMMENDED FIX:** Confirmar roadmap y retirar si no son inminentes.  
**WHEN:** Soon  
**EFFORT:** XS
