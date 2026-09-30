# Reporte de navegación y transiciones

Fecha de auditoría: 29 de septiembre de 2026  
Base técnica auditada: Expo SDK 57, Expo Router 57 y React Native Reanimated 4.

## Resumen ejecutivo

La aplicación tiene tres sistemas de transición superpuestos:

1. Un `Stack` raíz con fundido (`fade`) como transición predeterminada.
2. Un navegador de pestañas con transición nativa desactivada (`animation: 'none'`).
3. Un gesto horizontal propio que desplaza, reduce y desvanece parcialmente la pantalla actual antes de reemplazar la ruta de pestaña.

Además, Chat usa una entrada lateral específica, Comentarios se presenta como una hoja nativa y varias secciones internas usan microtransiciones de Reanimated.

La Community Wallet se reconstruyó después de la auditoría original como un flujo de iniciativas y transparencia conectado a Stellar.

## Arquitectura de navegación

### Stack raíz

El `Stack` principal está definido en `src/app/_layout.tsx`. Oculta el header nativo y aplica `animation: 'fade'` a todas las rutas salvo las excepciones declaradas por pantalla. El color de fondo del stack se conecta al tema activo para evitar destellos de otro color durante el cambio.

Según la referencia versionada de Expo Router 57, `push` agrega una pantalla al historial, `replace` sustituye la pantalla actual y `back` vuelve en el historial. Las presentaciones `card`, `modal`, `transparentModal`, `fullScreenModal` y `formSheet` tienen semánticas diferentes; el proyecto usa `formSheet` solamente para Comentarios.

Referencias:

