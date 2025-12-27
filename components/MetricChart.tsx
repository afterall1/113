'use client';

import { useEffect, useRef, useMemo } from 'react';
import useSWR from 'swr';
import {
    createChart,
    ColorType,
    IChartApi,
    ISeriesApi,
    LineSeries,
    HistogramSeries,
    Time,
} from 'lightweight-charts';
import { MetricType, MarketType, OpenInterestData, LongShortRatioData, TakerBuySellData, MoneyFlowData, MarginDebtData, MarginLongShortData } from '@/lib/types';

interface MetricChartProps {
    symbol: string;
    metric: MetricType;
    period?: string;
    color?: string;
    limit?: number;
    className?: string;
    marketType?: MarketType;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Format large numbers for display
const formatValue = (value: number, metric: MetricType): string => {
    if (metric === 'openInterest') {
        if (value >= 1000) return `${(value / 1000).toFixed(2)}B`;
        if (value >= 1) return `${value.toFixed(2)}M`;
        return `${(value * 1000).toFixed(0)}K`;
    }
    // Spot/Margin metrics formatting
    if (metric === 'moneyFlow' || metric === '24hrLargeInflow') {
        if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(2)}B`;
        if (Math.abs(value) >= 1) return `${value.toFixed(2)}M`;
        return `${(value * 1000).toFixed(0)}K`;
    }
    if (metric === 'marginDebtGrowth' || metric === 'isoMarginBorrowRatio') {
        return `${value.toFixed(2)}%`;
    }
    return value.toFixed(2);
};

// Convert API response to chart-compatible format
const transformData = (data: any[], metric: MetricType): { time: Time; value: number }[] => {
    if (!data || !Array.isArray(data)) return [];

    return data
        .map((item) => {
            let value: number;
            const timestamp = item.timestamp / 1000;

            switch (metric) {
                case 'openInterest':
                    value = parseFloat((item as OpenInterestData).sumOpenInterestValue) / 1e6;
                    break;
                case 'topLongShortAccounts':
                case 'topLongShortPositions':
                case 'globalLongShort':
                    value = parseFloat((item as LongShortRatioData).longShortRatio);
                    break;
                case 'takerBuySell':
                    value = parseFloat((item as TakerBuySellData).buySellRatio);
                    break;
                // Spot/Margin Metrics - use pre-normalized 'value' field from route.ts
                case 'moneyFlow':
                case '24hrLargeInflow':
                    // route.ts already provides normalized 'value' field
                    value = parseFloat(item.value || item.netInflow || '0');
                    break;
                case 'marginDebtGrowth':
                    // debtGrowthRate is already a percentage
                    value = parseFloat(item.debtGrowthRate || item.value || '0');
                    break;
                case 'marginLongShortRatio':
                    value = parseFloat((item as MarginLongShortData).longShortRatio || item.value || '0');
                    break;
                case 'isoMarginBorrowRatio':
                case 'platformConcentration':
                    value = parseFloat(item.longShortRatio || item.value || item.ratio || '0');
                    break;
                case 'fundingRate':
                    // Funding rate comes as decimal (e.g., 0.0001 = 0.01%)
                    value = parseFloat(item.fundingRate || '0') * 100; // Convert to percentage
                    break;
                default:
                    value = parseFloat(item.value) || 0;
            }

            return { time: timestamp as Time, value };
        })
        .filter((d) => d.value !== undefined && !isNaN(d.value))
        .sort((a, b) => Number(a.time) - Number(b.time));
};

// Skeleton loader component
function ChartSkeleton() {
    return (
        <div className="absolute inset-0 flex flex-col p-4 animate-pulse">
            {/* Header skeleton */}
            <div className="mb-4">
                <div className="h-3 w-24 bg-white/10 rounded mb-2" />
                <div className="h-8 w-32 bg-white/10 rounded" />
            </div>
            {/* Chart area skeleton */}
            <div className="flex-1 flex items-end gap-1">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 bg-white/5 rounded-t"
                        style={{ height: `${30 + Math.random() * 50}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

export function MetricChart({
    symbol,
    metric,
    period = '5m',
    color = '#14b8a6',
    limit = 30,
    className,
    marketType = 'futures',
}: MetricChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Line'> | ISeriesApi<'Histogram'> | null>(null);

    // Fetch metric data via Proxy API
    const { data: rawData, isLoading, error } = useSWR(
        symbol && metric
            ? `/api/binance/metrics?symbol=${symbol}&metric=${metric}&period=${period}&limit=${limit}&marketType=${marketType}`
            : null,
        fetcher,
        {
            refreshInterval: 60000,
            shouldRetryOnError: false,
        }
    );

    // Transform and memoize chart data
    const chartData = useMemo(() => {
        if (!rawData || !Array.isArray(rawData)) return [];
        return transformData(rawData, metric);
    }, [rawData, metric]);

    // Get latest value for header display
    const latestValue = useMemo(() => {
        if (chartData.length === 0) return null;
        return chartData[chartData.length - 1].value;
    }, [chartData]);

    // Calculate trend (comparing last value to first)
    const trend = useMemo(() => {
        if (chartData.length < 2) return 'neutral';
        const first = chartData[0].value;
        const last = chartData[chartData.length - 1].value;
        if (last > first * 1.01) return 'up';
        if (last < first * 0.99) return 'down';
        return 'neutral';
    }, [chartData]);

    // Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#a1a1aa', // Zinc-400
                fontFamily: 'ui-monospace, monospace',
                fontSize: 11,
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { color: 'rgba(255,255,255,0.03)', visible: true },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
                visible: true,
                fixLeftEdge: true,
                fixRightEdge: true,
                rightOffset: 5, // Space between last bar and right edge
            },
            rightPriceScale: {
                borderColor: 'rgba(255,255,255,0.1)',
                visible: true,
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            leftPriceScale: {
                visible: false,
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: 'rgba(255,255,255,0.2)',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#27272a',
                },
                horzLine: {
                    color: 'rgba(255,255,255,0.2)',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#27272a',
                },
            },
            handleScroll: true,
            handleScale: true,
        });

        // Choose series type based on metric
        if (metric === 'openInterest') {
            const series = chart.addSeries(HistogramSeries, {
                color: color,
                priceFormat: {
                    type: 'custom',
                    formatter: (price: number) => `${price.toFixed(1)}M`,
                },
            });
            seriesRef.current = series;
        } else {
            const series = chart.addSeries(LineSeries, {
                color: color,
                lineWidth: 2,
                priceFormat: {
                    type: 'custom',
                    formatter: (price: number) => price.toFixed(2),
                },
                crosshairMarkerVisible: true,
                crosshairMarkerRadius: 4,
            });
            seriesRef.current = series;
        }

        chartRef.current = chart;

        // Resize Handler with fitContent
        const resizeObserver = new ResizeObserver((entries) => {
            if (chartContainerRef.current && chartRef.current) {
                const entry = entries[0];
                if (entry) {
                    const { width, height } = entry.contentRect;
                    // Ensure dimensions don't exceed container
                    chartRef.current.applyOptions({
                        width: Math.max(width, 100),
                        height: Math.max(height, 100),
                    });
                    // Refit content after resize
                    chartRef.current.timeScale().fitContent();
                }
            }
        });
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };
    }, [metric, color]);

    // Update Data
    useEffect(() => {
        if (chartData.length > 0 && seriesRef.current && chartRef.current) {
            seriesRef.current.setData(chartData as any);
            chartRef.current.timeScale().fitContent();
        }
    }, [chartData]);

    // Metric display labels
    const metricLabels: Record<MetricType, string> = {
        openInterest: 'Open Interest',
        topLongShortAccounts: 'Top Traders (Accounts)',
        topLongShortPositions: 'Top Traders (Positions)',
        globalLongShort: 'Global Long/Short',
        takerBuySell: 'Taker Buy/Sell',
        basis: 'Basis',
        fundingRate: 'Funding Rate',
        // Spot/Margin Metrics
        '24hrLargeInflow': '24h Large Inflow',
        marginDebtGrowth: 'Margin Debt Growth',
        isoMarginBorrowRatio: 'Isolated Margin Borrow',
        platformConcentration: 'Platform Concentration',
        marginLongShortRatio: 'Margin Long/Short',
        moneyFlow: 'Money Flow',
    };

    // Value color based on trend and metric type
    const getValueColor = () => {
        if (metric === 'openInterest') return 'text-purple-400';
        if (trend === 'up') return 'text-teal-400';
        if (trend === 'down') return 'text-red-400';
        return 'text-white';
    };

    return (
        <div className={`relative h-64 w-full bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden ${className || ''}`}>

            {/* Header Section */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 pb-2 bg-gradient-to-b from-zinc-900/90 to-transparent">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-zinc-400 mb-1">
                            {metricLabels[metric] || metric}
                        </p>
                        {latestValue !== null ? (
                            <p className={`text-2xl font-mono font-bold ${getValueColor()} tracking-tight`}>
                                {formatValue(latestValue, metric)}
                                {metric !== 'openInterest' && (
                                    <span className="text-xs text-zinc-500 ml-1">ratio</span>
                                )}
                            </p>
                        ) : (
                            <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
                        )}
                    </div>
                    {/* Trend Indicator */}
                    {latestValue !== null && trend !== 'neutral' && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${trend === 'up'
                            ? 'bg-teal-500/10 text-teal-400'
                            : 'bg-red-500/10 text-red-400'
                            }`}>
                            <svg
                                className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 4.414 6.707 7.707a1 1 0 01-1.414 0z" />
                            </svg>
                            <span className="text-[10px] font-mono font-bold">
                                {trend === 'up' ? 'UP' : 'DOWN'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && <ChartSkeleton />}

            {/* Error State */}
            {error && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60">
                    <svg className="w-8 h-8 text-red-500/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs font-mono text-red-500/70 tracking-wider">
                        DATA UNAVAILABLE
                    </span>
                </div>
            )}

            {/* Chart Container - Absolute positioned to prevent overflow */}
            <div className="absolute inset-0 pt-16 overflow-hidden">
                <div
                    ref={chartContainerRef}
                    className="w-full h-full"
                    style={{ visibility: isLoading ? 'hidden' : 'visible' }}
                />
            </div>

            {/* Subtle Vignette Overlay */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]" />
        </div>
    );
}
