import { TickerData } from '@/lib/types';

interface PriceCache {
    openPrice: number;
    timestamp: number;
}

export class TimeframeManager {
    private cache: Map<string, PriceCache> = new Map();
    private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 Hour Cache

    // Interval to Binance Kline Interval map
    private readonly INTERVAL_MAP: Record<string, string> = {
        '1h': '1h',
        '4h': '4h',
        '24h': '1d', // Should be 1d open for 24h change, or just use ticker 24h
        '7d': '1w'
    };

    /**
     * Get the Open Price for the start of the timeframe.
     * e.g. If timeframe is 1h, get price at start of current hour? 
     * Or Open Price of the LAST 1h Candle? 
     * Usually "1h Change" means Current Price vs Price 1h ago.
     * Binance Klines gives us the open of the candle.
     * Let's assume we want "Percent change from the Open of the [Timeframe] Candle".
     */
    async fetchBasePrice(symbol: string, timeframe: string): Promise<number | null> {
        // For 24h, we can use the stream data directly, no need to fetch
        if (timeframe === '24h') return null;

        const cacheKey = `${symbol}-${timeframe}`;
        const cached = this.cache.get(cacheKey);
        const now = Date.now();

        // Check Cache (Lazy simple cache, ideally aligned with candle close times)
        // For now, simple TTL
        if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
            return cached.openPrice;
        }

        const interval = this.INTERVAL_MAP[timeframe];
        if (!interval) return null;

        try {
            // Fetch single latest completed candle or current candle
            // limit=1 gives the latest candle (still forming usually)
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1`);
            const data = await res.json();

            if (data && data.length > 0) {
                // kline: [time, open, high, low, close, ...]
                const openPrice = parseFloat(data[0][1]);

                this.cache.set(cacheKey, {
                    openPrice,
                    timestamp: now
                });
                return openPrice;
            }
        } catch (err) {
            console.warn(`[TimeframeManager] Failed to fetch for ${symbol}`, err);
        }

        return null;
    }

    calculateDynamicChange(currentPrice: number, basePrice: number): number {
        if (basePrice === 0) return 0;
        return ((currentPrice - basePrice) / basePrice) * 100;
    }
}
