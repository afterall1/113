'use client';

import { useState, useEffect } from 'react';
import { useMarketStore } from "@/store/useMarketStore";
import NebulaCanvas from "@/components/NebulaCanvas";
import HUD from "@/components/HUD";
import DetailDrawer from "@/components/DetailDrawer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useBinanceStream, streamStore } from "@/hooks/useBinanceStream";

export default function Home() {
  const [isBooted, setIsBooted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Activate Data Stream
  useBinanceStream();

  // Boot Sequence Logic
  useEffect(() => {
    const checkBoot = setInterval(() => {
      const count = streamStore.tickers.size;

      // Simulating "Booting" based on data buffer
      // Goal: Wait until we have ~20 tickers to show something interesting
      if (count > 20) {
        setIsBooted(true);
        clearInterval(checkBoot);
      } else {
        // Fake progress for UI feedback
        setProgress(prev => Math.min(prev + 5, 90));
      }
    }, 100);

    return () => clearInterval(checkBoot);
  }, []);

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
      {!isBooted ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black text-white">
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
            {/* Visualization Background */}
            <NebulaCanvas />

            {/* HUD Controls */}
            <HUD />

            {/* Side Panel */}
            <DetailDrawer />

            {/* Intro Text (Fades out when interactive, or stays as subtle bg) */}
            <div className="absolute bottom-8 left-8 p-8 z-10 pointer-events-none opacity-50">
              <h1 className="text-2xl font-bold text-white tracking-widest">
                LIQUIDITY NEBULA
              </h1>
              <p className="text-zinc-500 text-xs mt-1">
                v1.0.0 • LIVE BINANCE MARKET DATA
              </p>
            </div>
          </div>
        </ErrorBoundary>
      )}
    </main>
  );
}
