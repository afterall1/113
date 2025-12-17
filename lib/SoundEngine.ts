export class SoundEngine {
    private static instance: SoundEngine;
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private droneOsc: OscillatorNode | null = null;
    private droneGain: GainNode | null = null;

    // Rate Limiting
    private lastEventTime: number = 0;
    private readonly MIN_EVENT_DELAY = 150; // ms between pings (approx 6-7 per sec max)

    private constructor() { }

    static getInstance(): SoundEngine {
        if (!SoundEngine.instance) {
            SoundEngine.instance = new SoundEngine();
        }
        return SoundEngine.instance;
    }

    initialize() {
        if (this.ctx) return;

        // Lazy init
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        this.ctx = new AudioContextClass();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.0; // Start Muted
        this.masterGain.connect(this.ctx.destination);

        this.startDrone();
    }

    async resume() {
        if (!this.ctx) this.initialize();
        if (this.ctx?.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    setMute(isMuted: boolean) {
        if (!this.masterGain) return;
        // Smooth transition
        const now = this.ctx?.currentTime || 0;
        const target = isMuted ? 0.0 : 0.3; // 0.3 Max Volume
        this.masterGain.gain.setTargetAtTime(target, now, 0.1);

        if (!isMuted) this.resume();
    }

    private startDrone() {
        if (!this.ctx || !this.masterGain) return;

        this.droneOsc = this.ctx.createOscillator();
        this.droneGain = this.ctx.createGain();

        this.droneOsc.type = 'sine';
        this.droneOsc.frequency.value = 60; // Deep Base

        this.droneGain.gain.value = 0.3; // Subtle background

        this.droneOsc.connect(this.droneGain);
        this.droneGain.connect(this.masterGain);

        this.droneOsc.start();
    }

    // Procedural "Ping" for Gainers
    playPing(intensity: number = 0.5) {
        if (!this.ctx || !this.masterGain) return;
        if (Date.now() - this.lastEventTime < this.MIN_EVENT_DELAY) return;

        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();

        // Higher pitch for higher intensity/change
        const freq = 600 + (Math.random() * 400) + (intensity * 200);
        osc.frequency.value = freq;
        osc.type = 'sine';

        env.gain.value = 0;

        osc.connect(env);
        env.connect(this.masterGain);

        const now = this.ctx.currentTime;
        osc.start(now);

        // Envelope: Fast attack, Exponential decay
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.3 * intensity, now + 0.01);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.stop(now + 0.5);

        this.lastEventTime = Date.now();
    }

    // Procedural "Thud" for Losers
    playThud(intensity: number = 0.5) {
        if (!this.ctx || !this.masterGain) return;
        if (Date.now() - this.lastEventTime < this.MIN_EVENT_DELAY) return;

        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();

        // Low frequency
        osc.frequency.value = 100 + (Math.random() * 50);
        osc.type = 'triangle';

        env.gain.value = 0;

        osc.connect(env);
        env.connect(this.masterGain);

        const now = this.ctx.currentTime;
        osc.start(now);

        // Envelope: Thump
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.4 * intensity, now + 0.02);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.stop(now + 0.5);

        this.lastEventTime = Date.now();
    }
}
