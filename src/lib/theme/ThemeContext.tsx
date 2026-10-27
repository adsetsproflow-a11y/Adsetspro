'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'indigo' | 'emerald' | 'violet' | 'rose' | 'amber' | 'cyan';

export interface AccentOption {
  id: AccentColor;
  label: string;
  hex: string;
  previewClass: string;
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'indigo', label: 'Indigo (Flow)', hex: '#4f46e5', previewClass: 'bg-indigo-600' },
  { id: 'emerald', label: 'Emerald Mint', hex: '#059669', previewClass: 'bg-emerald-600' },
  { id: 'violet', label: 'Electric Violet', hex: '#7c3aed', previewClass: 'bg-purple-600' },
  { id: 'rose', label: 'Modern Rose', hex: '#e11d48', previewClass: 'bg-rose-600' },
  { id: 'amber', label: 'Warm Amber', hex: '#d97706', previewClass: 'bg-amber-600' },
  { id: 'cyan', label: 'Cyber Cyan', hex: '#0891b2', previewClass: 'bg-cyan-600' },
];

interface ThemeContextType {
  theme: ThemeMode;
  accent: AccentColor;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'saas_pm_theme';
const ACCENT_STORAGE_KEY = 'saas_pm_accent';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default is LIGHT mode and INDIGO accent as requested
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [accent, setAccentState] = useState<AccentColor>('indigo');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();

  // Helper to apply classes and data attributes to <html>
  const applyThemeToDOM = (resolved: 'light' | 'dark', activeAccent: AccentColor) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    root.setAttribute('data-accent', activeAccent);
  };

  // Initial read on mount
  useEffect(() => {
    try {
      const storedTheme = (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode) || 'light';
      const storedAccent = (localStorage.getItem(ACCENT_STORAGE_KEY) as AccentColor) || 'indigo';

      setThemeState(storedTheme);
      setAccentState(storedAccent);

      let initialResolved: 'light' | 'dark' = 'light';
      if (storedTheme === 'system') {
        initialResolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        initialResolved = storedTheme;
      }

      setResolvedTheme(initialResolved);
      applyThemeToDOM(initialResolved, storedAccent);
    } catch {}

    setMounted(true);
  }, []);

  // Listen to system preference changes when in 'system' mode
  useEffect(() => {
    if (!mounted || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolved);
      applyThemeToDOM(newResolved, accent);
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [mounted, theme, accent]);

  // Cross-tab sync via storage events & custom event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const newTheme = e.newValue as ThemeMode;
        setThemeState(newTheme);
        const resolved =
          newTheme === 'system'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
            : newTheme;
        setResolvedTheme(resolved);
        applyThemeToDOM(resolved, accent);
      }
      if (e.key === ACCENT_STORAGE_KEY && e.newValue) {
        const newAccent = e.newValue as AccentColor;
        setAccentState(newAccent);
        applyThemeToDOM(resolvedTheme, newAccent);
      }
    };

    const handleCustomChange = (e: any) => {
      if (e.detail?.theme) {
        setThemeState(e.detail.theme);
        setResolvedTheme(e.detail.resolvedTheme || e.detail.theme);
      }
      if (e.detail?.accent) {
        setAccentState(e.detail.accent);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('saas-theme-changed', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('saas-theme-changed', handleCustomChange);
    };
  }, [accent, resolvedTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}

    let resolved: 'light' | 'dark' = 'light';
    if (newTheme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = newTheme;
    }

    setResolvedTheme(resolved);
    applyThemeToDOM(resolved, accent);

    try {
      window.dispatchEvent(
        new CustomEvent('saas-theme-changed', {
          detail: { theme: newTheme, resolvedTheme: resolved, accent },
        })
      );
    } catch {}
  };

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, newAccent);
    } catch {}

    applyThemeToDOM(resolvedTheme, newAccent);

    try {
      window.dispatchEvent(
        new CustomEvent('saas-theme-changed', {
          detail: { theme, resolvedTheme, accent: newAccent },
        })
      );
    } catch {}
  };

  const toggleTheme = () => {
    // If currently light, switch to dark. If dark, switch to light.
    const nextTheme: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accent,
        resolvedTheme,
        setTheme,
        setAccent,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      theme: 'light' as ThemeMode,
      accent: 'indigo' as AccentColor,
      resolvedTheme: 'light' as 'light' | 'dark',
      setTheme: () => {},
      setAccent: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
