'use client';

import { useMarketStore } from "@/store/useMarketStore";
import { useEffect, useState } from "react";
import useSWR from 'swr';
import { fetchTokenMetadata } from '@/lib/services/tokenMetadata';
import { TokenMetadata } from '@/lib/types';
import {
    formatCurrency,
    formatSupply,
    formatDate,
    getDaysUntil,
    calculateUnlockRisk
} from '@/lib/utils';

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
        <div className="group p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.07]">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-lg font-mono text-zinc-200">{value}</p>
            {subValue && <p className="text-xs text-zinc-500 mt-0.5">{subValue}</p>}
        </div>
    );
}

// Tag pill component
function TagPill({ tag }: { tag: string }) {
    return (
        <span className="px-2 py-1 text-[10px] rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase tracking-wider">
            {tag}
        </span>
    );
}

// Chain badge component
function ChainBadge({ chain }: { chain: string }) {
    return (
        <span className="px-2 py-1 text-[10px] rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {chain}
        </span>
    );
}

export default function DetailDrawer() {
    const { selectedTicker, setSelectedTicker, favorites, toggleFavorite } = useMarketStore();
    const [isVisible, setIsVisible] = useState(false);

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
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [selectedTicker]);

    const close = () => {
        setIsVisible(false);
        setTimeout(() => setSelectedTicker(null), 300); // Wait for transition
    };

    if (!selectedTicker && !isVisible) return null;

    const daysUntilUnlock = metadata?.nextUnlock?.date ? getDaysUntil(metadata.nextUnlock.date) : 0;
    const hasUpcomingUnlock = metadata?.nextUnlock && metadata.nextUnlock.percentOfSupply > 0;
    const circulationRatio = metadata ? (metadata.circulatingSupply / (metadata.maxSupply || metadata.circulatingSupply) * 100) : 0;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={close}
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            />

            {/* Drawer Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/10 z-40 transform transition-transform duration-300 ease-out shadow-2xl overflow-y-auto ${isVisible ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="p-6 pb-32">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-4xl font-bold text-white tracking-tighter mb-1">
                                {selectedTicker?.symbol?.replace('USDT', '')}
                                <span className="text-sm text-zinc-500 ml-2 font-mono">/USDT</span>
                            </h2>
                            <div className={`text-lg font-mono flex items-center gap-2 ${(selectedTicker?.priceChangePercent || 0) >= 0 ? 'text-teal-400' : 'text-red-500'
                                }`}>
                                <span className="text-3xl font-bold tracking-tight">
                                    ${selectedTicker?.price?.toFixed(selectedTicker.price < 1 ? 4 : 2)}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-white/5 text-sm">
                                    {(selectedTicker?.priceChangePercent || 0) > 0 ? '+' : ''}
                                    {selectedTicker?.priceChangePercent}%
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Favorite Button */}
                            <button
                                onClick={() => selectedTicker && toggleFavorite(selectedTicker.symbol)}
                                className={`p-2 rounded-full transition-all ${favorites.includes(selectedTicker?.symbol || '')
                                    ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20'
                                    : 'text-zinc-600 hover:text-white hover:bg-white/10'
                                    }`}
                                title="Toggle Favorite"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={favorites.includes(selectedTicker?.symbol || '') ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </button>

                            <button
                                onClick={close}
                                className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
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
                        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                            {metadata.description}
                        </p>
                    )}

                    {/* Tags & Chains */}
                    {isLoading ? (
                        <div className="flex gap-2 mb-6 animate-pulse">
                            <div className="h-6 w-16 bg-white/10 rounded-full" />
                            <div className="h-6 w-20 bg-white/10 rounded-full" />
                            <div className="h-6 w-14 bg-white/10 rounded-full" />
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {metadata?.tags?.map((tag) => (
                                <TagPill key={tag} tag={tag} />
                            ))}
                            {metadata?.chains?.map((chain) => (
                                <ChainBadge key={chain} chain={chain} />
                            ))}
                        </div>
                    )}

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
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

                    {/* Next Unlock Card */}
                    {isLoading ? (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 animate-pulse mb-6">
                            <div className="h-4 w-24 bg-white/10 rounded mb-3" />
                            <div className="h-8 w-32 bg-white/10 rounded" />
                        </div>
                    ) : hasUpcomingUnlock ? (
                        (() => {
                            const risk = calculateUnlockRisk(metadata?.nextUnlock?.percentOfSupply || 0);
                            return (
                                <div className={`p-4 rounded-xl border mb-6 ${risk.bgClass} ${risk.borderClass}`}>
                                    {/* Header with Risk Badge */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${risk.colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <p className={`text-xs uppercase tracking-widest ${risk.colorClass}`}>
                                                Token Unlock
                                            </p>
                                        </div>
                                        {/* Risk Badge */}
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${risk.bgClass} ${risk.colorClass} border ${risk.borderClass}`}>
                                            {risk.labelTR}
                                        </span>
                                    </div>
                                    {/* Content */}
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className={`text-2xl font-bold font-mono ${risk.colorClass}`}>
                                                {daysUntilUnlock} gün kaldı
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-1">
                                                {formatDate(metadata?.nextUnlock?.date || '')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-mono ${risk.colorClass}`}>
                                                {formatCurrency(metadata?.nextUnlock?.valueUSD || 0)}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {metadata?.nextUnlock?.percentOfSupply}% supply
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-6">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest">Token Unlock</p>
                            </div>
                            <p className="text-sm text-zinc-400 mt-2">Yaklaşan token unlock yok</p>
                        </div>
                    )}

                    {/* Mini Chart Placeholder */}
                    <div className="h-40 rounded-xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 flex items-center justify-center">
                        <p className="text-zinc-700 text-xs tracking-widest">MINI CHART PREVIEW</p>
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-xs text-red-400">Metadata yüklenirken hata oluştu</p>
                        </div>
                    )}
                </div>

                {/* Fixed Bottom Button */}
                <div className="fixed bottom-0 right-0 w-full sm:w-[420px] p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
                    <button className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-black font-bold tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                        OPEN TRADE TERMINAL
                    </button>
                </div>
            </div>
        </>
    );
}
