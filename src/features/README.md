# Módulos de producto

Cada capacidad de producto vive en `src/features/<feature>` y expone la superficie mínima necesaria. Una feature puede usar las siguientes carpetas cuando aporten valor; no es obligatorio crearlas todas:

- `domain/` o `model/`: reglas y tipos puros, sin React, Expo, navegación ni componentes visuales.
- `application/`: casos de uso, coordinación de estado y providers propios de la feature.
- `data/` o `services/`: adaptadores de red, persistencia, DTO y mappers.
- `screens/`: pantallas navegables.
- `components/`, `hooks/`, `ui/`: implementación de presentación privada de la feature.

## Dirección de dependencias

La dirección permitida es:

```text
src/app -> screens/application -> domain/model
                    |                 ^
                    v                 |
                 data/services -------+

features -> components/ui, theme, shared
shared/components/ui/theme -X-> features/app
domain/model -X-> React, React Native, Expo, theme o componentes
```

Reglas prácticas:

1. `src/app` contiene adaptadores de Expo Router: exporta una pantalla o compone providers específicos de la ruta. No contiene lógica de negocio ni JSX de pantalla extenso.
2. Los modelos no conocen íconos, colores ni componentes. Los mappings visuales viven en `ui/`.
3. Un provider pertenece a la feature cuyo estado administra. Se monta en el límite más estrecho que conserve el estado requerido.
4. Una integración externa pertenece a la feature que la consume. Solo una capacidad realmente transversal entra en `src/shared/infrastructure`.
5. Las features no importan desde `src/app`. Si dos features comparten una primitiva estable, se extrae a `src/shared`; si una coordina a la otra, la dependencia debe ser unidireccional.
6. Los DTO de backend se transforman en modelos de dominio en `data/`; no deben propagarse directamente a componentes.
7. Los archivos `index.ts` públicos son opcionales. No se crean barrels globales que oculten dependencias o introduzcan ciclos.

ESLint protege los límites más críticos. La explicación completa, decisiones y criterios de modularización están en `docs/architecture.md`.
