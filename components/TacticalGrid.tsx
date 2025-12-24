'use client';

import { useState, useEffect } from 'react';
import { useMarketStore, GridSlot } from '@/store/useMarketStore';
import { MiniChart } from './MiniChart';
import { CoinSelector } from './CoinSelector';
import { streamStore } from '@/hooks/useBinanceStream';

/**
 * Tactical Grid Component - Neural Lattice Design
 * A 3x3 responsive grid for monitoring multiple assets simultaneously.
 * Each slot can hold a MiniChart or display an empty placeholder for coin selection.
 */
export function TacticalGrid() {
    const { gridSlots, setGridSlot, clearGridSlot, activeSlotId, setActiveSlotId, toggleViewMode } = useMarketStore();

    // Track which slot is currently being assigned (for CoinSelector)
    const [selectingSlotId, setSelectingSlotId] = useState<number | null>(null);

    // Force re-render for live data
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => forceUpdate(n => n + 1), 500);
        return () => clearInterval(interval);
    }, []);

    // Handle slot click for empty slots - Opens CoinSelector
    const handleAddCoin = (slotId: number) => {
        setSelectingSlotId(slotId);
    };

    // Handle coin selection from CoinSelector
    const handleCoinSelected = (symbol: string) => {
        if (selectingSlotId !== null) {
            setGridSlot(selectingSlotId, symbol);
        }
        setSelectingSlotId(null);
    };

    // Handle clearing a slot
    const handleClearSlot = (slotId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        clearGridSlot(slotId);
    };

    return (
        <div className="fixed inset-0 z-40 bg-zinc-950 neural-grid-bg overflow-auto">
            {/* Header Bar - Liquid Metal */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 liquid-metal !rounded-none">
                <div className="flex items-center gap-4">
                    {/* Grid Icon */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 flex items-center justify-center border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                        <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-[0.15em] text-white uppercase etched-text">
                            Neural Lattice
                        </h1>
                        <p className="text-[10px] font-mono text-teal-400/70 tracking-widest">
                            {gridSlots.filter(s => s.symbol).length}/9 MODULES ACTIVE
                        </p>
                    </div>
                </div>

                {/* Close / Return to Nebula Button */}
                <button
                    onClick={toggleViewMode}
                    className="group flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-button transition-all duration-300"
                >
                    <svg className="w-4 h-4 text-zinc-400 group-hover:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    <span className="text-xs font-mono font-bold text-zinc-300 group-hover:text-white tracking-widest transition-colors">
                        NEBULA
                    </span>
                </button>
            </div>

            {/* Grid Container */}
            <div className="p-6 min-h-[calc(100vh-80px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 h-full">
                    {gridSlots.map((slot) => (
                        <GridSlotCard
                            key={slot.id}
                            slot={slot}
                            isActive={activeSlotId === slot.id}
                            onAdd={() => handleAddCoin(slot.id)}
                            onClear={(e) => handleClearSlot(slot.id, e)}
                            onSelect={() => setActiveSlotId(slot.id)}
                        />
                    ))}
                </div>
            </div>

            {/* CoinSelector Modal */}
            <CoinSelector
                isOpen={selectingSlotId !== null}
                onClose={() => setSelectingSlotId(null)}
                onSelect={handleCoinSelected}
            />
        </div>
    );
}

/**
 * Individual Grid Slot Card Component - Neural/Holo Design
 */
interface GridSlotCardProps {
    slot: GridSlot;
    isActive: boolean;
    onAdd: () => void;
    onClear: (e: React.MouseEvent) => void;
    onSelect: () => void;
}

function GridSlotCard({ slot, isActive, onAdd, onClear, onSelect }: GridSlotCardProps) {
    const isEmpty = !slot.symbol;

    // Get live data for filled slots
    const liveData = slot.symbol ? streamStore.tickers.get(slot.symbol) : null;
    const price = liveData?.price || 0;
    const changePercent = liveData?.priceChangePercent || 0;
    const volume = liveData?.volume || 0;
    const isPositive = changePercent >= 0;

    // EMPTY STATE - Docking Bay
    if (isEmpty) {
        return (
            <button
                onClick={onAdd}
                className="group relative h-[32vh] min-h-[280px] neural-slot empty flex flex-col items-center justify-center gap-4 cursor-pointer"
            >
                {/* Pulsing Plus Icon */}
                <div className="relative w-14 h-14 rounded-2xl border border-white/10 group-hover:border-teal-500/40 flex items-center justify-center transition-all duration-500 group-hover:scale-110">
                    <svg className="w-7 h-7 text-zinc-600 group-hover:text-teal-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                    </svg>
                </div>

                {/* Label */}
                <div className="text-center">
                    <p className="text-[10px] font-mono tracking-[0.25em] text-zinc-600 group-hover:text-zinc-400 transition-colors uppercase">
                        NO SIGNAL
                    </p>
                    <p className="text-[9px] font-mono text-zinc-700 mt-1 tracking-wider">
                        DOCK {slot.id + 1}
                    </p>
                </div>

                {/* Corner Brackets */}
                <div className="absolute top-3 left-3 w-5 h-5 border-l border-t border-zinc-800 group-hover:border-teal-500/40 transition-colors" />
                <div className="absolute top-3 right-3 w-5 h-5 border-r border-t border-zinc-800 group-hover:border-teal-500/40 transition-colors" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-l border-b border-zinc-800 group-hover:border-teal-500/40 transition-colors" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-r border-b border-zinc-800 group-hover:border-teal-500/40 transition-colors" />
            </button>
        );
    }

    // FILLED STATE - Active Module / Holo Card
    return (
        <div
            onClick={onSelect}
            className={`group relative h-[32vh] min-h-[280px] neural-slot cursor-pointer overflow-hidden ${isActive
                ? 'ring-1 ring-teal-500/50 shadow-[0_0_30px_rgba(20,184,166,0.15)]'
                : ''
                }`}
        >
            {/* Full Chart - Primary Focus */}
            <div className="absolute inset-0 z-0">
                <MiniChart
                    symbol={slot.symbol!}
                    interval="15m"
                />
            </div>

            {/* Compact Header Bar (Glass overlay at top) */}
            <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 py-2 bg-zinc-950/80 backdrop-blur-sm border-b border-white/5">
                {/* Left: Symbol + Live Indicator */}
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-teal-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="text-sm font-bold text-white tracking-wide">
                        {slot.symbol?.replace('USDT', '')}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">/USDT</span>
                </div>

                {/* Right: Price + Change + Remove */}
                <div className="flex items-center gap-3">
                    <span className={`text-sm font-mono font-bold ${isPositive ? 'text-teal-400' : 'text-red-400'}`}>
                        ${price < 1 ? price.toFixed(4) : price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isPositive
                        ? 'bg-teal-500/10 text-teal-400'
                        : 'bg-red-500/10 text-red-400'
                        }`}>
                        {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                    </span>

                    {/* Remove Button */}
                    <button
                        onClick={onClear}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all duration-200"
                        title="Remove from grid"
                    >
                        <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Slot Indicator */}
            <div className="absolute bottom-2 left-3 text-[8px] font-mono text-zinc-600 tracking-widest z-20">
                M{slot.id + 1}
            </div>
        </div>
    );
}
