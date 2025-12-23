export interface TickerData {
  symbol: string;             // e.g., "BTCUSDT"
  price: number;              // Current price
  volume: number;             // 24h Volume or selected timeframe volume
  priceChangePercent: number; // Dynamic based on timeframe
  timeFrame: string;          // e.g., "1m", "15m", "1h"
}

// Token Unlock Schedule
export interface TokenUnlock {
  date: string;           // ISO date string (e.g., "2025-03-15")
  amount: number;         // Number of tokens to be unlocked
  valueUSD: number;       // Estimated USD value at unlock
  percentOfSupply: number; // Percentage of total supply being unlocked
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
