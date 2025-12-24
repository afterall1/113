# Tech Stack Lock
...

# TECH STACK LOCK
This document locks the core technology versions for the Liquidity Nebula project to ensure consistency.

## Frontend Core
- **Next.js**: 16.0.10
- **React**: 19.2.1
- **TypeScript**: ^5 (Latest Stable)

## Styling
- **Tailwind CSS**: v4 (PostCSS)

## Visualization (WebGL)
- **PixiJS**: Latest Stable (v8+)
- **@pixi/react**: Latest Stable (Compatible with React 19)

## State & Data
- **SWR**: LOCKED. Mandatory for all client-side async data fetching (REST API calls).
- **WebSocket**: Native browser WebSocket API (strictly for price/volume stream).
- **Constraint**:
  - High Frequency (>1Hz) -> WebSocket + Mutable Ref.
  - Low Frequency (User Interaction) -> SWR + React State.

## Charts
- **lightweight-charts**: v5.0+ (Latest Stable)
  - **Constraint**: MUST use `addSeries(LineSeries, options)` syntax.
  - **Deprecated**: DO NOT use `addLineSeries()` (v4 syntax).
  - **Performance**: Charts inside Grids must use `ResizeObserver` with `min-w-0` CSS parent.