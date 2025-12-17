export interface TickerData {
  symbol: string;             // e.g., "BTCUSDT"
  price: number;              // Current price
  volume: number;             // 24h Volume or selected timeframe volume
  priceChangePercent: number; // Dynamic based on timeframe
  timeFrame: string;          // e.g., "1m", "15m", "1h"
}

// Raw payload from Binance !ticker@arr stream
export interface BinanceTickerPayload {
  s: string;  // Symbol
  c: string;  // Close price
  q: string;  // Quote asset volume
  P: string;  // Price change percent
  E: number;  // Event time
}
