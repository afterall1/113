import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TickerData } from '@/lib/types';

// View Mode Type
export type ViewMode = 'GLOBAL' | 'SQUADRON';

interface MarketState {
    tickers: Map<string, TickerData>;
    selectedTicker: TickerData | null;
    hoveredTicker: TickerData | null;
    searchQuery: string;
    timeframe: string;
    isMuted: boolean;
    baselines: Map<string, number>;
    favorites: string[];
    viewMode: ViewMode;
    isWatchlistOpen: boolean;

    updateBatch: (newTickers: TickerData[]) => void;
    setSelectedTicker: (ticker: TickerData | null) => void;
    setHoveredTicker: (ticker: TickerData | null) => void;
    setSearchQuery: (query: string) => void;
    setTimeframe: (tf: string) => void;
    setIsMuted: (muted: boolean) => void;
    setBaselines: (baselines: Map<string, number>) => void;
    toggleFavorite: (symbol: string) => void;
    setViewMode: (mode: ViewMode) => void;
    setWatchlistOpen: (isOpen: boolean) => void;
}

export const useMarketStore = create<MarketState>()(
    persist(
        (set) => ({
            tickers: new Map(),
            selectedTicker: null,
            hoveredTicker: null,
            searchQuery: '',
            timeframe: '24h',
            isMuted: true,
            baselines: new Map(),
            favorites: [],
            viewMode: 'GLOBAL',
            isWatchlistOpen: false,

            updateBatch: (newTickers) =>
                set((state) => {
                    const updatedMap = new Map(state.tickers);
                    newTickers.forEach((ticker) => {
                        updatedMap.set(ticker.symbol, ticker);
                    });
                    return { tickers: updatedMap };
                }),

            setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),
            setHoveredTicker: (ticker) => set({ hoveredTicker: ticker }),
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

            setViewMode: (mode) => set({ viewMode: mode }),

            setWatchlistOpen: (isOpen) => set({ isWatchlistOpen: isOpen }),
        }),
        {
            name: 'nebula-storage', // Unique name for LocalStorage key
            partialize: (state) => ({
                // ONLY persist these fields
                favorites: state.favorites,
                isMuted: state.isMuted,
                timeframe: state.timeframe,
                viewMode: state.viewMode,
            }),
        }
    )
);

// Helper: Get Squadron (Favorites) Tickers
// Use this in components to filter tickers by favorites list
export const getSquadronTickers = (state: MarketState): Map<string, TickerData> => {
    const squadronMap = new Map<string, TickerData>();
    state.favorites.forEach(symbol => {
        const ticker = state.tickers.get(symbol);
        if (ticker) {
            squadronMap.set(symbol, ticker);
        }
    });
    return squadronMap;
};
