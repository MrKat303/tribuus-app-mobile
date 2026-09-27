# Tribuus · aplicación móvil

Aplicación móvil nativa de Tribuus para Android y iPhone. Está construida con React Native, Expo SDK 57, Expo Router y TypeScript estricto. Este repositorio es independiente de la web pública de Tribuus.

## Estado actual

Esta primera etapa incluye una bienvenida, navegación inferior y cinco áreas navegables: Inicio, Mapa, Publicar, Comunidad y Perfil. El contenido es local y demostrativo. Todavía no hay autenticación, Supabase, mapas, permisos del dispositivo ni notificaciones.

## Requisitos

- Node.js 22.13 o superior (se recomienda una versión LTS compatible con Expo SDK 57).
- npm.
- El development build de Tribuus en Android o iOS, Android Studio para un emulador Android o macOS con Xcode para un simulador iOS.

## Ejecutar el proyecto

```powershell
npm install
Copy-Item .env.example .env
npm start
```

Después de iniciar Expo, abre el enlace o escanea el código QR con el development build. También puedes usar:

```powershell
npm run android
npm run ios
npm run web
```

El simulador de iOS requiere macOS. Desde Windows se puede probar en dispositivos físicos Android e iOS mediante un development build generado con EAS.

## Verificaciones

```powershell
npm run lint
npm run typecheck
npm run test
npm run check
```

`npm run check` ejecuta las mismas tres barreras que GitHub Actions: ESLint, TypeScript y Jest.

## Flujo de trabajo en GitHub

Todo cambio empieza en un Issue y llega a la rama principal mediante Pull Request:

1. Crea un Issue con la plantilla de funcionalidad o error y define criterios de aceptación verificables.
2. Crea una rama desde `main` con el formato `tipo/numero-descripcion`, por ejemplo `feat/42-perfil-publico` o `fix/57-feed-vacio`.
3. Implementa el cambio y añade o actualiza sus pruebas.
4. Ejecuta `npm run check` antes de subir la rama.
5. Abre un Pull Request y enlaza el Issue con `Closes #42`.
6. Espera a que pasen los checks `ESLint`, `TypeScript` y `Tests` de GitHub Actions.
7. Haz squash merge a `main` y elimina la rama.

`main` es la rama predeterminada. Está protegida para exigir Pull Request, los tres checks de CI y al menos una aprobación antes del merge.

Las siguientes fases previstas son Sentry para errores en producción, Maestro para los recorridos críticos `signup → onboarding → feed → publicar → perfil`, y PostHog para analítica de producto. Dependabot ya revisa semanalmente las dependencias npm y las acciones de GitHub.

## Estructura

```text
src/
  app/          Rutas y layouts de Expo Router
  components/   Componentes visuales reutilizables
  data/         Datos locales de demostración
  features/     Módulos funcionales futuros
  services/     Contratos para backend y capacidades nativas
  theme/        Colores, tipografía, espaciado y navegación
  types/        Tipos compartidos del dominio
```

Las rutas deben limitarse a componer la interfaz. La lógica de producto vivirá en `features` y el acceso a Supabase, ubicación, cámara, mapas, push o almacenamiento local se implementará detrás de contratos en `services`.

## Variables de entorno

`.env.example` documenta únicamente variables públicas destinadas al cliente. Nunca incluyas claves secretas ni la clave `service_role` de Supabase en una aplicación Expo. Los archivos `.env` reales están ignorados por Git.

## EAS Build

`eas.json` contiene perfiles iniciales `preview` y `production`. Antes del primer build será necesario decidir los identificadores definitivos (`ios.bundleIdentifier` y `android.package`), instalar o usar EAS CLI e iniciar sesión en una cuenta de Expo. Ninguna cuenta ni proyecto externo ha sido vinculado en esta etapa.

## Identidad visual

- Fondo: `#FDF9F4`
- Texto: `#151813`
- Verde: `#2DC653`
- Interfaz: DM Sans
- Títulos: Newsreader

Los iconos de app y splash incluidos actualmente son recursos provisionales de la plantilla de Expo. Deben reemplazarse por los archivos oficiales de Tribuus antes de distribuir una build.
