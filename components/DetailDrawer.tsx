'use client';

import { useMarketStore } from "@/store/useMarketStore";
import { useEffect, useState } from "react";
import useSWR from 'swr';
import { fetchTokenMetadata } from '@/lib/services/tokenMetadata';
import { MiniChart } from '@/components/MiniChart';
import { TokenMetadata, UnlockAllocation } from '@/lib/types';
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

// Metric card component
function MetricCard({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
    return (
        <div className="group p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all hover:bg-white/[0.08] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 relative z-10">{label}</p>
            <p className="text-lg font-mono text-zinc-200 relative z-10">{value}</p>
            {subValue && <p className="text-xs text-zinc-500 mt-0.5 relative z-10">{subValue}</p>}
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 transition-all duration-300 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
                onClick={close}
            />

            {/* Aerogel Holographic Window */}
            <div
                className={`
                    relative w-full max-w-3xl 
                    bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 
                    backdrop-blur-xl border border-white/10 border-t-white/20
                    shadow-[0_0_50px_rgba(0,0,0,0.5)] 
                    flex flex-col overflow-hidden
                    transition-all duration-300 ease-out
                    absolute bottom-0 h-[80vh] rounded-t-2xl sm:static sm:h-auto sm:max-h-[85vh] sm:rounded-2xl
                    ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}
                `}
            >
                {/* Top Glow Effect */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                {/* Scanline Texture (Subtle) */}
                <div className="absolute inset-0 pointer-events-none bg-[url('/scanline.png')] opacity-[0.03] bg-repeat"
                    style={{ backgroundSize: '100% 4px' }} />

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar relative z-10">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tighter mb-1 drop-shadow-lg">
                                {selectedTicker?.symbol?.replace('USDT', '')}
                                <span className="text-sm text-zinc-500 ml-2 font-mono">/USDT</span>
                            </h2>
                            <div className={`text-lg font-mono flex items-center gap-3 ${(selectedTicker?.priceChangePercent || 0) >= 0 ? 'text-teal-400' : 'text-red-500'}`}>
                                <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                                    ${selectedTicker?.price?.toFixed(selectedTicker.price < 1 ? 4 : 2)}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-white/5 text-sm border border-white/5">
                                    {(selectedTicker?.priceChangePercent || 0) > 0 ? '+' : ''}
                                    {selectedTicker?.priceChangePercent}%
                                </span>
                                {/* Live Indicator */}
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-[9px] font-bold text-green-400 tracking-wider">LIVE</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Favorite Button */}
                            <button
                                onClick={() => selectedTicker && toggleFavorite(selectedTicker.symbol)}
                                className={`p-2 rounded-full transition-all border border-transparent ${favorites.includes(selectedTicker?.symbol || '')
                                    ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20 hover:bg-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.2)]'
                                    : 'text-zinc-600 hover:text-white hover:bg-white/10 hover:border-white/10'
                                    }`}
                                title="Toggle Favorite"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={favorites.includes(selectedTicker?.symbol || '') ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </button>

                            {/* Close Button */}
                            <button
                                onClick={close}
                                className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors border border-transparent hover:border-white/10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    {isLoading ? (
                        <div className="mb-6 animate-pulse">
                            <div className="h-4 w-full bg-white/10 rounded mb-2" />
                            <div className="h-4 w-3/4 bg-white/10 rounded" />
                        </div>
                    ) : metadata?.description && (
                        <p className="text-sm text-zinc-400 mb-8 leading-relaxed max-w-2xl">
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

                        {/* 1. Chart Section (Full Width Prominent) */}
                        <div className="rounded-xl border border-white/5 bg-black/40 overflow-hidden relative group h-[320px] shadow-inner shadow-black/50">
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

                        {/* 2. Key Metrics (4-Column Grid) */}
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
                <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end relative z-10">
                    <button
                        onClick={() => setIsTerminalOpen(true)}
                        className="w-full sm:w-auto px-8 py-3 bg-teal-500 hover:bg-teal-400 text-black font-bold tracking-widest rounded-lg transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_35px_rgba(20,184,166,0.6)] group"
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
