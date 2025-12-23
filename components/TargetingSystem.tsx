'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useMarketStore } from '@/store/useMarketStore';

interface MousePosition {
    x: number;
    y: number;
}

export default function TargetingSystem() {
    const hoveredTicker = useMarketStore((state) => state.hoveredTicker);
    const [isVisible, setIsVisible] = useState(false);

    // Use ref for mouse position to avoid re-renders on every mousemove
    const mousePosRef = useRef<MousePosition>({ x: 0, y: 0 });
    const cardRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);

    // Optimized cursor tracking with requestAnimationFrame
    const updatePosition = useCallback(() => {
        if (cardRef.current) {
            const offsetX = 20;
            const offsetY = 20;
            cardRef.current.style.transform = `translate(${mousePosRef.current.x + offsetX}px, ${mousePosRef.current.y + offsetY}px)`;
        }
        rafRef.current = null;
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mousePosRef.current = { x: e.clientX, y: e.clientY };

            // Throttle updates using requestAnimationFrame
            if (!rafRef.current) {
                rafRef.current = requestAnimationFrame(updatePosition);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [updatePosition]);

    // Fade in/out based on hoveredTicker
    useEffect(() => {
        if (hoveredTicker) {
            setIsVisible(true);
            // Trigger immediate position update when becoming visible
            requestAnimationFrame(updatePosition);
        } else {
            // Small delay for fade-out animation
            const timeout = setTimeout(() => setIsVisible(false), 150);
            return () => clearTimeout(timeout);
        }
    }, [hoveredTicker, updatePosition]);

    // Don't render if no data and animation complete
    if (!hoveredTicker && !isVisible) return null;

    // Format price with appropriate decimals
    const formatPrice = (price: number): string => {
        if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
        if (price >= 1) return price.toFixed(4);
        return price.toFixed(6);
    };

    // Clean symbol (remove USDT suffix)
    const cleanSymbol = hoveredTicker?.symbol.replace('USDT', '') ?? '';
    const priceChange = hoveredTicker?.priceChangePercent ?? 0;
    const isPositive = priceChange >= 0;

    return (
        <div
            ref={cardRef}
            className={`
                fixed left-0 top-0 z-20 pointer-events-none
                transition-opacity duration-150 ease-out
                will-change-transform
                ${hoveredTicker ? 'opacity-100' : 'opacity-0'}
            `}
        >
            {/* Targeting Reticle Effect */}
            <div className="relative">
                {/* Corner Brackets */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400/60" />
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400/60" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400/60" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400/60" />

                {/* Main Card with Glow Effect */}
                <div className="
                    backdrop-blur-md bg-black/80 
                    border border-cyan-500/30 
                    rounded-lg px-4 py-3
                    shadow-[0_0_20px_rgba(6,182,212,0.2),0_0_40px_rgba(6,182,212,0.1)]
                    min-w-[140px]
                ">
                    {/* Symbol */}
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
                        <span className="text-lg font-bold text-white tracking-wide">
                            {cleanSymbol}
                        </span>
                    </div>

                    {/* Price */}
                    <div className="text-sm text-zinc-300 font-mono mb-1">
                        ${formatPrice(hoveredTicker?.price ?? 0)}
                    </div>

                    {/* Change Percentage */}
                    <div className={`
                        text-sm font-semibold font-mono
                        ${isPositive ? 'text-emerald-400' : 'text-rose-400'}
                    `}>
                        {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                    </div>

                    {/* Scan Line Effect */}
                    <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                        <div className="
                            absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent
                            animate-[scan_2s_linear_infinite]
                        " style={{ top: '50%' }} />
                    </div>
                </div>

                {/* Lock-On Text */}
                <div className="text-[10px] text-cyan-500/60 font-mono tracking-widest mt-1 text-center">
                    TARGET LOCKED
                </div>
            </div>
        </div>
    );
}
