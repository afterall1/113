import { TokenMetadata, TokenUnlock, UnlockAllocation } from '@/lib/types';

/**
 * Allocation categories for token unlocks
 */
const ALLOCATION_CATEGORIES = [
    'Core Team',
    'Private Investors',
    'Ecosystem Fund',
    'Community Rewards',
    'Treasury',
    'Advisors',
    'Foundation',
];

/**
 * Generate a future date string based on days from now
 */
function getFutureDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
}

/**
 * Generate random allocation breakdown that sums to 100%
 * @param seed - Seed for deterministic random generation
 * @returns Array of allocations
 */
function generateAllocations(seed: number): UnlockAllocation[] {
    // Shuffle categories based on seed
    const shuffled = [...ALLOCATION_CATEGORIES].sort((a, b) => {
        const hashA = a.charCodeAt(0) + seed;
        const hashB = b.charCodeAt(0) + seed;
        return hashA - hashB;
    });

    // Pick 2-4 categories
    const categoryCount = 2 + (seed % 3);
    const selected = shuffled.slice(0, categoryCount);

    // Distribute percentages (sum to 100)
    const allocations: UnlockAllocation[] = [];
    let remaining = 100;

    for (let i = 0; i < selected.length; i++) {
        const isLast = i === selected.length - 1;
        // Last one gets the remainder, others get random portions
        const percent = isLast
            ? remaining
            : Math.floor(remaining * (0.3 + (((seed + i) % 40) / 100)));

        remaining -= percent;
        allocations.push({
            category: selected[i],
            percent,
        });
    }

    // Sort by percent descending for UI display
    return allocations.sort((a, b) => b.percent - a.percent);
}

/**
 * Mock token metadata for popular cryptocurrencies
 * Returns realistic data for known tokens, generic data for others
 */
const MOCK_TOKEN_DATA: Record<string, Omit<TokenMetadata, 'nextUnlock'> & { unlockDays: number; unlockPercent: number }> = {
    BTC: {
        marketCap: 1_850_000_000_000,
        fdv: 1_950_000_000_000,
        circulatingSupply: 19_600_000,
        maxSupply: 21_000_000,
        tags: ['Layer 1', 'Store of Value', 'PoW'],
        chains: ['Bitcoin'],
        description: 'The original cryptocurrency. A decentralized digital currency without a central bank or single administrator.',
        unlockDays: 0,
        unlockPercent: 0,
    },
    ETH: {
        marketCap: 420_000_000_000,
        fdv: 420_000_000_000,
        circulatingSupply: 120_500_000,
        maxSupply: 0, // Infinite supply
        tags: ['Layer 1', 'Smart Contracts', 'DeFi', 'PoS'],
        chains: ['Ethereum'],
        description: 'A decentralized platform for smart contracts and DApps. The backbone of Web3.',
        unlockDays: 0,
        unlockPercent: 0,
    },
    SOL: {
        marketCap: 95_000_000_000,
        fdv: 115_000_000_000,
        circulatingSupply: 450_000_000,
        maxSupply: 0,
        tags: ['Layer 1', 'Smart Contracts', 'High TPS'],
        chains: ['Solana'],
        description: 'High-performance blockchain with fast transaction speeds and low costs. Popular for DeFi and NFTs.',
        unlockDays: 45,
        unlockPercent: 2.1,
    },
    BNB: {
        marketCap: 85_000_000_000,
        fdv: 85_000_000_000,
        circulatingSupply: 145_000_000,
        maxSupply: 200_000_000,
        tags: ['Layer 1', 'Exchange Token', 'Smart Contracts'],
        chains: ['BNB Chain', 'Ethereum'],
        description: 'Native token of Binance ecosystem. Used for trading fee discounts and BNB Chain transactions.',
        unlockDays: 0,
        unlockPercent: 0,
    },
    XRP: {
        marketCap: 65_000_000_000,
        fdv: 130_000_000_000,
        circulatingSupply: 55_000_000_000,
        maxSupply: 100_000_000_000,
        tags: ['Payments', 'Enterprise', 'Cross-border'],
        chains: ['XRP Ledger'],
        description: 'Digital payment protocol designed for fast, low-cost international money transfers.',
        unlockDays: 30,
        unlockPercent: 1.0,
    },
    DOGE: {
        marketCap: 45_000_000_000,
        fdv: 45_000_000_000,
        circulatingSupply: 144_000_000_000,
        maxSupply: 0,
        tags: ['Meme', 'Payments', 'PoW'],
        chains: ['Dogecoin'],
        description: 'The original meme coin. A fun and friendly cryptocurrency with strong community support.',
        unlockDays: 0,
        unlockPercent: 0,
    },
    ADA: {
        marketCap: 32_000_000_000,
        fdv: 45_000_000_000,
        circulatingSupply: 35_000_000_000,
        maxSupply: 45_000_000_000,
        tags: ['Layer 1', 'Smart Contracts', 'PoS', 'Academic'],
        chains: ['Cardano'],
        description: 'A proof-of-stake blockchain built with peer-reviewed research. Focus on scalability and sustainability.',
        unlockDays: 60,
        unlockPercent: 0.5,
    },
    AVAX: {
        marketCap: 18_000_000_000,
        fdv: 25_000_000_000,
        circulatingSupply: 400_000_000,
        maxSupply: 720_000_000,
        tags: ['Layer 1', 'Smart Contracts', 'Subnets'],
        chains: ['Avalanche', 'Ethereum'],
        description: 'Fast, low-cost, and eco-friendly blockchain with unique subnet architecture for scalability.',
        unlockDays: 90,
        unlockPercent: 3.2,
    },
    LINK: {
        marketCap: 12_000_000_000,
        fdv: 15_000_000_000,
        circulatingSupply: 600_000_000,
        maxSupply: 1_000_000_000,
        tags: ['Oracle', 'DeFi', 'Infrastructure'],
        chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Avalanche'],
        description: 'Decentralized oracle network providing real-world data to smart contracts across multiple chains.',
        unlockDays: 120,
        unlockPercent: 1.8,
    },
    MATIC: {
        marketCap: 8_500_000_000,
        fdv: 10_000_000_000,
        circulatingSupply: 9_300_000_000,
        maxSupply: 10_000_000_000,
        tags: ['Layer 2', 'Scaling', 'ZK-Rollups'],
        chains: ['Ethereum', 'Polygon'],
        description: 'Ethereum scaling solution using sidechains and ZK-rollups. Low fees and fast transactions.',
        unlockDays: 75,
        unlockPercent: 2.5,
    },
    ARB: {
        marketCap: 3_500_000_000,
        fdv: 12_000_000_000,
        circulatingSupply: 3_000_000_000,
        maxSupply: 10_000_000_000,
        tags: ['Layer 2', 'Optimistic Rollup', 'DeFi'],
        chains: ['Ethereum', 'Arbitrum'],
        description: 'Leading Ethereum Layer 2 using optimistic rollups. Home to major DeFi protocols.',
        unlockDays: 30,
        unlockPercent: 4.5,
    },
    OP: {
        marketCap: 2_800_000_000,
        fdv: 15_000_000_000,
        circulatingSupply: 1_200_000_000,
        maxSupply: 4_300_000_000,
        tags: ['Layer 2', 'Optimistic Rollup', 'Superchain'],
        chains: ['Ethereum', 'Optimism'],
        description: 'Ethereum L2 scaling solution. Part of the Superchain vision for interconnected rollups.',
        unlockDays: 45,
        unlockPercent: 3.8,
    },
    PEPE: {
        marketCap: 8_000_000_000,
        fdv: 8_000_000_000,
        circulatingSupply: 420_690_000_000_000,
        maxSupply: 420_690_000_000_000,
        tags: ['Meme', 'Community'],
        chains: ['Ethereum'],
        description: 'Frog-themed meme coin inspired by the Pepe the Frog internet meme. Community-driven.',
        unlockDays: 0,
        unlockPercent: 0,
    },
    WIF: {
        marketCap: 3_200_000_000,
        fdv: 3_200_000_000,
        circulatingSupply: 998_900_000,
        maxSupply: 998_900_000,
        tags: ['Meme', 'Solana', 'Community'],
        chains: ['Solana'],
        description: 'Dog-themed meme coin on Solana. Features a Shiba Inu wearing a pink beanie.',
        unlockDays: 0,
        unlockPercent: 0,
    },
};

