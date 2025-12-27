import { NextRequest, NextResponse } from 'next/server';
import { UnifiedMarketData } from '@/lib/types';

export const runtime = 'edge';

// ============================================================================
// NEBULA NEXUS - DEEP SCAN ENGINE
// The Manipulation Hunter API
// ============================================================================
// This endpoint fetches Spot + Futures data in parallel, fuses them on the
// timestamp axis, and returns AI-ready UnifiedMarketData[].
// ============================================================================

// Binance API Endpoints
const BINANCE_FUTURES_KLINES = 'https://fapi.binance.com/fapi/v1/klines';
const BINANCE_SPOT_KLINES = 'https://api.binance.com/api/v3/klines';
const BINANCE_FUNDING_RATE = 'https://fapi.binance.com/fapi/v1/fundingRate';
const BINANCE_OPEN_INTEREST_HIST = 'https://fapi.binance.com/futures/data/openInterestHist';
const BINANCE_LONG_SHORT_RATIO = 'https://fapi.binance.com/futures/data/globalLongShortAccountRatio';

// Valid periods for OI/L/S Ratio endpoints
const VALID_METRIC_PERIODS = ['5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'];

// Map kline intervals to metric API periods
function mapIntervalToMetricPeriod(interval: string): string {
    if (VALID_METRIC_PERIODS.includes(interval)) return interval;
    const mapping: Record<string, string> = {
        '1m': '5m', '3m': '5m', '5m': '5m',
        '15m': '15m', '30m': '30m',
        '1h': '1h', '2h': '2h', '4h': '4h',
        '6h': '6h', '8h': '6h', '12h': '12h',
        '1d': '1d', '3d': '1d', '1w': '1d', '1M': '1d',
    };
    return mapping[interval] || '1h';
}

// ============================================================================
// DATA FETCHERS (Parallel Execution)
// ============================================================================

interface KlineRaw {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

async function fetchFuturesKlines(symbol: string, interval: string, limit: number): Promise<KlineRaw[]> {
    const url = `${BINANCE_FUTURES_KLINES}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error(`Futures Klines Error: ${res.status}`);
    const data = await res.json();

    return data.map((k: any[]) => ({
        timestamp: k[0], // Keep as ms
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
    }));
}

async function fetchSpotKlines(symbol: string, interval: string, limit: number): Promise<KlineRaw[]> {
    const url = `${BINANCE_SPOT_KLINES}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    if (!res.ok) {
        console.warn(`[DeepScan] Spot Klines unavailable for ${symbol}: ${res.status}`);
        return []; // Spot data may not exist for all futures pairs
    }
    const data = await res.json();

    return data.map((k: any[]) => ({
        timestamp: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
    }));
}

interface OIDataPoint {
    timestamp: number;
    sumOpenInterestValue: number;
}

async function fetchOpenInterest(symbol: string, period: string, limit: number): Promise<OIDataPoint[]> {
    const url = `${BINANCE_OPEN_INTEREST_HIST}?symbol=${symbol}&period=${period}&limit=${limit}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
        console.warn(`[DeepScan] OI data unavailable for ${symbol}: ${res.status}`);
        return [];
    }
    const data = await res.json();

    return data.map((item: any) => ({
        timestamp: item.timestamp,
        sumOpenInterestValue: parseFloat(item.sumOpenInterestValue),
    }));
}

interface FundingRatePoint {
    fundingTime: number;
    fundingRate: number;
}

async function fetchFundingRate(symbol: string, limit: number): Promise<FundingRatePoint[]> {
    const url = `${BINANCE_FUNDING_RATE}?symbol=${symbol}&limit=${limit}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
        console.warn(`[DeepScan] Funding Rate unavailable for ${symbol}: ${res.status}`);
        return [];
    }
    const data = await res.json();

    return data.map((item: any) => ({
        fundingTime: item.fundingTime,
        fundingRate: parseFloat(item.fundingRate),
    }));
}

interface LongShortPoint {
    timestamp: number;
    longShortRatio: number;
}

