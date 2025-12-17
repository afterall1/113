import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/store/useMarketStore';
import { streamStore } from '@/hooks/useBinanceStream';
import { TimeframeManager } from '@/lib/TimeframeManager';

export function useTimeframeSync() {
    const timeframe = useMarketStore(state => state.timeframe);
    const setBaselines = useMarketStore(state => state.setBaselines);
    const managerRef = useRef(new TimeframeManager());
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Temizlik (Cleanup)
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    useEffect(() => {
        // Eğer 24h seçiliyse, baseline çekmeye gerek yok.
        if (timeframe === '24h') {
            setBaselines(new Map());
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            return;
        }

        const sync = async () => {
            // 1. WebSocket'ten gelen coin listesini al
            const allSymbols = Array.from(streamStore.tickers.keys());

            // 2. SMART POLLING: Eğer liste boşsa (Henüz bağlanmadıysa), 1 sn bekle ve tekrar dene.
            if (allSymbols.length < 5) {
                console.log(`[TimeframeSync] Waiting for socket data... (${allSymbols.length} tickers)`);
                timeoutRef.current = setTimeout(sync, 1000);
                return;
            }

            // 3. Veri geldiyse, LIMITSIZ olarak hepsini çek.
            console.log(`[TimeframeSync] Fetching baselines for ${allSymbols.length} tickers on ${timeframe}...`);

            try {
                // TimeframeManager içindeki batching (parçalı çekim) fonksiyonunu kullan
                const baselines = await managerRef.current.fetchBaselines(allSymbols, timeframe);
                setBaselines(baselines);
                console.log(`[TimeframeSync] Success! Updated ${baselines.size} baselines.`);
            } catch (error) {
                console.error("[TimeframeSync] Error fetching baselines:", error);
            }
        };

        // İlk başlatma
        sync();

        // 5 Dakikada bir güncelle (300.000 ms)
        const interval = setInterval(sync, 5 * 60 * 1000);

        return () => {
            clearInterval(interval);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [timeframe, setBaselines]);
}