import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Position, TradeSide } from '@/lib/types';

// Simple ID generator if uuid is not available
const generateId = () => Math.random().toString(36).substr(2, 9);

interface TradeState {
    positions: Position[];
    tradeHistory: Position[]; // For now, just keeping closed positions
    activeLeverage: number;   // Default leverage for UI

    // Actions
    openPosition: (symbol: string, side: TradeSide, margin: number, leverage: number, currentPrice: number) => void;
    closePosition: (id: string, exitPrice: number) => void;
    setLeverage: (leverage: number) => void;
    clearHistory: () => void;
}

export const useTradeStore = create<TradeState>()(
    persist(
        (set) => ({
            positions: [],
            tradeHistory: [],
            activeLeverage: 10,

            setLeverage: (leverage) => set({ activeLeverage: leverage }),

            openPosition: (symbol, side, margin, leverage, currentPrice) => set((state) => {
                const sizeUSD = margin * leverage;

                // Simple liquidation estimation
                // Long Liq: Entry * (1 - 1/Lev)
                // Short Liq: Entry * (1 + 1/Lev)
                const liqPrice = side === 'LONG'
                    ? currentPrice * (1 - (1 / leverage) + 0.005) // Adding 0.5% buffer/fee
                    : currentPrice * (1 + (1 / leverage) - 0.005);

                const newPosition: Position = {
                    id: generateId(),
                    symbol,
                    side,
                    entryPrice: currentPrice,
                    sizeUSD,
                    leverage,
                    marginUSD: margin,
                    liquidationPrice: liqPrice,
                    timestamp: Date.now(),
                };

                return { positions: [newPosition, ...state.positions] };
            }),

            closePosition: (id, exitPrice) => set((state) => {
                const position = state.positions.find(p => p.id === id);
                if (!position) return {};

                // Move to history (simulation only, normally we'd calc PnL here too)
                const closedPosition = { ...position }; // snapshot

                return {
                    positions: state.positions.filter(p => p.id !== id),
                    tradeHistory: [closedPosition, ...state.tradeHistory]
                };
            }),

            clearHistory: () => set({ tradeHistory: [] }),
        }),
        {
            name: 'nebula-trade-storage',
        }
    )
);
