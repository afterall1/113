import { NextRequest, NextResponse } from 'next/server';
import { TokenMetadata, TokenUnlock } from '@/lib/types';

export const runtime = 'edge';

// ============================================================================
// SYMBOL -> COINGECKO ID MAPPING
// CoinGecko uses slugs (e.g., "bitcoin") not symbols (e.g., "BTC")
// ============================================================================

const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
    // Top 50 by market cap (common trading pairs)
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'DOGE': 'dogecoin',
    'ADA': 'cardano',
    'AVAX': 'avalanche-2',
    'SHIB': 'shiba-inu',
    'TRX': 'tron',
    'DOT': 'polkadot',
    'LINK': 'chainlink',
    'MATIC': 'matic-network',
    'POL': 'matic-network', // Polygon rebrand
    'BCH': 'bitcoin-cash',
    'LTC': 'litecoin',
    'NEAR': 'near',
    'UNI': 'uniswap',
    'APT': 'aptos',
    'ICP': 'internet-computer',
    'ETC': 'ethereum-classic',
    'FIL': 'filecoin',
    'ATOM': 'cosmos',
    'IMX': 'immutable-x',
    'HBAR': 'hedera-hashgraph',
    'CRO': 'crypto-com-chain',
    'STX': 'blockstack',
    'MNT': 'mantle',
    'INJ': 'injective-protocol',
    'OP': 'optimism',
    'ARB': 'arbitrum',
    'SUI': 'sui',
    'SEI': 'sei-network',
    'VET': 'vechain',
    'ALGO': 'algorand',
    'FTM': 'fantom',
    'SAND': 'the-sandbox',
    'MANA': 'decentraland',
    'GALA': 'gala',
    'AXS': 'axie-infinity',
    'THETA': 'theta-token',
    'XTZ': 'tezos',
    'EOS': 'eos',
    'AAVE': 'aave',
    'FLOW': 'flow',
    'NEO': 'neo',
    'XMR': 'monero',
    'EGLD': 'elrond-erd-2',
    'KAVA': 'kava',
    'XLM': 'stellar',
    'RUNE': 'thorchain',
    'CFX': 'conflux-token',
    'CAKE': 'pancakeswap-token',
    'LDO': 'lido-dao',
    'GMX': 'gmx',
    'SNX': 'synthetix-network-token',
    'CRV': 'curve-dao-token',
    'MKR': 'maker',
    'FXS': 'frax-share',
    'RPL': 'rocket-pool',
    'PENDLE': 'pendle',
    'PEPE': 'pepe',
    'WIF': 'dogwifcoin',
    'BONK': 'bonk',
    'FLOKI': 'floki',
    'WLD': 'worldcoin-wld',
    'TIA': 'celestia',
    'JUP': 'jupiter-exchange-solana',
    'PYTH': 'pyth-network',
    'JTO': 'jito-governance-token',
    'ORDI': 'ordinals',
    'BLUR': 'blur',
    'STRK': 'starknet',
    'DYM': 'dymension',
    'MEME': 'memecoin-2',
    'ACE': 'fusionist',
    'AI': 'any-inu',
    'ONDO': 'ondo-finance',
    'ENA': 'ethena',
    'W': 'wormhole',
    'TAO': 'bittensor',
    'FET': 'fetch-ai',
    'RENDER': 'render-token',
    'RNDR': 'render-token',
    'AGIX': 'singularitynet',
    'OCEAN': 'ocean-protocol',
    'ARKM': 'arkham',
    'GRT': 'the-graph',
    '1INCH': '1inch',
    'COMP': 'compound-governance-token',
    'YFI': 'yearn-finance',
    'SUSHI': 'sushi',
    'BAL': 'balancer',
    'LUNC': 'terra-luna',
    'LUNA': 'terra-luna-2',
    'ZRX': '0x',
    'ENS': 'ethereum-name-service',
    'APE': 'apecoin',
    'MASK': 'mask-network',
    'SSV': 'ssv-network',
    'LRC': 'loopring',
    'DYDX': 'dydx',
    'ZIL': 'zilliqa',
    'ONE': 'harmony',
    'HOT': 'holotoken',
    'CHZ': 'chiliz',
    'ENJ': 'enjincoin',
    'ROSE': 'oasis-network',
    'IOTA': 'iota',
    'KLAY': 'klay-token',
    'QTUM': 'qtum',
    'ZEC': 'zcash',
    'WAVES': 'waves',
    'KSM': 'kusama',
    'CELO': 'celo',
    'ANKR': 'ankr',
    'ICX': 'icon',
    'BTT': 'bittorrent',
    'SC': 'siacoin',
    'RVN': 'ravencoin',
    'ONT': 'ontology',
    'STORJ': 'storj',
    'IOTX': 'iotex',
    'SKL': 'skale',
    'CELR': 'celer-network',
    'BAND': 'band-protocol',
    'KNC': 'kyber-network-crystal',
    'BAT': 'basic-attention-token',
    'RSR': 'reserve-rights-token',
    'RLC': 'iexec-rlc',
    'OGN': 'origin-protocol',
    'NKN': 'nkn',
    'COTI': 'coti',
    'SXP': 'swipe',
    'ALICE': 'my-neighbor-alice',
    'TLM': 'alien-worlds',
    'C98': 'coin98',
    'SPELL': 'spell-token',
    'BICO': 'biconomy',
    'HIGH': 'highstreet',
    'MOVR': 'moonriver',
    'GLMR': 'moonbeam',
    'ASTR': 'astar',
    'KDA': 'kadena',
    'MINA': 'mina-protocol',
    'AUDIO': 'audius',
    'RAD': 'radicle',
    'AGLD': 'adventure-gold',
    'RARE': 'superrare',
    'PEOPLE': 'constitutiondao',
    'LOKA': 'league-of-kingdoms',
    'MAGIC': 'magic',
    'GMT': 'stepn',
    'GST': 'green-satoshi-token',
    'GAL': 'galxe',
    'OMG': 'omisego',
    'REQ': 'request-network',
    'POWR': 'power-ledger',
    'MTL': 'metal',
    'STMX': 'storm',
    'DATA': 'streamr',
    'CTSI': 'cartesi',
    'PROM': 'prom',
    'MDT': 'measurable-data-token',
    'PERP': 'perpetual-protocol',
    'ALPHA': 'alpha-finance',
    'DODO': 'dodo',
    'REEF': 'reef',
    'UNFI': 'unifi-protocol-dao',
    'LINA': 'linear',
    'TKO': 'tokocrypto',
    'SFP': 'safepal',
    'PUNDIX': 'pundi-x-2',
    'WOO': 'woo-network',
    'CHESS': 'tranchess',
    'BETA': 'beta-finance',
    'WING': 'wing-finance',
    'LEVER': 'lever',
    'BURGER': 'burger-swap',
    'XVG': 'verge',
    'XEM': 'nem',
    'DCR': 'decred',
    'DASH': 'dash',
    'AR': 'arweave',
    'HNT': 'helium',
    'JASMY': 'jasmycoin',
    'FLUX': 'zelcash',
};

