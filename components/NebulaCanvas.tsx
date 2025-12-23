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

    // Camera Offset for UI Panel Avoidance
    const cameraOffsetRef = useRef({ x: 0, y: 0 });

    // Panel Size Constants
    const RIGHT_PANEL_WIDTH = 400;  // DetailDrawer width
    const LEFT_PANEL_WIDTH = 288;   // WatchlistPanel width (w-72 = 18rem = 288px)

    // Only subscribe to LOW FREQUENCY updates if needed, or just read imperatively
    const { searchQuery, setSelectedTicker, timeframe } = useMarketStore();
    const timeframeRef = useRef(timeframe);

    // Sync Ref for Layout (avoid re-running effect just for var change)
    useEffect(() => {
        timeframeRef.current = timeframe;
    }, [timeframe]);


    // Create shared texture once - Stellar Plasma effect with Canvas 2D radial gradient
    // HIGH-DPI SUPER-SAMPLING: 512px for Retina-quality sharpness
    const createOrbTexture = (): PIXI.Texture => {
        // Create high-resolution canvas for smooth, glowing orb (Super-Sampled)
        const canvas = document.createElement('canvas');
        const size = 512; // 4x resolution for crisp Retina displays
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            // Fallback to basic texture if canvas context unavailable
            console.warn('[NebulaCanvas] Canvas 2D context unavailable, using fallback');
            return PIXI.Texture.WHITE;
        }

        const center = 256; // size / 2
        const radius = 200; // Reduced radius for tighter margin (Sharpening)

        // Create radial gradient for stellar plasma effect
        const gradient = ctx.createRadialGradient(
            center, center, 0,      // Inner circle (center point)
            center, center, radius  // Outer circle
        );

        // Define color stops for glowing gas ball effect (optimized for High-DPI)
        // SHARPENING V4 (VECTOR-HARD):
        // User feedback: "Still too hazy".
        // Solution: Remove falloff entirely. Create a hard-edge "Cutout" disc.
        gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');    // Core - Pure White
        gradient.addColorStop(0.98, 'rgba(255, 255, 255, 1)');   // Body - Solid White to 98%
        gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0)');    // Edge - Instant Transparent Cut

        // Draw the gradient circle
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.fill();

        // Create Pixi texture from canvas
        const texture = PIXI.Texture.from(canvas);

        // Advanced High-DPI settings (configured on source)
        // DISABLING MIPMAPS: Mipmaps cause blur when high-res textures are scaled down heavily.
        // We want crisp sampling from the high-res source.
        texture.source.scaleMode = 'linear';
        texture.source.autoGenerateMipmaps = false; // <--- CHANGED: False for sharpness

        return texture;
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
                autoDensity: true, // Syncs CSS style with resolution
                preference: 'webgl', // Enforce WebGL for stability
                roundPixels: true, // <--- SHARPNESS: Force integer coordinates to prevent sub-pixel blur
            });

            if (containerRef.current) {
                // Clear any existing canvas (React Strict Mode double-invoke protection)
                containerRef.current.innerHTML = '';
                containerRef.current.appendChild(app.canvas);
            }

            appRef.current = app;

            // Container for Orbs
            const container = new PIXI.Container();
            container.sortableChildren = true; // Enable z-index sorting
            app.stage.addChild(container);
            mainContainerRef.current = container;

            // Store texture in Ref - Stellar Plasma texture
            textureRef.current = createOrbTexture();

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
                const viewMode = state.viewMode;
                const favorites = state.favorites;
                const isWatchlistOpen = state.isWatchlistOpen;
                const hasSelectedTicker = state.selectedTicker !== null;

                // Create a Set for faster lookups in SQUADRON mode
                const favoritesSet = new Set(favorites);

                // ========================================
                // CAMERA SHIFT: Smooth pan when panels open
                // ========================================
                let targetOffsetX = 0;
                let targetOffsetY = 0;

                // Shift left when right drawer is open
                if (hasSelectedTicker) {
                    targetOffsetX = -RIGHT_PANEL_WIDTH / 2;
                }

                // Shift right when left panel is open
                if (isWatchlistOpen) {
                    targetOffsetX += LEFT_PANEL_WIDTH / 2;
                }

                // Smooth LERP transition
                const cameraEase = 0.08;
                cameraOffsetRef.current.x += (targetOffsetX - cameraOffsetRef.current.x) * cameraEase;
                cameraOffsetRef.current.y += (targetOffsetY - cameraOffsetRef.current.y) * cameraEase;

                // Apply offset to container
                if (mainContainerRef.current) {
                    mainContainerRef.current.x = cameraOffsetRef.current.x;
                    mainContainerRef.current.y = cameraOffsetRef.current.y;
                }

                // Dynamic Scale Factor based on Timeframe Volatility
                // 1m/15m have small % changes, so we need higher visual scale to see movement
                let scaleFactor = 15; // Default 24h/7d
                if (activeTimeframe === '4h') scaleFactor = 30;
                else if (activeTimeframe === '1h') scaleFactor = 50;
                else if (activeTimeframe === '15m') scaleFactor = 100;
                else if (activeTimeframe === '1m') scaleFactor = 200;

                // SQUADRON mode: Closer grouping, larger orbs
                const squadronScaleBoost = viewMode === 'SQUADRON' ? 1.2 : 1.0;
                const squadronCenterPull = viewMode === 'SQUADRON' ? 0.7 : 1.0; // Pull closer to center

                // Iterate over ALL tickers in the Stream Store
                streamStore.tickers.forEach((data, symbol) => {
                    let orb = orbsRef.current.get(symbol);

                    // Create if missing
                    if (!orb) {
                        const x = Math.random() * screenWidth;
                        orb = new CoinOrb(data, texture, x, screenCenterY);
                        orb.setParentContainer(mainContainerRef.current!);
                        orb.bindInteraction((clickedData) => {
                            useMarketStore.getState().setSelectedTicker(clickedData);
                        });
                        orb.bindHover(
                            (hoveredData) => useMarketStore.getState().setHoveredTicker(hoveredData),
                            () => useMarketStore.getState().setHoveredTicker(null)
                        );
                        mainContainerRef.current!.addChild(orb.sprite);
                        orbsRef.current.set(symbol, orb);
                    }

                    // VIEW MODE FILTERING
                    const isInSquadron = favoritesSet.has(symbol);
                    const shouldRender = viewMode === 'GLOBAL' || isInSquadron;

                    if (!shouldRender) {
                        // Hide orb but keep in memory for instant switching
                        orb.sprite.visible = false;
                        return; // Skip update and animate
                    }

                    // Show orb
                    orb.sprite.visible = true;

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
                    // Apply squadron center pull for tighter grouping
                    const adjustedScaleFactor = scaleFactor * squadronCenterPull;
                    orb.updateData(data, screenCenterY, adjustedScaleFactor, visualPercent);

                    // Update Highlight (Imperative check)
                    const isMatch = !hasQuery || symbol.includes(query);
                    orb.highlight(isMatch, hasQuery);

                    // Update Favorite Status
                    orb.setFavorite(isInSquadron);

                    // Animate Physics
                    orb.animate();
                });

                // Debug Logging (Throttled)
                if (Date.now() % 2000 < 20) {
                    const visibleCount = viewMode === 'SQUADRON' ? favorites.length : streamStore.tickers.size;
                    console.log(`[Nebula Debug] Mode: ${viewMode}, Visible: ${visibleCount}, Timeframe: ${activeTimeframe}`);
                }

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