/**
 * Generate default/generic token metadata for unknown tokens
 */
function generateGenericMetadata(symbol: string): TokenMetadata {
    const baseSymbol = symbol.replace('USDT', '').replace('BUSD', '').replace('USDC', '');
    const randomSeed = baseSymbol.charCodeAt(0) + (baseSymbol.charCodeAt(1) || 0);

    const marketCap = 500_000_000 + (randomSeed * 10_000_000);
    const fdvMultiplier = 1.2 + (randomSeed % 10) * 0.1;

    const nextUnlock: TokenUnlock = {
        date: getFutureDate(30 + (randomSeed % 60)),
        amount: marketCap * 0.02 / 10, // Rough token amount estimate
        valueUSD: marketCap * 0.02,
        percentOfSupply: 2 + (randomSeed % 5),
        allocations: generateAllocations(randomSeed),
    };

    return {
        marketCap,
        fdv: marketCap * fdvMultiplier,
        circulatingSupply: marketCap / 10,
        maxSupply: marketCap / 10 * fdvMultiplier,
        nextUnlock,
        tags: ['Altcoin'],
        chains: ['Ethereum'],
        description: `${baseSymbol} is a cryptocurrency token trading on major exchanges.`,
    };
}

/**
 * Fetch token metadata for a given symbol
 * Currently returns mock data - will be replaced with real API calls later
 * 
 * @param symbol - Trading pair symbol (e.g., "BTCUSDT", "ETHUSDT")
 * @returns Promise<TokenMetadata> - Token fundamental data
 */
export async function fetchTokenMetadata(symbol: string): Promise<TokenMetadata> {
    // Simulate network delay (100-300ms)
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // Extract base token from trading pair
    const baseSymbol = symbol.replace('USDT', '').replace('BUSD', '').replace('USDC', '');

    // Check if we have mock data for this token
    const mockData = MOCK_TOKEN_DATA[baseSymbol];

    if (mockData) {
        const { unlockDays, unlockPercent, ...metadata } = mockData;

        // Calculate next unlock based on mock data
        // Generate deterministic seed from symbol
        const symbolSeed = baseSymbol.charCodeAt(0) + (baseSymbol.charCodeAt(1) || 0);

        const nextUnlock: TokenUnlock = unlockDays > 0 ? {
            date: getFutureDate(unlockDays),
            amount: metadata.circulatingSupply * (unlockPercent / 100),
            valueUSD: metadata.marketCap * (unlockPercent / 100),
            percentOfSupply: unlockPercent,
            allocations: generateAllocations(symbolSeed),
        } : {
            date: '',
            amount: 0,
            valueUSD: 0,
            percentOfSupply: 0,
            allocations: [],
        };

        return {
            ...metadata,
            nextUnlock,
        };
    }

    // Return generic data for unknown tokens
    return generateGenericMetadata(symbol);
}

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
