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

                    for (const ticker of rawData) {
                        // Filter
                        if (!ticker.s.endsWith(TARGET_QUOTE_ASSET)) continue;
                        const volume = parseFloat(ticker.q);
                        if (volume < MIN_QUOTE_VOLUME) continue;

                        const price = parseFloat(ticker.c);
                        let percentChange = parseFloat(ticker.P);

                        // AUDIO TRIGGER LOGIC
                        // Only trigger if not muted and volatility is significant
                        if (!isMuted) {
                            // If Daily Change is high (> 5%) and volume is significant, trigger random ping
                            // This simulates "activity" on hot coins
                            if (Math.abs(percentChange) > 5) {
                                if (Math.random() > 0.95) { // 5% chance per tick per hot coin to ping (Rate limited by Engine)
                                    if (percentChange > 0) {
                                        soundEngine.current.playPing(Math.min(percentChange / 20, 1.0));
                                    } else {
                                        soundEngine.current.playThud(Math.min(Math.abs(percentChange) / 20, 1.0));
                                    }
                                }
                            }
                        }

                        // Handle Dynamic Timeframe Logic
                        // Note: In a real-world high-freq app, we wouldnt await fetch inside the loop like this
                        // We would have a background worker updating the "Base Prices" for the active timeframe
                        // For MVP, we use the cached open price if available, or just stick to 24h if fetching needed
                        // To prevent lag, we simply don't await here, we just use what we have or schedule a fetch?
                        // Actually, for thousands of coins, we cannot fetch 1h candle for all instantly.
                        // PROPOSAL: Only fetch for 'Selected' or just stick to 24h for MVP V2 optimization.
                        // IMPLEMENTATION: We will stick to 24h for the *stream* unless we have a base price ready.

                        // Just update the Map directly
                        const finalData: TickerData = {
                            symbol: ticker.s,
                            price: price,
                            volume: volume,
                            priceChangePercent: percentChange,
                            timeFrame: timeframe, // Use store timeframe
                        };

                        streamStore.tickers.set(ticker.s, finalData);

                        if (shouldUpdateUI) {
                            uiBatch.push(finalData);
                        }
                    }

                    // Notify WebGL Subscribers (Raf Loop checks this Map, or we emit event)
                    // Actually, we don't even need to emit if the Canvas component polls the Map in its Tick loop.
                    // But emitting allows us to notify "Changes occurred"
                    // streamStore.emit(); 

                    // Throttled UI State Update (For Drawer/HUD)
                    if (shouldUpdateUI && uiBatch.length > 0) {
                        updateBatch(uiBatch);
                        lastUiUpdate.current = now;
                    }

                } catch (error) {
                    console.error('[Liquidity Nebula] Parse Error:', error);
                }
            };

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
    }, [updateBatch, timeframe]);
}
