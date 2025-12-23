// Chart Data Structure (TradingView Standard)
export interface CandleData {
  time: string | number; // Timestamp or YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TickerData {
  symbol: string;             // e.g., "BTCUSDT"
  price: number;              // Current price
  volume: number;             // 24h Volume or selected timeframe volume
  priceChangePercent: number; // Dynamic based on timeframe
  timeFrame: string;          // e.g., "1m", "15m", "1h"
}

// Unlock Allocation Breakdown (who receives tokens)
export interface UnlockAllocation {
  category: string;  // e.g., 'Core Team', 'Private Investors', 'Ecosystem Fund'
  percent: number;   // Percentage of this unlock going to this category
}

// Token Unlock Schedule
export interface TokenUnlock {
  date: string;              // ISO date string (e.g., "2025-03-15")
  amount: number;            // Number of tokens to be unlocked
  valueUSD: number;          // Estimated USD value at unlock
  percentOfSupply: number;   // Percentage of total supply being unlocked
  allocations: UnlockAllocation[]; // Breakdown of who receives tokens
}

// Fundamental Token Metadata
export interface TokenMetadata {
  marketCap: number;           // Current market capitalization in USD
  fdv: number;                 // Fully Diluted Valuation in USD
  circulatingSupply: number;   // Currently circulating token supply
  maxSupply: number;           // Maximum token supply (0 if infinite)
  nextUnlock: TokenUnlock;     // Next scheduled token unlock event
  tags: string[];              // Category tags (e.g., 'Layer 1', 'Gaming', 'DeFi')
  chains: string[];            // Supported blockchains (e.g., 'Ethereum', 'Solana')
  description: string;          // Brief project description
}

// Raw payload from Binance !ticker@arr stream
export interface BinanceTickerPayload {
  s: string;  // Symbol
  c: string;  // Close price
  q: string;  // Quote asset volume
  P: string;  // Price change percent
  E: number;  // Event time
}

// --- TRADE TERMINAL TYPES ---

export type TradeSide = 'LONG' | 'SHORT';

export interface Position {
  id: string;             // Unique ID (e.g., uuid)
  symbol: string;         // e.g., "BTCUSDT"
  side: TradeSide;        // LONG or SHORT
  entryPrice: number;     // Price at entry
  sizeUSD: number;        // Total position size in USD (Margin * Leverage)
  leverage: number;       // Leverage multiplier (e.g., 20)
  marginUSD: number;      // Collateral used
  liquidationPrice: number; // Estimated liq price
  timestamp: number;      // Entry time
}

export interface TradeOrder {
  symbol: string;
  side: TradeSide;
  leverage: number;
  margin: number;
}
