# PROMPT: Overflow Fixes and CSS Constraints
> **Target Files**: `components/DetailDrawer.tsx`, `components/MetricChart.tsx`
> **Issue**: Canvas elements overflow grid containers

---

## PROBLEM DESCRIPTION

CSS Grid has a default behavior of `min-width: auto` on grid items. This means:
1. Grid items will NOT shrink smaller than their content
2. Canvas elements (from lightweight-charts) have intrinsic dimensions
3. Result: Charts overflow their containers and break layout

---

## SOLUTION: min-w-0 Pattern

### The Fix (Conceptual)
```css
/* DEFAULT (causes overflow) */
.grid-item {
    min-width: auto; /* Browser default */
}

/* FIXED (prevents overflow) */
.grid-item {
    min-width: 0;
    overflow: hidden;
}
```

---

## IMPLEMENTATION IN DETAILDRAWER.TSX

### Every Grid Container
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
```

### Every Grid Item (MetricChart Wrapper)
```tsx
<div className="min-w-0 overflow-hidden">
    <MetricChart ... />
</div>
```

### Parent Container
```tsx
<div className="space-y-6 w-full overflow-hidden">
    {/* All chart grids go here */}
</div>
```

---

## IMPLEMENTATION IN METRICCHART.TSX

### Main Container
```tsx
<div className={`relative h-64 w-full bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden ${className || ''}`}>
```

### Chart Wrapper (Absolute Positioning)
```tsx
{/* Chart Container - Absolute positioned to prevent overflow */}
<div className="absolute inset-0 pt-16 overflow-hidden">
    <div
        ref={chartContainerRef}
        className="w-full h-full"
        style={{ visibility: isLoading ? 'hidden' : 'visible' }}
    />
</div>
```

---

## CHART CONFIGURATION FIXES

### TimeScale Settings
```typescript
timeScale: {
    borderVisible: false,
    timeVisible: true,
    secondsVisible: false,
    visible: true,
    fixLeftEdge: true,
    fixRightEdge: true,
    rightOffset: 5, // Space between last bar and right edge
},
```

### RightPriceScale Settings
```typescript
rightPriceScale: {
    borderColor: 'rgba(255,255,255,0.1)',
    visible: true,
    scaleMargins: { top: 0.1, bottom: 0.1 }, // 10% margins
},
```

### ResizeObserver with fitContent
```typescript
const resizeObserver = new ResizeObserver((entries) => {
    if (chartContainerRef.current && chartRef.current) {
        const entry = entries[0];
        if (entry) {
            const { width, height } = entry.contentRect;
            // Ensure dimensions don't exceed container
            chartRef.current.applyOptions({
                width: Math.max(width, 100),
                height: Math.max(height, 100),
            });
            // Refit content after resize
            chartRef.current.timeScale().fitContent();
        }
    }
});
```

---

## COMPLETE CSS CLASS REFERENCE

| Class | Purpose | Applied To |
|-------|---------|------------|
| `min-w-0` | Override `min-width: auto` | Grid items |
| `overflow-hidden` | Clip overflowing content | Containers, grid items |
| `w-full` | Full width | Grids, containers |
| `absolute inset-0` | Fill parent absolutely | Chart wrapper |
| `relative` | Position context | Main container |
| `h-64` | Fixed height (256px) | Main container |

---

## DEBUGGING OVERFLOW

If charts still overflow, check:

1. **Parent has relative positioning**
```tsx
<div className="relative h-64 w-full overflow-hidden">
```

2. **All grid items have min-w-0**
```tsx
<div className="min-w-0 overflow-hidden">
    <MetricChart />
</div>
```

3. **ResizeObserver uses contentRect**
```typescript
const { width, height } = entry.contentRect;
// NOT: element.clientWidth (which might include overflow)
```

4. **fitContent is called after resize**
```typescript
chartRef.current.timeScale().fitContent();
```

---

## VISUAL RESULT

Before fix:
```
┌──────────┐
│  Chart   ├──────────►  OVERFLOW!
└──────────┘
```

After fix:
```
┌──────────┐
│  Chart   │  ← Contained
└──────────┘
```

---

*Prompt ID: OVERFLOW_FIX_001*
