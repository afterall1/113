'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8 text-center font-mono">
                    <h1 className="text-4xl text-red-500 mb-4 tracking-widest">NEBULA COLLAPSED</h1>
                    <p className="text-zinc-500 mb-8 max-w-md">
                        Critical rendering failure detected. This is likely due to a WebGL context loss or data corruption.
                    </p>
                    <button
                        onClick={() => {
                            // Clear potentially corrupted grid data from localStorage
                            try {
                                const storageKey = 'nebula-storage';
                                const stored = localStorage.getItem(storageKey);
                                if (stored) {
                                    const parsed = JSON.parse(stored);
                                    // Reset gridSlots to empty while preserving other data
                                    if (parsed.state) {
                                        parsed.state.gridSlots = Array.from({ length: 9 }, (_, i) => ({ id: i, symbol: null }));
                                        localStorage.setItem(storageKey, JSON.stringify(parsed));
                                    }
                                }
                            } catch (e) {
                                // If parsing fails, just clear the whole thing
                                localStorage.removeItem('nebula-storage');
                            }
                            window.location.reload();
                        }}
                        className="px-6 py-3 bg-white/10 text-teal-400 border border-teal-500/30 rounded-full hover:bg-white/20 transition-all"
                    >
                        REBOOT SYSTEM
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
