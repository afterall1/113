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
- **SWR / React Query**: Recommended for caching (TBD)
- **WebSocket**: Native browser WebSocket API
- **Constraint**: `useState` forbidden for socket streams. Use `Ref` + `Subscribers`.
