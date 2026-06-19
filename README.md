# 🎨 Rottapaint

Aplicación de dibujo infantil **offline-first** construida con React Native + Expo.  
Funciona en iPhone, iPad y como PWA en el navegador — un único codebase.

---

## El stack y por qué lo elegimos

Rottapaint usa un stack moderno pero deliberadamente pequeño. Cada pieza tiene un rol claro; no hay magia oculta.

### React Native + Expo

**React Native** te permite escribir la UI en JavaScript/TypeScript y compilarla a componentes nativos reales de iOS y Android — no a un WebView disfrazado. El resultado es rendimiento nativo, acceso al hardware (cámara, haptics, filesystem) y una app que Apple acepta en el App Store sin objeciones.

**Expo** es el cinturón de herramientas que rodea a React Native. Resuelve los problemas difíciles:

| Sin Expo | Con Expo |
|---|---|
| Configurar Xcode manualmente | `npx expo start` y listo |
| Gestionar certificados iOS | `eas build` lo hace por vos |
| Compilar en la nube | EAS Build corre en servidores de Expo |
| Actualizar OTA | `expo-updates` (sin pasar por la App Store) |

> **Punto de entrada para empezar**: `app/index.tsx` — es la primera pantalla que se renderiza. Desde ahí se ramifica todo.

---

### Expo Router (navegación)

La navegación entre pantallas funciona igual que Next.js: cada archivo en `app/` es una ruta. Si creás `app/settings.tsx`, automáticamente tenés una pantalla `/settings` con back button incluido.

```
app/
  _layout.tsx   ← configuración global (providers, theme)
  index.tsx     ← pantalla principal (Home ↔ Drawing)
```

> **Para agregar una pantalla nueva**: creá un archivo en `app/` y exportá un componente por default. Expo Router lo descubre solo.

---

### react-native-svg (el canvas)

En lugar de usar un `<canvas>` de HTML (que no existe en React Native), dibujamos con SVG. Cada trazo del pincel es un elemento `<Path>` con una curva de Bézier generada a partir de los puntos táctiles.

```
Toque del dedo → punto (x, y)
Puntos acumulados → string SVG path ("M 10 20 Q 15 25 20 30 ...")
Path string → <Path d="..." stroke="red" strokeWidth={8} />
SVG renderiza → ¡línea suave!
```

El algoritmo de suavizado está en `src/utils/svgPath.ts:pointsToSvgPath()`. Es la función más interesante del proyecto y un buen lugar para experimentar.

> **Para agregar un efecto de pincel**: modificá `pointsToSvgPath()` o agregá un nuevo campo en `BrushConfig` (`src/types/index.ts`).

---

### PanResponder (gestos táctiles)

`PanResponder` es la API nativa de React Native para capturar gestos. En `Canvas.tsx` usamos un único responder que:

1. Se "apropia" del toque cuando el dedo baja (`onPanResponderGrant`)
2. Agrega puntos mientras el dedo se mueve (`onPanResponderMove`)
3. Cierra el trazo cuando el dedo se levanta (`onPanResponderRelease`)

El truco de los `ref` para color y pincel (líneas 68-69 de `Canvas.tsx`) existe porque PanResponder se crea una sola vez pero necesita leer valores que cambian — los refs permiten leer el valor *actual* sin recrear el responder.

> **Para soportar multi-touch real** (ej. dos dedos dibujando a la vez): mirá `event.nativeEvent.touches` dentro de los handlers. Cada elemento del array es un dedo diferente.

---

### useReducer para el historial de dibujo

El estado del canvas no usa `useState` simple — usa `useReducer` con un stack de deshacer/rehacer. Es el mismo patrón que usan editores como VS Code o Figma.

```
committed: [trazo1, trazo2, trazo3]   ← lo que se ve
redoStack: []                          ← trazos "deshacidos"

→ UNDO →

committed: [trazo1, trazo2]
redoStack: [[trazo3]]

→ REDO →

committed: [trazo1, trazo2, trazo3]
redoStack: []
```

