# Current Sprint: Data Ingestion (Sprint 1)

## Status: Active
**Objective**: Build valid data pipeline from Binance to Frontend State.

## Implemented Components
### 1. Global State (`store/useMarketStore.ts`)
- **Library**: Zustand
- **Structure**: `Map<string, TickerData>` for O(1) lookups.
- **Actions**: `updateBatch` handles massive array updates efficiently.

### 2. Throttling Buffer (`lib/buffer.ts`)
- **Class**: `DataBuffer`
- **Logic**: 
  - Accumulates incoming WebSocket frames.
  - Flushes only once every `500ms`.
  - Deduplicates symbols (last write wins).

### 3. WebSocket Hook (`hooks/useBinanceStream.ts`)
- **Source**: `wss://stream.binance.com:9443/ws/!ticker@arr`
- **Filtering Rules**:
  - `quoteVolume` >= 1,000,000 (1M USDT)
  - `symbol` ends with "USDT"
- **Resilience**: Auto-reconnects after 3s on disconnect.

## Next Steps
- Implement `LiquidityNebula` visualization component.
- Connect valid state to PixiJS renderer.

## Optimization Phase (Sprint 1.5)
### 1. Transient Updates (Ref Pattern)
- **Problem**: `useState` caused re-renders on every tick.
- **Solution**: `useBinanceStream` writes to a mutable `streamStore`.
- **Canvas**: `NebulaCanvas` reads `streamStore` inside the Pixi ticker loop (60 FPS).
- **Result**: Zero React re-renders for socket data.

### 2. Timeframe Manager (`lib/TimeframeManager.ts`)
- **Logic**: Fetches historical `Open Price` for 1h/4h calculation.
- **Cache**: 1-hour TTL for base prices.
- **Integration**: Hook uses manager to calculate dynamic %.
