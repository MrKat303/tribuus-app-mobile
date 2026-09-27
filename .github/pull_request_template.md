## Resumen

<!-- Describe el cambio en términos de comportamiento y resultado. -->

## Contexto y problema

- **Problema u oportunidad:**
- **Usuario o flujo afectado:**
- **Issue, ticket o referencia:**

## Alcance

### Incluido
-

### Fuera de alcance
-

## Implementación técnica

- **Módulos, rutas y componentes afectados:**
- **Flujo de datos antes/después:**
- **Decisiones de arquitectura y alternativas consideradas:**
- **Contratos, tipos, estado o comportamiento de dominio modificados:**
- **Compatibilidad iOS / Android / web:**

<!-- Incluye nombres de archivos, funciones, hooks, providers o servicios. Explica por qué se eligió este diseño. -->

## Datos, backend y seguridad

- **APIs, servicios o dependencias externas:**
- **Cambios de esquema o migraciones:**
- **Autenticación, autorización y RLS:**
- **Variables de entorno nuevas/modificadas:**
- **Permisos de dispositivo y tratamiento de datos personales:**
- [ ] Revisé el diff: no hay secretos, tokens privados ni claves `service_role`.

<!-- Si algo no aplica, escribe N/A y explica brevemente. Nunca pegues valores secretos aquí. -->

## Interfaz y experiencia

- **Cambios de interfaz:**
- **Estados de carga, vacío y error:**
- **Accesibilidad y navegación por lector de pantalla:**
- **Capturas o video (Android/iOS/web):**

## Validación

| Comprobación | Resultado / evidencia |
| --- | --- |
| `npm run lint` | |
| `npm run typecheck` | |
| `npm run test` | |
| Flujo manual en Android | |
| Flujo manual en iOS | |
| Flujo manual en web (si aplica) | |
| EAS build / configuración nativa (si aplica) | |

<!-- Si no ejecutaste una comprobación, indica por qué y qué riesgo queda. -->

## Riesgos y despliegue

- **Riesgos conocidos o casos límite:**
- **Feature flags o configuración requerida:**
- **Pasos de despliegue / migración:**
- **Plan de reversión:**

## Lista de revisión

- [ ] El PR tiene un alcance claro y no incluye cambios accidentales.
- [ ] Añadí o actualicé pruebas para la lógica modificada.
- [ ] Actualicé documentación y variables de ejemplo cuando corresponde.
- [ ] Mantuve `package-lock.json` sincronizado si cambié dependencias.
- [ ] Probé los estados de error, carga y vacío relevantes.
- [ ] Revisé permisos, accesibilidad y diferencias entre plataformas.
- [ ] Confirmé que no incluí archivos locales, configuraciones de agentes ni credenciales.
