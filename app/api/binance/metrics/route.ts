import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Metric type to Binance endpoint mapping
const METRIC_ENDPOINTS: Record<string, string> = {
    openInterest: 'https://fapi.binance.com/futures/data/openInterestHist',
    topLongShortAccounts: 'https://fapi.binance.com/futures/data/topLongShortAccountRatio',
    topLongShortPositions: 'https://fapi.binance.com/futures/data/topLongShortPositionRatio',
    globalLongShort: 'https://fapi.binance.com/futures/data/globalLongShortAccountRatio',
    takerBuySell: 'https://fapi.binance.com/futures/data/takerlongshortRatio',
};

// Valid periods for Binance Futures Data API
const VALID_PERIODS = ['5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d'];

// Map chart intervals to valid API periods
function mapToValidPeriod(period: string): string {
    if (VALID_PERIODS.includes(period)) {
        return period;
    }
    // Map invalid periods to nearest valid period
    const periodMap: Record<string, string> = {
        '1m': '5m',
        '3m': '5m',
        '8h': '6h',
        '12h': '12h',
        '3d': '1d',
        '1w': '1d',
        '1M': '1d',
    };
    return periodMap[period] || '5m';
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const rawPeriod = searchParams.get('period') || '5m';
    const period = mapToValidPeriod(rawPeriod); // Map to valid period
    const metric = searchParams.get('metric');
    const limit = searchParams.get('limit') || '30';

    // Validation
    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    if (!metric) {
        return NextResponse.json({ error: 'Metric type is required' }, { status: 400 });
    }

    // Handle unsupported metrics (e.g., basis - no direct history API)
    if (metric === 'basis') {
        console.log(`[API/Metrics] Basis history not available, returning empty array`);
        return NextResponse.json([]);
    }

    const endpoint = METRIC_ENDPOINTS[metric];
    if (!endpoint) {
        return NextResponse.json(
            { error: `Unknown metric type: ${metric}` },
            { status: 400 }
        );
    }

    try {
        const binanceUrl = `${endpoint}?symbol=${symbol}&period=${period}&limit=${limit}`;

        console.log(`[API/Metrics] Fetching: ${metric} for ${symbol} @ ${period}`);

        const response = await fetch(binanceUrl, {
            headers: { 'Content-Type': 'application/json' },
            next: { revalidate: 60 } // 60-second server-side cache
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API/Metrics] Binance Error: ${response.status} - ${errorText}`);
            throw new Error(`Binance API Error: ${response.statusText}`);
        }

        const data = await response.json();

        console.log(`[API/Metrics] Received ${data.length || 0} data points for ${metric}`);

        return NextResponse.json(data);

    } catch (error) {
        console.error('[API/Metrics] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch metric data' },
            { status: 500 }
        );
    }
}
