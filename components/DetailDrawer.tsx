'use client';

import { useMarketStore } from "@/store/useMarketStore";
import { useEffect, useState } from "react";

export default function DetailDrawer() {
    const { selectedTicker, setSelectedTicker, favorites, toggleFavorite } = useMarketStore();
    const [isVisible, setIsVisible] = useState(false);

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

    return (
        <>
            {/* Backdrop (Mobile Only mostly) */}
            <div
                onClick={close}
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            />

            {/* Drawer Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-[#0a0a0a]/90 backdrop-blur-xl border-l border-white/10 z-40 transform transition-transform duration-300 ease-out p-8 shadow-2xl ${isVisible ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex justify-between items-start mb-12">
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

                    <div className="flex gap-2">
                        <button
                            onClick={() => selectedTicker && toggleFavorite(selectedTicker.symbol)}
                            className={`p-2 rounded-full transition-colors ${favorites.includes(selectedTicker?.symbol || '') ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-600 hover:text-zinc-400'}`}
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

                <div className="space-y-6">
                    {/* Stat Block */}
                    <div className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">24h Volume</p>
                        <p className="text-xl font-mono text-zinc-200">
                            {parseInt(selectedTicker?.volume?.toString() || '0').toLocaleString()}
                            <span className="text-xs text-zinc-600 ml-1">USDT</span>
                        </p>
                    </div>

                    {/* Placeholder for future Charts */}
                    <div className="h-48 rounded-xl bg-gradient-to-b from-white/5 to-transparent border border-white/5 flex items-center justify-center">
                        <p className="text-zinc-700 text-xs tracking-widest">MINI CHART PREVIEW</p>
                    </div>
                </div>

                <div className="absolute bottom-8 left-8 right-8">
                    <button className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-black font-bold tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]">
                        OPEN TRADE TERMINAL
                    </button>
                </div>

            </div>
        </>
    );
}
