# AGENTS.md — Odisea Dashboard

Este documento describe como trabajar en el dashboard de telemetria de Odisea.

## Arquitectura

```
app/           → Expo Router (file-based routing)
  (tabs)/      → Bottom tab navigator (Inbox, Investigate, Heatmap, Globe)
  investigation/[id].tsx → SVG detail screen
  auth.tsx     → Auth modal
src/
  types/       → Domain types (IncidentGroup, SessionSample, etc.)
  api/         → API client for odisea_central.py endpoints
  hooks/       → Reusable hooks
  components/  → Reusable UI components
  utils/       → Pure functions
```

## Stack

- Expo SDK 52 + Expo Router v4
- react-native-svg for timeline/map rendering on web and native
- React Native Gesture Handler + Reanimated
- AsyncStorage for token/settings cache

## Backend

The backend is `odisea_central.py` in the main Odisea game repo. It serves:
- `GET /incidents?status=&type=&scene=&limit=`
- `GET /incidents/{id}`
- `POST /incidents/{id}/status`
- `GET /incidents/{id}/samples`
- `GET /ghosts?player_id=&session_id=`
- `GET /ghosts/heatmap?scene=`
- `GET /api/geo-players`
- `GET /scenes`

## Rules

- TypeScript strict mode is on. No `any`.
- All API calls go through `src/api/client.ts`.
- Token is stored in AsyncStorage under `@odisea:auth_token`.
- SVG chart dimensions must be declared explicitly (not %).
- Dark theme only: `#0A0E14` background, `#131822` cards, `#1E2A3A` borders.
