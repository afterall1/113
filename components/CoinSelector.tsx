'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useMarketStore } from '@/store/useMarketStore';
import { streamStore } from '@/hooks/useBinanceStream';
import { TickerData } from '@/lib/types';

interface CoinSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (symbol: string) => void;
}

// Sort Mode Type
type SortMode = 'RELEVANCE' | 'GAINERS' | 'LOSERS' | 'VOLUME' | 'FAVORITES';

// Filter Chip Configuration
const FILTER_CHIPS: { mode: SortMode; label: string; icon: string; activeClass: string }[] = [
    { mode: 'GAINERS', label: 'Top Gainers', icon: '🚀', activeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
    { mode: 'LOSERS', label: 'Top Losers', icon: '🩸', activeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
    { mode: 'VOLUME', label: 'High Volume', icon: '🌊', activeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { mode: 'FAVORITES', label: 'Favorites', icon: '⭐', activeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
];

/**
 * CoinSelector Component
 * A futuristic modal for selecting coins from the live stream.
 * Features: Auto-focus, keyboard navigation, smart sorting filters.
 */
export function CoinSelector({ isOpen, onClose, onSelect }: CoinSelectorProps) {
    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const [activeSort, setActiveSort] = useState<SortMode>('RELEVANCE');
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Get favorites from store
    const favorites = useMarketStore((state) => state.favorites);

    // Force re-render to get live stream data
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => forceUpdate(n => n + 1), 500);
        return () => clearInterval(interval);
    }, [isOpen]);

    // Get filtered and sorted ticker list
    const filteredTickers = useMemo(() => {
        let tickersArray = Array.from(streamStore.tickers.values());

        // STEP 1: Apply FAVORITES filter first (only if in favorites mode)
        if (activeSort === 'FAVORITES') {
            const favSet = new Set(favorites);
            tickersArray = tickersArray.filter(t => favSet.has(t.symbol));
        }

        // STEP 2: Apply search query filter
        if (query.length > 0) {
            tickersArray = tickersArray.filter(t => t.symbol.includes(query.toUpperCase()));
        }

        // STEP 3: Apply sorting based on activeSort
        switch (activeSort) {
            case 'GAINERS':
                tickersArray.sort((a, b) => b.priceChangePercent - a.priceChangePercent);
                break;
            case 'LOSERS':
                tickersArray.sort((a, b) => a.priceChangePercent - b.priceChangePercent);
                break;
            case 'VOLUME':
                tickersArray.sort((a, b) => b.volume - a.volume);
                break;
            case 'FAVORITES':
                // Already filtered, sort by volume within favorites
                tickersArray.sort((a, b) => b.volume - a.volume);
                break;
            case 'RELEVANCE':
            default:
                // Default: sort by volume
                tickersArray.sort((a, b) => b.volume - a.volume);
                break;
        }

        // Limit to top 50 for performance
        return tickersArray.slice(0, 50);
    }, [query, activeSort, favorites, streamStore.tickers.size]);

    // Reset highlight when query or sort changes
    useEffect(() => {
        setHighlightedIndex(0);
    }, [query, activeSort]);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setHighlightedIndex(0);
            setActiveSort('RELEVANCE');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (!listRef.current) return;
        const highlightedEl = listRef.current.children[highlightedIndex] as HTMLElement;
        if (highlightedEl) {
            highlightedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [highlightedIndex]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredTickers.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredTickers[highlightedIndex]) {
                    onSelect(filteredTickers[highlightedIndex].symbol);
                    onClose();
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    }, [filteredTickers, highlightedIndex, onSelect, onClose]);

    // Handle item click
    const handleItemClick = (symbol: string) => {
        onSelect(symbol);
        onClose();
    };

    // Handle filter chip click
    const handleFilterClick = (mode: SortMode) => {
        setActiveSort(prev => prev === mode ? 'RELEVANCE' : mode);
    };

    // Format price display
    const formatPrice = (price: number) => {
        if (price >= 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
        if (price >= 1) return price.toFixed(2);
        if (price >= 0.0001) return price.toFixed(4);
        return price.toFixed(6);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Modal Container - Liquid Metal */}
            <div
                className="relative liquid-metal w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onKeyDown={handleKeyDown}
            >
                {/* Section 1: Search Input */}
                <div className="px-6 py-5 border-b border-white/5">
                    <div className="relative">
                        {/* Search Icon - aligned with px-6 content start */}
                        <svg
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>

                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search Asset..."
                            className="w-full pl-8 pr-10 py-1 bg-transparent text-white text-xl font-mono tracking-wider placeholder:text-zinc-600 focus:outline-none"
                        />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 -mr-2 text-zinc-500 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Section 2: Smart Discovery Filters */}
                <div className="px-6 py-3 border-b border-white/5">
                    <div
                        className="flex gap-3 overflow-x-auto -mx-6 px-6"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {FILTER_CHIPS.map(chip => {
                            const isActive = activeSort === chip.mode;
                            return (
                                <button
                                    key={chip.mode}
                                    onClick={() => handleFilterClick(chip.mode)}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all duration-300 border flex-shrink-0 ${isActive
                                        ? `liquid-button bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-teal-200 border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.3)]`
                                        : 'liquid-button'
                                        }`}
                                >
                                    <span>{chip.icon}</span>
                                    <span>{chip.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Section 3: Scrollable Result List */}
                <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
                >
                    {filteredTickers.length === 0 ? (
                        <div className="px-6 py-12 text-center text-zinc-500 font-mono text-sm">
                            {activeSort === 'FAVORITES' && favorites.length === 0
                                ? 'No favorites added yet. Add coins to your Squadron!'
                                : `No assets found${query ? ` for "${query}"` : ''}`}
                        </div>
                    ) : (
                        filteredTickers.map((ticker, index) => {
                            const isHighlighted = index === highlightedIndex;
                            const isPositive = ticker.priceChangePercent >= 0;
                            const isFavorite = favorites.includes(ticker.symbol);

                            return (
                                <button
                                    key={ticker.symbol}
                                    onClick={() => handleItemClick(ticker.symbol)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    className={`w-full flex items-center justify-between px-6 py-3 transition-all duration-150 ${isHighlighted
                                        ? 'bg-white/5 shadow-[inset_3px_0_0_0_#14b8a6]'
                                        : 'hover:bg-white/[0.02]'
                                        }`}
                                >
                                    {/* Left: Symbol */}
                                    <div className="flex items-center gap-3">
                                        {/* Live indicator */}
                                        <div className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-teal-500' : 'bg-red-500'
                                            } ${isHighlighted ? 'animate-pulse' : ''}`} />

                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white tracking-wider">
                                                {ticker.symbol.replace('USDT', '')}
                                            </span>
                                            <span className="text-zinc-600 text-sm">/USDT</span>
                                            {isFavorite && (
                                                <span className="text-amber-400 text-[10px]">⭐</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Price & Change */}
                                    <div className="flex items-center gap-4 text-right">
                                        <span className="font-mono text-sm text-zinc-400">
                                            ${formatPrice(ticker.price)}
                                        </span>
                                        <span className={`font-mono text-sm font-bold min-w-[60px] ${isPositive ? 'text-teal-400' : 'text-orange-500'
                                            }`}>
                                            {isPositive ? '+' : ''}{ticker.priceChangePercent.toFixed(2)}%
                                        </span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer Hint */}
                <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-600">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">↑↓</kbd>
                            <span>Navigate</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">↵</kbd>
                            <span>Select</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Esc</kbd>
                            <span>Close</span>
                        </span>
                    </div>
                    <span className="text-zinc-500">
                        {activeSort !== 'RELEVANCE' && <span className="text-teal-400/60 mr-2">{activeSort}</span>}
                        {filteredTickers.length} results
                    </span>
                </div>
            </div>
        </div>
    );
}
