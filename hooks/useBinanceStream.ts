import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/store/useMarketStore';
import { BinanceTickerPayload, TickerData } from '@/lib/types';
import { TimeframeManager } from '@/lib/TimeframeManager';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/!ticker@arr';
const MIN_QUOTE_VOLUME = 1_000_000;
const TARGET_QUOTE_ASSET = 'USDT';

// Transient Store accessible outside React Cycle
export const streamStore = {
    tickers: new Map<string, TickerData>(),
    subscribers: new Set<(data: Map<string, TickerData>) => void>(),

    subscribe(callback: (data: Map<string, TickerData>) => void) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    },

    emit() {
        this.subscribers.forEach(cb => cb(this.tickers));
    },

    getLatest(symbol: string) {
        return this.tickers.get(symbol);
    }
};

import { SoundEngine } from '@/lib/SoundEngine';

export function useBinanceStream() {
    const updateBatch = useMarketStore((state) => state.updateBatch);
    const timeframe = useMarketStore((state) => state.timeframe);
    const isMuted = useMarketStore((state) => state.isMuted);

    const wsRef = useRef<WebSocket | null>(null);
    const timeframeManager = useRef(new TimeframeManager());
    const soundEngine = useRef(SoundEngine.getInstance());

    // Throttled UI Update Ref
    const lastUiUpdate = useRef(0);

    // Use Ref to access latest timeframe inside callback without triggering effect re-run
    const timeframeRef = useRef(timeframe);
    useEffect(() => {
        timeframeRef.current = timeframe;
    }, [timeframe]);

    useEffect(() => {
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            wsRef.current = new WebSocket(BINANCE_WS_URL);

            wsRef.current.onopen = () => {
                console.log('[Liquidity Nebula] Connected to Binance Stream');
            };

            wsRef.current.onmessage = async (event) => {
                try {
                    const rawData: BinanceTickerPayload[] = JSON.parse(event.data);
                    const now = Date.now();
                    const shouldUpdateUI = now - lastUiUpdate.current > 1000; // 1s UI Throttle
                    const uiBatch: TickerData[] = [];

                    // Access latest timeframe via Ref
                    const currentTimeframe = timeframeRef.current;

                    for (const ticker of rawData) {
                        // Filter
                        if (!ticker.s.endsWith(TARGET_QUOTE_ASSET)) continue;
                        const volume = parseFloat(ticker.q);
                        if (volume < MIN_QUOTE_VOLUME) continue;

                        const price = parseFloat(ticker.c);
                        let percentChange = parseFloat(ticker.P);

                        // AUDIO TRIGGER LOGIC
                        // Only trigger if not muted and volatility is significant
                        if (!useMarketStore.getState().isMuted) {
                            // ... (keep exact audio logic reference)
                            // Re-implementing simplified access to store state for audio helper
                            // Actually we can leave the Audio Logic as is, just need to ensure `isMuted` access
                            const muted = useMarketStore.getState().isMuted;
                            if (!muted && Math.abs(percentChange) > 5) {
                                if (Math.random() > 0.95) {
                                    if (percentChange > 0) soundEngine.current.playPing(Math.min(percentChange / 20, 1.0));
                                    else soundEngine.current.playThud(Math.min(Math.abs(percentChange) / 20, 1.0));
                                }
                            }
                        }

                        // Handle Dynamic Timeframe Logic
                        // For 1h/4h/etc, we *should* check TimeframeManager
                        // But strictly for this optimization, we maintain 24h P for now unless we implement the Bulk Fetch
                        // If logic was advanced:
                        // if (currentTimeframe !== '24h') { percentChange = await timeframeManager.current.getChange(...) }

                        const finalData: TickerData = {
                            symbol: ticker.s,
                            price: price,
                            volume: volume,
                            priceChangePercent: percentChange,
                            timeFrame: currentTimeframe,
                        };

                        streamStore.tickers.set(ticker.s, finalData);

                        // ...
                        if (shouldUpdateUI) {
                            uiBatch.push(finalData);
                        }
                    }

                    // ...
                    if (shouldUpdateUI && uiBatch.length > 0) {
                        updateBatch(uiBatch);
                        lastUiUpdate.current = now;
                    }

                } catch (error) {
                    console.error('[Liquidity Nebula] Parse Error:', error);
                }
            };

            // ... (rest of socket events)
            wsRef.current.onclose = () => {
                console.warn('[Liquidity Nebula] Disconnected. Reconnecting in 3s...');
                reconnectTimeout = setTimeout(connect, 3000);
            };

            wsRef.current.onerror = (error) => {
                console.error('[Liquidity Nebula] WebSocket Error:', error);
                wsRef.current?.close();
            };
        };

        connect();

        return () => {
            wsRef.current?.close();
            clearTimeout(reconnectTimeout);
        };
    }, [updateBatch]); // Timeframe removed from deps to prevent reconnect
}