// ============================================================================
// TAG INFERENCE FROM COINGECKO CATEGORIES
// ============================================================================

function inferTags(categories: string[] | undefined): string[] {
    if (!categories || categories.length === 0) return ['Crypto'];

    const tagMap: Record<string, string> = {
        'layer-1': 'Layer 1',
        'layer-2': 'Layer 2',
        'smart-contract-platform': 'Smart Contracts',
        'decentralized-finance-defi': 'DeFi',
        'decentralized-exchange': 'DEX',
        'non-fungible-tokens-nft': 'NFT',
        'gaming': 'Gaming',
        'metaverse': 'Metaverse',
        'meme-token': 'Meme',
        'artificial-intelligence': 'AI',
        'oracle': 'Oracle',
        'storage': 'Storage',
        'privacy-coins': 'Privacy',
        'stablecoin': 'Stablecoin',
        'exchange-based-tokens': 'Exchange Token',
        'yield-farming': 'Yield',
        'liquid-staking-derivatives': 'Liquid Staking',
        'real-world-assets-rwa': 'RWA',
    };

    const tags: string[] = [];
    for (const cat of categories) {
        const normalizedCat = cat.toLowerCase().replace(/\s+/g, '-');
        if (tagMap[normalizedCat]) {
            tags.push(tagMap[normalizedCat]);
        }
    }

    return tags.length > 0 ? tags.slice(0, 5) : ['Crypto'];
}

// ============================================================================
// CHAIN INFERENCE FROM PLATFORMS
// ============================================================================

function inferChains(platforms: Record<string, string> | undefined): string[] {
    if (!platforms || Object.keys(platforms).length === 0) return ['Unknown'];

    const chainNameMap: Record<string, string> = {
        'ethereum': 'Ethereum',
        'binance-smart-chain': 'BNB Chain',
        'polygon-pos': 'Polygon',
        'arbitrum-one': 'Arbitrum',
        'optimistic-ethereum': 'Optimism',
        'avalanche': 'Avalanche',
        'solana': 'Solana',
        'fantom': 'Fantom',
        'base': 'Base',
        'tron': 'Tron',
    };

    const chains: string[] = [];
    for (const platform of Object.keys(platforms)) {
        if (chainNameMap[platform]) {
            chains.push(chainNameMap[platform]);
        }
    }

    return chains.length > 0 ? chains.slice(0, 5) : ['Native'];
}

// ============================================================================
// GENERATE PROJECTED UNLOCK (Based on supply difference)
// ============================================================================

