import { TickerData } from '@/lib/types';

export class DataBuffer {
    private buffer: Map<string, TickerData> = new Map();
    private lastFlush: number = 0;
    private readonly delay: number;

    constructor(delayMs: number = 500) {
        this.delay = delayMs;
    }

    push(data: TickerData[]) {
        for (const item of data) {
            this.buffer.set(item.symbol, item);
        }
    }

    flush(): TickerData[] | null {
        const now = Date.now();
        if (now - this.lastFlush < this.delay) {
            return null;
        }

        if (this.buffer.size === 0) {
            return null;
        }

        const flushedData = Array.from(this.buffer.values());
        this.buffer.clear();
        this.lastFlush = now;
        return flushedData;
    }
}
