'use client';

import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useMarketStore } from '@/store/useMarketStore';
import { CoinOrb } from '@/lib/CoinOrb';
import { streamStore } from '@/hooks/useBinanceStream';

export default function NebulaCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const orbsRef = useRef<Map<string, CoinOrb>>(new Map());
    const mainContainerRef = useRef<PIXI.Container | null>(null);
    const textureRef = useRef<PIXI.Texture | null>(null);

    // Only subscribe to LOW FREQUENCY updates if needed, or just read imperatively
    const { searchQuery, setSelectedTicker, timeframe } = useMarketStore();
    const timeframeRef = useRef(timeframe);

    // Sync Ref for Layout (avoid re-running effect just for var change)
    useEffect(() => {
        timeframeRef.current = timeframe;
    }, [timeframe]);


    // Create shared texture once
    const createOrbTexture = (app: PIXI.Application) => {
        const graphics = new PIXI.Graphics();
        graphics.circle(0, 0, 32);
        graphics.fill({ color: 0xffffff, alpha: 1 });
        // Add a glow bloom effect
        graphics.circle(0, 0, 48);
        graphics.fill({ color: 0xffffff, alpha: 0.3 });
        return app.renderer.generateTexture(graphics);
    };

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize Pixi App
        const app = new PIXI.Application();

        const initApp = async () => {
            // Clean up previous if any (Strict Mode double-invoke protection)
            if (appRef.current) {
                appRef.current.destroy(true, { children: true, texture: true });
            }

            await app.init({
                resizeTo: window,
                backgroundColor: 0x050505,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
            });

            if (containerRef.current) {
                containerRef.current.appendChild(app.canvas);
            }

            appRef.current = app;

            // Container for Orbs
            const container = new PIXI.Container();
            container.sortableChildren = true; // Enable z-index sorting
            app.stage.addChild(container);
            mainContainerRef.current = container;

            // Store texture in Ref
            textureRef.current = createOrbTexture(app);

            // MAIN RENDER LOOP (60 FPS)
            // Reads directly from Mutable Ref (streamStore)
            app.ticker.add(() => {
                const screenCenterY = app.screen.height / 2;
                const screenWidth = app.screen.width;
                const texture = textureRef.current!;

                const state = useMarketStore.getState();
                const hasQuery = state.searchQuery.length > 0;
                const query = state.searchQuery;
                const activeTimeframe = state.timeframe;
                const baselines = state.baselines;

                // Dynamic Scale Factor based on Timeframe Volatility
                // 1m/15m have small % changes, so we need higher visual scale to see movement
                let scaleFactor = 15; // Default 24h/7d
                if (activeTimeframe === '1h') scaleFactor = 40;
                else if (activeTimeframe === '15m') scaleFactor = 80;
                else if (activeTimeframe === '1m') scaleFactor = 150;

                // Iterate over ALL tickers in the Stream Store
                streamStore.tickers.forEach((data, symbol) => {
                    let orb = orbsRef.current.get(symbol);

                    // Create if missing
                    if (!orb) {
                        const x = Math.random() * screenWidth;
                        orb = new CoinOrb(data, texture, x, screenCenterY);
                        orb.bindInteraction((clickedData) => {
                            useMarketStore.getState().setSelectedTicker(clickedData);
                        });
                        mainContainerRef.current!.addChild(orb.sprite);
                        orbsRef.current.set(symbol, orb);
                    }

                    // Calculation Logic: Timeframe Overrides
                    let visualPercent: number | undefined;

                    if (activeTimeframe !== '24h') {
                        const base = baselines.get(symbol);
                        if (base) {
                            visualPercent = ((data.price - base) / base) * 100;
                        } else {
                            // STRICT MODE: If we are in a specific timeframe but have NO data yet,
                            // do NOT show the 24h percent. That is misleading.
                            // Decision: Set to 0 so it floats to center and "waits" there.
                            visualPercent = 0;
                        }
                    }

                    // Update Data (Position Target)
                    orb.updateData(data, screenCenterY, scaleFactor, visualPercent);

                    // Update Highlight (Imperative check)
                    const isMatch = !hasQuery || symbol.includes(query);
                    orb.highlight(isMatch, hasQuery);

                    // Animate Physics
                    orb.animate();
                });

                // Cleanup stale orbs? (Optional for now)
            });
        };

        initApp();

        return () => {
            // Cleanup handled by strict mode check or eventual unmount
            if (appRef.current) {
                appRef.current.destroy(true, { children: true, texture: true });
                appRef.current = null;
            }
        };
    }, []); // Empty dependency array = Single Mount!

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-0 w-full h-full pointer-events-auto"
        />
    );
}
