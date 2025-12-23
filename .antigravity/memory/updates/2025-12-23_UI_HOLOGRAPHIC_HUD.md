# SYSTEM UPDATE: Holographic HUD Interface
> **Date**: 2025-12-23
> **Topic**: UI Architecture, Modal System, Aerogel Aesthetic
> **Status**: APPLIED (Production)

## 1. Executive Summary
We have deprecated the sidebar "DetailDrawer" pattern in favor of a centralized "Holographic HUD" modal. This change aligns the UI with the "Cockpit" metaphor, allowing users to focus on specific asset data without losing context of the Nebula background.

## 2. Visual Architecture: "Aerogel Glass"
-   **Central Positioning**: The Detail window now floats in the center of the screen (`fixed inset-0 flex items-center`).
-   **Material**: High-grade frosted glass effect using `backdrop-blur-xl` and `bg-zinc-950/90`.
-   **Borders**: Subtle glowing edges (`border-white/10` + top glow).
-   **Animation**: "Quantum Snap" (Scale 95% -> 100%, Opacity 0 -> 100%).

## 3. Technical Implementation
-   **Component**: Refactored `components/DetailDrawer.tsx` to handle `fixed` positioning and click-outside logic.
-   **Data Persistence**: Retained `SWR` and `useMarketStore` integration.
-   **Responsive Behavior**:
    -   **Desktop**: Floating Window (max-w-3xl).
    -   **Mobile**: Bottom Sheet (Docked to bottom).

## 4. Handover Protocols
-   Future UI additions must use this "Glass Window" pattern for detailed views instead of sidebars.
-   Do NOT add external animation libraries; continue using Tailwind CSS transitions.