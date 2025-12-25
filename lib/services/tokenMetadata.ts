import { TokenMetadata } from '@/lib/types';

// ============================================================================
// MINIMAL FALLBACK RESPONSE
// Used when API completely fails (network error, etc.)
// ============================================================================

function createMinimalFallback(symbol: string): TokenMetadata {
    const cleanSymbol = symbol.replace(/USDT|BUSD|USD$/g, '');
    return {
        marketCap: 0,
        fdv: 0,
        circulatingSupply: 0,
        maxSupply: 0,
        nextUnlock: {
            date: 'N/A',
            amount: 0,
            valueUSD: 0,
            percentOfSupply: 0,
            allocations: [],
        },
        tags: ['Unknown'],
        chains: ['Unknown'],
        description: `${cleanSymbol} - Data temporarily unavailable.`,
    };
}

// ============================================================================
// FETCH TOKEN METADATA
// Connects to Smart Proxy API (CMC Deep State + CoinGecko Fallback)
// ============================================================================

/**
 * Fetch token metadata for a given symbol.
 * Uses the Smart Proxy API that combines CMC Deep State Extraction
 * with CoinGecko fallback.
 * 
 * @param symbol - Trading pair symbol (e.g., "BTCUSDT", "ETHUSDT", "PIPPINUSDT")
 * @returns Promise<TokenMetadata> - Token fundamental data from real sources
 */
export async function fetchTokenMetadata(symbol: string): Promise<TokenMetadata> {
    try {
        // Call the Smart Proxy API
        const response = await fetch(`/api/token/metadata?symbol=${encodeURIComponent(symbol)}`);

        // Parse response
        const data = await response.json();

        // If API returns error object, still use data if valid
        if (data.error) {
            console.warn(`[TokenMetadata] API warning for ${symbol}: ${data.error}`);
        }

        // Validate we have at least some data
        // The API already returns a safe empty response if all sources fail,
        // so we can trust the response structure
        if (typeof data.marketCap === 'number' || typeof data.fdv === 'number') {
            return data as TokenMetadata;
        }

        // If somehow the response is malformed, use minimal fallback
        console.warn(`[TokenMetadata] Malformed response for ${symbol}, using minimal fallback`);
        return createMinimalFallback(symbol);

    } catch (error) {
        // Network error or JSON parse error
        console.error(`[TokenMetadata] Network error for ${symbol}:`, error);
        return createMinimalFallback(symbol);
    }
}

// ============================================================================
// BATCH FETCH (Parallel requests)
// ============================================================================

/**
 * Fetch metadata for multiple tokens in parallel
 * 
 * @param symbols - Array of trading pair symbols
 * @returns Promise<Map<string, TokenMetadata>> - Map of symbol to metadata
 */
export async function fetchBatchTokenMetadata(
    symbols: string[]
): Promise<Map<string, TokenMetadata>> {
    const results = await Promise.all(
        symbols.map(async (symbol) => {
            const metadata = await fetchTokenMetadata(symbol);
            return [symbol, metadata] as const;
        })
    );

    return new Map(results);
}
