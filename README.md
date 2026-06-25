# Odisea Dashboard

Telemetry dashboard for the Odisea game, built with React Native + Expo.
The v1 web investigation charts render with `react-native-svg` so production
does not depend on CanvasKit/WASM availability.

## Quick Start

```bash
npm install
npm run dev          # web development
npm run dev:native   # Expo Go on device
```

## Build

```bash
npm run build:web    # static export to dist/
npm run type-check   # TypeScript validation
npm test             # unit tests
```

## Deploy

The static export (`dist/`) is served by `odisea_central.py` at the root path.

Set `CENTRAL_STATIC_DIR` to the `dist/` directory, or copy it to the default `./dashboard/dist`.
