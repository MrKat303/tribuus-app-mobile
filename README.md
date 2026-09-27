# Tribuus Mobile

Aplicación móvil de Tribuus para Android e iOS, construida con React Native, Expo SDK 57, Expo Router y TypeScript. Este repositorio contiene el cliente móvil; el contenido y varios flujos todavía funcionan con datos locales de demostración.

## Estado del proyecto

La app incluye navegación y pantallas para inicio, mapa, publicaciones, comunidad, chat, noticias, tienda, perfil, notificaciones, configuración y billetera comunitaria. Los formularios y modelos de feed, lugares y mapa permiten probar interacciones sin depender de una API de producto.

Las publicaciones y lugares se inicializan con datos de demostración y viven en memoria durante la ejecución. El perfil y la preferencia de apariencia pueden persistir localmente con AsyncStorage. Ninguno de esos datos representa un backend de producción. Existe un cliente Supabase para la sesión y la renovación automática de tokens, pero las pantallas todavía no usan Supabase para cargar o guardar contenido. No hay migraciones de base de datos en este repositorio.

El mapa usa `@rnmapbox/maps`, búsqueda de lugares con Mapbox y ubicación en primer plano. Para ejecutar esos flujos se necesita un token de Mapbox válido. La app requiere un development build nativo; Expo Go no incluye el módulo nativo de Mapbox.

## Stack

- Expo SDK `~57`, Expo Router y React Native `0.86.x`.
- TypeScript estricto, React 19 y React Compiler habilitado en la configuración de Expo.
- React Native Reanimated, Gesture Handler, Safe Area Context y React Native Screens.
- Mapbox mediante `@rnmapbox/maps`, más búsqueda de lugares con la API de geocoding.
- Supabase JS para el cliente y la gestión de sesión.
- AsyncStorage para persistir la sesión de Supabase en iOS y Android.
- Jest con `jest-expo`; ESLint y TypeScript para controles estáticos.
- Node.js `22.13.0` (definido en `.nvmrc`) y npm `11.6.2`.

## Arquitectura

Expo Router resuelve las rutas a partir de `src/app`. Los grupos de rutas organizan las pestañas principales y las pantallas de detalle:

- `src/app/`: layouts y rutas de bienvenida, pestañas, descubrimiento, notificaciones, configuración y billetera comunitaria.
- `src/features/feed/`: pantalla del feed, composición, comentarios, encuestas y reducer/modelo de publicaciones.
- `src/features/map/`: pantalla de mapa, búsqueda, cámara, ubicación, marcadores, clustering y ranking.
- `src/features/places/`: modelos, ranking, tarjetas y formularios de lugares y recomendaciones.
- `src/features/settings/`: interfaz para las secciones de configuración.
- `src/context/`: estado compartido de apariencia, perfil, lugares y publicaciones.
- `src/data/`: datos locales usados para demostraciones.
- `src/services/`: clientes e integraciones externas, como Mapbox y Supabase, junto a contratos de servicios.
- `src/components/ui/` y `src/theme/`: componentes reutilizables, estilos, tokens y tema de navegación.
- `src/types/`: tipos compartidos del dominio.

Mantén las rutas enfocadas en composición y navegación. La lógica de dominio debe vivir en `features`; los proveedores externos y capacidades del dispositivo deben quedar encapsulados en `services`.

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
