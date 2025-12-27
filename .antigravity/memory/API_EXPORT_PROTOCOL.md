# Nebula Data Bridge v1.0
> **Protocol Type**: API Export Specification
> **Date Created**: 2025-12-27
> **Status**: ACTIVE

---

## 1. Protocol Identity

**Name**: Nebula Data Bridge  
**Version**: 1.0  
**Purpose**: Enable external applications (e.g., Backtest & Anomaly Detection Engine) to consume market data from the Liquidity Nebula platform.

---

## 2. Base URL Configuration

| Environment | URL |
|-------------|-----|
| **Development** | `http://localhost:3000` |
| **Production** | `https://[DEPLOYMENT_DOMAIN]` |

> [!IMPORTANT]
> All endpoints use Next.js Edge Runtime for low-latency responses.

---

## 3. Endpoints Manifest

### 3.1 `GET /api/binance/metrics`

Fetches derivatives market metrics from Binance Futures/Spot markets.

**Reference**: [app/api/binance/metrics/route.ts](file:///c:/Users/PC15/Desktop/Projelerim/futures_tracker_v0.3/app/api/binance/metrics/route.ts)

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | `string` | ✅ | — | Trading pair (e.g., `BTCUSDT`) |
| `metric` | `MetricType` | ✅ | — | Metric to fetch (see list below) |
| `period` | `string` | ❌ | `5m` | Time period. Valid: `5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d` |
| `marketType` | `MarketType` | ❌ | `futures` | Market type: `futures` or `spot` |
| `limit` | `number` | ❌ | `30` | Number of data points |

#### Metric Types

**Futures Metrics:**
- `openInterest` → `OpenInterestData[]`
- `globalLongShort` → `LongShortRatioData[]`
- `topLongShortAccounts` → `LongShortRatioData[]`
- `topLongShortPositions` → `LongShortRatioData[]`
- `takerBuySell` → `TakerBuySellData[]`
- `fundingRate` → `FundingRateData[]`

**Spot/Margin Metrics:**
- `moneyFlow` → `MoneyFlowData[]`
- `24hrLargeInflow` → `MoneyFlowData[]`
- `marginDebtGrowth` → `MarginDebtData[]`
- `marginLongShortRatio` → `MarginLongShortData[]`
- `isoMarginBorrowRatio` → `IsoMarginBorrowData[]`

#### Example Request
```http
GET /api/binance/metrics?symbol=BTCUSDT&metric=openInterest&period=1h&marketType=futures&limit=50
```

#### Response Schema
```typescript
// Array of metric-specific data points
OpenInterestData[] | LongShortRatioData[] | TakerBuySellData[] | ...
```

---

### 3.2 `GET /api/token/metadata`

Fetches enriched token metadata from CoinMarketCap, CoinGecko, and DeFiLlama.

**Reference**: [app/api/token/metadata/route.ts](file:///c:/Users/PC15/Desktop/Projelerim/futures_tracker_v0.3/app/api/token/metadata/route.ts)

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | `string` | ✅ | Token symbol without quote (e.g., `BTC`, `ETH`) |

#### Example Request
```http
GET /api/token/metadata?symbol=BTC
```

#### Response Schema
```typescript
interface TokenMetadata {
  marketCap: number;           // USD Market Cap
  fdv: number;                 // Fully Diluted Valuation
  circulatingSupply: number;   // Circulating Supply
  maxSupply: number;           // Max Supply (0 if infinite)
  nextUnlock: TokenUnlock;     // Next unlock event
  tags: string[];              // Category tags
  chains: string[];            // Supported blockchains
  description: string;         // Brief project description
}

interface TokenUnlock {
  date: string;                // ISO date (e.g., "2025-03-15")
  amount: number;              // Tokens to be unlocked
  valueUSD: number;            // Estimated USD value
  percentOfSupply: number;     // Percentage of total supply
  allocations: UnlockAllocation[];
}

interface UnlockAllocation {
  category: string;            // e.g., 'Core Team', 'Investors'
  percent: number;             // Percentage allocation
}
```

---

### 3.3 `GET /api/binance/klines`

Fetches OHLC candlestick data from Binance Futures.

**Reference**: [app/api/binance/klines/route.ts](file:///c:/Users/PC15/Desktop/Projelerim/futures_tracker_v0.3/app/api/binance/klines/route.ts)

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | `string` | ✅ | — | Trading pair (e.g., `BTCUSDT`) |
| `interval` | `string` | ❌ | `15m` | Candlestick interval |
| `limit` | `number` | ❌ | `100` | Returns max 1500 candles |

#### Supported Intervals
`1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M`

#### Example Request
```http
GET /api/binance/klines?symbol=ETHUSDT&interval=1h&limit=500
```

#### Response Schema
```typescript
interface CandleData {
  time: number;    // Unix timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
}

// Returns: CandleData[]
```

---

## 4. Integration Rules

### 4.1 Consumption Patterns

**Server-Side (Recommended for Backtest):**
```typescript
// Next.js Server Component / API Route
const res = await fetch('http://localhost:3000/api/binance/metrics?symbol=BTCUSDT&metric=openInterest&period=1h');
const data = await res.json();
```

**Client-Side with SWR:**
```typescript
import useSWR from 'swr';

const { data, error } = useSWR<OpenInterestData[]>(
  '/api/binance/metrics?symbol=BTCUSDT&metric=openInterest',
  fetcher
);
```

### 4.2 Type Compatibility

> [!IMPORTANT]
> All consuming applications MUST import types from `lib/types.ts` to ensure compatibility.

**Core Types Reference:** [lib/types.ts](file:///c:/Users/PC15/Desktop/Projelerim/futures_tracker_v0.3/lib/types.ts)

### 4.3 Rate Limiting & Caching

| Endpoint | Cache Duration | Notes |
|----------|----------------|-------|
| `/api/binance/metrics` | 60s | Server-side `next.revalidate` |
| `/api/token/metadata` | 60s | SWR deduplication recommended |
| `/api/binance/klines` | 0s (No cache) | Fresh data priority |

### 4.4 Error Handling

All endpoints return consistent error format:
```typescript
{ error: string }  // HTTP 400 or 500
```

---

## 5. Type Definitions Reference

For complete type definitions, see the canonical source:

```
lib/types.ts
├── CandleData
├── TickerData
├── TokenMetadata
├── TokenUnlock
├── UnlockAllocation
├── MetricType
├── MarketType
├── OpenInterestData
├── LongShortRatioData
├── TakerBuySellData
├── FundingRateData
├── MoneyFlowData
├── MarginDebtData
├── IsoMarginBorrowData
├── MarginLongShortData
└── UnifiedMarketData
```

---

*Document Version: 1.0*  
*Last Updated: 2025-12-27*  
*Protocol Status: ACTIVE*
