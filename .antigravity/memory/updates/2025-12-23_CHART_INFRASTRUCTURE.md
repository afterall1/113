# SYSTEM UPDATE: Chart Infrastructure & Premium UI
> **Date**: 2025-12-23
> **Topic**: Financial Charting, Proxy Architecture, UI/UX Polish
> **Status**: APPLIED (Production)

## 1. Executive Summary
This update establishes the financial charting capability within the Liquidity Nebula interface. We implemented a secure backend proxy to bypass CORS when fetching Binance Futures data, created a high-performance lightweight chart component, and integrated a "Premium Ribbon" UI for timeframe selection that adheres to our high-end aesthetic standards.

## 2. Architecture Overview

### 2.1. Backend: Secure Proxy Layer
Direct browser calls to Binance Futures API (`fapi.binance.com`) are blocked by CORS policies.
**Solution**: Next.js Route Handler acting as a middleware.

-   **Path**: `app/api/binance/klines/route.ts`
-   **Function**: 
    1.  Receives internal request: `get /api...?symbol=BTCUSDT&interval=15m`
    2.  Fetches external data: `fapi.binance.com/fapi/v1/klines`
    3.  Transforms raw array `[time, open, high, low, close...]` to structured JSON.
    4.  **Caching**: Implements 60-second revalidation (`next: { revalidate: 60 }`) to propagate rate limits and reduce external load.

### 2.2. Frontend: `MiniChart` Component
Built on `lightweight-charts` (TradingView), optimized for performance and "Nebula" aesthetics.
-   **File**: `components/MiniChart.tsx`
-   **Key Features**:
    -   **Dynamic Props**: Accepts `symbol` and `interval` to instantly re-fetch data using `useSWR`.
    -   **Visuals**: Transparent background, custom Teal/Red palette, visible Right Price Scale.
    -   **Resilience**: Handles unmount cleanup (`chart.remove()`) and resize events (`ResizeObserver`).

### 2.3. UI/UX: Detail Drawer Integration
We overhauled the `DetailDrawer` to host the chart.
-   **The "Premium Ribbon"**: Instead of a standard dropdown, we built a horizontal scrollable list of timeframes (1m-1M).
    -   **Design**: Glassmorphism (`backdrop-blur-md`), hidden scrollbars (`no-scrollbar`), and active state indicators (Teal underline).
    -   **Interaction**: Placed at the top-right of the chart card for immediate access.

## 3. Data Flow Protocol
1.  User clicks a token -> `DetailDrawer` opens.
2.  Drawer initializes `chartInterval` state (default: '15m').
3.  `MiniChart` receives `symbol` + `interval`.
4.  `useSWR` calls local API `/api/binance/klines`.
5.  API fetches Binance, formats data, returns JSON.
6.  Chart renders candles. User changes interval -> Step 3 repeats instantly.

## 4. Code Snapshot: The Premium Ribbon
The specific CSS/Tailwind implementation for the scrollbar-free ribbon is critical for the aesthetic:

```tsx
<div className="flex overflow-x-auto no-scrollbar scroll-smooth gap-0.5 px-0.5" 
     style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
    {intervals.map(int => (
        <button
            key={int}
            onClick={() => setChartInterval(int)}
            className={`
                relative px-2 py-1 text-[9px] font-mono font-bold rounded flex-shrink-0 transition-all duration-300
                ${chartInterval === int 
                    ? 'bg-teal-500/10 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.1)] border border-teal-500/20' 
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'}
            `}
        >
            {int}
            {chartInterval === int && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-0.5 bg-teal-500 rounded-full mb-0.5" />
            )}
        </button>
    ))}
</div>
```

## 5. Neural Handover Instructions
For future agents working on this module:
1.  **Strict Typing**: Always use `CandleData` interface (`lib/types.ts`) when handling price data.
2.  **Proxy Usage**: NEVER fetch from Binance directly in client components. ALWAYS use `/api/binance/klines`.
3.  **Chart Library**: We use `lightweight-charts` v5. Use `addSeries(CandlestickSeries, ...)` syntax, NOT `addCandlestickSeries`.
4.  **Aesthetics**: Maintain the "borderless" look inside the drawer. The chart container has a fixed height (`h-64`); do not make it unbounded.

**Signed**: Lead Architect (Antigravity)