async function fetchLongShortRatio(symbol: string, period: string, limit: number): Promise<LongShortPoint[]> {
    const url = `${BINANCE_LONG_SHORT_RATIO}?symbol=${symbol}&period=${period}&limit=${limit}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
        console.warn(`[DeepScan] L/S Ratio unavailable for ${symbol}: ${res.status}`);
        return [];
    }
    const data = await res.json();

    return data.map((item: any) => ({
        timestamp: item.timestamp,
        longShortRatio: parseFloat(item.longShortRatio),
    }));
}

// ============================================================================
// DATA FUSION ENGINE
// ============================================================================

function findClosestValue<T extends { timestamp?: number; fundingTime?: number }>(
    arr: T[],
    targetTimestamp: number,
    maxDelta: number = 3600000 // 1 hour tolerance
): T | null {
    if (arr.length === 0) return null;

    let closest: T | null = null;
    let minDelta = Infinity;

    for (const item of arr) {
        const ts = item.timestamp ?? item.fundingTime ?? 0;
        const delta = Math.abs(ts - targetTimestamp);
        if (delta < minDelta && delta <= maxDelta) {
            minDelta = delta;
            closest = item;
        }
    }

    return closest;
}

function fuseData(
    futuresKlines: KlineRaw[],
    spotKlines: KlineRaw[],
    oiData: OIDataPoint[],
    fundingData: FundingRatePoint[],
    lsRatioData: LongShortPoint[]
): UnifiedMarketData[] {
    const result: UnifiedMarketData[] = [];

    // Build lookup maps for O(1) access
    const spotMap = new Map<number, KlineRaw>();
    spotKlines.forEach(k => spotMap.set(k.timestamp, k));

    // Track last known values for fill-forward
    let lastSpot: KlineRaw | null = null;
    let lastOI = 0;
    let lastFunding = 0;
    let lastLSRatio = 1.0;

    for (const futures of futuresKlines) {
        // Spot: Exact match or fill-forward
        const spotExact = spotMap.get(futures.timestamp);
        if (spotExact) {
            lastSpot = spotExact;
        }
        const spotPrice = lastSpot?.close ?? futures.close; // Fallback to futures if no spot
        const spotVolume = lastSpot?.volume ?? 0;

        // Open Interest: Find closest
        const oiPoint = findClosestValue(oiData, futures.timestamp, 3600000 * 4); // 4h tolerance
        if (oiPoint) lastOI = oiPoint.sumOpenInterestValue;

        // Funding Rate: Find closest (funding happens every 8h)
        const fundingPoint = findClosestValue(fundingData, futures.timestamp, 3600000 * 8);
        if (fundingPoint) lastFunding = fundingPoint.fundingRate;

        // Long/Short Ratio: Find closest
        const lsPoint = findClosestValue(lsRatioData, futures.timestamp, 3600000 * 4);
        if (lsPoint) lastLSRatio = lsPoint.longShortRatio;

        // Feature Engineering
        const spread = spotPrice > 0 ? ((futures.close - spotPrice) / spotPrice) * 100 : 0;

        // Divergence score: Simplified calculation
        // Positive when futures leads spot (potential manipulation signal)
        const divergence = spread; // In production, this would be CVD-based

        const unified: UnifiedMarketData = {
            timestamp: futures.timestamp,
            price: {
                spot: spotPrice,
                futures: futures.close,
            },
            volume: {
                spot: spotVolume,
                futures: futures.volume,
            },
            metrics: {
                openInterest: lastOI,
                fundingRate: lastFunding,
                longShortRatio: lastLSRatio,
            },
            signals: {
                spread: parseFloat(spread.toFixed(4)),
                divergence: parseFloat(divergence.toFixed(4)),
            },
        };

        result.push(unified);
    }

    return result;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || '1h';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Validation
    if (!symbol) {
        return NextResponse.json(
            { error: 'Symbol is required (e.g., BTCUSDT)' },
            { status: 400 }
        );
    }

    // Clamp limit to reasonable bounds
    const safeLimit = Math.min(Math.max(limit, 10), 500);

    // Map interval to metric period
    const metricPeriod = mapIntervalToMetricPeriod(interval);

    console.log(`[DeepScan] Starting scan for ${symbol} @ ${interval} (limit: ${safeLimit})`);

    try {
        // =====================================================================
        // PARALLEL DATA FETCHING
        // =====================================================================
        const [
            futuresKlines,
            spotKlines,
            oiData,
            fundingData,
            lsRatioData,
        ] = await Promise.all([
            fetchFuturesKlines(symbol, interval, safeLimit),
            fetchSpotKlines(symbol, interval, safeLimit),
            fetchOpenInterest(symbol, metricPeriod, safeLimit),
            fetchFundingRate(symbol, Math.ceil(safeLimit / 3)), // Funding is every 8h
            fetchLongShortRatio(symbol, metricPeriod, safeLimit),
        ]);

        console.log(`[DeepScan] Fetched: Futures(${futuresKlines.length}), Spot(${spotKlines.length}), OI(${oiData.length}), Funding(${fundingData.length}), L/S(${lsRatioData.length})`);

        // =====================================================================
        // DATA FUSION
        // =====================================================================
        const unifiedData = fuseData(
            futuresKlines,
            spotKlines,
            oiData,
            fundingData,
            lsRatioData
        );

        console.log(`[DeepScan] Fused ${unifiedData.length} data points for ${symbol}`);

        // =====================================================================
        // RESPONSE (DataFrame-ready JSON)
        // =====================================================================
        return NextResponse.json({
            symbol,
            interval,
            count: unifiedData.length,
            startTime: unifiedData[0]?.timestamp ?? null,
            endTime: unifiedData[unifiedData.length - 1]?.timestamp ?? null,
            data: unifiedData,
        });

    } catch (error) {
        console.error('[DeepScan] Critical Error:', error);
        return NextResponse.json(
            { error: 'Deep scan failed. Check server logs.' },
            { status: 500 }
        );
    }
}