Todo esto vive en `src/hooks/useDrawing.ts`. El reducer es puro (sin side effects), lo que lo hace fácil de testear.

> **Para agregar "grupos de undo"** (deshacer de a varios trazos juntos, como un fill): modificá la acción `UNDO` en el reducer para sacar un array de trazos en lugar de uno solo.

---

### AsyncStorage (persistencia)

Los dibujos se guardan localmente en el dispositivo. No hay servidor, no hay cuenta de usuario, no hay privacidad comprometida — los datos nunca salen del teléfono.

La capa de storage está completamente aislada en `src/utils/storage.ts`. Si en el futuro quisieran sincronizar a la nube (iCloud, Firebase), solo cambian ese archivo.

```
AsyncStorage keys:
  @rottapaint:drawings          → ["id1", "id2", ...]  (índice ordenado)
  @rottapaint:drawing:id1       → { Drawing completo en JSON }
```

> **Para agregar sync a iCloud**: reemplazá AsyncStorage por `@react-native-community/async-storage` con el backend iCloud, o usá `expo-secure-store` para datos sensibles.

---

### react-native-web (PWA)

El mismo código React Native se compila para el navegador usando `react-native-web`, que mapea cada componente nativo a su equivalente HTML. Esto nos da la PWA gratis.

```
npm run build:web   → genera dist/ con HTML/CSS/JS
npm run serve:web   → lo sirve localmente para probar
```

La diferencia entre la app nativa y la PWA es mínima: haptics no funcionan en web, y AsyncStorage usa `localStorage` internamente en el browser.

---

## Inicio rápido

```bash
git clone https://github.com/icarito/rottapaint.git
cd rottapaint
npm install

# Probar en el navegador (más rápido para iterar)
npm run dev

# Probar en dispositivo físico con Expo Go
npm run dev:native
# → escaneá el QR con la app "Expo Go" en tu iPhone/iPad

# Probar en Simulador de iOS (requiere Xcode)
npm run ios
```

---

## Estructura del proyecto

```
rottapaint/
│
├── app/                        ← EXPO ROUTER: cada archivo = una ruta
│   ├── _layout.tsx             ← providers globales (GestureHandler, SafeArea)
│   └── index.tsx               ← punto de entrada, switch Home ↔ Drawing
│
├── src/
│   ├── types/
│   │   └── index.ts            ← todos los tipos TypeScript del proyecto
│   │
│   ├── utils/                  ← funciones puras, sin React
│   │   ├── svgPath.ts          ← algoritmo de suavizado (Bézier quadrático)
│   │   ├── storage.ts          ← CRUD AsyncStorage
│   │   ├── colors.ts           ← paleta de colores
│   │   └── brushes.ts          ← configuración de pinceles
│   │
│   ├── hooks/                  ← lógica de estado reutilizable
│   │   ├── useDrawing.ts       ← estado del canvas + undo/redo (useReducer)
│   │   └── useStorage.ts       ← operaciones de guardado reactivas
│   │
│   ├── components/             ← piezas de UI reutilizables
│   │   ├── Canvas.tsx          ← el corazón: SVG + PanResponder
│   │   ├── ColorPicker.tsx     ← fila de colores con scroll
│   │   ├── BrushPicker.tsx     ← selector de pinceles
│   │   ├── Toolbar.tsx         ← barra de acciones (undo, save, etc.)
│   │   ├── DrawingCard.tsx     ← tarjeta de la galería con miniatura
│   │   └── SaveModal.tsx       ← modal para nombrar el dibujo
│   │
│   └── screens/                ← pantallas completas
│       ├── HomeScreen.tsx      ← galería de dibujos guardados
│       └── DrawingScreen.tsx   ← pantalla de dibujo (orquesta todo)
│
├── public/
│   ├── manifest.json           ← PWA Web App Manifest
│   └── service-worker.js       ← cache offline para PWA
│
├── .vscode/                    ← configuración del editor
│   ├── extensions.json         ← extensiones recomendadas
│   └── settings.json           ← config del workspace
│
├── __tests__/                  ← tests unitarios
│   ├── utils/
│   │   ├── svgPath.test.ts
│   │   └── storage.test.ts
│   └── hooks/
│       └── useDrawing.test.ts
│
├── app.json                    ← config Expo (nombre, bundle ID, permisos)
├── eas.json                    ← config EAS Build (perfiles de build)
├── babel.config.js             ← transpilador (no tocar salvo que sepas)
├── tsconfig.json               ← config TypeScript
├── .eslintrc.js                ← reglas de linting
└── AGENTS.md                   ← instrucciones para asistentes de IA
```

