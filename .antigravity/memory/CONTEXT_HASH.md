# CONTEXT HASH
> **Hash**: `MVP-V1.6-TOKEN-METADATA-PROXY`
> **Timestamp**: 2024-12-25 (Token Metadata Session)
> **Status**: STABLE

## MVP Features
- [x] **Core Codex**: Project Bible & Tech Stack established.
- [x] **Visualization**: PixiJS Nebula Canvas with dynamic CoinOrbs (Vector-Hard Profile).
- [x] **Squadron Protocol**: Watchlist & Favorites logic.
- [x] **Holographic HUD**: Centralized Detail Window ("Aerogel" Glass).
- [x] **Chart Infrastructure**: MiniChart with Proxy & Premium UI.
- [x] **Market Intelligence**: Derivatives metrics (OI, L/S Ratios) with MetricChart.
- [x] **Spot/Margin Data**: Dual-market tab switcher with Spot metrics grid.
- [x] **Token Metadata Proxy**: Real-time CMC/CoinGecko/DeFiLlama data integration.


## Next Phase
- **Token Unlock Coverage**: Expand static JSON to 100+ coins for comprehensive unlock data.
- **Charts**: Add real Sparkline/Candle charts to DetailDrawer.
- **Mobile**: Touch gesture optimization.

### [Sprint Kilo: Holographic HUD]
- **Date**: 2025-12-23
- **Feature Added**: UI Overhaul (Drawer -> Central Modal).
- **Visual**: "Aerogel" glass texture, "Quantum Snap" animation, Top-glow borders.
- **Mobile**: Implemented Bottom-Sheet logic for smaller screens.
- **Status**: Production Ready.

### [Sprint Delta: Fundamental Intelligence]
- **Date**: 2025-12-23
- **Feature Added**: DetailDrawer Enrichment.
- **Architecture Change**: Integrated `SWR` for metadata fetching.
- **Visual Update**: Implemented "Token Unlock Stacked Bar" with semantic color coding.
- **New Service**: `lib/services/tokenMetadata.ts` (Mock).
- **Status**: Production Ready.

### [Sprint Echo: Hover Interaction Infrastructure]
- **Date**: 2025-12-23
- **Feature Added**: Hover state propagation from WebGL to Zustand.
- **Store Change**: Added `hoveredTicker` state and `setHoveredTicker` action.
- **CoinOrb Enhancement**: Added `bindHover(onHover, onHoverOut)` method with callback refs.
- **Canvas Integration**: Connected hover callbacks during orb creation.
- **Status**: Production Ready.

### [Sprint Foxtrot: Targeting System UI]
- **Date**: 2025-12-23
- **Feature Added**: Cursor-following hover card with "Targeting Reticle" design.
- **New Component**: `components/TargetingSystem.tsx`.
- **Visual Elements**: Frosted glass, corner brackets, scan line animation, pulsing indicator.
- **Page Integration**: Added after NebulaCanvas in `app/page.tsx`.
- **Status**: Production Ready.

### [Sprint Golf: UX Polish]
- **Date**: 2025-12-23
- **Z-Index Fix**: Lowered TargetingSystem to z-20 (below DetailDrawer z-30/40).
- **Performance**: Optimized cursor tracking with `requestAnimationFrame` + CSS `transform`.
- **Visual**: Added enhanced glow effect with dual shadow layers.
- **Status**: Production Ready.

### [Sprint Hotel: Stellar Plasma Texture]
- **Date**: 2025-12-23
- **Visual Upgrade**: Replaced PIXI.Graphics orbs with Canvas 2D radial gradient texture.
- **Resolution**: Increased from 96px to 128px for smoother appearance.
- **Gradient**: 4-stop radial (bright core → transparent edge) for glowing gas ball effect.
- **Status**: Production Ready.

### [Sprint India: Breathing Effect]
- **Date**: 2025-12-23
- **Animation**: Added sine-wave pulse animation to orbs (±10% scale).
- **Properties**: `pulseOffset` (random phase), `pulseSpeed` (0.02-0.05).
- **Behavior**: Disabled during hover to avoid scale conflicts.
- **Status**: Production Ready.

### [Sprint Juliet: Blend Mode Polish]
- **Date**: 2025-12-23
- **Blend Mode**: Added `blendMode = 'add'` for nebula glow when orbs overlap.
- **Alpha**: Set base alpha to 0.9 for smoother blending.
- **Status**: Production Ready.

### [Sprint Lima: Market Intelligence System]
- **Date**: 2024-12-24
- **Feature Added**: Derivatives metrics visualization in DetailDrawer.
- **New Files**:
  - `app/api/binance/metrics/route.ts` (Backend proxy with period mapping)
  - `components/MetricChart.tsx` (Histogram/Line charts for OI, L/S ratios)
- **Type Additions**: `MetricType`, `OpenInterestData`, `LongShortRatioData`, `TakerBuySellData` in `lib/types.ts`.
- **DetailDrawer Changes**:
  - Expanded to `max-w-[1400px]`
  - Added "MARKET INTELLIGENCE" section with gradient header
  - 5 MetricCharts: OI (full width), Global L/S, Taker B/S, Top Accounts, Top Positions
- **CSS Fixes**: `min-w-0 overflow-hidden` on grid items to prevent canvas overflow.
- **Documentation**: Complete prompt set in `updates/2024-12-24_market-intelligence-system/`.
- **Status**: Production Ready.

