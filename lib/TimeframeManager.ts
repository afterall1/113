

export class TimeframeManager {
    private baseUrl = 'https://api.binance.com/api/v3';

    // Verilen sembol listesi için "Open Price" verilerini çeker
    async fetchBaselines(symbols: string[], timeframe: string): Promise<Map<string, number>> {
        const baselineMap = new Map<string, number>();

        // Sadece USDT paritelerini filtrele (Gürültüyü azalt)
        const targetSymbols = symbols.filter(s => s.endsWith('USDT'));

        // 20'li paketlere böl (Batching)
        const batches = this.chunkArray(targetSymbols, 20);

        // Her paketi işle
        for (const batch of batches) {
            await Promise.all(batch.map(async (symbol) => {
                try {
                    // Limit=1 ve Interval=timeframe ile son mumu çek
                    const res = await fetch(`${this.baseUrl}/klines?symbol=${symbol}&interval=${timeframe}&limit=1`);

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