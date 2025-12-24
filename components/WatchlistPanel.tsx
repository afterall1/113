'use client';

import { useState, useEffect } from 'react';
import { useMarketStore } from "@/store/useMarketStore";
import { streamStore } from "@/hooks/useBinanceStream";

export default function WatchlistPanel() {
    const { favorites, toggleFavorite, tickers, setSelectedTicker, timeframe, viewMode, setViewMode, isWatchlistOpen, setWatchlistOpen, baselines } = useMarketStore();
    const [inputValue, setInputValue] = useState('');

    // Force re-render every 500ms to sync with live data
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => forceUpdate(n => n + 1), 500);
        return () => clearInterval(interval);
    }, []);

    // Inverted logic: isCollapsed = !isWatchlistOpen
    const isCollapsed = !isWatchlistOpen;

    // Favorites panel active state (for styling only)

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        const raw = inputValue.toUpperCase().trim();
        const symbol = raw.endsWith('USDT') ? raw : `${raw}USDT`;

        // Add if not exists
        if (!favorites.includes(symbol)) {
            toggleFavorite(symbol);
        }
        setInputValue('');
    };

    return (
        <div
            className={`fixed top-0 left-0 h-full z-30 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-12 bg-transparent pointer-events-none' : 'w-72 liquid-metal !rounded-none !rounded-r-2xl pointer-events-auto'
                }`}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setWatchlistOpen(!isWatchlistOpen)}
                className={`absolute top-6 -right-12 w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 rounded-r-xl text-teal-400 hover:text-white transition-all pointer-events-auto ${isCollapsed ? 'translate-x-[0px]' : 'translate-x-0'
                    }`}
            >
                {isCollapsed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                    </svg>
                )}
            </button>

            {/* Content Container */}
            <div className={`flex flex-col h-full overflow-hidden ${isCollapsed ? 'opacity-0' : 'opacity-100 transition-opacity duration-300 delay-100'}`}>

                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            SQUADRON
                        </h2>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 font-mono">
                        {favorites.length} ASSETS TRACKED
                    </p>
                </div>

                {/* Add Input */}
                <div className="p-4">
                    <form onSubmit={handleAdd} className="relative">
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors placeholder:text-zinc-600 font-mono uppercase"
                            placeholder="ADD SYMBOL (e.g. BTC)"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button type="submit" className="absolute right-2 top-1.5 text-teal-500 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </form>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-2 space-y-1">
                    {favorites.length === 0 && (
                        <div className="text-center p-8 text-zinc-600 text-xs font-mono">
                            NO FAVORITES ADDED.
                            <br />
                            USE SEARCH TO ADD.
                        </div>
                    )}

                    {favorites.map(symbol => {
                        // Get LIVE data from streamStore (not stale Zustand data)
                        const liveData = streamStore.tickers.get(symbol);
                        const fallbackData = tickers.get(symbol);
                        const data = liveData || fallbackData;
                        const price = data?.price || 0;

                        // Calculate percent based on active timeframe
                        let percent = data?.priceChangePercent || 0;

                        if (timeframe !== '24h' && data) {
                            const base = baselines.get(symbol);
                            if (base && base > 0) {
                                percent = ((data.price - base) / base) * 100;
                            }
                            // If no baseline, keep the 24h percent as fallback
                        }

                        const isUp = percent >= 0;

                        return (
                            <div
                                key={symbol}
                                className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                onClick={() => data && setSelectedTicker(data)}
                            >
                                <div>
                                    <div className="font-bold text-white text-sm tracking-wide">
                                        {symbol.replace('USDT', '')}
                                    </div>
                                    <div className="text-xs font-mono text-zinc-500">
                                        ${price < 1 ? price.toFixed(4) : price.toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                    <span className={`text-xs font-mono font-bold ${isUp ? 'text-teal-400' : 'text-red-500'}`}>
                                        {isUp ? '+' : ''}{percent.toFixed(2)}%
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(symbol);
                                        }}
                                        className="text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 text-[10px] text-zinc-600 text-center font-mono">
                    MODE: <span className="text-zinc-500">{viewMode}</span> / {timeframe} / <span className="text-teal-500">LIVE</span>
                </div>
            </div>
        </div>
    );
}
