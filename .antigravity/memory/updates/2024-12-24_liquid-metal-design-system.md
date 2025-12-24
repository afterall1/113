# Liquidity Nebula - Design System Update
## Session Date: 2024-12-24
## Update ID: MVP-V1.3-LIQUID-METAL

---

## OVERVIEW

This document captures ALL design system changes implemented in this session. The primary objective was transforming the UI aesthetic from "Aerogel Glass" to a premium "Liquid Metal / Obsidian Monolit" design language with 2025 Spatial UI standards.

---

## 1. CSS DESIGN SYSTEM ADDITIONS

### File: `app/globals.css`

#### 1.1 Liquid Metal Design System (Lines 125-238)

```css
/* Liquid flow animation for metallic gradients */
@keyframes liquid-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

**Classes Added:**

| Class | Purpose | Key Properties |
|-------|---------|----------------|
| `.liquid-metal` | Main panel material | `bg-zinc-950/60`, `backdrop-blur-2xl`, metallic inset shadows |
| `.liquid-metal-light` | Lighter variant for nested elements | Reduced opacity version |
| `.liquid-button` | Mercury droplet button | Dark silver gradient, `background-size: 200% 100%`, animated on hover |
| `.liquid-button:hover` | Hover state | `background-position` shift, `translateY(-1px)`, glow shadow |
| `.liquid-button:active` | Active/pressed state | `translateY(1px) scale(0.98)` |
| `.liquid-button-primary` | Teal-accented variant | Teal metallic gradient, enhanced glow |

**Liquid Button Gradient:**
```css
background: linear-gradient(
  135deg,
  rgba(39, 39, 42, 0.9) 0%,
  rgba(63, 63, 70, 0.8) 25%,
  rgba(82, 82, 91, 0.7) 50%,
  rgba(63, 63, 70, 0.8) 75%,
  rgba(39, 39, 42, 0.9) 100%
);
```

#### 1.2 Obsidian Monolit Design System (Lines 239-363)

**Keyframes Added:**
```css
@keyframes border-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes scan-line {
  0% { transform: translateY(-100%); opacity: 0; }
  50% { opacity: 0.5; }
  100% { transform: translateY(100%); opacity: 0; }
}
```

**Classes Added:**

| Class | Purpose | Key Properties |
|-------|---------|----------------|
| `.obsidian-panel` | Dark monolith container | `bg-black/85`, `backdrop-blur-40px`, flowing border via `::before` |
| `.obsidian-panel::before` | Animated border effect | Gradient border with `mask-composite: exclude`, 8s animation |
| `.obsidian-panel::after` | Inner glow | `inset box-shadow` for depth |
| `.etched-text` | Metal-engraved typography | `text-shadow: 0 1px 0 rgba(255,255,255,0.1), 0 -1px 0 rgba(0,0,0,0.8)` |
| `.holo-scan` | Scanning light container | Teal light sweep via `::after` |
| `.etched-divider` | Gradient divider line | Fades at edges, bottom shadow |

**Obsidian Panel Flowing Border:**
```css
.obsidian-panel::before {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 0%,
    rgba(255, 255, 255, 0.15) 25%,
    rgba(20, 184, 166, 0.2) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    rgba(255, 255, 255, 0.03) 100%
  );
  background-size: 300% 100%;
  animation: border-flow 8s linear infinite;
}
```

#### 1.3 Neural Grid Design System (Lines 364-460)

**Keyframes Added:**
```css
@keyframes neural-pulse {
  0%, 100% { 
    border-color: rgba(255, 255, 255, 0.05); 
    box-shadow: 0 0 0 rgba(20, 184, 166, 0); 
  }
  50% { 
    border-color: rgba(20, 184, 166, 0.3); 
    box-shadow: 0 0 15px rgba(20, 184, 166, 0.1); 
  }
}

@keyframes holo-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

**Classes Added:**

| Class | Purpose | Key Properties |
|-------|---------|----------------|
| `.neural-slot` | Grid cell base | `rounded-1rem`, `bg-zinc-950/40`, `backdrop-blur-12px` |
| `.neural-slot.empty` | Empty state animation | `animation: neural-pulse 4s infinite ease-in-out` |
| `.neural-slot:hover` | Hover lift | `translateY(-2px)`, border brightens |
| `.holo-card` | Active data card | Gradient background, shimmer `::after` |
| `.holo-card::after` | Holographic shimmer | Light sweep, `animation: holo-shimmer 8s infinite linear` |
| `.holo-card:hover` | Hover lift | `translateY(-4px)`, enhanced shadow/glow |
| `.neural-grid-bg` | Blueprint dot pattern | `radial-gradient` dots, `20px` spacing |
| `.neural-grid-bg-lg` | Larger dot pattern | `40px` spacing |

---

## 2. COMPONENT UPDATES

