'use client';

import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useMarketStore } from '@/store/useMarketStore';
import { CoinOrb } from '@/lib/CoinOrb';

export default function NebulaCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const orbsRef = useRef<Map<string, CoinOrb>>(new Map());
    const mainContainerRef = useRef<PIXI.Container | null>(null);
    const textureRef = useRef<PIXI.Texture | null>(null);

    const { tickers, searchQuery, setSelectedTicker } = useMarketStore();

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

            // Animation Loop
            app.ticker.add(() => {
                orbsRef.current.forEach((orb) => orb.animate());
            });

            // Handle Resize logic if needed specifically beyond resizeTo
        };

        initApp();

        return () => {
            // Cleanup handled by strict mode check or eventual unmount
            if (appRef.current) {
                appRef.current.destroy(true, { children: true, texture: true });
                appRef.current = null;
            }
        };
    }, []);

    // Sync Data with Visuals
    useEffect(() => {
        if (!appRef.current || !mainContainerRef.current || !textureRef.current) return;

        const app = appRef.current;
        const container = mainContainerRef.current;
        const texture = textureRef.current;
        const existingOrbs = orbsRef.current;

        const screenCenterY = app.screen.height / 2;
        const screenWidth = app.screen.width;

        // Check filtered query
        const hasQuery = searchQuery.length > 0;

        tickers.forEach((data, symbol) => {
            let orb = existingOrbs.get(symbol);

            if (!orb) {
                const x = Math.random() * screenWidth;
                const y = screenCenterY;

                orb = new CoinOrb(data, texture, x, y);
                // Bind Interaction
                orb.bindInteraction((clickedData) => {
                    setSelectedTicker(clickedData);
                });

                container.addChild(orb.sprite);
                existingOrbs.set(symbol, orb);
            }

            // Update Physics Target
            orb.updateData(data, screenCenterY);

            // Update Highlighting
            const isMatch = !hasQuery || symbol.includes(searchQuery);
            orb.highlight(isMatch, hasQuery);
        });

        // Cleanup stale orbs (if tickers removed from stream?)
        // In this specific stream, tickers usually persist, but good practice:
        // ... logic to remove orbs not in tickers ...

    }, [tickers, searchQuery, setSelectedTicker]); // React to store updates

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-0 w-full h-full pointer-events-auto"
        />
    );
}
