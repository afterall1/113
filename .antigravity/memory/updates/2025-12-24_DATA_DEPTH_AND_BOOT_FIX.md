# SYSTEM UPDATE: Chart Data Depth & Boot Stability
> **Date**: 2025-12-24
> **Topic**: Data Integrity, Caching Strategy, Initialization Logic
> **Status**: APPLIED (Production)

## 1. Executive Summary
This update resolves two critical issues: 
1. The 15-minute price chart only showing partial history (~100 candles), now fixed to display the maximum available (1500).
2. The application hanging on the "Initializing Nebula Stream" screen when WebSocket data ingress is slow, now patched with a failsafe boot mechanism.

## 2. Technical Implementation

### 2.1. Maximize Chart Data Depth
The default Binance Proxy implementation had caching layers that prevented the full history from loading.

-   **Backend (`app/api/binance/klines/route.ts`)**:
    -   **Limit Override**: Hardcoded `limit=1500` in the upstream API call.
    -   **Cache Busting**: Set `revalidate: 0` in `NextResponse` to disable server-side caching.
    
-   **Frontend (`components/MiniChart.tsx`)**:
    -   **SWR Key Update**: Appended `&limit=1500` to the fetch URL. This acts as a "Cache Key Rotation" to force all client browsers to fetch fresh data instead of using their local cache.
    -   **Fit Content**: Added a delayed `timeScale().fitContent()` call (50ms) to ensure the chart scales to the full dataset after rendering.

### 2.2. Boot Loop Failsafe
The `app/page.tsx` initialization logic relied solely on receiving `> 20` unique tickers via WebSocket. If the socket connection was slow or the market was quiet, the app would hang indefinitely.

-   **Failsafe Timeout**: Added a 3-second `setTimeout` that forces `setIsBooted(true)` regardless of data state.
-   **CSS Fallback**: Added inline `style={{ backgroundColor: '#000' }}` to the loading screen to prevent white flashes if Tailwind CSS takes time to hydrate.

### 2.3. Production Debugging Tools
To verify the fix in the production build, we introduced runtime indicators:
-   **Visual Indicator**: A highly visible (Red/Black) "DEBUG: [COUNT] CANDLES" overlay on the chart.
-   **Server Logs**: Explicit console logging in the backend route to confirm the number of candles fetched from Binance.

## 3. Handover Protocols
1.  **Remove Debug**: The Debug text in `MiniChart.tsx` should be removed in the next polish phase.
2.  **Chart Performance**: Loading 1500 candles for *every* asset might be heavy. Consider reverting to 100 candles for the list view and only loading 1500 for the Detail View if performance drops.

**Signed**: Lead Architect (Antigravity)