### 2.1 HUD.tsx

**Changes:**
- Main container: `aerogel` → `liquid-metal`
- Icon buttons: Added `liquid-button rounded-full` class
- Timeframe selectors: Added `liquid-button` class
- Active states: Teal metallic gradient with `!important` overrides

**Active Button State:**
```tsx
className={`... liquid-button ... ${isActive
    ? '!bg-gradient-to-r !from-teal-900 !via-teal-800 !to-teal-900 text-teal-300 !border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.3)]'
    : ''
}`}
```

### 2.2 DetailDrawer.tsx

**Major Refactoring:**

| Element | Before | After |
|---------|--------|-------|
| Container | `liquid-metal` | `obsidian-panel holo-scan` |
| Max Width | `max-w-3xl` | `max-w-4xl` |
| Close Button | Standard X icon | Metallic capsule with "ESC" label |
| Header Layout | Stacked | Split layout (symbol left, massive price right) |
| Price Size | `text-2xl`-`text-3xl` | `text-5xl`-`text-6xl` |
| Symbol Style | Standard bold | `font-black etched-text` |
| Scrollable Content | Standard padding | Added `animate-in fade-in slide-in-from-bottom-4 duration-700` |
| Chart Container | Rounded with border | Full bleed (`-mx-6 sm:-mx-10`), taller (350px) |

**New Close Button:**
```tsx
<button
    onClick={close}
    className="absolute top-4 right-4 z-50 px-3 py-1.5 rounded-full liquid-button flex items-center gap-2 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300"
>
    <span className="text-[10px] font-mono font-bold text-zinc-400 tracking-widest">ESC</span>
    <svg>...</svg>
</button>
```

**MetricCard Component Update:**
```tsx
// Before
<div className="group p-3 rounded-xl bg-white/5 border border-white/5 ...">

// After
<div className="group p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/15 ... shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
    <p className="... etched-text">{label}</p>
    <p className="text-xl font-mono font-bold text-zinc-100 ...">{value}</p>
```

### 2.3 WatchlistPanel.tsx

**Changes:**
- Main container: Added `liquid-metal !rounded-none !rounded-r-2xl`
- Ticker rows: Enhanced hover (`hover:bg-white/10`, inset shadow)

```tsx
// Before
className={`... ${isCollapsed ? '...' : 'w-72 bg-black/60 backdrop-blur-md border-r border-white/10 shadow-2xl pointer-events-auto'}`}

// After
className={`... ${isCollapsed ? '...' : 'w-72 liquid-metal !rounded-none !rounded-r-2xl pointer-events-auto'}`}
```

### 2.4 CoinSelector.tsx

**Changes:**
- Modal container: Added `liquid-metal` class
- Filter chips: Added `liquid-button` with active teal gradient state

```tsx
// Active filter chip
className={`... ${isActive
    ? `liquid-button bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-teal-200 border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.3)]`
    : 'liquid-button'
}`}
```

### 2.5 TacticalGrid.tsx (Neural Lattice)

**Complete Refactor:**

**Main Container:**
```tsx
<div className="fixed inset-0 z-40 bg-zinc-950 neural-grid-bg overflow-auto">
```

**Header:**
```tsx
<div className="sticky top-0 z-50 ... liquid-metal !rounded-none">
    <h1 className="text-lg font-black tracking-[0.15em] text-white uppercase etched-text">
        Neural Lattice
    </h1>
```

**Empty Slot (Docking Bay):**
```tsx
<button
    onClick={onAdd}
    className="group relative h-[32vh] min-h-[280px] neural-slot empty flex flex-col items-center justify-center gap-4 cursor-pointer"
>
    <p className="text-[10px] font-mono tracking-[0.25em] text-zinc-600 ...">NO SIGNAL</p>
    <p className="text-[9px] font-mono text-zinc-700 ...">DOCK {slot.id + 1}</p>
</button>
```

**Filled Slot (Chart Focus - FINAL VERSION):**
```tsx
<div
    className={`group relative h-[32vh] min-h-[280px] neural-slot cursor-pointer overflow-hidden ${isActive
        ? 'ring-1 ring-teal-500/50 shadow-[0_0_30px_rgba(20,184,166,0.15)]'
        : ''
    }`}
>
    {/* Full Chart - Primary Focus (100% opacity) */}
    <div className="absolute inset-0 z-0">
        <MiniChart symbol={slot.symbol!} interval="15m" />
    </div>

    {/* Compact Header Bar */}
    <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 py-2 bg-zinc-950/80 backdrop-blur-sm border-b border-white/5">
        {/* Symbol + Price + Change in compact format */}
    </div>
</div>
```

### 2.6 MiniChart.tsx

**Changes:**
- Grid lines: `#334155` → `rgba(255,255,255,0.02)` (ultra-faint)
- Overlay shadow: Enhanced `shadow-[inset_0_0_30px_rgba(0,0,0,0.6)]`
- Removed: DEBUG data count indicator

