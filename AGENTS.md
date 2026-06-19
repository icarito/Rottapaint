# AGENTS.md — Guía para asistentes de IA

Este archivo le dice a Claude Code (y otros asistentes de IA) cómo trabajar en este repositorio correctamente.

---

## Contexto del proyecto

**Rottapaint** es una app de dibujo infantil construida con React Native + Expo. El canvas usa SVG (react-native-svg) en lugar de Canvas 2D o WebGL. El estado del dibujo es inmutable (useReducer). No hay backend — todo es local con AsyncStorage.

**Público objetivo**: niños de 3 a 10 años. Priorizar:
- Botones grandes (mínimo 44×44 pt, idealmente 56×56)
- Colores vibrantes
- Cero texto técnico en la UI
- Respuesta táctil inmediata (haptics)

---

## Arquitectura que no se debe romper

### Separación de capas

```
utils/      → funciones puras (sin React, sin side effects)
hooks/      → lógica de estado (React, pero sin UI)
components/ → UI pura (sin lógica de negocio)
screens/    → orquestación (conecta hooks con componentes)
```

**Regla**: nunca importes desde `screens/` en `components/`. Las dependencias van de afuera hacia adentro, nunca al revés.

### El reducer de dibujo es inmutable

En `src/hooks/useDrawing.ts`, el reducer **nunca muta el estado**. Siempre retorna un nuevo objeto. Si agregás una acción nueva, seguí este patrón:

```ts
case 'MI_ACCION':
  return { ...state, algoCambia: nuevoValor }; // ✅
  
case 'MI_ACCION':
  state.algoCambia = nuevoValor;               // ❌ NO
  return state;
```

### AsyncStorage: usar siempre las funciones de `src/utils/storage.ts`

Nunca llames a `AsyncStorage` directamente desde un componente o screen. Toda interacción pasa por `storage.ts` → `useStorage.ts`.

---

## Reglas de código

### TypeScript

- `strict: true` está activo. No usar `any`, no usar `as` salvo cuando sea estrictamente necesario y con un comentario que explique por qué.
- Todos los props de componentes deben tener una interface explícita con el sufijo `Props`.
- Los tipos del dominio van en `src/types/index.ts`.

### Componentes

- Usar `React.memo()` en componentes que reciben muchos re-renders (especialmente los del canvas y picker).
- Los callbacks que se pasan como props deben estar envueltos en `useCallback`.
- No usar `useEffect` para derivar estado — usar `useMemo` o calcular inline.

### Estilos

- Todos los estilos en `StyleSheet.create()` al final del archivo.
- No usar estilos inline salvo para valores dinámicos (ej. `{ backgroundColor: color }`).
- Nombres de estilos en camelCase.
- Tamaños mínimos de tap target: `44` en cualquier dimensión.

### Accesibilidad

Todo elemento interactivo debe tener:
```tsx
accessibilityLabel="descripción en español"
accessibilityRole="button" // o "radio", "checkbox", etc.
```

---

## Cómo agregar features

### Nuevo pincel

1. Agregar objeto a `BRUSHES[]` en `src/utils/brushes.ts`
2. Si el efecto visual requiere lógica especial, modificar `pointsToSvgPath()` en `src/utils/svgPath.ts` para que acepte el `BrushConfig` como parámetro
3. El `BrushPicker` lo muestra automáticamente
4. Agregar test en `__tests__/utils/svgPath.test.ts`

### Nuevo color o paleta

1. Agregar a `COLOR_PALETTE[]` en `src/utils/colors.ts`
2. El `ColorPicker` lo muestra automáticamente

### Nueva pantalla

1. Crear `app/nombre.tsx` con un componente por default
2. Navegar con `router.push('/nombre')` desde Expo Router
3. Si la pantalla necesita estado global, considerar Context antes de prop drilling

### Nueva acción en el canvas (ej. fill, shapes)

1. Agregar el tipo de acción a `DrawingAction` en `useDrawing.ts`
2. Agregar el case en el reducer
3. Exponer la función desde el hook
4. Agregar un botón en `Toolbar.tsx`

---

## Testing

### Qué testear

- **`src/utils/`**: todo. Son funciones puras, fáciles de testear.
- **`src/hooks/useDrawing.ts`**: el reducer directamente (importar la función `reducer` y testear cada action).
- **Componentes**: solo cuando hay lógica condicional compleja. Para UI pura no es necesario.

### Qué NO testear

- Estilos visuales
- Comportamiento de librerías externas (react-native-svg, AsyncStorage)
- Pantallas completas (demasiado acoplamiento)

### Ejecutar tests

```bash
npm test                    # todos los tests
npm test -- --watch         # modo watch
npm test -- svgPath         # solo tests de svgPath
npm run type-check          # verificación de tipos
npm run lint                # linting
```

---

## Convenciones de commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agregar pincel de acuarela
fix: corregir trazo que desaparece en iPad
refactor: extraer lógica de thumbnail a utils
test: agregar tests para pointsToSvgPath
docs: actualizar instrucciones de build
chore: actualizar dependencias de Expo
```

---

## Lo que NO hacer

- **No agregar un backend** salvo que el usuario lo pida explícitamente. La app es offline-first.
- **No usar `react-native-skia`** sin evaluar el impacto en el tamaño del bundle (agrega ~4MB).
- **No romper la compatibilidad con web** (react-native-web). Antes de usar una API nativa, verificar que tenga fallback en web.
- **No agregar analytics ni tracking** sin consentimiento explícito del usuario (la app es para niños, aplican regulaciones COPPA/GDPR-K).
- **No modificar `eas.json`** con credenciales reales — eso va en variables de entorno del CI.
- **No hardcodear strings en español en componentes** — si el proyecto crece a multi-idioma, van en un archivo de i18n.

---

## Dependencias: cómo agregar nuevas

Antes de agregar una dependencia:
1. ¿Expo ya tiene algo equivalente? (`expo-*`) → Preferir siempre el módulo de Expo.
2. ¿Es compatible con Expo SDK 52? → Verificar en [expo.fyi/package-compatibility](https://expo.fyi/package-compatibility).
3. ¿Es compatible con react-native-web? → Verificar si la feature se necesita en web.
4. Agregar con: `npx expo install nombre-paquete` (no `npm install` — Expo resuelve la versión compatible).

---

## Archivos que NO se deben modificar sin entender bien

| Archivo | Por qué |
|---|---|
| `babel.config.js` | Afecta toda la compilación; un error rompe el build |
| `app/_layout.tsx` | Es el root de la app; cambios aquí afectan todo |
| `tsconfig.json` | Cambios en `paths` pueden romper los imports `@/` |
| `eas.json` | Perfil de producción — cambios se van al App Store |

---

## Contexto de Expo Router

Este proyecto usa **Expo Router v4** (file-based routing). Las rutas son:

| Archivo | URL / ruta |
|---|---|
| `app/index.tsx` | `/` (pantalla inicial) |
| `app/_layout.tsx` | layout raíz (no es una ruta navegable) |

Para navegación imperativa usar `expo-router`:
```ts
import { router } from 'expo-router';
router.push('/ruta');
router.back();
router.replace('/ruta'); // sin agregar al historial
```
