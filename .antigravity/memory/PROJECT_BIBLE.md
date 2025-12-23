# Project Bible
...

# Liquidity Nebula Project Bible
> [!IMPORTANT]
> **Status**: v1.0.0 RELEASE CANDIDATE
> **Date**: 2025-12-18

## 1. Core Logic
- **Dynamic Percent Change**: The application must calculate percentage changes dynamically based on user selection (e.g., 1m, 5m, 15m, 1h, 4h, 1d). The visualization should update instantly to reflect the selected volatility timeframe.
- **On-Demand Data Pattern (NEW)**: Detailed fundamental data (FDV, Unlocks, Tags) is NOT streamed. It is fetched asynchronously via `SWR` only when a user selects an orb (Lazy Loading).

## 2. Visual Language
- **Theme**: Dark Mode ONLY. No light mode support.
- **Spatial Layout**:
  - **Top Hemisphere (Gainers)**: Green/Teal hues. Vertical positioning = magnitude.
  - **Center (Neutral)**: Stable orbit elements.
  - **Bottom Hemisphere (Losers)**: Red/Orange hues.
  - **Interaction Layer (HUD)**: Detailed data MUST appear as a centralized, floating holographic window ("Aerogel Glass"). Do not use sidebars for primary asset details.
- **Aesthetic**: Nebula/Space theme. Glowing elements, bloom effects, smooth physics.
- **Animation Standard**: Elements should "snap" or "materialize" (Scale/Fade) rather than slide.
- **Token Unlock Spectrum (Stacked Bar)**:
  - **Core Team**: Orange (`#F97316`)
  - **Investors**: Purple (`#A855F7`)
  - **Ecosystem**: Teal (`#14B8A6`)
  - **Community**: Green (`#22C55E`)
  - **Treasury**: Blue (`#3B82F6`)

## 3. Data Structure
The application will strictly adhere to the following TypeScript interface for market data:

```typescript
interface TickerData {
  symbol: string;             // e.g., "BTCUSDT"
  price: number;              // Current price
  volume: number;             // 24h Volume or selected timeframe volume
  priceChangePercent: number; // Dynamic based on timeframe
  timeFrame: string;          // e.g., "1m", "15m", "1h"
}
// High-Frequency Stream Data
interface TickerData {
  symbol: string;
  price: number;
  volume: number;
  priceChangePercent: number;
  timeFrame: string;
}

// Low-Frequency On-Demand Data
interface TokenMetadata {
  marketCap: number;
  fdv: number;
  circulatingSupply: number;
  maxSupply: number;
  nextUnlock: {
    date: string;
    amount: number;
    valueUSD: number;
    percentOfSupply: number;
    allocations: Array<{ category: string; percent: number }>;
  };
  tags: string[];
  chains: string[];
}
```

## 4. Architecture Standards
- **Transient Update Pattern**: For high-frequency data (WebSocket > 10Hz), DO NOT use React State (`useState`) to drive the render loop.
  - **Storage**: Use `Mutable Ref` or `Map` outside React Cycle.
  - **Rendering**: Read directly from storage in `requestAnimationFrame` or `PixiTicker`.
  - **State**: Only use `Zustand/Context` for low-frequency UI updates (Selection, filtering).

## 5. Feature Specification: The Squadron (Watchlist)
> **Status**: Active since v1.1
> **Purpose**: Allows users to track specific assets in a dedicated panel.

- **Data Persistence**:
  - The watchlist is stored in `localStorage` via Zustand Persist Middleware.
  - Key: `nebula-storage`.
  - Behavior: Data must survive browser refresh.

- **Visual Logic (Overrides Section 2)**:
  - **Favorite Status**: Coins in the watchlist MUST be visually distinct.
  - **Color Rule**: Favorites render with a **Gold/Amber tint** (`0xFFD700`) regardless of price action.
  - **Z-Index**: Favorites must act as "Flagships", floating visibly *above* standard market noise.

- **UI Components**:
  - **Command Deck**: A collapsible sidebar on the left.
  - **Interaction**: Adding a coin adds it to the store AND highlights the corresponding orb in WebGL.