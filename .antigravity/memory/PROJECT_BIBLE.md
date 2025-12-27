# Project Bible
...

# Liquidity Nebula Project Bible
> [!IMPORTANT]
> **Status**: v1.3.0 BRIDGE-V1.0-PROVIDER-READY
> **Date**: 2025-12-27

## 1. Core Logic
- **Dynamic Percent Change**: The application must calculate percentage changes dynamically based on user selection (e.g., 1m, 5m, 15m, 1h, 4h, 1d). The visualization should update instantly to reflect the selected volatility timeframe.

- **Market Intelligence Proxy**:
  - Direct browser calls to Binance Futures API are FORBIDDEN due to CORS.
  - MUST use `/api/binance/metrics`.
  - **Period Validation**: This API only accepts `5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d`. All other timeframes (e.g., 1m, 3d, 1w) MUST be mapped to the nearest valid period server-side.
  - **Market Type Routing**: The proxy accepts `marketType` parameter (`futures` or `spot`). Default is `futures`. Spot endpoints use different Binance APIs or Futures fallbacks where no Spot equivalent exists.

- **On-Demand Data Pattern (NEW)**: Detailed fundamental data (FDV, Unlocks, Tags) is NOT streamed. It is fetched asynchronously via `SWR` only when a user selects an orb (Lazy Loading).

