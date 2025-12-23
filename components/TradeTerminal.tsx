'use client';

import { useState, useEffect } from 'react';
import { useMarketStore } from "@/store/useMarketStore";
import { useTradeStore } from "@/store/useTradeStore";
import { formatCurrency } from '@/lib/utils';

export default function TradeTerminal({ onClose }: { onClose: () => void }) {
    const { selectedTicker } = useMarketStore();
    const { positions, openPosition, closePosition, activeLeverage, setLeverage } = useTradeStore();

    // Local Form State
    const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
    const [margin, setMargin] = useState<string>('100');

    if (!selectedTicker) return null;

    const price = selectedTicker.price;
    const activePosition = positions.find(p => p.symbol === selectedTicker.symbol);

    const handleOpenPosition = () => {
        const marginNum = parseFloat(margin);
        if (isNaN(marginNum) || marginNum <= 0) return;

        openPosition(selectedTicker.symbol, side, marginNum, activeLeverage, price);
    };

    const handleClosePosition = () => {
        if (activePosition) {
            closePosition(activePosition.id, price);
        }
    };

    // Calculate PnL for active position
    const calculatePnL = () => {
        if (!activePosition) return null;
        const entry = activePosition.entryPrice;
        const size = activePosition.sizeUSD;
        // Long PnL: (Current - Entry) / Entry * Size
        // Short PnL: (Entry - Current) / Entry * Size
        const pnl = activePosition.side === 'LONG'
            ? ((price - entry) / entry) * size
            : ((entry - price) / entry) * size;

        const returnPercent = (pnl / activePosition.marginUSD) * 100;
        return { pnl, returnPercent };
    };

    const pnlData = calculatePnL();

    return (
        <div className="flex flex-col h-full bg-zinc-900/50 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden relative">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-950/30">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    <h3 className="font-mono text-sm font-bold text-zinc-100 uppercase tracking-widest">
                        COMMAND CENTER
                    </h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-zinc-500 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-6 flex-1 overflow-y-auto custom-scrollbar">

                {/* 1. Account Info (Simulated) */}
                <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
                    <span>AVAILABLE BALANCE</span>
                    <span className="text-white font-bold">$100,000.00</span>
                </div>

                {/* 2. Position Status (Active or None) */}
                {activePosition ? (
                    <div className={`p-4 rounded-lg border ${pnlData && pnlData.pnl >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} relative overflow-hidden group`}>
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${pnlData && pnlData.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />

                        <div className="flex justify-between items-start mb-3">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${activePosition.side === 'LONG' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
                                {activePosition.side} {activePosition.leverage}x
                            </span>
                            <span className="text-xs font-mono text-zinc-400">
                                {formatCurrency(activePosition.sizeUSD)}
                            </span>
                        </div>

                        <div className="mb-4">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Unrealized PNL</p>
                            <p className={`text-2xl font-mono font-bold ${pnlData && pnlData.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {pnlData ? (pnlData.pnl >= 0 ? '+' : '') + formatCurrency(pnlData.pnl) : '---'}
                            </p>
                            <p className={`text-xs ${pnlData && pnlData.returnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {pnlData ? (pnlData.returnPercent >= 0 ? '+' : '') + pnlData.returnPercent.toFixed(2) : '0.00'}%
                            </p>
                        </div>

                        <div className='flex justify-between text-[10px] text-zinc-500 font-mono mb-4'>
                            <div>
                                <span className='block mb-0.5'>ENTRY</span>
                                <span className='text-zinc-300'>{formatCurrency(activePosition.entryPrice)}</span>
                            </div>
                            <div className='text-right'>
                                <span className='block mb-0.5'>LIQ. PRICE</span>
                                <span className='text-orange-400'>{formatCurrency(activePosition.liquidationPrice)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleClosePosition}
                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-white/5 hover:border-white/20 text-xs font-bold text-white rounded transition-all"
                        >
                            CLOSE POSITION
                        </button>
                    </div>
                ) : (
                    /* 3. Order Entry Form */
                    <div className="flex flex-col gap-5">
                        {/* Side Switch */}
                        <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
                            <button
                                onClick={() => setSide('LONG')}
                                className={`py-2 text-xs font-bold rounded-md transition-all ${side === 'LONG' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                LONG
                            </button>
                            <button
                                onClick={() => setSide('SHORT')}
                                className={`py-2 text-xs font-bold rounded-md transition-all ${side === 'SHORT' ? 'bg-red-500 text-black shadow-lg shadow-red-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                SHORT
                            </button>
                        </div>

                        {/* Leverage Slider */}
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-zinc-500">LEVERAGE</span>
                                <span className="font-mono text-zinc-300 font-bold">{activeLeverage}x</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="125"
                                step="1"
                                value={activeLeverage}
                                onChange={(e) => setLeverage(parseInt(e.target.value))}
                                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-600 mt-1 font-mono">
                                <span>1x</span>
                                <span>20x</span>
                                <span>50x</span>
                                <span>125x</span>
                            </div>
                        </div>

                        {/* Margin Input */}
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-zinc-500">MARGIN (USDT)</span>
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                                <input
                                    type="number"
                                    value={margin}
                                    onChange={(e) => setMargin(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-6 pr-4 text-sm font-mono text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="p-3 bg-white/5 rounded-lg border border-white/5 space-y-2">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-zinc-500">POSITION SIZE</span>
                                <span className="text-zinc-300 font-mono">
                                    {formatCurrency((parseFloat(margin) || 0) * activeLeverage)}
                                </span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-zinc-500">ENTRY PRICE</span>
                                <span className="text-zinc-300 font-mono">{formatCurrency(price)}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-zinc-500">EST. LIQ PRICE</span>
                                <span className="text-orange-400 font-mono">
                                    {/* Simple Calc for display */}
                                    {side === 'LONG'
                                        ? formatCurrency(price * (1 - 1 / activeLeverage))
                                        : formatCurrency(price * (1 + 1 / activeLeverage))}
                                </span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleOpenPosition}
                            className={`w-full py-3 rounded-lg font-bold text-sm tracking-wider shadow-lg transition-all
                                ${side === 'LONG'
                                    ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-black shadow-green-500/20'
                                    : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-black shadow-red-500/20'
                                }
                            `}
                        >
                            {side === 'LONG' ? 'BUY / LONG' : 'SELL / SHORT'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