- [Expo Router 57](https://docs.expo.dev/versions/v57.0.0/sdk/router/)
- [Stack de Expo Router](https://docs.expo.dev/router/advanced/stack/)
- [Presentaciones modales](https://docs.expo.dev/router/advanced/modals/)

### Navegador de pestañas

El layout `src/app/(tabs)/_layout.tsx` define cinco pestañas visibles, en este orden: Home, Chat, Maps, Discover y News. La transición del navegador está desactivada, de modo que tocar una pestaña cambia el contenido sin slide ni fundido del propio tab navigator.

Existen tres rutas ocultas del tab bar: `shop`, `publicar` y `perfil`. Siguen siendo navegables por URL, pero no muestran un botón propio en la barra.

### Gesto horizontal propio

`src/components/SwipeableTabPage.tsx` implementa navegación lateral entre las cinco pestañas visibles. Durante el arrastre:

- la pantalla sigue al dedo en el eje X;
- su opacidad baja gradualmente de `1` a `0.82`;
- su escala baja gradualmente de `1` a `0.985`;
- si no existe una pestaña en esa dirección, el desplazamiento se amortigua al 16 %;
- el cambio se confirma al superar 48 puntos o una velocidad absoluta de 0.5;
- si no se confirma, vuelve al origen con un spring (`damping: 21`, `mass: 0.72`, `stiffness: 240`);
- si se confirma, se ejecuta `router.replace`, por lo que el gesto no agrega una nueva entrada al historial.

El gesto no anima la pantalla de destino: la animación corresponde al arrastre de salida y luego el tab navigator hace un reemplazo sin animación.

## Matriz de transiciones entre páginas

| Origen / acción | Destino | Operación | Transición visible | Regreso |
|---|---|---|---|---|
| Bienvenida: “Entrar a Tribus” | Home | `replace` | Fundido del stack raíz | No vuelve a Bienvenida mediante back |
| Barra inferior | Home, Chat, Maps, Discover o News | cambio de tab | Ninguna (`animation: 'none'`) | Cada tab conserva el estado que mantenga el navegador |
| Swipe desde Home | Chat | `replace` | arrastre, leve escala y pérdida de opacidad; destino instantáneo | el swipe no agrega historial |
| Swipe desde Maps | Chat o Discover | `replace` | mismo gesto, limitado a zonas de 24 pt en los bordes | el swipe no agrega historial |
| Swipe desde Discover | Maps o News | `replace` | mismo gesto en toda la pantalla | el swipe no agrega historial |
| Swipe desde News | Discover | `replace` | mismo gesto en toda la pantalla | el swipe no agrega historial |
| Home: avatar | Perfil | `push` dentro de tabs | Ninguna del tab navigator | botón Volver / historial |
| Perfil: Configuración | Configuración | `push` al stack raíz | Fundido | `router.back()` |
| Perfil o Configuración: editar/abrir sección | `/ajustes/[section]` | `push` | Fundido | `router.back()` desde el detalle |
| Perfil: crear publicación | Publicar | `push` dentro de tabs | Ninguna del tab navigator | el envío usa `replace` hacia Home |
| Publicar: envío correcto | Home | `replace` | Ninguna del tab navigator | no vuelve al formulario mediante back |
| Home, News o Configuración: Notificaciones | Notificaciones | `push` | Fundido | `router.back()` |
| Home o Configuración: Community Wallet | `/community-wallet` | `push` | Slide nativo desde la derecha | `router.back()` |
| Community Wallet: Donar | `/community-wallet/donate` | `push` | `formSheet` nativo, detent de 92 % y grabber | cerrar, dismiss o back |
| Community Wallet: Proponer | `/community-wallet/propose` | `push` | Modal desde abajo | Cancelar, back o confirmación tras enviar |
| Donar: continuar | wallet Stellar externa | SEP-7 con `Linking.openURL` | transición controlada por el sistema operativo | regreso desde la wallet externa |
| Discover: categoría | `/discover/[category]` | `push` | Fundido | `router.back()` |
| Chat: seleccionar conversación | `/chat/[conversationId]` | `push` | Slide nativo desde la derecha | botón Volver, gesto nativo de back o back de Android |
| Tarjeta de publicación: comentarios | `/comments/[postId]` | `push` | `formSheet` nativo, detent de 92 %, radio 24 y grabber visible | botón cerrar, gesto de dismiss o back |
| Chat: abrir imagen | visor local | `Modal` de React Native | fundido del modal + zoom de 240 ms (o fade con Reduce Motion) + cross-dissolve de imagen de 180 ms | botón cerrar o back del sistema |

## Cobertura real del swipe entre tabs

El swipe no es simétrico en todas las pestañas:

- Home, Discover y News lo reciben mediante el componente `Screen`.
- Maps usa una variante `edgeOnly` para no interferir con los gestos del mapa.
- Chat no está envuelto en `SwipeableTabPage`, por lo que no permite iniciar el cambio lateral.

Consecuencia: se puede ir de Home a Chat con swipe, pero no continuar desde Chat a Maps ni volver de Chat a Home con el mismo gesto. Maps sí permite saltar a Chat o Discover desde los bordes. Esta discontinuidad puede sentirse accidental.

## Transiciones dentro de secciones

### Feed

- El compositor inline no cambia de ruta. Al publicar, reduce escala a `0.98` y opacidad a `0.88` durante 180 ms, muestra éxito, recupera opacidad en 140 ms y finalmente desaparece en 160 ms.
- Una publicación recién creada entra con animación y las tarjetas reordenadas usan `LinearTransition` de 240 ms.
- Like y guardado comprimen el icono a `0.94` durante 70 ms y lo restituyen durante 110 ms.
- El contador de comentarios entra desde abajo durante 180 ms y sale hacia arriba durante 120 ms.
- Cambiar el filtro del feed sustituye los datos de la lista sin transición de página.

### Chat

- Las filas de conversaciones aparecen escalonadas con `FadeInDown` de 200 ms y retrasos de 35 ms, limitados a las primeras siete posiciones.
- Los mensajes recibidos entran con `FadeInDown` de 200 ms; los propios usan spring. Con Reduce Motion se usa un fundido de 140 ms.
- El indicador de escritura hace fade in/out y anima sus puntos mientras Reduce Motion esté desactivado.
- Respuesta, selector de emojis y adjunto pendiente entran desde abajo en 160 ms y salen con fade de 100 ms.
- Grabación y vista previa de audio usan fades y transición de layout; las reacciones usan timing más spring.
- El swipe de respuesta actúa dentro de una burbuja; no navega entre páginas.

### Otras secciones

- Los resultados de búsqueda de Discover aparecen o desaparecen por render condicional, sin animación dedicada.
- Cambiar categorías en Shop modifica el contenido en sitio, sin transición dedicada.
- Los switches de Configuración usan el control nativo; abrir un detalle sí navega con el fundido del stack.
- News abre el detalle de alertas mediante `Alert`, no mediante una página nueva.

## Comportamiento de back y del historial

- Bienvenida → Home y Publicar → Home usan `replace`, correctamente tratados como pasos de una sola dirección.
- Las pantallas de detalle usan `push` y ofrecen `router.back()` cuando tienen header propio.
- El swipe entre tabs usa `replace`; no permite recorrer por back el historial de swipes.
- Perfil es una ruta oculta del navegador de tabs y añade un botón Volver propio.
- Comentarios se cierra con `router.back()` aunque se presenta como `formSheet`; el gesto nativo de dismiss también queda disponible.
- No se encontró `usePreventRemove`; ninguna pantalla bloquea explícitamente back por trabajo sin guardar o una operación irreversible en curso.

## Hallazgos y recomendaciones

1. **Inconsistencia del swipe.** Chat rompe la continuidad del gesto entre pestañas. Conviene elegir una política: eliminar el swipe personalizado y depender de la barra, o aplicarlo de forma coherente sin interferir con listas, chat y mapa.
2. **Tabs sin transición + swipe parcial.** El usuario ve movimiento solo mientras arrastra la pantalla de origen; el destino aparece de golpe. Si se conserva el gesto, sería preferible una transición espacial completa o, siguiendo la convención de tabs nativos, retirar el slide personalizado.
3. **Fundido global.** Configuración, Notificaciones, detalles de ajustes y categorías de Discover representan navegación jerárquica, pero actualmente entran con fade. Un push lateral nativo comunicaría mejor que se está profundizando y preservaría una gramática consistente con Chat.
4. **Reduce Motion parcial.** Feed y Chat consultan `useReducedMotion`, pero `SwipeableTabPage` no lo hace. El gesto personalizado siempre aplica escala y opacidad.
5. **Rutas ocultas.** Perfil y Publicar funcionan como pantallas internas del tab navigator, no como pantallas del stack raíz. Eso elimina animación y mezcla navegación de tabs con flujos de detalle/creación.
6. **Validación pendiente en dispositivo.** Este reporte verifica configuración y código. Para validar sensación, velocidad, gestos de back y ausencia de frames intermedios hace falta una pasada completa en build release sobre iOS y Android.

## Community Wallet actual

El flujo actual incluye:

- un home con saldo, iniciativas y movimientos;
- apoyo local persistente e iniciativas propuestas por vecinos;
- una hoja de donación que delega la firma a una wallet Stellar mediante SEP-7;
- una pantalla modal para crear propuestas;
- lectura de saldo y pagos desde Horizon cuando se configura la cuenta pública del barrio;
- modo demo explícito cuando todavía no existe una cuenta Stellar configurada.
