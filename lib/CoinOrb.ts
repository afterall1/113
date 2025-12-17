import * as PIXI from 'pixi.js';
import { TickerData } from './types';

export class CoinOrb {
    public sprite: PIXI.Sprite;
    public symbol: string;
    public targetY: number = 0;

    private data: TickerData;
    private velocityY: number = 0;
    private readonly friction: number = 0.92;
    private readonly spring: number = 0.05;
    private originalScale: number = 1;
    private isHovered: boolean = false;

    constructor(data: TickerData, texture: PIXI.Texture, startX: number, startY: number) {
        this.data = data;
        this.symbol = data.symbol;

        this.sprite = new PIXI.Sprite(texture);
        this.sprite.anchor.set(0.5);
        this.sprite.x = startX;
        this.sprite.y = startY;
        this.targetY = startY; // Initialize target

        // Size based on volume (Square root to dampen huge differences)
        // Base scale 0.1, max scale cap around 0.5
        const volScale = Math.min(Math.sqrt(data.volume) * 0.0005, 0.5);
        this.originalScale = Math.max(0.05, volScale); // Minimum size
        this.sprite.scale.set(this.originalScale);

        // Color tint based on initial gain/loss
        this.updateBaseTint();

        // Interactive setup
        this.sprite.eventMode = 'static';
        this.sprite.cursor = 'pointer';

        this.sprite.on('pointerenter', () => this.setHover(true));
        this.sprite.on('pointerleave', () => this.setHover(false));
    }

    updateData(newData: TickerData, screenCenterY: number, scaleFactor: number = 15) {
        this.data = newData;
        // Don't call updateColor here blindly if we want to respect search query dimming 
        // We'll handle color updates via specific highlighting logic or check state
        // For now, let's keep it simple: Base color depends on price change.
        // Opacity depends on search.
        this.updateBaseTint();

        // Calculate Target Y
        this.targetY = screenCenterY - (this.data.priceChangePercent * scaleFactor);
    }

    private updateBaseTint() {
        if (this.data.priceChangePercent >= 0) {
            // Gainers: Green/Teal (Simple tint for now)
            this.sprite.tint = 0x00ffcc;
        } else {
            // Losers: Red/Orange
            this.sprite.tint = 0xff3366;
        }
    }

    // Called by main loop or subscriber when search query changes
    highlight(active: boolean, forceDim: boolean = false) {
        if (forceDim && !active) {
            this.sprite.alpha = 0.1;
            this.sprite.zIndex = 0;
        } else {
            this.sprite.alpha = 1.0;
            this.sprite.zIndex = 1;
        }
    }

    setHover(active: boolean) {
        this.isHovered = active;
        const hoverScale = active ? 1.5 : 1.0;
        // We handle scale smoothing in animate() or just direct set here for responsiveness
        // For now, smooth interaction in animate would be better but let's do direct for instant feedback
        const targetScale = this.originalScale * hoverScale;
        this.sprite.scale.set(targetScale);

        if (active) {
            this.sprite.zIndex = 100; // Bring to front
            // Emit event or callback if we had one for tooltip
            // For now, we just visually indicate
        } else {
            this.sprite.zIndex = 1;
        }
    }

    bindInteraction(onSelect: (data: TickerData) => void) {
        this.sprite.on('pointerdown', () => onSelect(this.data));
    }

    animate() {
        // LERP (Linear Interpolation) for Smooth Easing
        // Standard formula: current = current + (target - current) * ease
        const ease = 0.08; // 0.05=Heavy, 0.1=Standard, 0.2=Snappy
        const dy = this.targetY - this.sprite.y;

        // Optimization: Stop computing if very close
        if (Math.abs(dy) < 0.5) {
            this.sprite.y = this.targetY;
        } else {
            this.sprite.y += dy * ease;
        }

        // Optional: Subtle floating wobble (Breathing effect)
        // this.sprite.x += Math.sin(Date.now() * 0.001 + this.sprite.y * 0.01) * 0.2;
    }
}
