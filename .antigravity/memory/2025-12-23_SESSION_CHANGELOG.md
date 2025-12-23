# Liquidity Nebula — Session Changelog
**Date**: 2025-12-23
**Session Focus**: Token Unlock Veri Yapısı Derinleştirme + UI Görselleştirmesi

---

## Affected Files

| File | Action |
|------|--------|
| `lib/types.ts` | MODIFIED |
| `lib/services/tokenMetadata.ts` | MODIFIED |
| `components/DetailDrawer.tsx` | MODIFIED |

---

## Change 1: Token Unlock Veri Yapısını Derinleştirme

### File: `lib/types.ts`

**Purpose**: Add `UnlockAllocation` interface to describe who receives tokens during an unlock event.

**Exact Change**:

```diff
// BEFORE (lines 9-15):
// Token Unlock Schedule
export interface TokenUnlock {
  date: string;           // ISO date string (e.g., "2025-03-15")
  amount: number;         // Number of tokens to be unlocked
  valueUSD: number;       // Estimated USD value at unlock
  percentOfSupply: number; // Percentage of total supply being unlocked
}

// AFTER:
// Unlock Allocation Breakdown (who receives tokens)
export interface UnlockAllocation {
  category: string;  // e.g., 'Core Team', 'Private Investors', 'Ecosystem Fund'
  percent: number;   // Percentage of this unlock going to this category
}

// Token Unlock Schedule
export interface TokenUnlock {
  date: string;              // ISO date string (e.g., "2025-03-15")
  amount: number;            // Number of tokens to be unlocked
  valueUSD: number;          // Estimated USD value at unlock
  percentOfSupply: number;   // Percentage of total supply being unlocked
  allocations: UnlockAllocation[]; // Breakdown of who receives tokens
}
```

---

### File: `lib/services/tokenMetadata.ts`

**Purpose**: 
1. Add allocation categories constant
2. Add `generateAllocations()` helper function
3. Update all `TokenUnlock` object creations to include allocations

**Exact Changes**:

#### Change 1.1: Update imports and add constants (lines 1-60)

```typescript
// BEFORE:
import { TokenMetadata, TokenUnlock } from '@/lib/types';

/**
 * Generate a future date string based on days from now
 */
function getFutureDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
}

// AFTER:
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
```

#### Change 1.2: Update `generateGenericMetadata()` function (around line 183-189)

```typescript
// BEFORE:
    const nextUnlock: TokenUnlock = {
        date: getFutureDate(30 + (randomSeed % 60)),
        amount: marketCap * 0.02 / 10, // Rough token amount estimate
        valueUSD: marketCap * 0.02,
        percentOfSupply: 2 + (randomSeed % 5),
    };

// AFTER:
    const nextUnlock: TokenUnlock = {
        date: getFutureDate(30 + (randomSeed % 60)),
        amount: marketCap * 0.02 / 10, // Rough token amount estimate
        valueUSD: marketCap * 0.02,
        percentOfSupply: 2 + (randomSeed % 5),
        allocations: generateAllocations(randomSeed),
    };
```

#### Change 1.3: Update `fetchTokenMetadata()` function (around line 222-234)

```typescript
// BEFORE:
        // Calculate next unlock based on mock data
        const nextUnlock: TokenUnlock = unlockDays > 0 ? {
            date: getFutureDate(unlockDays),
            amount: metadata.circulatingSupply * (unlockPercent / 100),
            valueUSD: metadata.marketCap * (unlockPercent / 100),
            percentOfSupply: unlockPercent,
        } : {
            date: '',
            amount: 0,
            valueUSD: 0,
            percentOfSupply: 0,
        };

// AFTER:
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
```

---

## Change 2: Unlock Dağılımı Görselleştirmesi (UI)

### File: `components/DetailDrawer.tsx`

**Purpose**: 
1. Add category color mappings
2. Add `AllocationBar` stacked bar component
3. Add `AllocationLegend` component
4. Integrate into Token Unlock card

**Exact Changes**:

#### Change 2.1: Add imports and color constants (lines 1-43)

