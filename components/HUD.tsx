'use client';

import { useMarketStore } from "@/store/useMarketStore";

export default function HUD() {
    const {
        searchQuery,
        setSearchQuery,
        timeframe,
        setTimeframe
    } = useMarketStore();

    const timeframes = ['1m', '15m', '1h', '4h', '24h', '7d'];

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl z-20 transition-all hover:bg-black/60">

            {/* Search Bar */}
            <div className="relative group">
                <input
                    type="text"
                    placeholder="SEARCH TICKER..."
                    className="bg-transparent border-b border-white/20 text-white px-2 py-1 outline-none font-mono tracking-widest text-sm focus:border-teal-400 w-32 focus:w-48 transition-all placeholder:text-white/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                />
            </div>

            <div className="h-6 w-px bg-white/10"></div>

            {/* Timeframe Selector */}
            <div className="flex items-center gap-1">
                {timeframes.map((tf) => (
                    <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider transition-all ${timeframe === tf
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tf}
                    </button>
                ))}
            </div>
        </div>
    );
}
