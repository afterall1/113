import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/store/useMarketStore';
import { BinanceTickerPayload, TickerData } from '@/lib/types';
import { SoundEngine } from '@/lib/SoundEngine';

const BINANCE_WS_URL = 'wss://fstream.binance.com/ws/!ticker@arr'; // FUTURES
const MIN_QUOTE_VOLUME = 1_000_000;
const TARGET_QUOTE_ASSET = 'USDT';

// --- SINGLETON SOCKET MANAGER ---
// This lives outside React Lifecycle and survives unmounts/remounts.

let globalSocket: WebSocket | null = null;
let activeListeners = new Set<(data: BinanceTickerPayload[]) => void>();
let closeTimeout: NodeJS.Timeout | null = null;
let isConnecting = false;

const connectGlobal = () => {
    // Cancel any pending close
    if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
    }

    if (globalSocket && (globalSocket.readyState === WebSocket.OPEN || globalSocket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    if (isConnecting) return;
    isConnecting = true;

    console.log('[Liquidity Nebula] Initializing Global WebSocket...');
    const ws = new WebSocket(BINANCE_WS_URL);

    ws.onopen = () => {
        console.log('[Liquidity Nebula] Global Socket Connected');
        isConnecting = false;
        globalSocket = ws;
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            activeListeners.forEach(listener => listener(data));
        } catch (e) {
            console.error(e);
        }
    };

    ws.onclose = () => {
        console.warn('[Liquidity Nebula] Global Socket Closed');
        globalSocket = null;
        isConnecting = false;
        // Auto-reconnect if we still have listeners
        if (activeListeners.size > 0) {
            setTimeout(connectGlobal, 3000);
        }
    };

    ws.onerror = (err) => {
        console.error('[Liquidity Nebula] Socket Error:', err);
        ws.close();
    };
};

const disconnectGlobal = () => {
    if (activeListeners.size === 0 && globalSocket) {
        // Debounce close by 5 seconds to handle strict-mode or rapid navigation
        closeTimeout = setTimeout(() => {
            if (activeListeners.size === 0 && globalSocket) {
                console.log('[Liquidity Nebula] No listeners. Closing Global Socket...');
                globalSocket.close();
                globalSocket = null;
            }
        }, 5000);
    }
};

// --- TRANSIENT STORE ---
export const streamStore = {
    tickers: new Map<string, TickerData>(),
    getLatest(symbol: string) { return this.tickers.get(symbol); }
};

// --- REACT HOOK ---
export function useBinanceStream() {
    const updateBatch = useMarketStore((state) => state.updateBatch);
    const timeframe = useMarketStore((state) => state.timeframe);

    // Refs for closure stability
    const updateBatchRef = useRef(updateBatch);
    const timeframeRef = useRef(timeframe);
    useEffect(() => { updateBatchRef.current = updateBatch; }, [updateBatch]);
    useEffect(() => { timeframeRef.current = timeframe; }, [timeframe]);

    const soundEngine = useRef(SoundEngine.getInstance());
    const lastUiUpdate = useRef(0);

    useEffect(() => {
        const handleData = (rawData: BinanceTickerPayload[]) => {
            const now = Date.now();
            const shouldUpdateUI = now - lastUiUpdate.current > 1000;
            const uiBatch: TickerData[] = [];
            const currentTimeframe = timeframeRef.current; // Read stable ref

            for (const ticker of rawData) {
                if (!ticker.s.endsWith(TARGET_QUOTE_ASSET)) continue;
                const volume = parseFloat(ticker.q);
                if (volume < MIN_QUOTE_VOLUME) continue;

                const price = parseFloat(ticker.c);
                const percentChange = parseFloat(ticker.P);

                // Sound Logic
                if (!useMarketStore.getState().isMuted) {
                    const muted = useMarketStore.getState().isMuted;
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
                if (updateBatchRef.current) {
                    updateBatchRef.current(uiBatch);
                }
                lastUiUpdate.current = now;
            }
        };

        // Subscribe to global singleton
        activeListeners.add(handleData);
        connectGlobal();

        return () => {
            activeListeners.delete(handleData);
            disconnectGlobal();
        };
    }, []); // ZERO DEPENDENCIES -> Only runs on Mount/Unmount
}
