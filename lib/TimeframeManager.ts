

export class TimeframeManager {
    private baseUrl = 'https://api.binance.com/api/v3';

    // Interval to Binance Kline Interval map
    private readonly INTERVAL_MAP: Record<string, string> = {
        '1m': '1m',
        '15m': '15m',
        '1h': '1h',
        '4h': '4h',
        // '24h': '1d', // Filtered out before calling this
        '7d': '1w'
    };

    // Verilen sembol listesi için "Open Price" verilerini çeker
    async fetchBaselines(symbols: string[], timeframe: string): Promise<Map<string, number>> {
        const baselineMap = new Map<string, number>();

        // Map timeframe to Binance interval
        const interval = this.INTERVAL_MAP[timeframe];
        if (!interval) {
            console.warn(`[TimeframeManager] Invalid or unsupported timeframe: ${timeframe}`);
            return baselineMap; // Return empty if not supported
        }

        // Sadece USDT paritelerini filtrele (Gürültüyü azalt) - User wanted ALL now
        const targetSymbols = symbols;

        // 20'li paketlere böl (Batching)
        const batches = this.chunkArray(targetSymbols, 20);

        // Her paketi işle
        for (const batch of batches) {
            await Promise.all(batch.map(async (symbol) => {
                try {
                    // Limit=1 ve Interval=mappedInterval ile son mumu çek
                    const res = await fetch(`${this.baseUrl}/klines?symbol=${symbol}&interval=${interval}&limit=1`);

                    if (!res.ok) return; // Hata veren coini atla

                    const data = await res.json();
                    // Binance kline format: [OpenTime, Open, High, Low, Close, ...]
                    // Index 1 = Open Price
                    if (Array.isArray(data) && data.length > 0) {
                        const openPrice = parseFloat(data[0][1]);
                        if (!isNaN(openPrice)) {
                            baselineMap.set(symbol, openPrice);
                        }
                    }
                } catch (e) {
                    // Tekil hata tüm süreci durdurmasın (Fail-Safe)
                    console.warn(`Failed to fetch baseline for ${symbol}`, e);
                }
            }));

            // API'ye nefes aldır (50ms bekle)
            await new Promise(r => setTimeout(r, 50));
        }

        return baselineMap;
    }

    // Yardımcı fonksiyon: Diziyi parçalara böler
    private chunkArray<T>(array: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }
}