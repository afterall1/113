import { NextRequest, NextResponse } from 'next/server';
import { TokenMetadata, TokenUnlock, UnlockAllocation } from '@/lib/types';

export const runtime = 'edge';

// ============================================================================
// SYMBOL -> CMC SLUG MAPPING
// CoinMarketCap uses slugs (e.g., "bitcoin") not symbols (e.g., "BTC")
// ============================================================================

const SYMBOL_TO_CMC_SLUG: Record<string, string> = {
    // Major coins with non-obvious slugs
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'bnb',
    'SOL': 'solana',
    'XRP': 'xrp',
    'DOGE': 'dogecoin',
    'ADA': 'cardano',
    'AVAX': 'avalanche',
    'SHIB': 'shiba-inu',
    'TRX': 'tron',
    'DOT': 'polkadot-new',
    'LINK': 'chainlink',
    'MATIC': 'polygon',
    'POL': 'polygon',
    'BCH': 'bitcoin-cash',
    'LTC': 'litecoin',
    'NEAR': 'near-protocol',
    'UNI': 'uniswap',
    'APT': 'aptos',
    'ICP': 'internet-computer',
    'ETC': 'ethereum-classic',
    'FIL': 'filecoin',
    'ATOM': 'cosmos',
    'IMX': 'immutable-x',
    'HBAR': 'hedera',
    'CRO': 'cronos',
    'STX': 'stacks',
    'MNT': 'mantle',
    'INJ': 'injective',
    'OP': 'optimism-ethereum',
    'ARB': 'arbitrum',
    'SUI': 'sui',
    'SEI': 'sei',
    'VET': 'vechain',
    'ALGO': 'algorand',
    'FTM': 'fantom',
    'SAND': 'the-sandbox',
    'MANA': 'decentraland',
    'GALA': 'gala',
    'AXS': 'axie-infinity',
    'THETA': 'theta-network',
    'XTZ': 'tezos',
    'EOS': 'eos',
    'AAVE': 'aave',
    'FLOW': 'flow',
    'NEO': 'neo',
    'XMR': 'monero',
    'EGLD': 'multiversx-egld',
    'KAVA': 'kava',
    'XLM': 'stellar',
    'RUNE': 'thorchain',
    'CFX': 'conflux-network',
    'CAKE': 'pancakeswap',
    'LDO': 'lido-dao',
    'GMX': 'gmx',
    'SNX': 'synthetix-network-token',
    'CRV': 'curve-dao-token',
    'MKR': 'maker',
    'FXS': 'frax-share',
    'RPL': 'rocket-pool',
    'PENDLE': 'pendle',
    'PEPE': 'pepe',
    'WIF': 'dogwifhat',
    'BONK': 'bonk1',
    'FLOKI': 'floki-inu',
    'WLD': 'worldcoin-org',
    'TIA': 'celestia',
    'JUP': 'jupiter-ag',
    'PYTH': 'pyth-network',
    'JTO': 'jito',
    'ORDI': 'ordi',
    'BLUR': 'blur-token',
    'STRK': 'starknet-token',
    'DYM': 'dymension',
    'MEME': 'memecoin',
    'ONDO': 'ondo-finance',
    'ENA': 'ethena',
    'W': 'wormhole',
    'TAO': 'bittensor',
    'FET': 'fetch',
    'RENDER': 'render-token',
    'RNDR': 'render-token',
    'AGIX': 'singularitynet',
    'OCEAN': 'ocean-protocol',
    'GRT': 'the-graph',
    '1INCH': '1inch',
    'COMP': 'compound',
    'YFI': 'yearn-finance',
    'SUSHI': 'sushiswap',
    'APE': 'apecoin-ape',
    'ENS': 'ethereum-name-service',
    'DYDX': 'dydx-chain',
    'CHZ': 'chiliz',
    'ENJ': 'enjin-coin',
    'ROSE': 'oasis-network',
    'IOTA': 'iota',
    'ZEC': 'zcash',
    'KSM': 'kusama',
    'AR': 'arweave',
    'HNT': 'helium',
    'JASMY': 'jasmy',
    'FLUX': 'flux',
    'GMT': 'stepn',
    'MAGIC': 'magic',
    'PIPPIN': 'pippin',
    'VIRTUAL': 'virtual-protocol',
    'AI16Z': 'ai16z',
    'FARTCOIN': 'fartcoin',
    'GRIFFAIN': 'griffain',
    'AIXBT': 'aixbt-by-virtuals',
    'ARC': 'ai-rig-complex',
    'ZEREBRO': 'zerebro',
    'GOAT': 'goatseus-maximus',
    'SPX': 'spx6900',
    'PENGU': 'pudgy-penguins',
    'PNUT': 'peanut-the-squirrel',
    'ACT': 'act-i-the-ai-prophecy',
    'CHILLGUY': 'just-a-chill-guy',
    'MOODENG': 'moo-deng',
    'MEW': 'cat-in-a-dogs-world',
    'POPCAT': 'popcat-sol',
    'NEIRO': 'neiro-3',
    'BRETT': 'brett',
    'PONKE': 'ponke',
    'BOME': 'book-of-meme',
    'TURBO': 'turbo',
    'DOGS': 'dogs-2',
    'MOG': 'mog-coin',
    'GIGA': 'gigachad-2',
    'MYRO': 'myro',
    'TREMP': 'doland-tremp',
    'TRUMP': 'maga-trump',
    'MOTHER': 'mother-iggy',
    'MOVE': 'movement',
    'LAYER': 'layer',
    'MORPHO': 'morpho',
    'USUAL': 'usual',
    'HYPE': 'hyperliquid',
    'VANA': 'vana',
    'ME': 'magic-eden',
    'ORCA': 'orca',
    'COW': 'cow-protocol',
    'ZK': 'zksync',
    'EIGEN': 'eigenlayer',
    'DRIFT': 'drift-protocol',
};

