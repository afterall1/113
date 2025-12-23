/**
 * Utility Functions for Liquidity Nebula
 * Formatting and risk assessment helpers
 */

// Risk level type
export interface RiskLevel {
    label: string;
    labelTR: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
}

/**
 * Format large currency values with abbreviations
 * @param value - Number to format
 * @param showDollar - Whether to prefix with $ (default: true)
 * @returns Formatted string (e.g., "$1.2B", "$500M", "$10K")
 */
export function formatCurrency(value: number, showDollar: boolean = true): string {
    const prefix = showDollar ? '$' : '';

    if (value >= 1_000_000_000_000) {
        return `${prefix}${(value / 1_000_000_000_000).toFixed(2)}T`;
    } else if (value >= 1_000_000_000) {
        return `${prefix}${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
        return `${prefix}${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
        return `${prefix}${(value / 1_000).toFixed(2)}K`;
    }
    return `${prefix}${value.toFixed(2)}`;
}

/**
 * Format supply numbers without currency prefix
 * @param value - Number to format
 * @returns Formatted string (e.g., "1.2B", "500M")
 */
export function formatSupply(value: number): string {
    return formatCurrency(value, false);
}

/**
 * Format date string to a readable format
 * @param dateStr - ISO date string (e.g., "2025-03-15")
 * @returns Formatted date (e.g., "15 Mar 2025")
 */
export function formatDate(dateStr: string): string {
    if (!dateStr) return '—';

    try {
        const date = new Date(dateStr);
        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        };
        return date.toLocaleDateString('en-GB', options);
    } catch {
        return dateStr;
    }
}

/**
 * Format date string to Turkish locale
 * @param dateStr - ISO date string
 * @returns Formatted date in Turkish (e.g., "15 Mart 2025")
 */
export function formatDateTR(dateStr: string): string {
    if (!dateStr) return '—';

    try {
        const date = new Date(dateStr);
        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        };
        return date.toLocaleDateString('tr-TR', options);
    } catch {
        return dateStr;
    }
}

/**
 * Calculate days until a target date
 * @param dateStr - ISO date string
 * @returns Number of days (negative if in past)
 */
export function getDaysUntil(dateStr: string): number {
    if (!dateStr) return 0;
    const target = new Date(dateStr);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate unlock risk level based on percentage of supply being unlocked
 * @param percent - Percentage of total supply being unlocked
 * @returns RiskLevel object with label, Turkish label, and Tailwind color classes
 */
export function calculateUnlockRisk(percent: number): RiskLevel {
    if (percent > 5) {
        return {
            label: 'HIGH RISK',
            labelTR: 'YÜKSEK RİSK',
            colorClass: 'text-red-400',
            bgClass: 'bg-red-500/10',
            borderClass: 'border-red-500/30',
        };
    } else if (percent >= 1) {
        return {
            label: 'MEDIUM RISK',
            labelTR: 'ORTA RİSK',
            colorClass: 'text-amber-400',
            bgClass: 'bg-amber-500/10',
            borderClass: 'border-amber-500/30',
        };
    } else if (percent > 0) {
        return {
            label: 'LOW RISK',
            labelTR: 'DÜŞÜK RİSK',
            colorClass: 'text-teal-400',
            bgClass: 'bg-teal-500/10',
            borderClass: 'border-teal-500/20',
        };
    }

    // No unlock
    return {
        label: 'NO UNLOCK',
        labelTR: 'KİLİT YOK',
        colorClass: 'text-zinc-400',
        bgClass: 'bg-white/5',
        borderClass: 'border-white/10',
    };
}

/**
 * Format percentage with sign
 * @param value - Percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with sign (e.g., "+5.25%", "-3.10%")
 */
export function formatPercent(value: number, decimals: number = 2): string {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Get color class based on value (positive = green, negative = red)
 * @param value - Number to evaluate
 * @returns Tailwind color class
 */
export function getValueColorClass(value: number): string {
    if (value > 0) return 'text-teal-400';
    if (value < 0) return 'text-red-500';
    return 'text-zinc-400';
}
