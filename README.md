# Tribuus Mobile

Aplicación móvil de Tribuus para Android e iOS, construida con React Native, Expo SDK 57, Expo Router y TypeScript. Este repositorio contiene el cliente móvil; el contenido y varios flujos todavía funcionan con datos locales de demostración.

## Estado del proyecto

La app incluye navegación y pantallas para inicio, mapa, publicaciones, comunidad, chat, noticias, tienda, perfil, notificaciones, configuración y una Community Wallet integrada con Stellar. Lugares y varias experiencias de exploración todavía usan datos locales de demostración.

Autenticación, perfiles, chat y feed se integran con Supabase; el feed también usa Supabase Storage y Realtime. Lugares continúan en memoria durante la ejecución y Community Wallet persiste parte de su estado con AsyncStorage. Las migraciones versionadas bajo `supabase/migrations` definen el schema y las publicaciones Realtime requeridas por el cliente.

El mapa usa `@rnmapbox/maps`, búsqueda de lugares con Mapbox y ubicación en primer plano. Para ejecutar esos flujos se necesita un token de Mapbox válido. La app requiere un development build nativo; Expo Go no incluye el módulo nativo de Mapbox.

## Stack

- Expo SDK `~57`, Expo Router y React Native `0.86.x`.
- TypeScript estricto, React 19 y React Compiler habilitado en la configuración de Expo.
- React Native Reanimated, Gesture Handler, Safe Area Context y React Native Screens.
- Mapbox mediante `@rnmapbox/maps`, más búsqueda de lugares con la API de geocoding.
- Supabase JS para el cliente y la gestión de sesión.
- Stellar Horizon para saldo e historial público, y SEP-7 para delegar donaciones a una wallet externa.
- AsyncStorage para persistir la sesión de Supabase en iOS y Android.
- Jest con `jest-expo`; ESLint y TypeScript para controles estáticos.
- Node.js `22.13.0` (definido en `.nvmrc`) y npm `11.6.2`.

## Arquitectura

Expo Router resuelve rutas desde `src/app`, pero las implementaciones de pantalla viven en módulos verticales de `src/features`:

- `src/app/`: adaptadores de ruta, layouts, guards y opciones de navegación; no contiene lógica de producto.
- `src/features/<feature>/model` o `domain`: tipos, reducers y reglas deterministas sin dependencias de React o Expo.
- `src/features/<feature>/application`: casos de uso, coordinación de estado y providers propiedad de la feature.
- `src/features/<feature>/data` o `services`: APIs, storage, DTO, mappers y repositories.
- `src/features/<feature>/screens`, `components`, `hooks` y `ui`: presentación privada del módulo.
- `src/shared/`: primitivas transversales e infraestructura común sin semántica de producto.
- `src/bootstrap/`: arranque y composición explícita de providers.
- `src/components/ui/` y `src/theme/`: sistema visual reutilizable, independiente de las features.

Las dependencias apuntan desde rutas y UI hacia application y dominio. `shared`, UI compartida y theme nunca dependen de features; ESLint protege los límites críticos. Consulta [docs/architecture.md](docs/architecture.md) para las reglas completas, criterios de modularización y deuda priorizada.

## Requisitos

- Node.js `22.13.0` o superior compatible con Expo SDK 57.
- npm `11.6.2` (la versión usada por CI).
- Android Studio y Android SDK para compilar o ejecutar en Android.
- macOS y Xcode para compilar o ejecutar el simulador de iOS.
- Un development build para probar módulos nativos, en particular Mapbox.

Expo SDK 57 requiere React Native 0.86 y Node.js 22.13.x como mínimo. Consulta la [referencia versionada de Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) antes de cambiar versiones o configuración nativa.

## Configuración local

1. Instala las dependencias fijadas en el lockfile:

   ```powershell
   npm ci
   ```

