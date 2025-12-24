'use client';

import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';
import { CandleData } from '@/lib/types';

interface MiniChartProps {
    symbol: string;
    color?: string;
    interval?: string;
    className?: string; // Optional: Allow parent to control container styling
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MiniChart({ symbol, color = '#22c55e', interval = '15m', className }: MiniChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    // Fetch data via Proxy API
    const { data: candleData, isLoading, error } = useSWR<CandleData[]>(
        symbol ? `/api/binance/klines?symbol=${symbol}&interval=${interval}&limit=1500` : null,
        fetcher,
        {
            refreshInterval: 5000,
            shouldRetryOnError: false, // Don't retry on invalid symbols
        }
    );

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Create Chart Instance
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#94a3b8', // Slate-400
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { color: 'rgba(255,255,255,0.02)', style: 0, visible: true }, // Ultra-faint grid
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                borderColor: '#334155',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: '#334155',
                visible: true, // Force visible
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
            crosshair: {
                // Nebula feel - precise crosshair
                mode: 1, // Normal
                vertLine: {
                    color: '#64748b',
                    width: 1,
                    style: 3, // Dashed
                    labelBackgroundColor: '#1e293b',
                },
                horzLine: {
                    color: '#64748b',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#1e293b',
                },
            },
        });

        // Add Series
        const series = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',          // Green-500
            downColor: '#ef4444',        // Red-500
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
            borderVisible: false,
        });

        chartRef.current = chart;
        seriesRef.current = series;

        // Resize Handler
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                });
            }
        };

        const resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
        };
    }, []); // Init once

    // Data Update Effect
    useEffect(() => {
        // Guard: Ensure candleData is actually an array (API might return error object)
        if (candleData && Array.isArray(candleData) && seriesRef.current && chartRef.current) {
            // Ensure data is valid and sorted
            // lightweight-charts expects sorted ascending time
            const validData = candleData
                .filter(d => d.time && d.open && d.high && d.low && d.close)
                .sort((a, b) => (Number(a.time) - Number(b.time)));

            // Cast to specific library type structure just to satisfy TS stricter checks if needed
            // But CandleData usually matches CandlestickData<Time> if defined correctly
            seriesRef.current.setData(validData as any);

            // Auto fit content only on first significant load or manually if requested
            // Doing it every 5s might disturb user panning. 
            // We'll fit content initially.
            // Check if we already have visible logical range? 
            // For simple MiniChart, assume auto-fit is desired behavior for now.
            // Force fit content after a small delay to ensure layout validation
            setTimeout(() => {
                chartRef.current?.timeScale().fitContent();
            }, 50);
        }
    }, [candleData]);

    return (
        <div className="w-full h-full relative group min-h-[200px]">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs font-mono z-10 bg-black/50 backdrop-blur-sm tracking-wider">
                    <span className="animate-pulse">LOADING MARKET DATA...</span>
                </div>
            )}
            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 text-xs font-mono z-10 bg-black/80 backdrop-blur-sm">
                    <svg className="w-8 h-8 mb-2 text-red-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="tracking-wider">DATA UNAVAILABLE</span>
                    <span className="text-[9px] text-zinc-600 mt-1">{symbol}</span>
                </div>
            )}
            {/* Chart Container */}
            <div ref={chartContainerRef} className="w-full h-full" />

            {/* Overlay Gradient for seamless bleed integration */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.6)]" />
        </div>
    );
}
