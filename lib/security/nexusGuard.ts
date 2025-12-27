import { NextRequest } from 'next/server';

// ============================================================================
// NEBULA NEXUS - SECURITY GUARD
// "Only invited guests may enter the Nexus."
// ============================================================================

/**
 * Master API Key for Nexus Access
 * In production, this should be loaded from environment variables:
 * process.env.NEBULA_MASTER_KEY
 */
export const NEBULA_MASTER_KEY = 'NEXUS-7-OMEGA-PROTOCOL-2025';

/**
 * Header name for API key authentication
 */
export const API_KEY_HEADER = 'x-nebula-api-key';

// ============================================================================
// RATE LIMITING (Future Implementation)
// ============================================================================

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
    maxRequests: 100,        // Max requests per window
    windowMs: 60 * 1000,     // 1 minute window
    enabled: false,          // Disabled by default (enable in production)
};

/**
 * Check rate limit for a given identifier (IP or API key)
 * @param identifier - Unique identifier for rate limiting (IP address or API key)
 * @returns Object with isAllowed and remaining requests
 */
export function checkRateLimit(identifier: string): {
    isAllowed: boolean;
    remaining: number;
    resetIn: number;
} {
    if (!RATE_LIMIT_CONFIG.enabled) {
        return { isAllowed: true, remaining: RATE_LIMIT_CONFIG.maxRequests, resetIn: 0 };
    }

    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
        // Create new entry or reset expired one
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_CONFIG.windowMs,
        });
        return {
            isAllowed: true,
            remaining: RATE_LIMIT_CONFIG.maxRequests - 1,
            resetIn: RATE_LIMIT_CONFIG.windowMs,
        };
    }

    if (entry.count >= RATE_LIMIT_CONFIG.maxRequests) {
        return {
            isAllowed: false,
            remaining: 0,
            resetIn: entry.resetTime - now,
        };
    }

    entry.count++;
    return {
        isAllowed: true,
        remaining: RATE_LIMIT_CONFIG.maxRequests - entry.count,
        resetIn: entry.resetTime - now,
    };
}

// ============================================================================
// IP BANNING (Future Implementation)
// ============================================================================

// Banned IP addresses (use Redis or database in production)
const bannedIPs = new Set<string>();

/**
 * Check if an IP is banned
 * @param ip - IP address to check
 * @returns true if banned, false otherwise
 */
export function isIPBanned(ip: string): boolean {
    return bannedIPs.has(ip);
}

/**
 * Ban an IP address
 * @param ip - IP address to ban
 */
export function banIP(ip: string): void {
    bannedIPs.add(ip);
    console.log(`[NexusGuard] IP Banned: ${ip}`);
}

/**
 * Unban an IP address
 * @param ip - IP address to unban
 */
export function unbanIP(ip: string): void {
    bannedIPs.delete(ip);
    console.log(`[NexusGuard] IP Unbanned: ${ip}`);
}

// ============================================================================
// MAIN VERIFICATION FUNCTION
// ============================================================================

/**
 * Verify Nexus API access credentials
 * @param req - Next.js request object
 * @returns true if access is granted, false otherwise
 */
export function verifyNexusAccess(req: NextRequest): boolean {
    // Extract API key from header
    const apiKey = req.headers.get(API_KEY_HEADER);

    // Check if API key is provided and matches master key
    if (!apiKey) {
        console.log('[NexusGuard] Access denied: No API key provided');
        return false;
    }

    if (apiKey !== NEBULA_MASTER_KEY) {
        console.log('[NexusGuard] Access denied: Invalid API key');
        return false;
    }

    // Future: Add IP ban check here
    // const clientIP = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
    // if (isIPBanned(clientIP)) {
    //     console.log(`[NexusGuard] Access denied: Banned IP ${clientIP}`);
    //     return false;
    // }

    // Future: Add rate limit check here
    // const rateLimitResult = checkRateLimit(apiKey);
    // if (!rateLimitResult.isAllowed) {
    //     console.log(`[NexusGuard] Rate limit exceeded for ${apiKey}`);
    //     return false;
    // }

    console.log('[NexusGuard] Access granted');
    return true;
}

/**
 * Get client IP from request (utility function)
 * @param req - Next.js request object
 * @returns Client IP address
 */
export function getClientIP(req: NextRequest): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || 'unknown';
}
