# Token Metadata Proxy System Implementation

**Date:** 2024-12-25
**Context Hash:** MVP-V1.6-TOKEN-METADATA-PROXY
**Session Focus:** Real-time token metadata fetching with multi-source fallback

---

## Overview

Bu oturum, Liquidity Nebula projesine gerçek zamanlı token metadata çekme sistemi eklemeyi kapsamaktadır. Sistem, CoinMarketCap (CMC) Deep State Extraction, CoinGecko API, DeFiLlama Scraping ve Static JSON Fallback stratejilerini bir arada kullanır.

---

## Implemented Components

### 1. Token Metadata API Route

**File:** `app/api/token/metadata/route.ts`

**Purpose:** Backend proxy for fetching real token metadata from multiple sources.

**Architecture:**
```
Request → CMC Deep State Extraction
       → CoinGecko API Fallback
       → Safe Empty Response
       
Unlock Data:
       → DeFiLlama Scraping
       → Static JSON Fallback
       → N/A
```

**Key Features:**

1. **CMC Deep State Extraction (Hydration Hijacking)**
   - Fetches HTML from `https://coinmarketcap.com/currencies/{slug}/`
   - Extracts `<script id="__NEXT_DATA__">` JSON block via Regex
   - Uses recursive `findKey()` hunter function for structure-agnostic parsing
   - 155+ symbol-to-CMC-slug mappings

2. **CoinGecko API Fallback**
   - Uses CoinGecko `/coins/{id}` endpoint
   - Dynamic search via `/search?query=` for unknown symbols
   - 40+ symbol-to-CoinGecko-ID mappings

3. **DeFiLlama Unlock Scraping**
   - Fetches HTML from `https://defillama.com/unlocks/{protocol}/`
   - Extracts `__NEXT_DATA__` JSON for unlock events
   - Hunts for keys: `events`, `upcomingUnlocks`, `emissions`, `tokenAllocation`
   - 35+ symbol-to-DeFiLlama-slug mappings

4. **Static Token Unlock Data**
   - Curated JSON file with accurate unlock schedules
   - 35+ major coins with dates, amounts, percentages, allocations
   - Fallback when DeFiLlama fails

---

### 2. Static Token Unlocks JSON

**File:** `lib/data/tokenUnlocks.json`

**Structure:**
```json
{
  "_meta": {
    "version": "1.0.0",
    "updated": "2025-12-25",
    "description": "Curated token unlock schedules for top Binance Futures coins"
  },
  "unlocks": {
    "ARB": {
      "protocol": "arbitrum",
      "nextUnlock": {
        "date": "2025-03-16",
        "amount": 92150000,
        "percentOfSupply": 2.1,
        "category": "Team & Investors"
      },
      "allocations": [
        { "category": "Team", "percent": 26.9 },
        { "category": "Investors", "percent": 17.5 },
        { "category": "DAO Treasury", "percent": 42.8 },
        { "category": "Airdrop", "percent": 12.8 }
      ]
    }
    // ... 35+ more coins
  }
}
```

**Covered Coins:**
- **L2s:** ARB, OP, STRK, ZK, DYM
- **Alt L1s:** SUI, APT, SEI, TIA, MOVE
- **DeFi:** JUP, JTO, ONDO, ENA, PENDLE, AAVE, UNI, LINK
- **New Listings:** EIGEN, W, PYTH, WLD, VIRTUAL, GUNZ
- **Major:** BTC, ETH, SOL, AVAX, DOGE
- **Meme (Fully Circulating):** PEPE, WIF, BONK, AI16Z

---

### 3. Token Metadata Service Update

**File:** `lib/services/tokenMetadata.ts`

**Change:** Complete rewrite - removed all mock data (314 lines → 86 lines)

**Before:**
- `MOCK_TOKEN_DATA` object with 14 hardcoded tokens
- `generateAllocations()` function generating fake allocations
- `generateGenericMetadata()` function with random calculations
- `ALLOCATION_CATEGORIES` array

**After:**
- Clean `fetchTokenMetadata()` calling `/api/token/metadata` proxy
- Minimal `createMinimalFallback()` for network errors only
- `fetchBatchTokenMetadata()` for parallel requests

**New Code:**
```typescript
export async function fetchTokenMetadata(symbol: string): Promise<TokenMetadata> {
    try {
        const response = await fetch(`/api/token/metadata?symbol=${encodeURIComponent(symbol)}`);
        const data = await response.json();

        if (data.error) {
            console.warn(`[TokenMetadata] API warning for ${symbol}: ${data.error}`);
        }

        if (typeof data.marketCap === 'number' || typeof data.fdv === 'number') {
            return data as TokenMetadata;
        }

        return createMinimalFallback(symbol);
    } catch (error) {
        console.error(`[TokenMetadata] Network error for ${symbol}:`, error);
        return createMinimalFallback(symbol);
    }
}
```

---

## Technical Implementation Details

### Hunter Functions (Structure-Agnostic Parsing)

```typescript
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
```