function generateProjectedUnlock(
    circulatingSupply: number,
    maxSupply: number | null,
    currentPrice: number
): TokenUnlock {
    // If no max supply, assume circulating is max (fully unlocked)
    if (!maxSupply || maxSupply <= circulatingSupply) {
        return {
            date: 'N/A',
            amount: 0,
            valueUSD: 0,
            percentOfSupply: 0,
            allocations: [],
        };
    }

    const remainingSupply = maxSupply - circulatingSupply;
    const percentLocked = (remainingSupply / maxSupply) * 100;

    // Estimate next unlock as 1% of remaining supply over next 90 days
    const estimatedUnlockAmount = remainingSupply * 0.01;
    const estimatedValueUSD = estimatedUnlockAmount * currentPrice;

    // Create a projected date (90 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);

    return {
        date: futureDate.toISOString().split('T')[0],
        amount: Math.round(estimatedUnlockAmount),
        valueUSD: Math.round(estimatedValueUSD),
        percentOfSupply: parseFloat((estimatedUnlockAmount / maxSupply * 100).toFixed(2)),
        allocations: [
            { category: 'Ecosystem Fund', percent: 40 },
            { category: 'Core Team', percent: 30 },
            { category: 'Private Investors', percent: 20 },
            { category: 'Community Rewards', percent: 10 },
        ],
    };
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol')?.toUpperCase();

    // Validation
    if (!symbol) {
        return NextResponse.json(
            { error: 'Symbol parameter is required (e.g., ?symbol=BTC)' },
            { status: 400 }
        );
    }

    // Clean symbol (remove USDT/BUSD suffix if present)
    const cleanSymbol = symbol.replace(/USDT$|BUSD$|USD$/, '');

    // Get CoinGecko ID from mapping, or search for it
    let coinGeckoId = SYMBOL_TO_COINGECKO_ID[cleanSymbol];

    // If not in mapping, try to search CoinGecko
    if (!coinGeckoId) {
        console.log(`[API/Token] Symbol ${cleanSymbol} not in mapping, searching CoinGecko...`);

        try {
            const searchUrl = `https://api.coingecko.com/api/v3/search?query=${cleanSymbol.toLowerCase()}`;
            const searchResponse = await fetch(searchUrl, {
                headers: { 'Accept': 'application/json' },
                next: { revalidate: 3600 } // Cache search results for 1 hour
            });

            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                const coins = searchData.coins || [];

                // Find exact symbol match (case-insensitive)
                const exactMatch = coins.find(
                    (c: { symbol: string }) => c.symbol.toUpperCase() === cleanSymbol
                );

                if (exactMatch) {
                    coinGeckoId = exactMatch.id;
                    console.log(`[API/Token] Found ${cleanSymbol} via search: ${coinGeckoId}`);
                } else if (coins.length > 0) {
                    // Take the first result if no exact match
                    coinGeckoId = coins[0].id;
                    console.log(`[API/Token] Using first search result for ${cleanSymbol}: ${coinGeckoId}`);
                }
            }
        } catch (searchError) {
            console.error(`[API/Token] Search failed for ${cleanSymbol}:`, searchError);
        }
    }

    // If still no ID found, return error
    if (!coinGeckoId) {
        console.warn(`[API/Token] Could not find CoinGecko ID for: ${cleanSymbol}`);
        return NextResponse.json(
            { error: `Could not find token: ${cleanSymbol}` },
            { status: 404 }
        );
    }

    try {
        // Fetch from CoinGecko API
        const apiUrl = `https://api.coingecko.com/api/v3/coins/${coinGeckoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

        console.log(`[API/Token] Fetching metadata for ${cleanSymbol} (${coinGeckoId})`);

        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/json',
            },
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API/Token] CoinGecko Error: ${response.status} - ${errorText}`);

            if (response.status === 429) {
                return NextResponse.json(
                    { error: 'Rate limit exceeded. Please try again later.' },
                    { status: 429 }
                );
            }

            throw new Error(`CoinGecko API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Extract and transform data
        const marketData = data.market_data;

        const tokenMetadata: TokenMetadata = {
            marketCap: marketData?.market_cap?.usd || 0,
            fdv: marketData?.fully_diluted_valuation?.usd || 0,
            circulatingSupply: marketData?.circulating_supply || 0,
            maxSupply: marketData?.max_supply || marketData?.total_supply || 0,
            nextUnlock: generateProjectedUnlock(
                marketData?.circulating_supply || 0,
                marketData?.max_supply,
                marketData?.current_price?.usd || 0
            ),
            tags: inferTags(data.categories),
            chains: inferChains(data.platforms),
            description: data.description?.en?.split('.')[0] || 'No description available.',
        };

        console.log(`[API/Token] Successfully fetched metadata for ${cleanSymbol}`);

        return NextResponse.json(tokenMetadata);

    } catch (error) {
        console.error('[API/Token] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch token metadata' },
            { status: 500 }
        );
    }
}
