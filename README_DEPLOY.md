# Liquidity Nebula - Deployment Guide

## Overview
Liquidity Nebula is a high-performance Client-Side WebGL application. Since it relies heavily on client-side WebSockets and PixiJS, deployment is straightforward but requires specific configuration for optimal performance.

## Host Recommendations
- **Vercel** (Recommended for Next.js)
- **Netlify**
- **Cloudflare Pages**

## Environment Variables
Currently, the application runs purely client-side without secret backend keys.
No `.env` is required for the build.

## Build Commands
- **Framework**: Next.js
- **Build Command**: `next build` (or `npm run build`)
- **Output Directory**: `.next`

## Performance Tuning
1. **Headers**: Ensure your host serves assets with `Cache-Control: public, max-age=31536000, immutable`.
2. **Region**: Deploy closest to your users, though WebSocket latency depends on user -> Binance, not user -> Vercel.

## Known Constraints
- **CORS**: This app connects directly to `stream.binance.com`. If you enable strict CSP, ensure `wss://stream.binance.com:9443` is allowed.
- **Mobile**: Optimised for Landscape. Portrait mode might feel crowded.

## Checklist Before Live
- [x] `app/layout.tsx` Metadata updated.
- [x] ErrorBoundary active.
- [x] Console logs cleaned (mostly).
- [x] Audio Context verifies user interaction.
