'use client';

import { useMarketStore } from "@/store/useMarketStore";
import { SoundEngine } from '@/lib/SoundEngine';

export default function HUD() {
    const {
        searchQuery,
        setSearchQuery,
        timeframe,
        setTimeframe,
        isMuted,
        setIsMuted
    } = useMarketStore();

    const timeframes = ['1m', '15m', '1h', '4h', '24h', '7d'];

    const toggleSound = () => {
        const newState = !isMuted;
        setIsMuted(newState);
        const engine = SoundEngine.getInstance();
        engine.setMute(newState);
    };

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl z-20 transition-all hover:bg-black/60">

            {/* Sound Toggle */}
            <button
                onClick={toggleSound}
                className={`p-1.5 rounded-full transition-all ${!isMuted ? 'text-teal-400 bg-teal-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
                {isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                )}
            </button>

            <div className="h-6 w-px bg-white/10"></div>

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
