'use client';

import { useMarketStore } from "@/store/useMarketStore";
import { useEffect, useState } from "react";
import useSWR from 'swr';
import { fetchTokenMetadata } from '@/lib/services/tokenMetadata';
import { MiniChart } from '@/components/MiniChart';
import { MetricChart } from '@/components/MetricChart';
import { TokenMetadata, UnlockAllocation, MetricType, MarketType } from '@/lib/types';
import {
    formatCurrency,
    formatSupply,
    formatDate,
    getDaysUntil,
    calculateUnlockRisk
} from '@/lib/utils';

// Category color mapping for allocation visualization
const CATEGORY_COLORS: Record<string, { bg: string; glow: string }> = {
    'Core Team': { bg: 'bg-orange-500', glow: 'shadow-orange-500/50' },
    'Private Investors': { bg: 'bg-purple-500', glow: 'shadow-purple-500/50' },
    'Ecosystem Fund': { bg: 'bg-teal-500', glow: 'shadow-teal-500/50' },
    'Community Rewards': { bg: 'bg-green-500', glow: 'shadow-green-500/50' },
    'Treasury': { bg: 'bg-blue-500', glow: 'shadow-blue-500/50' },
    'Advisors': { bg: 'bg-pink-500', glow: 'shadow-pink-500/50' },
    'Foundation': { bg: 'bg-cyan-500', glow: 'shadow-cyan-500/50' },
};

const CATEGORY_DOT_COLORS: Record<string, string> = {
    'Core Team': 'bg-orange-500',
    'Private Investors': 'bg-purple-500',
    'Ecosystem Fund': 'bg-teal-500',
    'Community Rewards': 'bg-green-500',
    'Treasury': 'bg-blue-500',
    'Advisors': 'bg-pink-500',
    'Foundation': 'bg-cyan-500',
};

function getCategoryColor(category: string): { bg: string; glow: string } {
    return CATEGORY_COLORS[category] || { bg: 'bg-zinc-500', glow: 'shadow-zinc-500/50' };
}

function getCategoryDotColor(category: string): string {
    return CATEGORY_DOT_COLORS[category] || 'bg-zinc-500';
}

// Skeleton loading component
function MetricSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="h-3 w-16 bg-white/10 rounded mb-2" />
            <div className="h-6 w-24 bg-white/10 rounded" />
        </div>
    );
}