```tsx
grid: {
    vertLines: { visible: false },
    horzLines: { color: 'rgba(255,255,255,0.02)', style: 0, visible: true },
},
```

---

## 3. PixiJS TEXTURE & MATERIAL UPDATES

### 3.1 NebulaCanvas.tsx - Orb Texture

**Function: `createOrbTexture()`**

**Before (Flat Disc):**
```typescript
gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
gradient.addColorStop(0.98, 'rgba(255, 255, 255, 1)');
gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
```

**After (Hyper-Glass Singularity):**
```typescript
const radius = 240; // Increased from 200

gradient.addColorStop(0.0,  'rgba(255, 255, 255, 1.0)');  // Core - Singularity
gradient.addColorStop(0.3,  'rgba(255, 255, 255, 0.9)');  // Inner Halo
gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.5)');  // Body - Glass
gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.1)');  // Dark Band
gradient.addColorStop(0.96, 'rgba(255, 255, 255, 0.95)'); // Rim Light
gradient.addColorStop(1.0,  'rgba(255, 255, 255, 0.0)');  // Sharp Cutoff
```

**Critical Settings:**
```typescript
texture.source.scaleMode = 'linear';
texture.source.autoGenerateMipmaps = false;
```

### 3.2 CoinOrb.ts - Material Properties

**Constants:**
```typescript
// Before
const TEXTURE_SCALE_CORRECTION = 0.25;

// After
const TEXTURE_SCALE_CORRECTION = 0.22; // 10% smaller for rim light
```

**Alpha Values:**
| State | Before | After |
|-------|--------|-------|
| Base | 1.0 | 0.85 |
| Highlight Normal | 1.0 | 0.85 |
| Favorites | 1.0 | 0.95 |
| Dimmed | 0.1 | 0.1 |

**Blend Mode:** `'add'` (unchanged - optimal for glow effect)

---

## 4. DESIGN LANGUAGE SUMMARY

### Color Palette
- **Primary Accent:** Teal (`#14b8a6`, `rgb(20, 184, 166)`)
- **Negative:** Red (`#ef4444`, `#ff3366`)
- **Positive:** Teal/Green (`#22c55e`, `#00ffcc`)
- **Favorites:** Gold (`#FFD700`)
- **Backgrounds:** Zinc scale (`zinc-950`, `zinc-900`)
- **Borders:** White at varying opacity (`white/5` to `white/20`)

### Animation Timings
| Animation | Duration | Easing |
|-----------|----------|--------|
| `liquid-flow` | 6s | linear, infinite |
| `border-flow` | 8s | linear, infinite |
| `scan-line` | 4s | ease-in-out, infinite |
| `neural-pulse` | 4s | ease-in-out, infinite |
| `holo-shimmer` | 8s | linear, infinite |
| Button transitions | 300-500ms | ease-out |
| Panel animations | 500-700ms | ease-out |

### Material Hierarchy
1. **Obsidian Panel** - Primary containers (DetailDrawer, major modals)
2. **Liquid Metal** - Secondary containers (HUD, WatchlistPanel, headers)
3. **Neural Slot** - Grid cells, cards
4. **Liquid Button** - All interactive elements

---

## 5. BUILD VERIFICATION

All changes verified with `npm run build`:
- ✅ TypeScript compilation: No errors
- ✅ Static page generation: 4/4 pages
- ⚠️ CSS Lint warnings: `@apply` and `@theme` are Tailwind CSS v4 directives (compile correctly at runtime)

---

## 6. FILES MODIFIED

| File | Type of Change |
|------|----------------|
| `app/globals.css` | Added ~200 lines of CSS (3 design systems) |
| `components/HUD.tsx` | Class updates for liquid-metal styling |
| `components/DetailDrawer.tsx` | Major refactor to obsidian-panel layout |
| `components/WatchlistPanel.tsx` | Container and row styling updates |
| `components/CoinSelector.tsx` | Modal and filter chip styling |
| `components/TacticalGrid.tsx` | Complete refactor to Neural Lattice |
| `components/MiniChart.tsx` | Grid opacity and overlay shadow updates |
| `components/NebulaCanvas.tsx` | Orb texture gradient update |
| `lib/CoinOrb.ts` | Scale and alpha tuning for glass effect |

---

## 7. TECH STACK LOCK COMPLIANCE

All changes comply with:
- **Next.js:** 16.0.10 ✅
- **React:** 19.2.1 ✅
- **PixiJS:** v8+ ✅
- **Tailwind CSS:** v4 ✅
- **lightweight-charts:** v5 ✅

No dependencies added or modified.

---

*Document generated: 2024-12-24T22:47:24+03:00*
*State Hash: MVP-V1.3-LIQUID-METAL*
