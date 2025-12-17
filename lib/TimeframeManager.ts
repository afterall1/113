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
     * Bulk fetch baseline prices for multiple symbols.
     * Use sparingly to avoid rate limits.
     */
    async fetchBaselines(symbols: string[], timeframe: string): Promise<Map<string, number>> {
        const resultMap = new Map<string, number>();
        const interval = this.INTERVAL_MAP[timeframe];

        if (!interval || timeframe === '24h') return resultMap;

        // 1. Filter for USDT pairs only (Safety check)
        const targetSymbols = symbols.filter(s => s.endsWith('USDT'));

        // 2. Chunking Configuration
        const CHUNK_SIZE = 20;
        const DELAY_MS = 50;

        const chunks = [];
        for (let i = 0; i < targetSymbols.length; i += CHUNK_SIZE) {
            chunks.push(targetSymbols.slice(i, i + CHUNK_SIZE));
        }

        for (const chunk of chunks) {
            await Promise.all(chunk.map(async (symbol) => {
                try {
                    const price = await this.fetchBasePrice(symbol, timeframe);
                    if (price !== null) {
                        resultMap.set(symbol, price);
                    }
                } catch (e) {
                    // Fail silent per symbol
                }
            }));
            // Rate Limiting Delay
            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        return resultMap;
    }

    /**
     * Get the Open Price for the start of the timeframe.
     */
    async fetchBasePrice(symbol: string, timeframe: string): Promise<number | null> {
        // ... (rest of method same)
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