// Metric card component - Obsidian Cell
function MetricCard({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
    return (
        <div className="group p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 transition-all relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5 relative z-10 etched-text">{label}</p>
            <p className="text-xl font-mono font-bold text-zinc-100 relative z-10 tracking-tight">{value}</p>
            {subValue && <p className="text-xs text-zinc-500 mt-1 relative z-10">{subValue}</p>}
        </div>
    );
}

// Tag pill component
function TagPill({ tag }: { tag: string }) {
    return (
        <span className="px-2 py-1 text-[10px] rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase tracking-wider shadow-[0_0_10px_rgba(20,184,166,0.1)]">
            {tag}
        </span>
    );
}

// Chain badge component
function ChainBadge({ chain }: { chain: string }) {
    return (
        <span className="px-2 py-1 text-[10px] rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
            {chain}
        </span>
    );
}

// Stacked allocation bar component
function AllocationBar({ allocations }: { allocations: UnlockAllocation[] }) {
    if (!allocations || allocations.length === 0) return null;

    return (
        <div className="mt-4">
            {/* Stacked Bar */}
            <div className="h-3 rounded-full overflow-hidden flex bg-white/5 shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                {allocations.map((alloc, idx) => {
                    const colors = getCategoryColor(alloc.category);
                    return (
                        <div
                            key={alloc.category}
                            className={`${colors.bg} transition-all duration-500 hover:brightness-125`}
                            style={{ width: `${alloc.percent}%` }}
                            title={`${alloc.category}: ${alloc.percent}%`}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// Allocation legend component
function AllocationLegend({ allocations }: { allocations: UnlockAllocation[] }) {
    if (!allocations || allocations.length === 0) return null;

    return (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {allocations.map((alloc) => (
                <div key={alloc.category} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${getCategoryDotColor(alloc.category)} shadow-[0_0_5px_currentColor]`} />
                    <span className="text-[10px] text-zinc-400">
                        {alloc.category}: <span className="text-zinc-200 font-mono">{alloc.percent}%</span>
                    </span>
                </div>
            ))}
        </div>
    );
}

import TradeTerminal from './TradeTerminal';

// ... imports

export default function DetailDrawer() {
    const { selectedTicker, setSelectedTicker, favorites, toggleFavorite } = useMarketStore();
    const [isVisible, setIsVisible] = useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [chartInterval, setChartInterval] = useState('15m');
    const [marketDataType, setMarketDataType] = useState<MarketType>('futures');
    const intervals = ['1m', '3m', '15m', '30m', '1h', '2h', '4h', '8h', '12h', '1d', '3d', '1w', '1M'];

    // SWR for fetching token metadata
    const { data: metadata, isLoading, error } = useSWR<TokenMetadata>(
        selectedTicker?.symbol ? `metadata-${selectedTicker.symbol}` : null,
        () => fetchTokenMetadata(selectedTicker!.symbol),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000, // 1 minute cache
        }
    );

    useEffect(() => {
        if (selectedTicker) {
            // Small delay to allow mounting before triggering animation
            requestAnimationFrame(() => setIsVisible(true));
            setChartInterval('15m');
        } else {
            setIsVisible(false);
        }
    }, [selectedTicker]);

    const close = () => {
        setIsVisible(false);
        setTimeout(() => setSelectedTicker(null), 300); // Wait for exit animation
    };

    if (!selectedTicker && !isVisible) return null;

    const daysUntilUnlock = metadata?.nextUnlock?.date ? getDaysUntil(metadata.nextUnlock.date) : 0;
    const hasUpcomingUnlock = metadata?.nextUnlock && metadata.nextUnlock.percentOfSupply > 0;
    const circulationRatio = metadata ? (metadata.circulatingSupply / (metadata.maxSupply || metadata.circulatingSupply) * 100) : 0;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 transition-all duration-300 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-lg transition-opacity duration-300"
                onClick={close}
            />

            {/* Obsidian Monolith Window */}
            <div
                className={`
                    relative w-full max-w-[1400px] obsidian-panel holo-scan
                    flex flex-col overflow-hidden
                    transition-all duration-500 ease-out
                    absolute bottom-0 h-[90vh] rounded-t-3xl sm:static sm:h-auto sm:max-h-[92vh] sm:rounded-3xl
                    ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-12 scale-95 opacity-0'}
                `}
            >
                {/* Integrated Close Button - Top Right Metallic Capsule */}
                <button
                    onClick={close}
                    className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-full liquid-button flex items-center gap-2 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300"
                >
                    <span className="text-[10px] font-mono font-bold text-zinc-400 tracking-widest">ESC</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Scrollable Content with Scanner Animation */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* HEADER SECTION - Split Layout */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">

                        {/* Left: Symbol & Meta */}
                        <div className="flex items-center gap-4">
                            {/* Favorite Button */}
                            <button
                                onClick={() => selectedTicker && toggleFavorite(selectedTicker.symbol)}
                                className={`p-3 rounded-2xl liquid-button transition-all duration-300 ${favorites.includes(selectedTicker?.symbol || '')
                                    ? '!bg-gradient-to-r !from-amber-900 !via-amber-800 !to-amber-900 text-amber-300 !border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
                                    : ''
                                    }`}
                                title="Toggle Favorite"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill={favorites.includes(selectedTicker?.symbol || '') ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </button>

                            <div>
                                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter etched-text mb-1">
                                    {selectedTicker?.symbol?.replace('USDT', '')}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-zinc-500 font-mono tracking-wider">/USDT PERPETUAL</span>
                                    {/* Live Indicator */}
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                                        </span>
                                        <span className="text-[8px] font-bold text-green-400 tracking-widest">LIVE</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Massive Price Display */}
                        <div className="text-right">
                            <div className={`text-5xl sm:text-6xl font-black tracking-tighter ${(selectedTicker?.priceChangePercent || 0) >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                                ${selectedTicker?.price?.toFixed(selectedTicker.price < 1 ? 4 : 2)}
                            </div>
                            <div className={`flex items-center justify-end gap-2 mt-1 text-lg font-mono font-bold ${(selectedTicker?.priceChangePercent || 0) >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                                <span className={`px-3 py-1 rounded-lg border ${(selectedTicker?.priceChangePercent || 0) >= 0 ? 'bg-teal-500/10 border-teal-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                    {(selectedTicker?.priceChangePercent || 0) > 0 ? '+' : ''}
                                    {selectedTicker?.priceChangePercent?.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Etched Divider */}
                    <div className="etched-divider mb-8" />

                    {/* Description */}
                    {isLoading ? (
                        <div className="mb-6 animate-pulse">
                            <div className="h-4 w-full bg-white/10 rounded mb-2" />
                            <div className="h-4 w-3/4 bg-white/10 rounded" />
                        </div>
                    ) : metadata?.description && (
                        <p className="text-sm text-zinc-300 mb-8 leading-relaxed max-w-2xl">
                            {metadata.description}
                        </p>
                    )}

                    {/* Tags & Chains */}
                    {isLoading ? (
                        <div className="flex gap-2 mb-8 animate-pulse">
                            <div className="h-6 w-16 bg-white/10 rounded-full" />
                            <div className="h-6 w-20 bg-white/10 rounded-full" />
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2 mb-8">
                            {metadata?.tags?.map((tag) => (
                                <TagPill key={tag} tag={tag} />
                            ))}
                            {metadata?.chains?.map((chain) => (
                                <ChainBadge key={chain} chain={chain} />
                            ))}
                        </div>
                    )}

                    {/* Main Content Stack */}
                    <div className="flex flex-col gap-6 mb-8">

                        {/* 1. Chart Section (Full Bleed - No Border) */}
                        <div className="-mx-6 sm:-mx-10 rounded-none bg-black/30 overflow-hidden relative group h-[350px]">
                            {/* Header Row */}
                            <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start z-10 pointer-events-none">
                                {/* Title (Left) */}
                                <div className="flex items-center gap-2 pointer-events-auto bg-zinc-900/90 backdrop-blur rounded px-2 py-1 border border-white/10 shadow-lg">
                                    <div className={`w-1.5 h-1.5 rounded-full ${Number(selectedTicker?.priceChangePercent || 0) >= 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'} animate-pulse`} />
                                    <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">BINANCE PERP</span>
                                </div>

                                {/* Premium Interval Ribbon (Right) */}
                                <div className="pointer-events-auto flex items-center bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-lg p-0.5 overflow-hidden max-w-[220px] shadow-lg">
                                    <div className="flex overflow-x-auto no-scrollbar scroll-smooth gap-0.5 px-0.5"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                        {intervals.map(int => (
                                            <button
                                                key={int}
                                                onClick={() => setChartInterval(int)}
                                                className={`
                                                    relative px-2 py-1 text-[9px] font-mono font-bold rounded flex-shrink-0 transition-all duration-300
                                                    ${chartInterval === int
                                                        ? 'bg-teal-500/10 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.1)] border border-teal-500/20'
                                                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'}
                                                `}
                                            >
                                                {int}
                                                {chartInterval === int && (
                                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-0.5 bg-teal-500 rounded-full mb-0.5" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Chart Component */}
                            <div className="w-full h-full">
                                {selectedTicker && (
                                    <MiniChart
                                        symbol={selectedTicker.symbol}
                                        color={Number(selectedTicker.priceChangePercent) >= 0 ? '#22c55e' : '#ef4444'}
                                        interval={chartInterval}
                                    />
                                )}
                            </div>
                        </div>

                        {/* 2. Market Intelligence Section */}
                        <div className="-mx-6 sm:-mx-10 px-6 sm:px-10 py-8 border-t border-b border-white/5 bg-gradient-to-b from-black/40 to-transparent">
                            {/* Section Header */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)] animate-pulse" />
                                    <h3 className="text-lg font-black tracking-wide">
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-teal-400 to-blue-400">
                                            MARKET INTELLIGENCE
                                        </span>
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                                    <div className="w-1 h-1 rounded-full bg-teal-500" />
                                    <span className="text-[10px] font-mono font-bold text-zinc-400 tracking-widest">
                                        {chartInterval.toUpperCase()} PERIOD
                                    </span>
                                </div>
                            </div>

                            {/* Market Type Segmented Control - Liquid Metal Style */}
                            <div className="mb-8">
                                <div className="inline-flex p-1 rounded-xl bg-black/40 border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                                    {(['futures', 'spot'] as MarketType[]).map((type) => {
                                        const isActive = marketDataType === type;
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => setMarketDataType(type)}
                                                className={`
                                                    relative px-5 py-2 text-xs font-mono font-bold uppercase tracking-widest
                                                    rounded-lg transition-all duration-300
                                                    ${isActive
                                                        ? 'text-teal-300 bg-gradient-to-r from-teal-900/80 via-teal-800/60 to-teal-900/80 border border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.25)]'
                                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                                                    }
                                                `}
                                            >
                                                {type === 'futures' ? '⚡ Futures' : '📊 Spot'}
                                                {/* Active Glow Bar */}
                                                {isActive && (
                                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent rounded-full" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {selectedTicker && (
                                <>
                                    {/* FUTURES DATA VIEW */}
                                    {marketDataType === 'futures' && (
                                        <div className="space-y-6 w-full overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
                                            {/* Open Interest - Full Width (Primary) */}
                                            <div className="w-full min-w-0 overflow-hidden">
                                                <MetricChart
                                                    symbol={selectedTicker.symbol}
                                                    metric="openInterest"
                                                    period={chartInterval}
                                                    color="#a855f7"
                                                />
                                            </div>

                                            {/* Ratio Metrics - 2 Column Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                                <div className="min-w-0 overflow-hidden">
                                                    <MetricChart
                                                        symbol={selectedTicker.symbol}
                                                        metric="globalLongShort"
                                                        period={chartInterval}
                                                        color="#14b8a6"
                                                    />
                                                </div>
                                                <div className="min-w-0 overflow-hidden">
                                                    <MetricChart
                                                        symbol={selectedTicker.symbol}
                                                        metric="takerBuySell"
                                                        period={chartInterval}
                                                        color="#22c55e"
                                                    />
                                                </div>
                                            </div>

                                            {/* Top Traders - 2 Column Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                                <div className="min-w-0 overflow-hidden">
                                                    <MetricChart
                                                        symbol={selectedTicker.symbol}
                                                        metric="topLongShortAccounts"
                                                        period={chartInterval}
                                                        color="#3b82f6"
                                                    />
                                                </div>
                                                <div className="min-w-0 overflow-hidden">
                                                    <MetricChart
                                                        symbol={selectedTicker.symbol}
                                                        metric="topLongShortPositions"
                                                        period={chartInterval}
                                                        color="#f97316"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SPOT DATA VIEW - Full Margin Intelligence Grid */}
                                    {marketDataType === 'spot' && (
                                        <div className="space-y-6 w-full overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
                                            {/* Money Flow - Full Width (Primary) */}
                                            <div className="w-full min-w-0 overflow-hidden">
                                                <MetricChart
                                                    symbol={selectedTicker.symbol}
                                                    metric="moneyFlow"
                                                    period={chartInterval}
                                                    color="#F59E0B"
                                                    marketType="spot"
                                                />
                                            </div>

                                            {/* Margin Metrics - 2 Column Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                                <div className="min-w-0 overflow-hidden">
                                                    <MetricChart
                                                        symbol={selectedTicker.symbol}
                                                        metric="24hrLargeInflow"
                                                        period={chartInterval}
                                                        color="#10B981"
                                                        marketType="spot"
                                                    />
                                                </div>
                                                <div className="min-w-0 overflow-hidden">
                                                    <MetricChart
                                                        symbol={selectedTicker.symbol}
                                                        metric="marginDebtGrowth"
                                                        period={chartInterval}
                                                        color="#EF4444"
                                                        marketType="spot"
                                                    />
                                                </div>
                                            </div>

                                            {/* Advanced Margin Metrics - 2 Column Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                                <div className="min-w-0 overflow-hidden">
                                                    <MetricChart
                                                        symbol={selectedTicker.symbol}
                                                        metric="marginLongShortRatio"
                                                        period={chartInterval}
                                                        color="#3B82F6"
                                                        marketType="spot"
                                                    />
                                                </div>
                                                <div className="min-w-0 overflow-hidden">
                                                    <MetricChart
                                                        symbol={selectedTicker.symbol}
                                                        metric="isoMarginBorrowRatio"
                                                        period={chartInterval}
                                                        color="#8B5CF6"
                                                        marketType="spot"
                                                    />
                                                </div>
                                            </div>

                                            {/* Taker Buy/Sell Ratio - Full Width (Strategic Replacement) */}
                                            <div className="w-full min-w-0 overflow-hidden">
                                                <MetricChart
                                                    symbol={selectedTicker.symbol}
                                                    metric="takerBuySell"
                                                    period={chartInterval}
                                                    color="#22C55E"
                                                    marketType="spot"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* 3. Key Metrics (4-Column Grid) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {isLoading ? (
                                <>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5"><MetricSkeleton /></div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5"><MetricSkeleton /></div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5"><MetricSkeleton /></div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/5"><MetricSkeleton /></div>
                                </>
                            ) : (
                                <>
                                    <MetricCard
                                        label="Market Cap"
                                        value={metadata ? formatCurrency(metadata.marketCap) : '—'}
                                    />
                                    <MetricCard
                                        label="FDV"
                                        value={metadata ? formatCurrency(metadata.fdv) : '—'}
                                    />
                                    <MetricCard
                                        label="Circulating"
                                        value={metadata ? formatSupply(metadata.circulatingSupply) : '—'}
                                        subValue={metadata?.maxSupply ? `${circulationRatio.toFixed(1)}% of max` : 'Infinite'}
                                    />
                                    <MetricCard
                                        label="24h Volume"
                                        value={`$${parseInt(selectedTicker?.volume?.toString() || '0').toLocaleString()}`}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Token Unlock Section */}
                    {isLoading ? (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 animate-pulse mb-6">
                            <div className="h-4 w-24 bg-white/10 rounded mb-3" />
                            <div className="h-8 w-32 bg-white/10 rounded" />
                        </div>
                    ) : (hasUpcomingUnlock || metadata?.nextUnlock) ? (
                        hasUpcomingUnlock ? (() => {
                            const risk = calculateUnlockRisk(metadata?.nextUnlock?.percentOfSupply || 0);
                            return (
                                <div className={`p-5 rounded-xl border mb-6 ${risk.bgClass} ${risk.borderClass} relative overflow-hidden`}>
                                    {/* Background Glow */}
                                    <div className={`absolute inset-0 opacity-10 ${risk.colorClass.replace('text-', 'bg-')}`} />

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${risk.colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                <p className={`text-xs uppercase tracking-widest ${risk.colorClass}`}>
                                                    Token Unlock Event
                                                </p>
                                            </div>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${risk.bgClass} ${risk.colorClass} border ${risk.borderClass} shadow-[0_0_10px_currentColor]`}>
                                                {risk.labelTR}
                                            </span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-4">
                                            <div>
                                                <p className={`text-2xl font-bold font-mono ${risk.colorClass} drop-shadow-md`}>
                                                    {daysUntilUnlock} gün kaldı
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-1">
                                                    Scheduled for {formatDate(metadata?.nextUnlock?.date || '')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-mono ${risk.colorClass}`}>
                                                    {formatCurrency(metadata?.nextUnlock?.valueUSD || 0)}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    Represents {metadata?.nextUnlock?.percentOfSupply}% of supply
                                                </p>
                                            </div>
                                        </div>
                                        {metadata?.nextUnlock?.allocations && metadata.nextUnlock.allocations.length > 0 && (
                                            <>
                                                <AllocationBar allocations={metadata.nextUnlock.allocations} />
                                                <AllocationLegend allocations={metadata.nextUnlock.allocations} />
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })() : (
                            // No upcoming unlock but we have metadata
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-6 flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Token Unlock</p>
                                    <p className="text-sm text-zinc-300">No major unlocks scheduled in the near future.</p>
                                </div>
                            </div>
                        )
                    ) : null}

                    {/* Error State */}
                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-xs text-red-400">Metadata could not be loaded.</p>
                        </div>
                    )}
                </div>

                {/* Footer (Fixed at bottom of window) */}
                <div className="p-6 border-t border-white/10 bg-white/[0.03] backdrop-blur-sm flex justify-end relative z-10">
                    <button
                        onClick={() => setIsTerminalOpen(true)}
                        className="w-full sm:w-auto px-8 py-3.5 bg-teal-500 hover:bg-teal-400 text-black font-bold tracking-widest rounded-xl transition-all duration-300 shadow-[0_0_25px_rgba(20,184,166,0.35)] hover:shadow-[0_0_40px_rgba(20,184,166,0.65)] group"
                    >
                        <span className="group-hover:tracking-[0.2em] transition-all duration-300">OPEN TERMINAL</span>
                    </button>
                </div>

                {/* TRADE TERMINAL OVERLAY */}
                {isTerminalOpen && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
                        <TradeTerminal onClose={() => setIsTerminalOpen(false)} />
                    </div>
                )}
            </div>
        </div>
    );
}