### [Sprint Lima: Market Intelligence System]
- **Date**: 2024-12-24
- **Feature Added**: Full Derivatives Data Integration.
- **Backend**: Created `/api/binance/metrics` proxy with server-side caching (60s).
- **Frontend**: Implemented `MetricChart` component with `lightweight-charts` v5.
- **UI Overhaul**: Expanded `DetailDrawer` to `max-w-[1400px]` (Wide Cockpit).
- **CSS Logic**: Enforced `min-w-0` on all Grid items to prevent Canvas overflow.
- **Visuals**: Added specific color coding for OI (Purple), Global Ratio (Teal), Top Traders (Blue/Orange).
- **Status**: Production Ready.

### [Sprint Mike: Spot/Margin Data Integration]
- **Date**: 2024-12-25
- **Feature Added**: Dual-market tab switcher in DetailDrawer (Futures/Spot).
- **Backend Extension**:
  - Split `METRIC_ENDPOINTS` into `FUTURES_ENDPOINTS` and `SPOT_ENDPOINTS`.
  - Added `marketType` parameter to `/api/binance/metrics` proxy.
  - Created `transformTickerToTimeSeries()` for 24hr ticker → time series.
  - Created `transformKlinesToDebtGrowth()` for klines → debt proxy.
- **Type Additions**:
  - `MarketType` union (`'futures' | 'spot'`).
  - Extended `MetricType` with: `'24hrLargeInflow'`, `'marginDebtGrowth'`, `'isoMarginBorrowRatio'`, `'platformConcentration'`, `'marginLongShortRatio'`, `'moneyFlow'`.
  - New interfaces: `MoneyFlowData`, `MarginDebtData`, `IsoMarginBorrowData`, `MarginLongShortData`.
- **MetricChart Updates**:
  - Added `marketType` prop.
  - Updated SWR URL to include `marketType` parameter.
  - Extended `transformData()` with Spot metric cases.
  - Added Spot metric labels and formatting.
- **DetailDrawer Changes**:
  - Added `marketDataType` state (`'futures' | 'spot'`).
  - Implemented Liquid Metal segmented control (Teal glow active).
  - Quantum Fade animation (`slide-in-from-bottom-3 duration-500`).
  - Spot Grid: 6 MetricCharts (Money Flow, 24h Inflow, Margin Debt, Margin L/S, ISO Borrow, Taker B/S).
- **Strategic Replacement**: `platformConcentration` → `takerBuySell` (no public API for Platform Concentration).
- **Bug Fix**: Removed double division in MetricChart for Spot metrics (data was already normalized).
- **Status**: Production Ready.

### [Sprint November: Token Metadata Proxy System]
- **Date**: 2024-12-25
- **Feature Added**: Real-time token metadata fetching with multi-source fallback.
- **New Files**:
  - [app/api/token/metadata/route.ts](cci:7://file:///c:/Users/PC15/Desktop/Projelerim/futures_tracker_v0.3/app/api/token/metadata/route.ts:0:0-0:0) (877 lines - CMC/CoinGecko/DeFiLlama proxy)
  - [lib/data/tokenUnlocks.json](cci:7://file:///c:/Users/PC15/Desktop/Projelerim/futures_tracker_v0.3/lib/data/tokenUnlocks.json:0:0-0:0) (836 lines - Curated unlock schedules for 35+ coins)
- **Backend Architecture**:
  - CMC Deep State Extraction (Hydration Hijacking via `__NEXT_DATA__` regex)
  - CoinGecko API fallback with dynamic `/search` for unknown symbols
  - DeFiLlama unlock scraping via HTML parsing
  - Static JSON fallback for curated unlock data
  - Recursive [findKey()](cci:1://file:///c:/Users/PC15/Desktop/Projelerim/futures_tracker_v0.3/app/api/token/metadata/route.ts:164:0-196:1) hunter function for structure-agnostic JSON parsing
- **Symbol Mappings**:
  - 155+ CMC slug mappings
  - 40+ CoinGecko ID mappings
  - 35+ DeFiLlama protocol mappings
- **Service Rewrite**:
  - [lib/services/tokenMetadata.ts](cci:7://file:///c:/Users/PC15/Desktop/Projelerim/futures_tracker_v0.3/lib/services/tokenMetadata.ts:0:0-0:0) reduced from 314 → 86 lines
  - Removed all mock data (`MOCK_TOKEN_DATA`, `generateAllocations()`, `generateGenericMetadata()`)
  - Clean proxy call with minimal network-error fallback
- **Debugging Sessions**:
  - PIPPIN: Added CoinGecko dynamic search fallback
  - GUNZ: Added to static JSON with curated unlock data
  - MOVE: Expanded CMC hunter keys + added DeFiLlama scraping
- **Status**: Production Ready.

### [Sprint Oscar: Twin-Core Bridge Protocol]
- **Date**: 2025-12-27
- **Hash**: `BRIDGE-V1.0-PROVIDER-READY`
- **Module**: Twin-Core Architecture Preparation
- **Feature Added**: API Export Protocol for external consumption.
- **New Files**:
  - `.antigravity/memory/API_EXPORT_PROTOCOL.md` (Nebula Data Bridge v1.0 specification)
- **Architecture Change**: Mevcut uygulama, harici Backtest uygulaması (Nebula Forge) için Veri Sağlayıcı (Data Provider) rolüne uyarlandı.
- **Endpoints Documented**:
  - `GET /api/binance/metrics` (Futures + Spot metrics)
  - `GET /api/token/metadata` (CMC/CoinGecko/DeFiLlama proxy)
  - `GET /api/binance/klines` (OHLC candlestick data)
- **Integration Rules**: Server-side ve SWR tüketim kalıpları, `lib/types.ts` uyumluluğu tanımlandı.
- **Status**: Production Ready.