---

## Guía para contribuir

### Agregar un nuevo color

1. Abrí `src/utils/colors.ts`
2. Agregá un objeto al array `COLOR_PALETTE`:
   ```ts
   { id: 'mint', color: '#00C9A7', label: 'Menta' },
   ```
3. Listo. El `ColorPicker` lo muestra automáticamente.

### Agregar un nuevo pincel

1. Abrí `src/utils/brushes.ts`
2. Agregá un objeto al array `BRUSHES`:
   ```ts
   {
     id: 'glitter',
     name: 'Glitter',
     emoji: '✨',
     strokeWidth: 6,
     opacity: 0.8,
     lineCap: 'round',
     lineJoin: 'round',
     isEraser: false,
   }
   ```
3. Si querés un efecto especial (ej. traza punteada), modificá `pointsToSvgPath()` para que acepte un parámetro de estilo y genere paths distintos.

### Agregar una nueva pantalla

1. Creá `app/settings.tsx`:
   ```tsx
   export default function SettingsScreen() {
     return <View><Text>Configuración</Text></View>;
   }
   ```
2. Para navegar hacia ella desde cualquier lugar:
   ```tsx
   import { router } from 'expo-router';
   router.push('/settings');
   ```

### Cambiar el fondo del canvas

En `DrawingScreen.tsx`, el `drawing.backgroundColor` es el color de fondo. Para agregar un selector, modificá `src/utils/colors.ts` → `CANVAS_BACKGROUNDS` y agregá un componente picker similar al de colores.

---

## Testing

```bash
npm test              # tests unitarios (Jest)
npm run type-check    # verifica tipos TypeScript sin compilar
npm run lint          # ESLint en src/
```

Ver `__tests__/` para ejemplos de tests. Los más útiles son los de `useDrawing.ts` y `svgPath.ts` porque son lógica pura fácil de testear.

---

## Build y deploy automático (GitHub Actions)

Los tres workflows en `.github/workflows/` se encargan de todo.

### PWA → GitHub Pages (automático en cada push a `main`)

El workflow `deploy-pages.yml` corre en cada push a `main`:

1. `npx expo export --platform web` genera `dist/`
2. Se sube a GitHub Pages vía `actions/deploy-pages`

**URL pública**: https://icarito.github.io/Rottapaint/

El base path se inyecta automáticamente con la variable de entorno `EXPO_PUBLIC_BASE_URL` y lo lee `app.config.js`. No necesitás configurar nada — funciona desde el primer push.

> Para activar Pages: ir a **Settings → Pages → Source → GitHub Actions** en el repositorio.

---

### iOS IPA (en tags `v*` o manualmente)

El workflow `build-ios.yml` usa Fastlane en un runner `macos-14` con Xcode 15.4.

**El job tiene un gate**: si `IOS_CERTIFICATE_BASE64` no está configurado como Secret, el workflow termina limpio con un `::notice::` — sin marcar fallo. Podés hacer push de tags mientras tanto sin rompernada.

#### Cómo habilitarlo

Agregá estos Secrets en **Settings → Secrets and variables → Actions**:

| Secret | Cómo obtenerlo |
|---|---|
| `IOS_CERTIFICATE_BASE64` | `base64 -i TuCertificado.p12` |
| `IOS_CERTIFICATE_PASSWORD` | Contraseña del .p12 |
| `IOS_PROVISIONING_PROFILE_BASE64` | `base64 -i TuProfile.mobileprovision` |
| `IOS_PROVISIONING_PROFILE_NAME` | Nombre del profile (sin extensión) |