- **Token Metadata Proxy Architecture (NEW)**:
  - Direct browser calls to CoinMarketCap/CoinGecko are FORBIDDEN.
  - MUST use `/api/token/metadata?symbol={SYMBOL}`.
  - **Data Strategy**:
    1. CMC Deep State Extraction (HTML → `__NEXT_DATA__` → recursive key hunting)
    2. CoinGecko API fallback (with dynamic search for unknown symbols)
    3. Safe empty response (never crashes UI)
  - **Unlock Data Strategy**:
    1. DeFiLlama HTML scraping (`/unlocks/{protocol}`)
    2. Static JSON fallback ([lib/data/tokenUnlocks.json](cci:7://file:///c:/Users/PC15/Desktop/Projelerim/futures_tracker_v0.3/lib/data/tokenUnlocks.json:0:0-0:0))
    3. "N/A" for unmapped coins (no fake data generation)

- **Klines Proxy Architecture**:
  - Direct browser calls to Binance Klines API are FORBIDDEN.
  - MUST use `/api/binance/klines?symbol={SYMBOL}&interval={INTERVAL}&limit={LIMIT}`.
  - **Supported Intervals**: `1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M`
  - **Response**: `CandleData[]` (time as Unix seconds, OHLC values)
  - **Cache**: No cache (`revalidate: 0`) - Fresh data priority.
  - **Max Limit**: 1500 candles per request.


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

- **Metric Color Coding (Market Intelligence)**:
  - **Open Interest**: Purple (`#a855f7`) - Represents market depth/heat.
  - **Global Long/Short**: Teal (`#14b8a6`) - Matches the "Gainers" logic.
  - **Top Traders (Accounts)**: Blue (`#3b82f6`) - Institutional view.
  - **Top Traders (Positions)**: Orange (`#f97316`) - Smart money view.
  - **Taker Buy/Sell**: Green (`#22c55e`) - Aggressive flow.

- **Spot/Margin Metric Color Coding**:
  - **Money Flow**: Gold (`#F59E0B`) - Capital movement indicator.
  - **24h Large Inflow**: Emerald (`#10B981`) - Whale activity.
  - **Margin Debt Growth**: Red (`#EF4444`) - Leverage risk signal.
  - **Margin Long/Short**: Blue (`#3B82F6`) - Spot market sentiment.
  - **ISO Margin Borrow**: Purple (`#8B5CF6`) - Isolated position risk.
  - **Taker Buy/Sell (Spot)**: Green (`#22C55E`) - Active market flow.

- **Wide Cockpit Layout (DetailDrawer)**:
  - **Width Constraints**: Max width extends to `1400px` (or `90vw`).
  - **Grid Discipline**: All Grid Items containing Charts MUST have `min-w-0` and `overflow-hidden` to prevent Canvas blow-out.
  - **Hierarchy**:
    1. Header (Symbol/Price)
    2. Price Chart (Main Context)
    3. Market Intelligence Section:
       - Tab Switcher (Futures/Spot) - Liquid Metal Segmented Control
       - Futures Grid: OI (Full Width), Ratios (2 Columns)
       - Spot Grid: Money Flow (Full Width), Metrics (2x2 Grid), Taker B/S (Full Width)


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
  description: string; // First sentence from CMC/CoinGecko
}


// Market Intelligence Metrics
type MetricType = 
  | 'openInterest' 
  | 'topLongShortAccounts' 
  | 'topLongShortPositions' 
  | 'globalLongShort' 
  | 'takerBuySell'
  | 'basis'
  | 'fundingRate'           // <-- YENİ EKLENEN
  // Spot/Margin Metrics
  | '24hrLargeInflow'
  | 'marginDebtGrowth'
  | 'isoMarginBorrowRatio'
  | 'platformConcentration'
  | 'marginLongShortRatio'
  | 'moneyFlow';

type MarketType = 'futures' | 'spot';

interface MetricDataPoint {
  timestamp: number;
  value: number; // Normalized value (e.g., Ratio or OI in USD)
}

// API Response Structures
interface OpenInterestData {
  symbol: string;
  sumOpenInterest: string;      // Contracts
  sumOpenInterestValue: string; // USD Value
  timestamp: number;
}

interface LongShortRatioData {
  symbol: string;
  longShortRatio: string;
  timestamp: number;
}

// Spot/Margin Data Structures
interface MoneyFlowData {
  asset: string;
  timestamp: number;
  netInflow: string;
  largeInflow: string;
  largeOutflow: string;
}

interface MarginDebtData {
  asset: string;
  timestamp: number;
  debtSize: string;
  debtGrowthRate: string;
}

interface IsoMarginBorrowData {
  symbol: string;
  timestamp: number;
  borrowRatio: string;
}

interface MarginLongShortData {
  symbol: string;
  timestamp: number;
  longShortRatio: string;
  longPosition: string;
  shortPosition: string;

// OHLC Candlestick Data (Klines API Response)
interface CandleData {
  time: string | number;  // Unix timestamp (seconds) or YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
}

// Taker Buy/Sell Volume Ratio
interface TakerBuySellData {
  buySellRatio: string;
  buyVol: string;
  sellVol: string;
  timestamp: number;
}

// Funding Rate Data (Perpetual Futures)
interface FundingRateData {
  symbol: string;
  fundingRate: string;   // e.g., "0.0001" (0.01%)
  fundingTime: number;   // Unix timestamp (ms) of next funding
}
}

```

## 4. Architecture Standards
- **Transient Update Pattern**: For high-frequency data (WebSocket > 10Hz), DO NOT use React State (`useState`) to drive the render loop.
  - **Storage**: Use `Mutable Ref` or `Map` outside React Cycle.
  - **Rendering**: Read directly from storage in `requestAnimationFrame` or `PixiTicker`.
  - **State**: Only use `Zustand/Context` for low-frequency UI updates (Selection, filtering).
  
- **Proxy-First Data Fetching**:
  - ALL external API calls MUST go through Next.js API routes.
  - Client-side direct API calls to CMC, CoinGecko, DeFiLlama, Binance are FORBIDDEN.
  - Reason: CORS, rate limiting, error handling centralization.
  - Pattern: `Frontend → /api/* → External API → Cache (5-10 min) → Response`

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


## 6. API Export Protocol (Nebula Data Bridge v1.0)
> **Status**: Active since v1.3.0
> **Purpose**: Enable external applications (e.g., Backtest & Anomaly Detection Engine) to consume market data from Liquidity Nebula.

### Base URL
| Environment | URL |
|-------------|-----|
| **Development** | `http://localhost:3000` |
| **Production** | `https://[DEPLOYMENT_DOMAIN]` |

### Exported Endpoints

| Endpoint | Parameters | Response | Cache |
|----------|------------|----------|-------|
| `GET /api/binance/metrics` | `symbol`, `metric`, `period`, `marketType`, `limit` | `MetricDataPoint[]` | 60s |
| `GET /api/token/metadata` | `symbol` | [TokenMetadata](cci:2://file:///c:/Users/PC15/Desktop/Projelerim/futures_tracker_v0.3/lib/types.ts:33:0-42:1) | 60s |
| `GET /api/binance/klines` | `symbol`, `interval`, `limit` | `CandleData[]` | 0s |

### Consumption Patterns

**Server-Side:**
```typescript
const res = await fetch('http://localhost:3000/api/binance/metrics?symbol=BTCUSDT&metric=openInterest&period=1h');
const data = await res.json();
```

**Client-Side (SWR):**
```typescript
import useSWR from 'swr';
const { data, error } = useSWR<OpenInterestData[]>(
  '/api/binance/metrics?symbol=BTCUSDT&metric=openInterest',
  fetcher
);
```

### Integration Rules
1. All consuming applications MUST import types from `lib/types.ts`.
2. All endpoints use Next.js Edge Runtime for low-latency responses.
3. Error format: `{ error: string }` with HTTP 400 or 500.

### Type Reference
Canonical source: `lib/types.ts`
```
├── CandleData
├── TickerData
├── TokenMetadata, TokenUnlock, UnlockAllocation
├── MetricType, MarketType
├── OpenInterestData, LongShortRatioData, TakerBuySellData
├── FundingRateData, MoneyFlowData, MarginDebtData
├── IsoMarginBorrowData, MarginLongShortData
└── UnifiedMarketData
```