# 🎨 Rottapaint

Aplicación de dibujo infantil offline construida con **React Native + Expo**.  
Diseñada para iPad y iPhone, lista para el App Store.

---

## ✨ Características

- **Canvas de dibujo** con curvas de Bézier suaves
- **5 pinceles**: Lápiz, Marcador, Pincel, Crayón y Borrador
- **16 colores** en paleta vibrante pensada para niños
- **Gestos táctiles nativos** con PanResponder (soporte multi-touch iPad)
- **Deshacer / Rehacer** con historial completo
- **Guardar dibujos** localmente con AsyncStorage
- **Galería de dibujos** con miniaturas SVG
- **Interfaz amigable** — botones grandes, emojis, colores alegres
- **Soporte iPad** — layout adaptativo con más columnas en pantallas anchas
- **Exportar imagen** compartiendo el SVG del dibujo
- **Sin conexión** — 100 % offline first

---

## 🚀 Inicio rápido

### Prerrequisitos

- Node.js ≥ 18
- npm o yarn
- [Expo Go](https://expo.dev/client) en tu iPhone/iPad (para probar rápido)
- Xcode 15+ (para compilar a iOS nativo)

### Instalación

```bash
git clone https://github.com/icarito/rottapaint.git
cd rottapaint
npm install
npx expo start
```

Escaneá el QR con **Expo Go** en tu dispositivo, o presioná `i` para abrirlo en el Simulador de iOS.

---

## 📱 Compilar para iOS nativo (App Store)

### 1. Configurar EAS Build

```bash
npm install -g eas-cli
eas login
eas build:configure
```

### 2. Build de producción

```bash
# Build en la nube (recomendado, no requiere Mac)
eas build --platform ios --profile production

# Build local (requiere Xcode)
npx expo run:ios --configuration Release
```

### 3. Abrir en Xcode

```bash
npx expo prebuild --platform ios
open ios/rottapaint.xcworkspace
```

Configurar en Xcode:
- **Bundle Identifier**: `com.rottapaint.app`
- **Team**: Tu Apple Developer Team
- **Deployment Target**: iOS 16.0+
- Activar **Sign in with Apple** si se usa autenticación

### 4. Enviar al App Store

```bash
eas submit --platform ios
```

O desde Xcode: **Product → Archive → Distribute App → App Store Connect**

---

## 🌐 Exportar como PWA (opcional)

Expo soporta compilación web con Metro. Los archivos de `public/` incluyen el Service Worker y el Web Manifest para funcionalidad offline.

### Ejecutar en web

```bash
npx expo start --web
```

### Build estático para producción

```bash
npx expo export --platform web
# Los archivos quedan en dist/
```

### Desplegar como PWA

```bash
# Con Vercel
npx vercel dist/

# Con Netlify
npx netlify deploy --dir dist/ --prod

# Con cualquier servidor estático
npx serve dist/
```

### Registrar el Service Worker

El archivo `public/service-worker.js` provee cache offline. Para registrarlo, agregá en tu `app/index.tsx` (solo en web):

```ts
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}
```

---

## 🗂 Estructura del proyecto

```
rottapaint/
├── app/                    # Expo Router (entrada de navegación)
│   ├── _layout.tsx         # Root layout con GestureHandler + SafeArea
│   └── index.tsx           # Navegación Home ↔ Drawing
├── src/
│   ├── components/
│   │   ├── Canvas.tsx      # Canvas SVG con PanResponder
│   │   ├── ColorPicker.tsx # Selector de colores horizontal
│   │   ├── BrushPicker.tsx # Selector de pinceles
│   │   ├── Toolbar.tsx     # Barra superior (deshacer, guardar, volver)
│   │   ├── DrawingCard.tsx # Tarjeta de dibujo guardado
│   │   └── SaveModal.tsx   # Modal para nombrar dibujos
│   ├── hooks/
│   │   ├── useDrawing.ts   # Estado del canvas (reducer)
│   │   └── useStorage.ts   # CRUD con AsyncStorage
│   ├── screens/
│   │   ├── HomeScreen.tsx  # Galería de dibujos
│   │   └── DrawingScreen.tsx # Pantalla de dibujo
│   ├── types/index.ts      # Tipos TypeScript
│   └── utils/
│       ├── colors.ts       # Paleta de colores
│       ├── brushes.ts      # Configuración de pinceles
│       ├── svgPath.ts      # Conversión puntos → SVG path
│       └── storage.ts      # AsyncStorage helpers
├── public/
│   ├── manifest.json       # PWA Web App Manifest
│   └── service-worker.js   # Cache offline para PWA
├── app.json                # Configuración Expo
├── eas.json                # Configuración EAS Build
└── package.json
```

---

## 🎨 Personalización

### Agregar colores

Editá `src/utils/colors.ts` → array `COLOR_PALETTE`.

### Agregar pinceles

Editá `src/utils/brushes.ts` → array `BRUSHES`. Cada pincel tiene:
- `strokeWidth`: grosor
- `opacity`: transparencia (0–1)
- `lineCap`: `round | square | butt`
- `lineJoin`: `round | miter | bevel`

### Cambiar fondo del canvas

Modificá `DEFAULT_BACKGROUND` en `src/utils/colors.ts` o agregá un selector de fondo en `DrawingScreen`.

---

## 🛠 Tecnologías

| Biblioteca | Propósito |
|---|---|
| Expo 52 | SDK y herramientas de build |
| Expo Router 4 | Navegación basada en archivos |
| react-native-svg | Rendering del canvas vectorial |
| react-native-gesture-handler | Gestos táctiles nativos |
| react-native-reanimated | Animaciones 60 fps |
| @react-native-async-storage | Persistencia local |
| expo-haptics | Retroalimentación táctil |
| expo-media-library | Exportar a Fotos |
| TypeScript | Tipos estáticos |

---

## 📋 Checklist App Store

- [ ] Agregar ícono en `assets/icon.png` (1024×1024 px, sin transparencia)
- [ ] Agregar splash en `assets/splash.png`
- [ ] Configurar `bundleIdentifier` en `app.json`
- [ ] Registrarse en [Apple Developer Program](https://developer.apple.com/programs/) ($99/año)
- [ ] Crear el app en App Store Connect
- [ ] Completar `eas.json` con `appleId`, `ascAppId`, `appleTeamId`
- [ ] Hacer build con `eas build --platform ios --profile production`
- [ ] Hacer submit con `eas submit --platform ios`
- [ ] Completar metadata en App Store Connect (capturas, descripción, categoría "Education")
- [ ] Clasificación de edad: **4+** (sin contenido inapropiado)

---

## 📄 Licencia

MIT © Rottapaint
