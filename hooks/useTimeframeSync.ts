import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/store/useMarketStore';
import { streamStore } from '@/hooks/useBinanceStream';
import { TimeframeManager } from '@/lib/TimeframeManager';

export function useTimeframeSync() {
    const timeframe = useMarketStore(state => state.timeframe);
    const setBaselines = useMarketStore(state => state.setBaselines);
    const managerRef = useRef(new TimeframeManager());

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let intervalId: NodeJS.Timeout;

        // If 24h, we rely on stream "P" (PriceChangePercent), no baselines needed.
        if (timeframe === '24h') {
            setBaselines(new Map());
            return;
        }

        const runSync = async () => {
            // Fetch ALL USDT tickers (Filtering happens in Manager or Stream)
            const symbols = Array.from(streamStore.tickers.keys());
            console.log(`[TimeframeSync] Sending ${symbols.length} tickers to Manager...`);

            const baselines = await managerRef.current.fetchBaselines(symbols, timeframe);
            setBaselines(baselines);
            console.log(`[TimeframeSync] Updated ${baselines.size} baselines.`);
        };

        const tryInitialSync = () => {
            const count = streamStore.tickers.size;
            if (count < 5) {
                console.warn(`[TimeframeSync] Stream cold (${count} tickers). Waiting 1s...`);
                timeoutId = setTimeout(tryInitialSync, 1000);
            } else {
                console.log(`[TimeframeSync] Stream ready (${count} tickers). Starting sync.`);
                runSync();
                // Start Interval only after success
                intervalId = setInterval(runSync, 5 * 60 * 1000); // 5 Minutes
            }
        };

        // Start waiting/sync logic
        tryInitialSync();

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, [timeframe, setBaselines]);
}
