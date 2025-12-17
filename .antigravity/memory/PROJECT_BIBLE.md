# Liquidity Nebula Project Bible
> [!IMPORTANT]
> **Status**: v1.0.0 RELEASE CANDIDATE
> **Date**: 2025-12-18

## 1. Core Logic
- **Dynamic Percent Change**: The application must calculate percentage changes dynamically based on user selection (e.g., 1m, 5m, 15m, 1h, 4h, 1d). The visualization should update instantly to reflect the selected volatility timeframe.

## 2. Visual Language
- **Theme**: Dark Mode ONLY. No light mode support.
- **Spatial Layout**:
  - **Top Hemisphere (Gainers)**: Green/Teal hues. Use vertical positioning to indicate magnitude of gain.
  - **Center (Neutral)**: Elements with little to no change (~0%). Stable orbit.
  - **Bottom Hemisphere (Losers)**: Red/Orange hues. Vertical positioning indicates magnitude of loss.
- **Aesthetic**: Nebula/Space theme. Glowing elements, bloom effects, smooth physics-based movement.

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
```

## 4. Architecture Standards
- **Transient Update Pattern**: For high-frequency data (WebSocket > 10Hz), DO NOT use React State (`useState`) to drive the render loop.
  - **Storage**: Use `Mutable Ref` or `Map` outside React Cycle.
  - **Rendering**: Read directly from storage in `requestAnimationFrame` or `PixiTicker`.
  - **State**: Only use `Zustand/Context` for low-frequency UI updates (Selection, filtering).