El IPA queda como artefacto del workflow y, si el trigger fue un tag, se adjunta al Release de GitHub automáticamente.

> **Nota**: el workflow asume bundle id `com.rottapaint.app` (el de `app.json`). Si tu provisioning profile usa uno diferente, ajustá `IOS_BUNDLE_ID` en `build-ios.yml`.

---

### Android APK (en tags `v*` o manualmente)

El workflow `build-android.yml` regenera el proyecto nativo con `expo prebuild` y compila con Gradle.

**Sin Secrets de firma**: produce un APK de debug funcional, útil para testear.  
**Con Secrets de firma**: produce un APK de release listo para Play Store.

#### Secrets opcionales para APK firmado

| Secret | Descripción |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -i release.keystore` |
| `ANDROID_KEY_ALIAS` | Alias de la clave en el keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Contraseña del keystore |
| `ANDROID_KEY_PASSWORD` | Contraseña de la clave |

También podés disparar el workflow manualmente desde Actions y elegir `debug` o `release` en el input `build_type`.

---

### Build y deploy local (sin CI)

```bash
# Web / PWA
npm run build:web     # genera dist/
npm run serve:web     # sirve dist/ localmente

# iOS (requiere Mac + Xcode)
npx expo prebuild --platform ios
cd ios && pod install && cd ..
npx expo run:ios --configuration Release

# Android (requiere Android SDK)
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

---

## Notas pendientes

> Dos cosas honestas a tener en cuenta antes de publicar:

- **Íconos placeholder**: los assets en `assets/` son funcionales pero provisorios (círculo con una "R"). Reemplazalos con el diseño real antes de subir al App Store o de darle el link de la PWA a alguien. Specs:
  - `icon.png` — 1024×1024 px, sin transparencia, sin esquinas (Apple las agrega)
  - `adaptive-icon.png` — 1024×1024 px, con zona segura para Android
  - `splash.png` — 1284×2778 px recomendado
  - `favicon.png` — 64×64 px (para la PWA en browser)

- **Bundle ID de iOS**: el workflow de CI asume `com.rottapaint.app`. Si tu provisioning profile usa un bundle id diferente, cambiá la variable `IOS_BUNDLE_ID` en `.github/workflows/build-ios.yml` antes de agregar los Secrets.

---

## Checklist App Store

- [ ] Reemplazar íconos placeholder en `assets/`
- [ ] `bundleIdentifier` único en `app.json` → `com.tuempresa.rottapaint`
- [ ] Apple Developer Program ($99/año) en [developer.apple.com](https://developer.apple.com/programs/)
- [ ] App creada en [App Store Connect](https://appstoreconnect.apple.com)
- [ ] Agregar Secrets de iOS en el repo (ver tabla arriba)
- [ ] Crear un tag `v1.0.0` para disparar el build de CI
- [ ] Clasificación de edad: **4+**
- [ ] Capturas de pantalla: iPhone 6.9", iPad Pro 13"

---

## Tecnologías

| Biblioteca | Versión | Rol |
|---|---|---|
| `expo` | ~52 | SDK principal, herramientas de build |
| `expo-router` | ~4 | Navegación basada en archivos (como Next.js) |
| `react-native` | 0.76 | Framework UI nativo |
| `react-native-svg` | 15.8 | Rendering del canvas vectorial |
| `react-native-gesture-handler` | ~2.20 | Gestos táctiles nativos de alto rendimiento |
| `react-native-reanimated` | ~3.16 | Animaciones en el hilo nativo (60 fps) |
| `react-native-web` | ~0.19 | Compila RN a HTML/CSS para browser/PWA |
| `@react-native-async-storage` | 1.23 | Persistencia local (clave-valor) |
| `expo-haptics` | ~14 | Vibración táctil (iPhone/iPad) |
| `expo-media-library` | ~17 | Exportar dibujos a Fotos del dispositivo |
| `react-native-view-shot` | 3.8 | Captura del canvas como imagen PNG |

---

## Licencia

MIT © Rottapaint
