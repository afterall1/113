import { create } from 'zustand';
import { TickerData } from '@/lib/types';

interface MarketState {
    tickers: Map<string, TickerData>;
    selectedTicker: TickerData | null;
    searchQuery: string;
    timeframe: string;
    isMuted: boolean;
    baselines: Map<string, number>;
    updateBatch: (newTickers: TickerData[]) => void;
    setSelectedTicker: (ticker: TickerData | null) => void;
    setSearchQuery: (query: string) => void;
    setTimeframe: (tf: string) => void;
    setIsMuted: (muted: boolean) => void;
    setBaselines: (baselines: Map<string, number>) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
    tickers: new Map(),
    selectedTicker: null,
    searchQuery: '',
    timeframe: '24h',
    isMuted: true, // Start muted
    baselines: new Map(),
    updateBatch: (newTickers) =>
        set((state) => {
            const updatedMap = new Map(state.tickers);
            newTickers.forEach((ticker) => {
                updatedMap.set(ticker.symbol, ticker);
            });
            return { tickers: updatedMap };
        }),
    setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setTimeframe: (tf) => set({ timeframe: tf }),
    setIsMuted: (muted) => set({ isMuted: muted }),
    setBaselines: (baselines) => set({ baselines }),
}));
