import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TickerData } from '@/lib/types';

interface MarketState {
    tickers: Map<string, TickerData>;
    selectedTicker: TickerData | null;
    searchQuery: string;
    timeframe: string;
    isMuted: boolean;
    baselines: Map<string, number>;
    favorites: string[];

    updateBatch: (newTickers: TickerData[]) => void;
    setSelectedTicker: (ticker: TickerData | null) => void;
    setSearchQuery: (query: string) => void;
    setTimeframe: (tf: string) => void;
    setIsMuted: (muted: boolean) => void;
    setBaselines: (baselines: Map<string, number>) => void;
    toggleFavorite: (symbol: string) => void;
}

export const useMarketStore = create<MarketState>()(
    persist(
        (set) => ({
            tickers: new Map(),
            selectedTicker: null,
            searchQuery: '',
            timeframe: '24h',
            isMuted: true,
            baselines: new Map(),
            favorites: [],

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

            toggleFavorite: (symbol) => set((state) => {
                const exists = state.favorites.includes(symbol);
                const newList = exists
                    ? state.favorites.filter(s => s !== symbol)
                    : [...state.favorites, symbol];
                return { favorites: newList };
            }),
        }),
        {
            name: 'nebula-storage', // Unique name for LocalStorage key
            partialize: (state) => ({
                // ONLY persist these fields
                favorites: state.favorites,
                isMuted: state.isMuted,
                timeframe: state.timeframe
            }),
        }
    )
);
