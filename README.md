# Abby Habits — app de hábitos con mascota-asistente

MVP de una app de hábitos donde una mascota (**Abby**, una gatita) guía la experiencia:
charlás con ella en lenguaje natural, te ayuda a crear hábitos personalizados, y
te acompaña en la pantalla de **Hoy** con mensajes según tu progreso del día.

Hecho con **Expo + React Native + TypeScript**, así que el mismo código corre en
tu **navegador / computadora** para testear y en **iOS / Android** cuando quieras
llevarlo al celular.

---

## Cómo correrlo

```bash
npm install          # solo la primera vez

npm run web          # abre la app en el navegador (testeo en compu)
npm run android      # emulador / dispositivo Android
npm run ios          # simulador iOS (requiere macOS)
npm start            # menú de Expo: escaneás el QR con la app "Expo Go"
```

Para probar en tu **celular** sin compilar nada: instalá la app **Expo Go**,
corré `npm start` y escaneá el QR.

---

## El flujo principal (lo que valida el MVP)

1. **Conversás con la mascota** — Abby pregunta "¿qué querés mejorar?".
2. **Escribís en lenguaje natural** — ej: *"tomar 2 litros de agua por día"*,
   *"dormir 8 horas"*, *"leer 10 páginas"*.
3. **Se convierte en una ficha editable** — nombre, tipo, unidad, frecuencia,
   meta mínima, meta ideal y botones rápidos. Ajustás y guardás.
4. **Aparece en "Hoy"** — con sus botones de registro rápido.
5. **Registrás progreso** con un toque, y la mascota reacciona en tiempo real:
   te avisa cuánto falta, te felicita, o te recuerda lo pendiente.
6. **Se guarda el historial diario** (persiste aunque cierres la app).

---

## Arquitectura

El código está deliberadamente separado en **cuatro capas** para poder crecer
sin enredarse. Las dependencias van siempre hacia adentro: la UI conoce al
dominio, el dominio no conoce a la UI.

```
src/
├── core/
│   ├── habit-engine/      ← DOMINIO PURO (sin UI, sin storage, sin React)
│   │   ├── types.ts          Habit, HabitLog, Progress...
│   │   ├── engine.ts         cálculo de progreso, estado del día, rachas
│   │   ├── parser.ts         lenguaje natural → ficha (interfaz reemplazable por IA)
│   │   └── index.ts
│   └── mascot/            ← CAPA CONVERSACIONAL (personalidad de la mascota)
│       ├── personality.ts    identidad, caras y colores por humor
│       ├── messages.ts       mensajes contextuales para "Hoy"
│       ├── conversation.ts   diálogo de creación de hábitos
│       └── index.ts
├── data/                 ← DATOS DEL USUARIO (persistencia)
│   ├── storage.ts            adaptador sobre AsyncStorage (web + móvil)
│   └── id.ts
├── store/                ← ESTADO (une dominio + datos)
│   └── useStore.ts           Zustand + persistencia
└── ui/                   ← INTERFAZ (React Native)
    ├── theme.ts
    ├── components/           Mascot, HabitCard, ChatBubble, ProgressBar
    └── screens/              TodayScreen, ChatScreen, HabitEditScreen
```

### Por qué esta separación

Cada feature futura tiene un lugar natural donde entrar **sin tocar el resto**:

| Próximo paso                         | Dónde vive                                            |
| ------------------------------------ | ----------------------------------------------------- |
| Parser con IA (en vez de heurístico) | implementar `NaturalLanguageParser` en `parser.ts`    |
| Recordatorios inteligentes           | nuevo módulo en `core/` + `data/` para programarlos   |
| Detección de patrones / sugerencias  | nuevas funciones puras en `habit-engine`              |
| Personalidad evolutiva de la mascota | `mascot/personality.ts` (caras/colores ya por nivel)  |
| Hábitos compuestos                   | extender `types.ts` + `engine.ts`                     |
| Integraciones externas / sync        | reemplazar el adaptador en `data/storage.ts`          |

El **parser** es el ejemplo más claro: hoy es una heurística offline, pero está
detrás de la interfaz `NaturalLanguageParser`. Para enchufar un LLM, se
implementa esa interfaz y se cambia `defaultParser` — nada más se entera.

---

## Stack

- **Expo SDK 56** + **React Native** + **TypeScript**
- **React Navigation** (native-stack) — navegación
- **Zustand** + `persist` — estado y persistencia
- **AsyncStorage** — almacenamiento local (web, iOS, Android)

## Estado del MVP

✅ Conversación con la mascota · creación por lenguaje natural · ficha editable ·
pantalla "Hoy" · registro rápido · mensajes contextuales · historial diario
persistente.

🔜 Preparado (no incluido aún): recordatorios, planes de rescate, detección de
patrones, sugerencias automáticas, hábitos compuestos, personalidad evolutiva,
integraciones.
