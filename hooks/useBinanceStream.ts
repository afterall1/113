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

    // 1. Refs to access latest state/functions without re-running Effect
    const updateBatchRef = useRef(updateBatch);
    const timeframe = useMarketStore((state) => state.timeframe); // Just for specific optimization if needed
    const timeframeRef = useRef(timeframe);

    // Keep Refs synced
    useEffect(() => { updateBatchRef.current = updateBatch; }, [updateBatch]);
    useEffect(() => { timeframeRef.current = timeframe; }, [timeframe]);

    const wsRef = useRef<WebSocket | null>(null);
    const soundEngine = useRef(SoundEngine.getInstance());
    const lastUiUpdate = useRef(0);

    // 2. Main Connection Effect - ZERO DEPENDENCIES [ ]
    useEffect(() => {
        let reconnectTimeout: NodeJS.Timeout;
        let isUnmounted = false;

        const connect = () => {
            if (isUnmounted) return;

            console.log('[Liquidity Nebula] Initializing WebSocket...');
            wsRef.current = new WebSocket(BINANCE_WS_URL);

            wsRef.current.onopen = () => {
                console.log('[Liquidity Nebula] Connected to Binance Stream');
            };

            wsRef.current.onmessage = async (event) => {
                if (isUnmounted) return;
                try {
                    const rawData: BinanceTickerPayload[] = JSON.parse(event.data);
                    const now = Date.now();
                    const shouldUpdateUI = now - lastUiUpdate.current > 1000;
                    const uiBatch: TickerData[] = [];

                    const currentTimeframe = timeframeRef.current; // Read from Ref

                    for (const ticker of rawData) {
                        if (!ticker.s.endsWith(TARGET_QUOTE_ASSET)) continue;
                        const volume = parseFloat(ticker.q);
                        if (volume < MIN_QUOTE_VOLUME) continue;

                        const price = parseFloat(ticker.c);
                        const percentChange = parseFloat(ticker.P);

                        // Sound Logic
                        if (!useMarketStore.getState().isMuted) {
                            const muted = useMarketStore.getState().isMuted; // Double check
                            if (!muted && Math.abs(percentChange) > 5) {
                                if (Math.random() > 0.95) {
                                    if (percentChange > 0) soundEngine.current.playPing(Math.min(percentChange / 20, 1.0));
                                    else soundEngine.current.playThud(Math.min(Math.abs(percentChange) / 20, 1.0));
                                }
                            }
                        }

                        const finalData: TickerData = {
                            symbol: ticker.s,
                            price: price,
                            volume: volume,
                            priceChangePercent: percentChange,
                            timeFrame: currentTimeframe,
                        };

                        streamStore.tickers.set(ticker.s, finalData);

                        if (shouldUpdateUI) {
                            uiBatch.push(finalData);
                        }
                    }

                    if (shouldUpdateUI && uiBatch.length > 0) {
                        // Call via Ref to avoid closure staleness
                        if (updateBatchRef.current) {
                            updateBatchRef.current(uiBatch);
                        }
                        lastUiUpdate.current = now;
                    }

                } catch (error) {
                    console.error('[Liquidity Nebula] Parse Error:', error);
                }
            };

            wsRef.current.onclose = () => {
                console.warn('[Liquidity Nebula] Disconnected. Reconnecting in 3s...');
                if (!isUnmounted) {
                    reconnectTimeout = setTimeout(connect, 3000);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('[Liquidity Nebula] WebSocket Error:', error);
                wsRef.current?.close();
            };
        };

        connect();

        return () => {
            isUnmounted = true;
            console.log('[Liquidity Nebula] Cleaning up WebSocket...');
            if (wsRef.current) wsRef.current.close();
            clearTimeout(reconnectTimeout);
        };
    }, []); // <--- ABSOLUTELY ZERO DEPENDENCIES. GUARANTEED STABILITY.
}
