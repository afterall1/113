# PROMPT: DetailDrawer Integration and Layout
> **Target File**: `components/DetailDrawer.tsx` (MODIFY)
> **Dependencies**: `components/MetricChart.tsx`

---

## CONTEXT

Integrate the MetricChart components into the existing DetailDrawer. The drawer needs to be expanded to accommodate the new charts and use a proper grid layout.

---

## CHANGES REQUIRED

### 1. Add Import

At the top of the file, add:
```typescript
import { MetricChart } from '@/components/MetricChart';
import { TokenMetadata, UnlockAllocation, MetricType } from '@/lib/types';
```

### 2. Expand Panel Width

Find the main panel div (around line 180) and change:
```tsx
// BEFORE
className={`relative w-full max-w-4xl obsidian-panel ...`}

// AFTER
className={`relative w-full max-w-[1400px] obsidian-panel ...`}
```

Also update height:
```tsx
// BEFORE
absolute bottom-0 h-[85vh] ... sm:max-h-[90vh]

// AFTER
absolute bottom-0 h-[90vh] ... sm:max-h-[92vh]
```

### 3. Add Market Intelligence Section

After the MiniChart (price chart) section, add this entire block:

```tsx
{/* 2. Market Intelligence Section */}
<div className="-mx-6 sm:-mx-10 px-6 sm:px-10 py-8 border-t border-b border-white/5 bg-gradient-to-b from-black/40 to-transparent">
    {/* Section Header */}
    <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)] animate-pulse" />
            <h3 className="text-lg font-black tracking-wide">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-teal-400 to-blue-400">
                    MARKET INTELLIGENCE
                </span>
            </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <div className="w-1 h-1 rounded-full bg-teal-500" />
            <span className="text-[10px] font-mono font-bold text-zinc-400 tracking-widest">
                {chartInterval.toUpperCase()} PERIOD
            </span>
        </div>
    </div>

    {selectedTicker && (
        <div className="space-y-6 w-full overflow-hidden">
            {/* Open Interest - Full Width (Primary) */}
            <div className="w-full min-w-0 overflow-hidden">
                <MetricChart
                    symbol={selectedTicker.symbol}
                    metric="openInterest"
                    period={chartInterval}
                    color="#a855f7"
                />
            </div>

            {/* Ratio Metrics - 2 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="min-w-0 overflow-hidden">
                    <MetricChart
                        symbol={selectedTicker.symbol}
                        metric="globalLongShort"
                        period={chartInterval}
                        color="#14b8a6"
                    />
                </div>
                <div className="min-w-0 overflow-hidden">
                    <MetricChart
                        symbol={selectedTicker.symbol}
                        metric="takerBuySell"
                        period={chartInterval}
                        color="#22c55e"
                    />
                </div>
            </div>

            {/* Top Traders - 2 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="min-w-0 overflow-hidden">
                    <MetricChart
                        symbol={selectedTicker.symbol}
                        metric="topLongShortAccounts"
                        period={chartInterval}
                        color="#3b82f6"
                    />
                </div>
                <div className="min-w-0 overflow-hidden">
                    <MetricChart
                        symbol={selectedTicker.symbol}
                        metric="topLongShortPositions"
                        period={chartInterval}
                        color="#f97316"
                    />
                </div>
            </div>
        </div>
    )}
</div>
```

---

## LAYOUT STRUCTURE

```
┌─────────────────────────────────────────────────────┐
│  HEADER (Symbol + Price)             [ESC] [★]     │
├─────────────────────────────────────────────────────┤
│  PRICE CHART (MiniChart)                            │
│  ┌─────────────────────────────────────────────┐   │
│  │             h-[350px]                        │   │
│  └─────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│  ● MARKET INTELLIGENCE               [15M PERIOD]  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         OPEN INTEREST (Full Width)          │   │
│  │              h-64 (256px)                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │   Global Long/Short │  │   Taker Buy/Sell   │  │
│  │       h-64          │  │       h-64         │  │
│  └─────────────────────┘  └─────────────────────┘  │
│                                                     │
│  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  Top Traders (Acc)  │  │  Top Traders (Pos) │  │
│  │       h-64          │  │       h-64         │  │
│  └─────────────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────┤
│  KEY METRICS (Market Cap, FDV, Circulating, Vol)   │
├─────────────────────────────────────────────────────┤
│  TOKEN UNLOCK SECTION                               │
├─────────────────────────────────────────────────────┤
│  FOOTER                    [OPEN TERMINAL]         │
└─────────────────────────────────────────────────────┘
```

---

## CRITICAL CSS PATTERNS

### 1. Grid Overflow Prevention
Every grid item MUST have `min-w-0`:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
    <div className="min-w-0 overflow-hidden">
        <MetricChart ... />
    </div>
</div>
```

### 2. Full Bleed Sections
Use negative margins to extend to container edges:
```tsx
<div className="-mx-6 sm:-mx-10 px-6 sm:px-10 ...">
```

### 3. Period Synchronization
All MetricCharts use the same `chartInterval` state as the MiniChart:
```tsx
period={chartInterval}
```

---

## GRADIENT HEADER STYLING

```tsx
<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-teal-400 to-blue-400">
    MARKET INTELLIGENCE
</span>
```

---

*Prompt ID: DETAIL_DRAWER_001*
