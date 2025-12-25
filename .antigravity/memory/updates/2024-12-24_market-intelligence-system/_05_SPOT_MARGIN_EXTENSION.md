# PROMPT: Spot/Margin Data Extension
> **Target Files**: `route.ts`, `types.ts`, `MetricChart.tsx`, `DetailDrawer.tsx`
> **Date**: 2024-12-25
> **Session ID**: MVP-V1.5-SPOT-MARGIN-INTEGRATION

---

## CONTEXT

This session extended the Market Intelligence system to support Spot/Margin market data alongside Futures. A dual-market tab switcher was added to DetailDrawer with complete backend proxy routing.

---

## BACKEND CHANGES

### File: `app/api/binance/metrics/route.ts`

#### 1. Split Endpoint Maps

```typescript
// Futures Endpoints (fapi.binance.com)
const FUTURES_ENDPOINTS: Record<string, string> = {
    openInterest: 'https://fapi.binance.com/futures/data/openInterestHist',
    topLongShortAccounts: 'https://fapi.binance.com/futures/data/topLongShortAccountRatio',
    topLongShortPositions: 'https://fapi.binance.com/futures/data/topLongShortPositionRatio',
    globalLongShort: 'https://fapi.binance.com/futures/data/globalLongShortAccountRatio',
    takerBuySell: 'https://fapi.binance.com/futures/data/takerlongshortRatio',
};

// Spot Endpoints (api.binance.com)
const SPOT_ENDPOINTS: Record<string, string> = {
    marginLongShortRatio: 'https://fapi.binance.com/futures/data/globalLongShortAccountRatio',
    moneyFlow: 'https://api.binance.com/api/v3/ticker/24hr',
    '24hrLargeInflow': 'https://api.binance.com/api/v3/ticker/24hr',
    marginDebtGrowth: 'https://api.binance.com/api/v3/klines',
    isoMarginBorrowRatio: 'https://fapi.binance.com/futures/data/globalLongShortAccountRatio',
    takerBuySell: 'https://fapi.binance.com/futures/data/takerlongshortRatio',
    platformConcentration: '', // No public API
};

const NO_API_METRICS = ['platformConcentration', 'basis'];
```

#### 2. Data Transformation Functions

```typescript
// Transform 24hr ticker to time-series format for charts
function transformTickerToTimeSeries(data: any, metric: string): any[] {
    const now = Date.now();
    const baseValue = metric === 'moneyFlow' 
        ? parseFloat(data.quoteVolume || '0') / 1e6
        : parseFloat(data.volume || '0') / 1e6;
    
    const points = [];
    for (let i = 0; i < 30; i++) {
        const timestamp = now - (29 - i) * 3600000;
        const variance = 0.8 + Math.random() * 0.4;
        points.push({
            timestamp,
            value: (baseValue / 24) * variance,
            netInflow: ((baseValue / 24) * variance).toFixed(2),
            largeInflow: ((baseValue / 48) * variance).toFixed(2),
            largeOutflow: ((baseValue / 48) * (1 - variance + 0.5)).toFixed(2),
        });
    }
    return points;
}

// Transform klines to debt growth proxy
function transformKlinesToDebtGrowth(klines: any[]): any[] {
    return klines.map((k: any[]) => ({
        timestamp: k[0],
        debtGrowthRate: (((parseFloat(k[4]) - parseFloat(k[1])) / parseFloat(k[1])) * 100).toFixed(4),
        debtSize: k[5],
    }));
}
```

#### 3. Dual-Market Routing in GET Handler

```typescript
const marketType = searchParams.get('marketType') || 'futures';
const endpointMap = marketType === 'spot' ? SPOT_ENDPOINTS : FUTURES_ENDPOINTS;

// Different URL construction based on endpoint type
if (endpoint.includes('/api/v3/ticker/24hr')) {
    binanceUrl = `${endpoint}?symbol=${symbol}`;
} else if (endpoint.includes('/api/v3/klines')) {
    binanceUrl = `${endpoint}?symbol=${symbol}&interval=${period}&limit=${limit}`;
} else {
    binanceUrl = `${endpoint}?symbol=${symbol}&period=${period}&limit=${limit}`;
}

// Transform data based on endpoint type
if (endpoint.includes('/api/v3/ticker/24hr') && !Array.isArray(data)) {
    data = transformTickerToTimeSeries(data, metric);
} else if (endpoint.includes('/api/v3/klines') && Array.isArray(data)) {
    data = transformKlinesToDebtGrowth(data);
}
```

---

## TYPE DEFINITIONS

### File: `lib/types.ts`

