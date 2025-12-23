# SYSTEM UPDATE: High-DPI "Vector-Hard" Rendering Profile
> **Date**: 2025-12-23
> **Topic**: WebGL Render Sharpness & Pixel Alignment
> **Status**: APPLIED (Production)

## 1. Executive Summary
This document details the architectural overhaul of the `NebulaCanvas` rendering pipeline. The objective was to eliminate persistent "haze" and "blur" artifacts observed on High-DPI (Retina) displays. The solution evolved from simple super-sampling to a strict "Vector-Hard" profile that prioritizes integer-coordinate alignment and hard-edge assets over soft additive blending.

## 2. Problem Analysis
The initial "Nebula" aesthetic relied on:
1.  **Additive Blending**: Glowing orbs overlapping.
2.  **Soft Gradients**: 128px textures with long falloff.
3.  **Sub-pixel Positioning**: Fluid physics using floating-point coordinates.

**The Flaw**: On High-DPI screens, downscaling these soft, additive textures created a "muddy" or "foggy" appearance. The accumulation of anti-aliased edges and sub-pixel interpolation resulted in a loss of definition.

## 3. The Solution: "Vector-Hard" Profile
We shifted the paradigm from "Glowing Light" to "Solid Vector Disc".

### 3.1. Texture Architecture (`NebulaCanvas.tsx`)
We replaced the soft radial gradient with a Super-Sampled Hard-Edge Disc.

-   **Resolution**: Increased from 128px → **512px** (4x Super-Sampling).
-   **Gradient Profile**:
    -   `0.0 -> 0.98`: **Pure White (`#FFFFFF`) @ 100% Opacity**.
    -   `0.98 -> 1.0`: Transparent.
    -   *Result*: A crisp, aliasing-resistant disc that behaves like SVG.
-   **Config**:
    -   `scaleMode: 'linear'`: Smooth downscaling.
    -   `autoGenerateMipmaps: false`: **CRITICAL**. Disabling mipmaps forces the GPU to sample from the high-res 512px source even at small sizes, preventing "mipmap blur".

### 3.2. Rendering Pipeline (`NebulaCanvas.tsx`)
PixiJS initialization was tuned for 1:1 pixel mapping.

```typescript
await app.init({
    resizeTo: window,
    backgroundColor: 0x050505,
    antialias: true,
    resolution: window.devicePixelRatio || 1, // Retina Density
    autoDensity: true,  // Sync CSS pixels to Device pixels
    preference: 'webgl',
    roundPixels: true   // <--- THE NUCLEAR OPTION
});
```

-   **`roundPixels: true`**: Forces PixiJS to floor/ceil all coordinate values to integers during the render pass. This eliminates **sub-pixel interpolation blur**, ensuring every orb snaps to the pixel grid.

### 3.3. Material Logic (`CoinOrb.ts`)
-   **Blend Mode**: Switched from `ADD` to `NORMAL` (Standard Alpha Blending).
    -   *Why*: Additive blending accumulates alpha channels, creating a "haze" when many items overlap. Normal blending preserves the sharp edges of the top-most orbs.
-   **Scale Compensation**:
    -   Since texture grew 4x (128->512), we apply a **0.25x** correction factor to all scale calculations to maintain the original visual size relative to the screen.

## 4. Implementation Snapshot

### Texture Generation
```typescript
// components/NebulaCanvas.tsx
const createOrbTexture = (): PIXI.Texture => {
    const size = 512; // High-Res
    const center = 256;
    const radius = 240; 
    
    // Hard-Edge Gradient
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
    gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)'); 
    gradient.addColorStop(0.98, 'rgba(255, 255, 255, 1)'); // Solid Core
    gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0)');  // Cut

    const texture = PIXI.Texture.from(canvas);
    texture.source.scaleMode = 'linear';
    texture.source.autoGenerateMipmaps = false; // No blur
    return texture;
};
```

## 5. Neural Handover Protocols
If future modification is required:
1.  **Do NOT re-enable Mipmaps**. They destroy detail at small scales for this specific high-contrast aesthetic.
2.  **Do NOT remove `roundPixels`**. Without it, slow-moving orbs will "shimmer" or blur as they traverse sub-pixel coordinates.
3.  **Maintain 512px Source**. Do not lower resolution; modern GPUs handle this mostly-transparent texture easily.

**Signed**: Lead Architect (Antigravity)
