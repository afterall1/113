import { NextRequest, NextResponse } from 'next/server';
import { CandleData } from '@/lib/types';

export const runtime = 'edge'; // Optional: Use Edge Runtime for speed

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || '15m';
    const limit = searchParams.get('limit') || '100';

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        const binanceUrl = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

        const response = await fetch(binanceUrl, {
            headers: { 'Content-Type': 'application/json' },
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!response.ok) {
            throw new Error(`Binance API Error: ${response.statusText}`);
        }

        const rawData = await response.json();

        // Transform [time, open, high, low, close, volume, ...] to CandleData
        const candleData: CandleData[] = rawData.map((k: any) => ({
            time: k[0] / 1000, // Convert ms to s (Unix Timestamp) for Lightweight Charts
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
        }));

        return NextResponse.json(candleData);

    } catch (error) {
        console.error('[API/Klines] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chart data' },
            { status: 500 }
        );
    }
}