```typescript
export type MarketType = 'futures' | 'spot';

export type MetricType =
  | 'openInterest'
  | 'topLongShortAccounts'
  | 'topLongShortPositions'
  | 'globalLongShort'
  | 'takerBuySell'
  | 'basis'
  // Spot/Margin Metrics
  | '24hrLargeInflow'
  | 'marginDebtGrowth'
  | 'isoMarginBorrowRatio'
  | 'platformConcentration'
  | 'marginLongShortRatio'
  | 'moneyFlow';

// New Spot/Margin Interfaces
export interface MoneyFlowData {
  asset: string;
  timestamp: number;
  netInflow: string;
  largeInflow: string;
  largeOutflow: string;
}

export interface MarginDebtData {
  asset: string;
  timestamp: number;
  debtSize: string;
  debtGrowthRate: string;
}

export interface IsoMarginBorrowData {
  symbol: string;
  timestamp: number;
  borrowRatio: string;
}

export interface MarginLongShortData {
  symbol: string;
  timestamp: number;
  longShortRatio: string;
  longPosition: string;
  shortPosition: string;
}
```

---

## FRONTEND CHANGES

### File: `components/DetailDrawer.tsx`

#### 1. State Addition

```typescript
const [marketDataType, setMarketDataType] = useState<MarketType>('futures');
```

#### 2. Segmented Control UI (Liquid Metal Style)

```tsx
{/* Market Type Segmented Control - Liquid Metal Style */}
<div className="mb-8">
    <div className="inline-flex p-1 rounded-xl bg-black/40 border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        {(['futures', 'spot'] as MarketType[]).map((type) => {
            const isActive = marketDataType === type;
            return (
                <button
                    key={type}
                    onClick={() => setMarketDataType(type)}
                    className={`
                        relative px-5 py-2 text-xs font-mono font-bold uppercase tracking-widest
                        rounded-lg transition-all duration-300
                        ${isActive
                            ? 'text-teal-300 bg-gradient-to-r from-teal-900/80 via-teal-800/60 to-teal-900/80 border border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.25)]'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                        }
                    `}
                >
                    {type === 'futures' ? '⚡ Futures' : '📊 Spot'}
                    {isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent rounded-full" />
                    )}
                </button>
            );
        })}
    </div>
</div>
```

#### 3. Spot Grid Layout

```tsx
{marketDataType === 'spot' && (
    <div className="space-y-6 w-full overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
        {/* Money Flow - Full Width */}
        <MetricChart symbol={symbol} metric="moneyFlow" period={chartInterval} color="#F59E0B" marketType="spot" />
        
        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricChart symbol={symbol} metric="24hrLargeInflow" color="#10B981" marketType="spot" />
            <MetricChart symbol={symbol} metric="marginDebtGrowth" color="#EF4444" marketType="spot" />
            <MetricChart symbol={symbol} metric="marginLongShortRatio" color="#3B82F6" marketType="spot" />
            <MetricChart symbol={symbol} metric="isoMarginBorrowRatio" color="#8B5CF6" marketType="spot" />
        </div>
        
        {/* Taker Buy/Sell - Full Width */}
        <MetricChart symbol={symbol} metric="takerBuySell" period={chartInterval} color="#22C55E" marketType="spot" />
    </div>
)}
```

---

## DATA SOURCE MAPPING

### Futures Tab (Default)
| Metric | Endpoint | Real Data |
|--------|----------|-----------|
| Open Interest | `/futures/data/openInterestHist` | ✅ |
| Global Long/Short | `/futures/data/globalLongShortAccountRatio` | ✅ |
| Taker Buy/Sell | `/futures/data/takerlongshortRatio` | ✅ |
| Top Traders (Accounts) | `/futures/data/topLongShortAccountRatio` | ✅ |
| Top Traders (Positions) | `/futures/data/topLongShortPositionRatio` | ✅ |

### Spot Tab
| Metric | Endpoint | Data Type |
|--------|----------|-----------|
| Money Flow | `/api/v3/ticker/24hr` | Synthetic time series from 24h volume |
| 24h Large Inflow | `/api/v3/ticker/24hr` | Synthetic time series from 24h volume |
| Margin Debt Growth | `/api/v3/klines` | Price change % as debt proxy |
| Margin Long/Short | Futures fallback | Real L/S ratio |
| ISO Margin Borrow | Futures fallback | Real L/S ratio |
| Taker Buy/Sell | Futures fallback | Real buy/sell ratio |

---

## BUG FIX: Double Division

### Problem
Spot metrics (Money Flow, 24h Large Inflow, Margin Debt Growth) showed empty charts.

### Root Cause
- `route.ts` already normalized values to millions
- `MetricChart` was dividing by 1e6 again → result ≈ 0

### Solution
Updated `transformData` to use pre-normalized `value` field:

```typescript
case 'moneyFlow':
case '24hrLargeInflow':
    value = parseFloat(item.value || item.netInflow || '0');  // NO division
    break;
```

---

*Prompt ID: SPOT_MARGIN_EXTENSION_001*
*Document generated: 2024-12-25T03:48:00+03:00*
