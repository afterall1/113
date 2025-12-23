'use client';

import { useState } from 'react';
import { useMarketStore, GridSlot } from '@/store/useMarketStore';
import { MiniChart } from './MiniChart';
import { streamStore } from '@/hooks/useBinanceStream';

/**
 * Tactical Grid Component
 * A 3x3 responsive grid for monitoring multiple assets simultaneously.
 * Each slot can hold a MiniChart or display an empty placeholder for coin selection.
 */
export function TacticalGrid() {
    const { gridSlots, setGridSlot, clearGridSlot, activeSlotId, setActiveSlotId, toggleViewMode } = useMarketStore();
    const [isSelectingForSlot, setIsSelectingForSlot] = useState<number | null>(null);

    // Handle slot click for empty slots
    const handleAddCoin = (slotId: number) => {
        // For now, use a simple prompt. Later integrate with a search modal.
        const input = window.prompt('Enter coin symbol (e.g., BTC or BTCUSDT):');
        if (!input || !input.trim()) return;

        // Normalize symbol
        const rawSymbol = input.trim().toUpperCase();
        const symbol = rawSymbol.endsWith('USDT') ? rawSymbol : `${rawSymbol}USDT`;

        // VALIDATION: Check if symbol exists in live stream
        const existsInStream = streamStore.tickers.has(symbol);

        if (!existsInStream) {
            // Show error message
            alert(`⚠️ Symbol "${symbol}" not found in Binance Futures.\n\nMake sure the coin is listed on Binance Futures and try again.`);
            return;
        }

        setGridSlot(slotId, symbol);
    };

    // Handle clearing a slot
    const handleClearSlot = (slotId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        clearGridSlot(slotId);
    };

    return (
        <div className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-xl overflow-auto">
            {/* Header Bar */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    {/* Grid Icon */}
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/10 flex items-center justify-center border border-teal-500/20">
                        <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </div>
                    <h1 className="text-sm font-bold tracking-[0.2em] text-white/90 uppercase">
                        Tactical Grid
                    </h1>
                    <span className="text-[10px] font-mono text-teal-400/60 tracking-wider">
                        {gridSlots.filter(s => s.symbol).length}/9 ACTIVE
                    </span>
                </div>

                {/* Close / Return to Nebula Button */}
                <button
                    onClick={toggleViewMode}
                    className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-500/30 transition-all duration-300"
                >
                    <svg className="w-4 h-4 text-zinc-400 group-hover:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                    </svg>
                    <span className="text-xs font-mono text-zinc-400 group-hover:text-white tracking-wider transition-colors">
                        NEBULA
                    </span>
                </button>
            </div>

            {/* Grid Container */}
            <div className="p-4 min-h-[calc(100vh-60px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
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
        </div>
    );
}

/**
 * Individual Grid Slot Card Component
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

    if (isEmpty) {
        return (
            <button
                onClick={onAdd}
                className="group relative h-[30vh] min-h-[250px] rounded-xl border-2 border-dashed border-white/10 hover:border-teal-500/40 bg-white/[0.02] hover:bg-white/[0.04] flex flex-col items-center justify-center gap-4 transition-all duration-500"
            >
                {/* Holographic Glow on Hover */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5" />

                {/* Plus Icon Container */}
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-white/10 group-hover:border-teal-500/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                    <svg className="w-8 h-8 text-zinc-500 group-hover:text-teal-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                </div>

                {/* Label */}
                <div className="text-center">
                    <p className="text-[10px] font-mono font-bold tracking-[0.3em] text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase">
                        Add Asset
                    </p>
                    <p className="text-[9px] font-mono text-zinc-600 group-hover:text-zinc-500 mt-1 tracking-wider transition-colors">
                        SLOT {slot.id + 1}
                    </p>
                </div>

                {/* Corner Brackets (Holographic Targeting) */}
                <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-zinc-700/50 group-hover:border-teal-500/50 rounded-tl-sm transition-colors" />
                <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-zinc-700/50 group-hover:border-teal-500/50 rounded-tr-sm transition-colors" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-zinc-700/50 group-hover:border-teal-500/50 rounded-bl-sm transition-colors" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-zinc-700/50 group-hover:border-teal-500/50 rounded-br-sm transition-colors" />
            </button>
        );
    }

    // Filled State - Show MiniChart
    return (
        <div
            onClick={onSelect}
            className={`relative h-[30vh] min-h-[250px] rounded-xl overflow-hidden border transition-all duration-300 ${isActive
                ? 'border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.15)]'
                : 'border-white/10 hover:border-white/20'
                }`}
        >
            {/* Glass Header */}
            <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 py-2 bg-zinc-900/80 backdrop-blur-sm border-b border-white/5">
                {/* Symbol Badge */}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-xs font-mono font-bold text-white tracking-wider">
                        {slot.symbol?.replace('USDT', '')}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                        /USDT
                    </span>
                </div>

                {/* Clear Button */}
                <button
                    onClick={onClear}
                    className="group/clear p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-200"
                    title="Remove from grid"
                >
                    <svg className="w-3.5 h-3.5 text-zinc-500 group-hover/clear:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Chart Container - Push down for header space */}
            <div className="absolute inset-0 pt-10">
                <MiniChart
                    symbol={slot.symbol!}
                    interval="15m"
                />
            </div>

            {/* Slot Number Indicator */}
            <div className="absolute bottom-2 left-2 z-20 text-[9px] font-mono text-zinc-600 tracking-wider">
                SLOT {slot.id + 1}
            </div>

            {/* Active Glow Border Effect */}
            {isActive && (
                <div className="absolute inset-0 pointer-events-none rounded-xl shadow-[inset_0_0_20px_rgba(20,184,166,0.1)]" />
            )}
        </div>
    );
}
