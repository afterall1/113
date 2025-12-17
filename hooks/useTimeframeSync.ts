import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/store/useMarketStore';
import { streamStore } from '@/hooks/useBinanceStream';
import { TimeframeManager } from '@/lib/TimeframeManager';

export function useTimeframeSync() {
    const timeframe = useMarketStore(state => state.timeframe);
    const setBaselines = useMarketStore(state => state.setBaselines);
    const managerRef = useRef(new TimeframeManager());

    useEffect(() => {
        // If 24h, we rely on stream "P" (PriceChangePercent), no baselines needed.
        if (timeframe === '24h') {
            setBaselines(new Map());
            return;
        }

        const syncBaselines = async () => {
            const symbols = Array.from(streamStore.tickers.keys());
            if (symbols.length === 0) return;

            // Sort by volume? Or just take top 100 to avoid killing API?
            // For MVP, lets try to fetch all but verify performance later.
            // Limiting to Top 50 by volume for safety is a good heuristic.
            const topSymbols = Array.from(streamStore.tickers.values())
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 50)
                .map(d => d.symbol);

            console.log(`[TimeframeSync] Fetching baselines for ${topSymbols.length} tickers on ${timeframe}...`);
            const baselines = await managerRef.current.fetchBaselines(topSymbols, timeframe);
            setBaselines(baselines);
            console.log(`[TimeframeSync] Updated ${baselines.size} baselines.`);
        };

        // Initial Fetch
        syncBaselines();

        // Interval (5 minutes)
        const interval = setInterval(syncBaselines, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [timeframe, setBaselines]);
}