```typescript
// BEFORE:
'use client';

import { useMarketStore } from "@/store/useMarketStore";
import { useEffect, useState } from "react";
import useSWR from 'swr';
import { fetchTokenMetadata } from '@/lib/services/tokenMetadata';
import { TokenMetadata } from '@/lib/types';
import {
    formatCurrency,
    formatSupply,
    formatDate,
    getDaysUntil,
    calculateUnlockRisk
} from '@/lib/utils';

// AFTER:
'use client';

import { useMarketStore } from "@/store/useMarketStore";
import { useEffect, useState } from "react";
import useSWR from 'swr';
import { fetchTokenMetadata } from '@/lib/services/tokenMetadata';
import { TokenMetadata, UnlockAllocation } from '@/lib/types';
import {
    formatCurrency,
    formatSupply,
    formatDate,
    getDaysUntil,
    calculateUnlockRisk
} from '@/lib/utils';

// Category color mapping for allocation visualization
const CATEGORY_COLORS: Record<string, { bg: string; glow: string }> = {
    'Core Team': { bg: 'bg-orange-500', glow: 'shadow-orange-500/50' },
    'Private Investors': { bg: 'bg-purple-500', glow: 'shadow-purple-500/50' },
    'Ecosystem Fund': { bg: 'bg-teal-500', glow: 'shadow-teal-500/50' },
    'Community Rewards': { bg: 'bg-green-500', glow: 'shadow-green-500/50' },
    'Treasury': { bg: 'bg-blue-500', glow: 'shadow-blue-500/50' },
    'Advisors': { bg: 'bg-pink-500', glow: 'shadow-pink-500/50' },
    'Foundation': { bg: 'bg-cyan-500', glow: 'shadow-cyan-500/50' },
};

const CATEGORY_DOT_COLORS: Record<string, string> = {
    'Core Team': 'bg-orange-500',
    'Private Investors': 'bg-purple-500',
    'Ecosystem Fund': 'bg-teal-500',
    'Community Rewards': 'bg-green-500',
    'Treasury': 'bg-blue-500',
    'Advisors': 'bg-pink-500',
    'Foundation': 'bg-cyan-500',
};

function getCategoryColor(category: string): { bg: string; glow: string } {
    return CATEGORY_COLORS[category] || { bg: 'bg-zinc-500', glow: 'shadow-zinc-500/50' };
}

function getCategoryDotColor(category: string): string {
    return CATEGORY_DOT_COLORS[category] || 'bg-zinc-500';
}
```

#### Change 2.2: Add AllocationBar and AllocationLegend components (after ChainBadge component)

```tsx
// Stacked allocation bar component
function AllocationBar({ allocations }: { allocations: UnlockAllocation[] }) {
    if (!allocations || allocations.length === 0) return null;

    return (
        <div className="mt-4">
            {/* Stacked Bar */}
            <div className="h-3 rounded-full overflow-hidden flex bg-white/5 shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                {allocations.map((alloc, idx) => {
                    const colors = getCategoryColor(alloc.category);
                    return (
                        <div
                            key={alloc.category}
                            className={`${colors.bg} transition-all duration-500 hover:brightness-125`}
                            style={{ width: `${alloc.percent}%` }}
                            title={`${alloc.category}: ${alloc.percent}%`}
                        />
                    );
                })}
            </div>
        </div>
    );
}

// Allocation legend component
function AllocationLegend({ allocations }: { allocations: UnlockAllocation[] }) {
    if (!allocations || allocations.length === 0) return null;

    return (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {allocations.map((alloc) => (
                <div key={alloc.category} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${getCategoryDotColor(alloc.category)}`} />
                    <span className="text-[10px] text-zinc-400">
                        {alloc.category}: <span className="text-zinc-200 font-mono">{alloc.percent}%</span>
                    </span>
                </div>
            ))}
        </div>
    );
}
```

#### Change 2.3: Integrate into Token Unlock Card (inside the hasUpcomingUnlock block, after the existing content div)

```tsx
// BEFORE (after the content div closes):
                                    </div>
                                </div>

// AFTER:
                                    </div>

                                    {/* Allocation Breakdown Bar */}
                                    {metadata?.nextUnlock?.allocations && metadata.nextUnlock.allocations.length > 0 && (
                                        <>
                                            <AllocationBar allocations={metadata.nextUnlock.allocations} />
                                            <AllocationLegend allocations={metadata.nextUnlock.allocations} />
                                        </>
                                    )}
                                </div>
```

---

## Visual Result

The Token Unlock card in DetailDrawer now displays:
1. **Timer**: Days until unlock + formatted date
2. **Value**: USD value + % of supply  
3. **Stacked Bar**: Color-coded horizontal bar showing allocation percentages
4. **Legend**: Category names with colored dots and percentages

**Category Color Scheme**:
- Core Team → Orange (#F97316)
- Private Investors → Purple (#A855F7)
- Ecosystem Fund → Teal (#14B8A6)
- Community Rewards → Green (#22C55E)
- Treasury → Blue (#3B82F6)
- Advisors → Pink (#EC4899)
- Foundation → Cyan (#06B6D4)

---

## Verification

- ✅ TypeScript compilation: `npx tsc --noEmit` — No errors
- ✅ Production build: `npm run build` — Success
- ✅ Dev server: `npm run dev` — Running on http://localhost:3000

---

## End of Session Changelog