2. Crea un archivo de entorno local:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Completa las variables:

   | Variable | Uso |
   | --- | --- |
   | `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | Token público de Mapbox para mostrar el mapa y buscar lugares. Reemplaza el valor de ejemplo. |
   | `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. El cliente Supabase lo requiere al iniciar la app. |
   | `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key del proyecto Supabase. El cliente Supabase la requiere al iniciar la app. |
   | `EXPO_PUBLIC_STELLAR_NETWORK` | Red Stellar: usa `testnet` durante desarrollo y `public` en producción. |
   | `EXPO_PUBLIC_STELLAR_HORIZON_URL` | Endpoint Horizon correspondiente a la red seleccionada. |
   | `EXPO_PUBLIC_STELLAR_COMMUNITY_ACCOUNT` | Dirección pública `G...` del fondo comunitario que recibe donaciones. |

   Las variables con prefijo `EXPO_PUBLIC_` se incorporan al bundle del cliente. Usa solo claves diseñadas para exposición en una app móvil. No agregues claves `service_role`, secretos privados ni credenciales de servidor. Restringe el token de Mapbox desde su panel.

4. Inicia Expo:

   ```powershell
   npm start
   ```

   Abre la app en un development build instalado en un dispositivo o emulador. Para compilar y ejecutar localmente:

   ```powershell
   npm run android
   npm run ios
   ```

   `npm run ios` requiere macOS y Xcode. También existe `npm run web` para iniciar el target web; algunas funciones nativas solo están disponibles en Android o iOS.

Los archivos `.env`, `.env.local` y otros entornos locales están excluidos por Git. Nunca publiques valores reales en `.env.example`.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia Expo CLI. |
| `npm run android` | Prepara y ejecuta la app en Android. |
| `npm run ios` | Prepara y ejecuta la app en iOS (macOS/Xcode). |
| `npm run web` | Inicia el target web. |
| `npm run lint` | Ejecuta ESLint mediante Expo. |
| `npm run typecheck` | Comprueba tipos con TypeScript, sin emitir archivos. |
| `npm run test` | Ejecuta Jest una vez. |
| `npm run test:watch` | Ejecuta Jest en modo watch. |
| `npm run check` | Ejecuta lint, typecheck y tests en secuencia. |

GitHub Actions ejecuta lint, typecheck y tests en cada pull request hacia `main` y en cada push a `main`. Dependabot revisa semanalmente las dependencias npm y mensualmente las GitHub Actions.

## Builds con EAS

`eas.json` define los perfiles `development`, `preview` y `production`. El perfil de desarrollo usa un development client y el entorno EAS `development`. Configura en EAS las variables públicas necesarias para cada entorno de build; las variables locales de `.env.local` no sustituyen la configuración guardada en EAS.

El identificador EAS del proyecto está en `expo.extra.eas.projectId`; el owner, slug y los identificadores nativos se definen en `app.json`. Cambia esos identificadores solo coordinando el proyecto de Expo y las aplicaciones registradas en las tiendas.

Ejemplo de build Android de desarrollo, después de configurar el entorno EAS y sus variables:

```powershell
eas build --profile development --platform android
```

## Convenciones de contribución

- Usa la plantilla de pull request de `.github/pull_request_template.md` y documenta decisiones técnicas, alcance, validación, riesgos y cambios de configuración.
- Mantén actualizado `package-lock.json` cuando cambies dependencias.
- No subas archivos de entorno, tokens, claves privadas ni instrucciones locales de agentes.
- Añade o actualiza pruebas de modelo cuando cambie lógica determinista de feed, mapa, lugares o tema.
- Para nuevas dependencias nativas o cambios de configuración, valida el flujo en un development build y describe las plataformas probadas en el pull request.

Flujo recomendado: abre un issue con criterios de aceptación, crea una rama desde `main` (`feat/<issue>-descripcion` o `fix/<issue>-descripcion`), ejecuta `npm run check` y abre un pull request hacia `main` enlazando el issue. CI vuelve a ejecutar los controles de lint, TypeScript y Jest.
