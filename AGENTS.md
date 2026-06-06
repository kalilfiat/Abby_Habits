# Guía para agentes — Abby Habits

Expo SDK 56 + React Native + TypeScript. Corre en web (testeo en compu) y móvil.
**Antes de tocar APIs de Expo, leé los docs versionados:**
https://docs.expo.dev/versions/v56.0.0/

## Comandos

- `npm run web` — testear en navegador
- `npx tsc --noEmit` — type-check (correr siempre antes de dar por terminado)
- `npm run verify` — chequeos anti-regresión (módulos, Abby PNGs, layout Progreso)
- `npx expo export --platform web` — validar que bundlea
- `npm start` — Expo Go en celular vía QR
- `npm run build:apk` — APK release en `dist/` (corre `verify` + `tsc` antes)

## Evitar regresiones (scaffold / APK sin imágenes)

- **Commitear** antes de `expo prebuild --clean` o de tocar `android/` a mano; el
  prebuild limpio puede dejar el repo mezclado con plantilla si el JS no está guardado.
- Las poses de Abby **siempre** van con `require()` en `src/ui/mascotAssets.ts`
  (Metro las empaqueta en release); no usar placeholders ni URLs sueltas en UI.
- `app.json` debe mantener `"assetBundlePatterns": ["assets/**/*"]`.
- Si algo se pierde, existen `scripts/restore-from-transcript.mjs` y
  `scripts/restore-strreplace-from-transcript.mjs` (ver reportes JSON en `scripts/`).

## Arquitectura (respetar la dirección de dependencias)

Cuatro capas en `src/`; las dependencias apuntan hacia adentro. La UI conoce al
dominio; el dominio **nunca** importa UI, store ni React.

- `src/core/habit-engine/` — dominio **puro** (sin React/UI/storage). Tipos,
  cálculo de progreso/rachas, y el parser de lenguaje natural.
- `src/core/mascot/` — capa conversacional: personalidad, mensajes contextuales
  de "Hoy", y el diálogo de creación. Depende de `habit-engine`, no al revés.
- `src/data/` — persistencia (adaptador sobre AsyncStorage) + helpers de IDs.
- `src/store/useStore.ts` — Zustand: único punto donde se unen dominio y datos.
- `src/ui/` — pantallas y componentes. Solo presentación; la lógica vive abajo.

## Convenciones

- El **parser** está detrás de la interfaz `NaturalLanguageParser`. Para cambiar
  a un parser con IA, implementá esa interfaz y reasigná `defaultParser` en
  `parser.ts`. No metas lógica de parseo en la UI ni en el store.
- Mensajes de la mascota = funciones **puras y deterministas** sobre el estado
  (sin random por render, para que no "parpadee" de humor).
- Fechas: usar `dayKey()` del engine (día calendario local `YYYY-MM-DD`).
- Textos de UI en español rioplatense (voseo), consistente con la mascota.
- Mantené los componentes de `ui/` presentacionales: reciben datos y emiten
  intents; el estado se maneja en el store.