// ============================================================================
// THE HUNTER FUNCTION - Recursive Deep Key Finder
// Structure-agnostic: searches JSON tree for specific keys
// ============================================================================

function findKey(obj: unknown, targetKey: string, maxDepth: number = 10): unknown {
    if (maxDepth <= 0 || obj === null || obj === undefined) {
        return undefined;
    }

    if (typeof obj !== 'object') {
        return undefined;
    }

    // Check if current object has the target key
    if (targetKey in (obj as Record<string, unknown>)) {
        return (obj as Record<string, unknown>)[targetKey];
    }

    // Recursively search in nested objects and arrays
    if (Array.isArray(obj)) {
        for (const item of obj) {
            const result = findKey(item, targetKey, maxDepth - 1);
            if (result !== undefined) {
                return result;
            }
        }
    } else {
        for (const value of Object.values(obj as Record<string, unknown>)) {
            const result = findKey(value, targetKey, maxDepth - 1);
            if (result !== undefined) {
                return result;
            }
        }
    }

    return undefined;
}

// Find all occurrences of a key (returns array)
function findAllKeys(obj: unknown, targetKey: string, results: unknown[] = [], maxDepth: number = 10): unknown[] {
    if (maxDepth <= 0 || obj === null || obj === undefined) {
        return results;
    }

    if (typeof obj !== 'object') {
        return results;
    }

    // Check if current object has the target key
    if (targetKey in (obj as Record<string, unknown>)) {
        results.push((obj as Record<string, unknown>)[targetKey]);
    }

    // Recursively search in nested objects and arrays
    if (Array.isArray(obj)) {
        for (const item of obj) {
            findAllKeys(item, targetKey, results, maxDepth - 1);
        }
    } else {
        for (const value of Object.values(obj as Record<string, unknown>)) {
            findAllKeys(value, targetKey, results, maxDepth - 1);
        }
    }

    return results;
}

