'use client';

import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useMarketStore } from '@/store/useMarketStore';
import { CoinOrb } from '@/lib/CoinOrb';
import { streamStore } from '@/hooks/useBinanceStream';

interface NebulaCanvasProps {
    active?: boolean; // When false, pauses GPU rendering to save resources
}

// ============================================================================
// STAR FIELD TYPES for Deep Space Background
// ============================================================================
interface Star {
    sprite: PIXI.Sprite;
    baseAlpha: number;
    pulseSpeed: number;
    pulseOffset: number;
    velocityX: number;  // Slow drift velocity
    velocityY: number;
}

interface NebulaMist {
    sprite: PIXI.Sprite;
    rotationSpeed: number;
    driftX: number;
    driftY: number;
}

export default function NebulaCanvas({ active = true }: NebulaCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const orbsRef = useRef<Map<string, CoinOrb>>(new Map());
    const mainContainerRef = useRef<PIXI.Container | null>(null);
    const textureRef = useRef<PIXI.Texture | null>(null);

    // Deep Space Background Refs
    const bgContainerRef = useRef<PIXI.Container | null>(null);
    const starsRef = useRef<Star[]>([]);
    const nebulaRef = useRef<NebulaMist[]>([]);

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


    // Create shared texture once - HYPER-GLASS SINGULARITY effect
    // HIGH-DPI SUPER-SAMPLING: 512px for Retina-quality sharpness
    // 2025 "Sentient Matter" design language - Volumetric glass sphere simulation
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
        const radius = 240; // Larger radius for premium glass sphere

        // Create radial gradient for HYPER-GLASS SINGULARITY effect
        const gradient = ctx.createRadialGradient(
            center, center, 0,      // Inner circle (center point)
            center, center, radius  // Outer circle
        );

        // HYPER-GLASS SINGULARITY Color Stops (All WHITE - Tinted by PixiJS)
        // Simulates volumetric glass sphere with internal light refraction
        gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');  // Core - Singularity: Pure Bright
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)');  // Inner Halo: Dense Energy
        gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.5)');  // Body: Semi-Transparent Glass
        gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.1)');  // Dark Band: Contrast Ring
        gradient.addColorStop(0.96, 'rgba(255, 255, 255, 0.95)'); // Rim Light: Sharp Edge Glow
        gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');  // Sharp Cutoff: Clean Edge

        // Draw the gradient circle
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.fill();

        // Create Pixi texture from canvas
        const texture = PIXI.Texture.from(canvas);

        // Critical Settings for Glass Effect
        texture.source.scaleMode = 'linear';           // Smooth transitions
        texture.source.autoGenerateMipmaps = false;    // Preserve detail at all scales

        return texture;
    };

    // Create a small star texture (1-2px white dot with soft glow)
    const createStarTexture = (): PIXI.Texture => {
        const canvas = document.createElement('canvas');
        const size = 8; // Small texture for performance
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) return PIXI.Texture.WHITE;

        const center = size / 2;
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
        gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center, center, center, 0, Math.PI * 2);
        ctx.fill();

        const texture = PIXI.Texture.from(canvas);
        texture.source.scaleMode = 'linear';
        return texture;
    };

    // Create nebula mist texture (pre-blurred soft gradient)
    const createNebulaTexture = (color: string): PIXI.Texture => {
        const canvas = document.createElement('canvas');
        const size = 512; // Large for soft effect
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) return PIXI.Texture.WHITE;

        const center = size / 2;
        const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);

        // Parse color and create transparent gradient
        gradient.addColorStop(0.0, color);
        gradient.addColorStop(0.4, color.replace(')', ', 0.3)').replace('rgb', 'rgba'));
        gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(center, center, center, 0, Math.PI * 2);
        ctx.fill();

        const texture = PIXI.Texture.from(canvas);
        texture.source.scaleMode = 'linear';
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
                backgroundColor: 0x000000, // Pure black for deep space
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

            // ================================================================
            // LAYER 0: DEEP SPACE BACKGROUND (Rendered FIRST = Behind Orbs)
            // ================================================================
            const bgContainer = new PIXI.Container();
            bgContainer.zIndex = -1000; // Ensure it's always behind
            app.stage.addChild(bgContainer);
            bgContainerRef.current = bgContainer;

            const screenWidth = app.screen.width;
            const screenHeight = app.screen.height;

            // --- LAYER 1: DISTANT STARS (1000 twinkling points with drift) ---
            const starTexture = createStarTexture();
            const stars: Star[] = [];
            const STAR_COUNT = 1000;

            for (let i = 0; i < STAR_COUNT; i++) {
                const star = new PIXI.Sprite(starTexture);
                star.x = Math.random() * screenWidth * 1.2 - screenWidth * 0.1;
                star.y = Math.random() * screenHeight * 1.2 - screenHeight * 0.1;

                // Random size (1-2px visual)
                const scale = 0.12 + Math.random() * 0.18;
                star.scale.set(scale);

                // Random base alpha (wide range for depth perception)
                const baseAlpha = 0.1 + Math.random() * 0.7; // 0.1 to 0.8
                star.alpha = baseAlpha;

                star.anchor.set(0.5);
                bgContainer.addChild(star);

                stars.push({
                    sprite: star,
                    baseAlpha,
                    pulseSpeed: 0.005 + Math.random() * 0.02, // Very slow twinkle
                    pulseOffset: Math.random() * Math.PI * 2,  // Random phase
                    velocityX: (Math.random() - 0.5) * 0.02,   // Subtle drift
                    velocityY: (Math.random() - 0.5) * 0.01,
                });
            }
            starsRef.current = stars;

            // --- LAYER 2: NEBULA FOG (2 massive rotating gradient clouds) ---
            const nebulaColors = [
                'rgb(88, 28, 135)',   // Purple/Violet #581c87
                'rgb(30, 64, 175)',   // Deep Blue #1e40af
            ];

            const nebulae: NebulaMist[] = [];

            nebulaColors.forEach((color, index) => {
                const nebulaTexture = createNebulaTexture(color);
                const nebula = new PIXI.Sprite(nebulaTexture);

                // Position: centered with offset for overlap
                nebula.x = screenWidth * (0.4 + index * 0.25);
                nebula.y = screenHeight * (0.45 + (index % 2) * 0.15);

                // MASSIVE scale - 1.5x screen size for fog effect
                const fogScale = Math.max(screenWidth, screenHeight) / 256 * 1.5;
                nebula.scale.set(fogScale);
                nebula.alpha = 0.05; // Very subtle (0.05)
                nebula.anchor.set(0.5);
                nebula.blendMode = 'add'; // Additive for glow effect

                bgContainer.addChild(nebula);

                nebulae.push({
                    sprite: nebula,
                    rotationSpeed: 0.00015 * (index % 2 === 0 ? 1 : -1), // Opposite rotations
                    driftX: 0, // Static position, only rotation
                    driftY: 0,
                });
            });
            nebulaRef.current = nebulae;

            // ================================================================
            // LAYER 1: ORB CONTAINER (Rendered SECOND = Above Background)
            // ================================================================
            const container = new PIXI.Container();
            container.sortableChildren = true; // Enable z-index sorting
            container.zIndex = 0;
            app.stage.addChild(container);
            mainContainerRef.current = container;

            // Enable stage sorting
            app.stage.sortableChildren = true;

            // Store texture in Ref - Stellar Plasma texture
            textureRef.current = createOrbTexture();

            // MAIN RENDER LOOP (60 FPS)
            // Reads directly from Mutable Ref (streamStore)
            app.ticker.add(() => {
                // SAFETY: Exit early if refs are not ready
                if (!mainContainerRef.current || !textureRef.current) return;

                // ================================================================
                // BACKGROUND ANIMATION: Stars Twinkle + Drift, Nebula Rotation
                // ================================================================
                const time = Date.now() * 0.001; // Convert to seconds for smooth animation
                const w = app.screen.width;
                const h = app.screen.height;

                // Animate stars (alpha pulse + velocity drift)
                starsRef.current.forEach(star => {
                    // Twinkling effect
                    const pulse = Math.sin(time * star.pulseSpeed * 100 + star.pulseOffset);
                    star.sprite.alpha = star.baseAlpha + pulse * 0.2; // ±20% alpha variance

                    // Velocity drift
                    star.sprite.x += star.velocityX;
                    star.sprite.y += star.velocityY;

                    // Wrap around screen edges for infinite starfield
                    if (star.sprite.x > w + 10) star.sprite.x = -10;
                    if (star.sprite.x < -10) star.sprite.x = w + 10;
                    if (star.sprite.y > h + 10) star.sprite.y = -10;
                    if (star.sprite.y < -10) star.sprite.y = h + 10;
                });

                // Animate nebula (slow rotation only, centered)
                nebulaRef.current.forEach(nebula => {
                    nebula.sprite.rotation += nebula.rotationSpeed;
                });

                const screenCenterY = app.screen.height / 2;
                const screenWidth = app.screen.width;
                const texture = textureRef.current;

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

                // NEBULA mode: Show all. GRID mode: Still show all orbs but with adjusted styling
                // Favorites get special highlighting regardless of mode
                const squadronScaleBoost = 1.0;
                const squadronCenterPull = 1.0;

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
                    // In both modes, render all orbs (Grid view handles its own filtering)
                    const shouldRender = true;

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
                    const visibleCount = streamStore.tickers.size;
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

    // GPU OPTIMIZATION: Pause/Resume ticker when switching views
    useEffect(() => {
        if (!appRef.current) return;
        if (active) {
            appRef.current.ticker.start();
        } else {
            appRef.current.ticker.stop();
        }
    }, [active]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-0 w-full h-full pointer-events-auto"
        />
    );
}
