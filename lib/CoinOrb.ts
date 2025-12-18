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

    // Hover Label System
    private labelContainer: PIXI.Container | null = null;
    private labelText: PIXI.Text | null = null;
    private hoverRing: PIXI.Graphics | null = null;
    private parentContainer: PIXI.Container | null = null;

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

    // Set parent container for label rendering (called from NebulaCanvas)
    setParentContainer(container: PIXI.Container) {
        this.parentContainer = container;
    }

    // Get effective radius for hit detection
    getRadius(): number {
        // Base radius is 48 (from texture), scale by sprite scale
        return 48 * this.sprite.scale.x;
    }

    updateData(newData: TickerData, screenCenterY: number, scaleFactor: number = 15, overridePercent?: number) {
        this.data = newData;

        // Determine value to display/calculate
        const displayPercent = overridePercent !== undefined ? overridePercent : this.data.priceChangePercent;

        // CRITICAL FIX: Update the data object so that UI components (DetailDrawer) see the corrected %
        if (overridePercent !== undefined) {
            this.data.priceChangePercent = overridePercent;
        }

        this.updateBaseTint(displayPercent);

        // Calculate Target Y
        this.targetY = screenCenterY - (displayPercent * scaleFactor);
    }

    private updateBaseTint(percent: number = this.data.priceChangePercent) {
        if (this.isFavorite) {
            // GOLD for Favorites
            this.sprite.tint = 0xFFD700;
            this.sprite.zIndex = 50; // Above normal (1), below hover (100)
            this.sprite.alpha = 1.0;
        } else if (percent >= 0) {
            // Gainers: Green/Teal
            this.sprite.tint = 0x00ffcc;
            this.sprite.zIndex = 1;
        } else {
            // Losers: Red/Orange
            this.sprite.tint = 0xff3366;
            this.sprite.zIndex = 1;
        }
    }

    private isFavorite: boolean = false;

    setFavorite(isFav: boolean) {
        if (this.isFavorite !== isFav) {
            this.isFavorite = isFav;
            // Re-apply tint immediately
            this.updateBaseTint(this.data.priceChangePercent);
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
        const targetScale = this.originalScale * hoverScale;
        this.sprite.scale.set(targetScale);

        if (active) {
            this.sprite.zIndex = 100; // Bring to front
            this.showLabel();
        } else {
            this.sprite.zIndex = 1;
            this.hideLabel();
        }
    }

    private showLabel() {
        if (!this.parentContainer || this.labelContainer) return;

        // Create container for label + ring
        this.labelContainer = new PIXI.Container();
        this.labelContainer.zIndex = 200; // Always on top

        // Create glowing ring
        this.hoverRing = new PIXI.Graphics();
        const ringRadius = this.getRadius() + 4;
        this.hoverRing.circle(0, 0, ringRadius);
        this.hoverRing.stroke({ width: 2, color: 0x00ffff, alpha: 0.8 });
        // Outer glow
        this.hoverRing.circle(0, 0, ringRadius + 4);
        this.hoverRing.stroke({ width: 1, color: 0x00ffff, alpha: 0.3 });
        this.labelContainer.addChild(this.hoverRing);

        // Create floating label
        this.labelText = new PIXI.Text({
            text: this.symbol.replace('USDT', ''),
            style: {
                fontFamily: 'monospace',
                fontSize: 12,
                fontWeight: 'bold',
                fill: 0xffffff,
                stroke: { color: 0x000000, width: 3 },
                dropShadow: {
                    alpha: 0.5,
                    angle: Math.PI / 4,
                    blur: 4,
                    distance: 2,
                },
            },
        });
        this.labelText.anchor.set(0, 0.5);
        this.labelText.x = ringRadius + 8;
        this.labelText.y = -ringRadius;
        this.labelContainer.addChild(this.labelText);

        // Add percent badge
        const percentText = new PIXI.Text({
            text: `${this.data.priceChangePercent >= 0 ? '+' : ''}${this.data.priceChangePercent.toFixed(2)}%`,
            style: {
                fontFamily: 'monospace',
                fontSize: 10,
                fill: this.data.priceChangePercent >= 0 ? 0x00ffcc : 0xff3366,
                stroke: { color: 0x000000, width: 2 },
            },
        });
        percentText.anchor.set(0, 0.5);
        percentText.x = ringRadius + 8;
        percentText.y = -ringRadius + 14;
        this.labelContainer.addChild(percentText);

        this.parentContainer.addChild(this.labelContainer);
        this.updateLabelPosition();
    }

    private hideLabel() {
        if (this.labelContainer && this.parentContainer) {
            this.parentContainer.removeChild(this.labelContainer);
            this.labelContainer.destroy({ children: true });
            this.labelContainer = null;
            this.labelText = null;
            this.hoverRing = null;
        }
    }

    private updateLabelPosition() {
        if (this.labelContainer) {
            this.labelContainer.x = this.sprite.x;
            this.labelContainer.y = this.sprite.y;
        }
    }

    bindInteraction(onSelect: (data: TickerData) => void) {
        this.sprite.on('pointerdown', () => onSelect(this.data));
    }

    animate() {
        // LERP (Linear Interpolation) for Smooth Easing
        const ease = 0.08;
        const dy = this.targetY - this.sprite.y;

        if (Math.abs(dy) < 0.5) {
            this.sprite.y = this.targetY;
        } else {
            this.sprite.y += dy * ease;
        }

        // Update label position if visible
        this.updateLabelPosition();
    }

    // Cleanup on destroy
    destroy() {
        this.hideLabel();
    }
}
