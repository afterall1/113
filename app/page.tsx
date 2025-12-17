'use client';

import NebulaCanvas from "@/components/NebulaCanvas";
import HUD from "@/components/HUD";
import DetailDrawer from "@/components/DetailDrawer";
import { useBinanceStream } from "@/hooks/useBinanceStream";

export default function Home() {
  // Activate Data Stream
  useBinanceStream();

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden flex flex-col">
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
          LIVE BINANCE MARKET DATA
        </p>
      </div>
    </main>
  );
}
