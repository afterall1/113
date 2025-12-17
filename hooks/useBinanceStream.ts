import { useEffect, useRef } from 'react';
import { useMarketStore } from '@/store/useMarketStore';
import { DataBuffer } from '@/lib/buffer';
import { BinanceTickerPayload, TickerData } from '@/lib/types';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/!ticker@arr';

// Filtering Constants
const MIN_QUOTE_VOLUME = 1_000_000; // 1M USDT
const TARGET_QUOTE_ASSET = 'USDT';

export function useBinanceStream() {
    const updateBatch = useMarketStore((state) => state.updateBatch);
    const bufferRef = useRef(new DataBuffer(500));
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let reconnectTimeout: NodeJS.Timeout;

        const connect = () => {
            wsRef.current = new WebSocket(BINANCE_WS_URL);

            wsRef.current.onopen = () => {
                console.log('[Liquidity Nebula] Connected to Binance Stream');
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const rawData: BinanceTickerPayload[] = JSON.parse(event.data);
                    const filteredData: TickerData[] = [];

                    for (const ticker of rawData) {
                        // Filter: Only USDT pairs
                        if (!ticker.s.endsWith(TARGET_QUOTE_ASSET)) continue;

                        // Filter: Volume > 1M
                        const volume = parseFloat(ticker.q);
                        if (volume < MIN_QUOTE_VOLUME) continue;

                        filteredData.push({
                            symbol: ticker.s,
                            price: parseFloat(ticker.c),
                            volume: volume,
                            priceChangePercent: parseFloat(ticker.P),
                            timeFrame: '24h', // Default to 24h for now
                        });
                    }

                    if (filteredData.length > 0) {
                        bufferRef.current.push(filteredData);
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

        // Throttled Flush Loop
        const flushInterval = setInterval(() => {
            const batch = bufferRef.current.flush();
            if (batch) {
                updateBatch(batch);
            }
        }, 100); // Check buffer frequently, but flush respects buffer delay

        return () => {
            wsRef.current?.close();
            clearTimeout(reconnectTimeout);
            clearInterval(flushInterval);
        };
    }, [updateBatch]);
}