// ============================================================================
// EXTRACT DATE FROM TEXT (Regex-based)
// ============================================================================

function extractDateFromText(text: string): string | null {
    if (!text) return null;

    // Match YYYY-MM-DD format
    const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[0];

    // Match "Month DD, YYYY" format
    const monthMatch = text.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i);
    if (monthMatch) {
        try {
            const date = new Date(monthMatch[0]);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        } catch { /* ignore */ }
    }

    return null;
}

// ============================================================================
// GENERATE SAFE EMPTY RESPONSE (Fallback)
// ============================================================================

function generateSafeEmptyResponse(): TokenMetadata {
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
        tags: ['Crypto'],
        chains: ['Unknown'],
        description: 'Data unavailable.',
    };
}

// ============================================================================
// CMC DEEP STATE EXTRACTION
// ============================================================================

async function fetchFromCMC(symbol: string): Promise<TokenMetadata | null> {
    const cleanSymbol = symbol.replace(/USDT$|BUSD$|USD$/, '');

    // Get slug from mapping, or convert symbol to lowercase as fallback
    const slug = SYMBOL_TO_CMC_SLUG[cleanSymbol] || cleanSymbol.toLowerCase();

    const url = `https://coinmarketcap.com/currencies/${slug}/`;

    console.log(`[CMC] Fetching: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache',
            },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
            console.warn(`[CMC] HTTP ${response.status} for ${slug}`);
            return null;
        }

        const html = await response.text();

        // Extract __NEXT_DATA__ JSON block
        const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);

        if (!jsonMatch || !jsonMatch[1]) {
            console.warn(`[CMC] Could not find __NEXT_DATA__ for ${slug}`);
            return null;
        }

        const jsonData = JSON.parse(jsonMatch[1]);

        // Hunt for key data structures
        const statistics = findKey(jsonData, 'statistics') as Record<string, unknown> | undefined;
        const detail = findKey(jsonData, 'detail') as Record<string, unknown> | undefined;
        const tokenDistribution = findKey(jsonData, 'tokenDistribution') as unknown[] | undefined;
        const allocations = findKey(jsonData, 'allocations') as unknown[] | undefined;
        const description = findKey(jsonData, 'description') as string | undefined;
        const category = findKey(jsonData, 'category') as string | undefined;
        const tags = findAllKeys(jsonData, 'tags', [], 5) as string[][] | undefined;
        const platforms = findKey(jsonData, 'platforms') as unknown[] | undefined;

        // Hunt for token unlock specific keys (CMC stores unlock data in various places)
        const vestingSchedule = findKey(jsonData, 'vestingSchedule') as unknown[] | Record<string, unknown> | undefined;
        const tokenUnlocks = findKey(jsonData, 'tokenUnlocks') as unknown[] | Record<string, unknown> | undefined;
        const upcomingEvents = findKey(jsonData, 'upcomingEvents') as unknown[] | undefined;
        const vestingData = findKey(jsonData, 'vestingData') as Record<string, unknown> | undefined;
        const unlockSchedule = findKey(jsonData, 'unlockSchedule') as unknown[] | Record<string, unknown> | undefined;
        const supplySchedule = findKey(jsonData, 'supplySchedule') as unknown[] | Record<string, unknown> | undefined;
        const cliff = findKey(jsonData, 'cliff') as Record<string, unknown> | undefined;
        const tgeDate = findKey(jsonData, 'tgeDate') as string | undefined;
        const nextUnlockDate = findKey(jsonData, 'nextUnlockDate') as string | undefined;
        const nextUnlockAmount = findKey(jsonData, 'nextUnlockAmount') as number | string | undefined;
        const nextUnlockPercent = findKey(jsonData, 'nextUnlockPercent') as number | string | undefined;

        // Extract numeric values from statistics
        const price = Number(statistics?.price || findKey(jsonData, 'price') || 0);
        const marketCap = Number(statistics?.marketCap || findKey(jsonData, 'marketCap') || 0);
        const fullyDilutedMarketCap = Number(statistics?.fullyDilutedMarketCap || findKey(jsonData, 'fullyDilutedMarketCap') || 0);
        const circulatingSupply = Number(statistics?.circulatingSupply || findKey(jsonData, 'circulatingSupply') || 0);
        const totalSupply = Number(statistics?.totalSupply || findKey(jsonData, 'totalSupply') || 0);
        const maxSupply = Number(statistics?.maxSupply || findKey(jsonData, 'maxSupply') || 0);

        // Calculate FDV if not directly available
        const fdv = fullyDilutedMarketCap > 0
            ? fullyDilutedMarketCap
            : (maxSupply > 0 ? maxSupply * price : totalSupply * price);

        // Extract token distribution/allocations from various sources
        const parsedAllocations: UnlockAllocation[] = [];

        // Try multiple sources for allocation data
        const distSources = [
            tokenDistribution,
            allocations,
            Array.isArray(vestingSchedule) ? vestingSchedule : null,
            Array.isArray(tokenUnlocks) ? tokenUnlocks : null,
            Array.isArray(unlockSchedule) ? unlockSchedule : null,
        ].filter(Boolean);

        for (const distSource of distSources) {
            if (Array.isArray(distSource) && parsedAllocations.length === 0) {
                for (const item of distSource) {
                    if (typeof item === 'object' && item !== null) {
                        const itemObj = item as Record<string, unknown>;
                        const cat = String(
                            itemObj.category || itemObj.name || itemObj.label ||
                            itemObj.holder || itemObj.type || itemObj.allocation || 'Unknown'
                        );
                        const pct = Number(
                            itemObj.percent || itemObj.percentage || itemObj.value ||
                            itemObj.share || itemObj.allocation || 0
                        );
                        if (cat && cat !== 'Unknown' && pct > 0) {
                            parsedAllocations.push({ category: cat, percent: pct });
                        }
                    }
                }
            }
        }

        // Extract next unlock date from various sources
        let extractedUnlockDate: string | null = null;
        let extractedUnlockAmount = 0;
        let extractedUnlockPercent = 0;

        // Try direct nextUnlock fields first
        if (nextUnlockDate) {
            extractedUnlockDate = extractDateFromText(String(nextUnlockDate));
        }
        if (nextUnlockAmount) {
            extractedUnlockAmount = Number(nextUnlockAmount) || 0;
        }
        if (nextUnlockPercent) {
            extractedUnlockPercent = Number(nextUnlockPercent) || 0;
        }

        // Try upcomingEvents for next unlock
        if (!extractedUnlockDate && Array.isArray(upcomingEvents)) {
            for (const event of upcomingEvents) {
                if (typeof event === 'object' && event !== null) {
                    const eventObj = event as Record<string, unknown>;
                    const eventDate = String(eventObj.date || eventObj.timestamp || eventObj.time || '');
                    const eventName = String(eventObj.name || eventObj.title || eventObj.type || '').toLowerCase();

                    // Check if this is an unlock event
                    if (eventName.includes('unlock') || eventName.includes('vest') || eventName.includes('release')) {
                        const parsedDate = extractDateFromText(eventDate);
                        if (parsedDate) {
                            extractedUnlockDate = parsedDate;
                            extractedUnlockAmount = Number(eventObj.amount || eventObj.value || 0);
                            extractedUnlockPercent = Number(eventObj.percent || eventObj.percentage || 0);
                            break;
                        }
                    }
                }
            }
        }

        // Try vestingSchedule or tokenUnlocks for upcoming unlocks
        if (!extractedUnlockDate) {
            const scheduleSource = Array.isArray(vestingSchedule) ? vestingSchedule :
                Array.isArray(tokenUnlocks) ? tokenUnlocks :
                    Array.isArray(unlockSchedule) ? unlockSchedule : null;

            if (scheduleSource) {
                const now = Date.now();
                for (const item of scheduleSource) {
                    if (typeof item === 'object' && item !== null) {
                        const itemObj = item as Record<string, unknown>;
                        const itemDate = String(itemObj.date || itemObj.timestamp || itemObj.unlockDate || '');
                        const parsedDate = extractDateFromText(itemDate);

                        if (parsedDate) {
                            const unlockTime = new Date(parsedDate).getTime();
                            // Only consider future unlocks
                            if (unlockTime > now) {
                                extractedUnlockDate = parsedDate;
                                extractedUnlockAmount = Number(itemObj.amount || itemObj.tokens || itemObj.value || 0);
                                extractedUnlockPercent = Number(itemObj.percent || itemObj.percentage || itemObj.share || 0);
                                break;
                            }
                        }
                    }
                }
            }
        }

        // Try TGE date if no unlock date found
        if (!extractedUnlockDate && tgeDate) {
            extractedUnlockDate = extractDateFromText(String(tgeDate));
        }

        // Fallback: try description text
        if (!extractedUnlockDate && description) {
            extractedUnlockDate = extractDateFromText(description);
        }

        // Extract chains/platforms
        const chains: string[] = [];
        if (Array.isArray(platforms)) {
            for (const p of platforms) {
                if (typeof p === 'object' && p !== null) {
                    const pObj = p as Record<string, unknown>;
                    const name = String(pObj.name || pObj.platform || '');
                    if (name) chains.push(name);
                }
            }
        }

        // Extract tags
        const extractedTags: string[] = [];
        if (category) extractedTags.push(category);
        if (Array.isArray(tags)) {
            for (const tagArray of tags.flat()) {
                if (typeof tagArray === 'string' && !extractedTags.includes(tagArray)) {
                    extractedTags.push(tagArray);
                }
            }
        }

        // Build nextUnlock with extracted data
        const unlockValueUSD = extractedUnlockAmount > 0 && price > 0
            ? extractedUnlockAmount * price
            : 0;

        const nextUnlock: TokenUnlock = parsedAllocations.length > 0 || extractedUnlockDate
            ? {
                date: extractedUnlockDate || 'TBA',
                amount: extractedUnlockAmount,
                valueUSD: unlockValueUSD,
                percentOfSupply: extractedUnlockPercent,
                allocations: parsedAllocations.slice(0, 5),
            }
            : {
                date: 'N/A',
                amount: 0,
                valueUSD: 0,
                percentOfSupply: 0,
                allocations: [],
            };

        const result: TokenMetadata = {
            marketCap,
            fdv,
            circulatingSupply,
            maxSupply: maxSupply || totalSupply,
            nextUnlock,
            tags: extractedTags.length > 0 ? extractedTags.slice(0, 5) : ['Crypto'],
            chains: chains.length > 0 ? chains.slice(0, 5) : ['Native'],
            description: description?.split('.')[0] || 'No description available.',
        };

        console.log(`[CMC] Successfully extracted data for ${slug}: MCAP=${marketCap}, FDV=${fdv}`);
        return result;

    } catch (error) {
        console.error(`[CMC] Error extracting data for ${slug}:`, error);
        return null;
    }
}

// ============================================================================
// COINGECKO FALLBACK (Preserved from original)
// ============================================================================

const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
    'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana',
    'XRP': 'ripple', 'DOGE': 'dogecoin', 'ADA': 'cardano', 'AVAX': 'avalanche-2',
    'SHIB': 'shiba-inu', 'TRX': 'tron', 'DOT': 'polkadot', 'LINK': 'chainlink',
    'MATIC': 'matic-network', 'POL': 'matic-network', 'BCH': 'bitcoin-cash',
    'LTC': 'litecoin', 'NEAR': 'near', 'UNI': 'uniswap', 'APT': 'aptos',
    'ICP': 'internet-computer', 'ATOM': 'cosmos', 'ARB': 'arbitrum', 'OP': 'optimism',
    'SUI': 'sui', 'SEI': 'sei-network', 'PEPE': 'pepe', 'WIF': 'dogwifcoin',
    'BONK': 'bonk', 'FLOKI': 'floki', 'TIA': 'celestia', 'JUP': 'jupiter-exchange-solana',
    'ONDO': 'ondo-finance', 'ENA': 'ethena', 'TAO': 'bittensor', 'FET': 'fetch-ai',
    'RENDER': 'render-token', 'GRT': 'the-graph', 'AAVE': 'aave', 'MKR': 'maker',
};

async function fetchFromCoinGecko(symbol: string): Promise<TokenMetadata | null> {
    const cleanSymbol = symbol.replace(/USDT$|BUSD$|USD$/, '');
    let coinGeckoId = SYMBOL_TO_COINGECKO_ID[cleanSymbol];

    // Try search API if not in mapping
    if (!coinGeckoId) {
        try {
            const searchUrl = `https://api.coingecko.com/api/v3/search?query=${cleanSymbol.toLowerCase()}`;
            const searchResponse = await fetch(searchUrl, {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 3600 }
            });

            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                const coins = searchData.coins || [];
                const exactMatch = coins.find(
                    (c: { symbol: string }) => c.symbol.toUpperCase() === cleanSymbol
                );
                coinGeckoId = exactMatch?.id || coins[0]?.id;
            }
        } catch (e) {
            console.error(`[CoinGecko] Search failed:`, e);
        }
    }

    if (!coinGeckoId) {
        console.warn(`[CoinGecko] Could not find ID for ${cleanSymbol}`);
        return null;
    }

    try {
        const apiUrl = `https://api.coingecko.com/api/v3/coins/${coinGeckoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 300 }
        });

        if (!response.ok) {
            console.warn(`[CoinGecko] HTTP ${response.status} for ${coinGeckoId}`);
            return null;
        }

        const data = await response.json();
        const marketData = data.market_data;

        return {
            marketCap: marketData?.market_cap?.usd || 0,
            fdv: marketData?.fully_diluted_valuation?.usd || 0,
            circulatingSupply: marketData?.circulating_supply || 0,
            maxSupply: marketData?.max_supply || marketData?.total_supply || 0,
            nextUnlock: {
                date: 'N/A',
                amount: 0,
                valueUSD: 0,
                percentOfSupply: 0,
                allocations: [],
            },
            tags: ['Crypto'],
            chains: ['Native'],
            description: data.description?.en?.split('.')[0] || 'No description available.',
        };
    } catch (error) {
        console.error(`[CoinGecko] Error:`, error);
        return null;
    }
}

// ============================================================================
// DEFILLAMA UNLOCKS SCRAPING
// Strategy: Scrape DeFiLlama unlocks page like CMC for __NEXT_DATA__
// ============================================================================

const SYMBOL_TO_DEFILLAMA_SLUG: Record<string, string> = {
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'SUI': 'sui',
    'APT': 'aptos',
    'SEI': 'sei',
    'TIA': 'celestia',
    'STRK': 'starknet',
    'DYM': 'dymension',
    'MOVE': 'movement',
    'EIGEN': 'eigenlayer',
    'ZK': 'zksync-era',
    'W': 'wormhole',
    'PYTH': 'pyth-network',
    'JTO': 'jito',
    'JUP': 'jupiter',
    'ONDO': 'ondo-finance',
    'ENA': 'ethena',
    'PENDLE': 'pendle',
    'WLD': 'worldcoin',
    'AAVE': 'aave',
    'UNI': 'uniswap',
    'LINK': 'chainlink',
    'GRT': 'the-graph',
    'LDO': 'lido',
    'MKR': 'maker',
    'CRV': 'curve',
    'SNX': 'synthetix',
    'COMP': 'compound',
    'DYDX': 'dydx',
    'GMX': 'gmx',
    'GUNZ': 'gunzilla',
    'VIRTUAL': 'virtuals',
    'LAYER': 'layerzero',
    'USUAL': 'usual',
    'MORPHO': 'morpho',
    'HYPE': 'hyperliquid',
    'DRIFT': 'drift',
};

async function fetchUnlockFromDeFiLlama(symbol: string): Promise<TokenUnlock | null> {
    const cleanSymbol = symbol.replace(/USDT$|BUSD$|USD$/, '');
    const slug = SYMBOL_TO_DEFILLAMA_SLUG[cleanSymbol] || cleanSymbol.toLowerCase();

    const url = `https://defillama.com/unlocks/${slug}`;
    console.log(`[DeFiLlama] Fetching unlocks: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            next: { revalidate: 600 } // Cache for 10 minutes
        });

        if (!response.ok) {
            console.warn(`[DeFiLlama] HTTP ${response.status} for ${slug}`);
            return null;
        }

        const html = await response.text();

        // Extract __NEXT_DATA__ JSON
        const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
        if (!jsonMatch || !jsonMatch[1]) {
            console.warn(`[DeFiLlama] No __NEXT_DATA__ for ${slug}`);
            return null;
        }

        const jsonData = JSON.parse(jsonMatch[1]);

        // Hunt for unlock data
        const events = findKey(jsonData, 'events') as unknown[] | undefined;
        const upcomingUnlocks = findKey(jsonData, 'upcomingUnlocks') as unknown[] | undefined;
        const emissions = findKey(jsonData, 'emissions') as unknown[] | undefined;
        const tokenAllocation = findKey(jsonData, 'tokenAllocation') as Record<string, number> | undefined;
        const categories = findKey(jsonData, 'categories') as Record<string, unknown> | undefined;

        // Find next unlock event
        let nextUnlockDate: string | null = null;
        let nextUnlockAmount = 0;
        let nextUnlockPercent = 0;

        const now = Date.now();
        const eventSource = events || upcomingUnlocks || emissions;

        if (Array.isArray(eventSource)) {
            for (const event of eventSource) {
                if (typeof event === 'object' && event !== null) {
                    const e = event as Record<string, unknown>;
                    const timestamp = Number(e.timestamp || e.date || e.time || 0);

                    // Convert to ms if needed
                    const eventTime = timestamp > 1e12 ? timestamp : timestamp * 1000;

                    if (eventTime > now) {
                        const date = new Date(eventTime);
                        nextUnlockDate = date.toISOString().split('T')[0];
                        nextUnlockAmount = Number(e.amount || e.tokens || e.value || 0);
                        nextUnlockPercent = Number(e.percent || e.percentage || e.unlockPercent || 0);
                        break;
                    }
                }
            }
        }

        // Build allocations from tokenAllocation or categories
        const allocations: UnlockAllocation[] = [];
        const allocSource = tokenAllocation || categories;

        if (allocSource && typeof allocSource === 'object') {
            for (const [key, value] of Object.entries(allocSource)) {
                if (typeof value === 'number' && value > 0) {
                    allocations.push({ category: key, percent: value });
                } else if (typeof value === 'object' && value !== null) {
                    const v = value as Record<string, unknown>;
                    const pct = Number(v.percent || v.percentage || v.allocation || 0);
                    if (pct > 0) {
                        allocations.push({ category: key, percent: pct });
                    }
                }
            }
        }

        if (nextUnlockDate || allocations.length > 0) {
            console.log(`[DeFiLlama] Found unlock data for ${slug}: ${nextUnlockDate}`);
            return {
                date: nextUnlockDate || 'TBA',
                amount: nextUnlockAmount,
                valueUSD: 0,
                percentOfSupply: nextUnlockPercent,
                allocations: allocations.slice(0, 5)
            };
        }

        return null;

    } catch (error) {
        console.error(`[DeFiLlama] Error for ${slug}:`, error);
        return null;
    }
}

// ============================================================================
// STATIC TOKEN UNLOCK DATA (Curated Fallback)
// ============================================================================

import tokenUnlocksData from '@/lib/data/tokenUnlocks.json';

interface StaticUnlockEntry {
    protocol: string;
    nextUnlock: {
        date: string | null;
        amount: number;
        percentOfSupply: number;
        category: string;
    };
    allocations: Array<{ category: string; percent: number }>;
}

const STATIC_UNLOCKS = tokenUnlocksData.unlocks as Record<string, StaticUnlockEntry>;

function getStaticUnlockData(symbol: string): TokenUnlock | null {
    const cleanSymbol = symbol.replace(/USDT$|BUSD$|USD$/, '');
    const staticData = STATIC_UNLOCKS[cleanSymbol];

    if (!staticData) {
        return null;
    }

    const { nextUnlock, allocations } = staticData;

    // Convert allocations to UnlockAllocation format
    const formattedAllocations: UnlockAllocation[] = allocations.map(a => ({
        category: a.category,
        percent: a.percent
    }));

    return {
        date: nextUnlock.date || 'N/A',
        amount: nextUnlock.amount,
        valueUSD: 0, // Will be calculated with price
        percentOfSupply: nextUnlock.percentOfSupply,
        allocations: formattedAllocations
    };
}

// ============================================================================
// MAIN API HANDLER
// Strategy: CMC/CoinGecko for Price + DeFiLlama/Static for Unlocks
// ============================================================================

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol')?.toUpperCase();

    if (!symbol) {
        return NextResponse.json(
            { error: 'Symbol parameter is required (e.g., ?symbol=BTC)' },
            { status: 400 }
        );
    }

    const cleanSymbol = symbol.replace(/USDT$|BUSD$|USD$/, '');
    console.log(`[API/Token] Processing request for: ${cleanSymbol}`);

    // Get unlock data: DeFiLlama first, then static fallback
    let unlockData = await fetchUnlockFromDeFiLlama(symbol);
    let unlockSource = 'DeFiLlama';

    if (!unlockData) {
        unlockData = getStaticUnlockData(symbol);
        unlockSource = 'Static';
    }

    if (unlockData) {
        console.log(`[API/Token] Found unlock data from ${unlockSource} for ${cleanSymbol}`);
    }

    // Strategy 1: Try CoinMarketCap Deep State Extraction
    let result = await fetchFromCMC(symbol);
    let source = 'CMC';

    // Strategy 2: Fallback to CoinGecko
    if (!result || (result.marketCap === 0 && result.fdv === 0)) {
        console.log(`[API/Token] CMC failed, trying CoinGecko for ${cleanSymbol}`);
        result = await fetchFromCoinGecko(symbol);
        source = 'CoinGecko';
    }

    // If we have price data, inject unlock data
    if (result && (result.marketCap > 0 || result.fdv > 0)) {
        // Override unlock data if available
        if (unlockData) {
            // Calculate USD value using price (price = mcap / circulating)
            const price = result.circulatingSupply > 0
                ? result.marketCap / result.circulatingSupply
                : result.fdv / result.maxSupply || 0;

            result.nextUnlock = {
                ...unlockData,
                valueUSD: unlockData.amount * price
            };
            console.log(`[API/Token] Injected ${unlockSource} unlock for ${cleanSymbol}: ${unlockData.date}`);
        }

        console.log(`[API/Token] ${source} success for ${cleanSymbol}`);
        return NextResponse.json(result);
    }

    // Strategy 3: Return with just unlock data if available
    if (unlockData) {
        console.log(`[API/Token] Using ${unlockSource} unlock only for ${cleanSymbol}`);
        const safeResult = generateSafeEmptyResponse();
        safeResult.nextUnlock = unlockData;
        return NextResponse.json(safeResult);
    }

    // Strategy 4: Return safe empty response
    console.warn(`[API/Token] All sources failed for ${cleanSymbol}, returning safe empty`);
    return NextResponse.json(generateSafeEmptyResponse());
}

