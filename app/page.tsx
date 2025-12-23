'use client';

import { useState, useEffect } from 'react';
import { useMarketStore } from "@/store/useMarketStore";
import NebulaCanvas from "@/components/NebulaCanvas";
import HUD from "@/components/HUD";
import DetailDrawer from "@/components/DetailDrawer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useBinanceStream, streamStore } from "@/hooks/useBinanceStream";
import { useTimeframeSync } from "@/hooks/useTimeframeSync";
import WatchlistPanel from "@/components/WatchlistPanel";
import TargetingSystem from "@/components/TargetingSystem";
import { TacticalGrid } from "@/components/TacticalGrid";

export default function Home() {
  const [isBooted, setIsBooted] = useState(false);
  const [progress, setProgress] = useState(0);

  // View Mode - NEBULA (3D orbs) or GRID (charts)
  const viewMode = useMarketStore((state) => state.viewMode);

  // Activate Data Stream
  useBinanceStream();
  // Activate Timeframe Logic
  useTimeframeSync();

  // Boot Sequence Logic
  useEffect(() => {
    const checkBoot = setInterval(() => {
      const count = streamStore.tickers.size;
      // Goal: Wait until we have ~5 tickers (Reduced from 20)
      if (count > 5) {
        setIsBooted(true);
        clearInterval(checkBoot);
      } else {
        setProgress(prev => Math.min(prev + 5, 90));
      }
    }, 100);

    // FORCE BOOT FAILURE SAFEGUARD
    // If socket is blocked or slow, boot anyway after 3 seconds
    const forceBoot = setTimeout(() => {
      setIsBooted(true);
    }, 3000);

    return () => {
      clearInterval(checkBoot);
      clearTimeout(forceBoot);
    };
  }, []);

  // Determine if Nebula should be active (pause GPU when in Grid mode)
  const isNebulaActive = viewMode === 'NEBULA';

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
      {!isBooted ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black text-white"
          style={{ backgroundColor: '#000000' }} // Fallback if Tailwind fails
        >
          <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-mono text-xs tracking-widest text-zinc-500 animate-pulse">
            INITIALIZING NEBULA STREAM...
          </p>
        </div>
      ) : (
        <ErrorBoundary>
          <div className="animate-in fade-in duration-1000">
            {/* Visualization Background - Always mounted, but paused when Grid is active */}
            <NebulaCanvas active={isNebulaActive} />

            {/* Tactical Grid Overlay - Shown when in GRID mode */}
            {viewMode === 'GRID' && <TacticalGrid />}

            {/* Targeting System Hover Card - Only in Nebula mode */}
            {isNebulaActive && <TargetingSystem />}

            {/* Watchlist Sidebar (Left) - Only in Nebula mode */}
            {isNebulaActive && <WatchlistPanel />}

            {/* HUD Controls - Always visible */}
            <HUD />

            {/* Side Panel - Only in Nebula mode */}
            {isNebulaActive && <DetailDrawer />}

            {/* Intro Text (Fades out when interactive, or stays as subtle bg) */}
            {isNebulaActive && (
              <div className="absolute bottom-8 left-8 p-8 z-10 pointer-events-none opacity-50">
                <h1 className="text-2xl font-bold text-white tracking-widest">
                  LIQUIDITY NEBULA
                </h1>
                <p className="text-zinc-500 text-xs mt-1">
                  v1.0.0 • LIVE BINANCE MARKET DATA
                </p>
              </div>
            )}
          </div>
        </ErrorBoundary>
      )}
    </main>
  );
}
