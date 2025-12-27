import { NextRequest, NextResponse } from 'next/server';
import { verifyNexusAccess } from '@/lib/security/nexusGuard';

// ============================================================================
// NEBULA NEXUS - MIDDLEWARE GATEWAY
// "The Gatekeeper of the Nexus"
// ============================================================================
// This middleware protects all /api/nexus/* routes with API key authentication.
// Other API routes (binance, token) and frontend routes are NOT affected.
// ============================================================================

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Log incoming Nexus requests
    console.log(`[Middleware] Nexus request: ${request.method} ${pathname}`);

    // Verify API key
    const hasAccess = verifyNexusAccess(request);

    if (!hasAccess) {
        // Return 401 Unauthorized with JSON response
        return NextResponse.json(
            {
                error: 'ACCESS_DENIED',
                message: 'Missing or invalid Nexus clearance credentials.',
                hint: 'Provide valid API key in x-nebula-api-key header.',
            },
            {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'ApiKey realm="Nebula Nexus"',
                    'X-Nexus-Status': 'LOCKED',
                },
            }
        );
    }

    // Access granted - continue to the API route
    const response = NextResponse.next();

    // Add security headers to response
    response.headers.set('X-Nexus-Status', 'UNLOCKED');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    return response;
}

// ============================================================================
// ROUTE MATCHING CONFIGURATION
// ============================================================================
// Only protect /api/nexus/* routes - all other routes are unaffected
// ============================================================================

export const config = {
    matcher: '/api/nexus/:path*',
};
