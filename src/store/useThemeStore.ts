// ============================================================
// Theme Store — Light / Dark / System with Zustand persistence
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    resolvedTheme: () => 'light' | 'dark';
}

const getSystemTheme = (): 'light' | 'dark' =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            mode: 'light',
            setMode: (mode) => {
                set({ mode });
                const resolved = mode === 'system' ? getSystemTheme() : mode;
                document.documentElement.classList.toggle('dark', resolved === 'dark');
            },
            resolvedTheme: () => {
                const { mode } = get();
                return mode === 'system' ? getSystemTheme() : mode;
            },
        }),
        { name: 'avyren-theme' }
    )
);

// Apply theme immediately on app load
export function initTheme() {
    const stored = JSON.parse(localStorage.getItem('avyren-theme') || '{}');
    const mode: ThemeMode = stored?.state?.mode ?? 'light';
    const resolved = mode === 'system' ? getSystemTheme() : mode;
    document.documentElement.classList.toggle('dark', resolved === 'dark');
}