### CMC Hunted Keys:
- `statistics` → price, marketCap, fullyDilutedMarketCap, circulatingSupply, maxSupply
- `description` → token description
- `category` → primary category
- `platforms` → blockchain platforms
- `tags` → category tags
- `vestingSchedule`, `tokenUnlocks`, `upcomingEvents` → unlock data
- `nextUnlockDate`, `nextUnlockAmount`, `nextUnlockPercent` → direct unlock fields

### DeFiLlama Hunted Keys:
- `events` → unlock events array
- `upcomingUnlocks` → upcoming unlock events
- `emissions` → token emissions schedule
- `tokenAllocation` → allocation distribution
- `categories` → allocation categories

---

## Symbol Mappings

### CMC Slug Mapping (155+ entries)

```typescript
const SYMBOL_TO_CMC_SLUG: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'ARB': 'arbitrum',
    'OP': 'optimism-ethereum',
    'SUI': 'sui',
    'APT': 'aptos',
    'MOVE': 'movement',
    'GUNZ': 'gunz',
    'VIRTUAL': 'virtual-protocol',
    'AI16Z': 'ai16z',
    'PIPPIN': 'pippin',
    // ... 145+ more
};
```

### DeFiLlama Slug Mapping (35+ entries)

```typescript
const SYMBOL_TO_DEFILLAMA_SLUG: Record<string, string> = {
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'SUI': 'sui',
    'GUNZ': 'gunzilla',
    'VIRTUAL': 'virtuals',
    'LAYER': 'layerzero',
    // ... 29+ more
};
```

### CoinGecko ID Mapping (40+ entries)

```typescript
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'PEPE': 'pepe',
    'WIF': 'dogwifcoin',
    // ... 35+ more
};
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GET /api/token/metadata                       │
│                         ?symbol=ARB                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UNLOCK DATA LAYER                           │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ DeFiLlama Scrape │ →  │ Static JSON      │ →  NULL          │
│  │ (35+ slugs)      │    │ (35+ coins)      │                   │
│  └──────────────────┘    └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PRICE DATA LAYER                            │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ CMC Deep State   │ →  │ CoinGecko API    │ →  Safe Empty    │
│  │ (155+ slugs)     │    │ (40+ + search)   │                   │
│  └──────────────────┘    └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RESPONSE ASSEMBLY                           │
│  - Inject unlock data into price result                          │
│  - Calculate valueUSD = amount × price                           │
│  - Return TokenMetadata interface                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Handling Strategy

| Scenario | Behavior |
|----------|----------|
| CMC fails (HTTP error, no JSON) | Try CoinGecko |
| CoinGecko fails | Return safe empty response |
| DeFiLlama fails | Use static JSON |
| Static JSON missing | nextUnlock = N/A |
| Network error | Return minimal fallback |
| Unknown symbol | Search CoinGecko, fallback to lowercase slug |

---

## Files Created/Modified

| File | Status | Lines Changed |
|------|--------|---------------|
| `app/api/token/metadata/route.ts` | CREATED | 877 lines |
| `lib/data/tokenUnlocks.json` | CREATED | 836 lines |
| `lib/services/tokenMetadata.ts` | MODIFIED | 314 → 86 lines |

---

## Build Verification

All builds passed successfully:
```
▲ Next.js 16.0.10 (Turbopack)
✓ Compiled successfully
✓ TypeScript passed
✓ Generating static pages (4/4)

Routes:
├ ƒ /api/token/metadata (Dynamic)
```

---

## Git Commits

1. `5f21179` - feat: add CoinGecko token metadata proxy with dynamic search fallback
2. `ffff94f` - feat: add DeFiLlama unlock scraping + comprehensive static token unlock data

---

## Debugging Notes

### PIPPIN Issue
- **Problem:** PIPPIN coin showing fake metadata
- **Root Cause:** Symbol not in CMC mapping, fallback generated fake data
- **Solution:** Added dynamic CoinGecko search API fallback

### GUNZ Issue
- **Problem:** Token unlock data not displaying despite being on DeFiLlama
- **Root Cause:** DeFiLlama pages render unlock data via JavaScript, not in SSR
- **Solution:** Added GUNZ to static JSON with curated unlock data

### MOVE Issue
- **Problem:** Token unlock section showing "No major unlocks"
- **Root Cause:** CMC stores unlock data in unpredictable keys
- **Solution:** Expanded hunter keys + added DeFiLlama scraping + added to static JSON

---

## Tech Stack Compliance

- ✅ Next.js 16.0.10 (Edge Runtime)
- ✅ Native fetch (no axios)
- ✅ TypeScript strict mode
- ✅ Proxy-First architecture
- ✅ No external dependencies added

---

## Known Limitations

1. **DeFiLlama Scraping:** Many pages render unlock data client-side, __NEXT_DATA__ may be empty
2. **CMC Scraping:** Token unlock data often not in SSR, requires JS execution
3. **Static JSON Coverage:** Only 35+ coins curated, others may show "N/A"
4. **Rate Limits:** CMC and CoinGecko have rate limits, caching helps (5-10 min revalidate)

---

## Future Enhancements (Not Implemented)

- [ ] TokenUnlocks.app scraping for comprehensive unlock data
- [ ] Expand static JSON to 100+ coins
- [ ] Supply-based vesting inference for unmapped coins
- [ ] Scheduled background sync for unlock data
