'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Palette, Check, Monitor, ChevronDown } from 'lucide-react';
import { useTheme, ACCENT_OPTIONS, ThemeMode, AccentColor } from '@/lib/theme/ThemeContext';

interface ThemeToggleProps {
  showAccentPicker?: boolean;
  align?: 'left' | 'right';
  className?: string;
  variant?: 'button' | 'dropdown' | 'expanded';
}

export default function ThemeToggle({
  showAccentPicker = true,
  align = 'right',
  className = '',
  variant = 'button',
}: ThemeToggleProps) {
  const { theme, accent, resolvedTheme, setTheme, setAccent, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isDark = resolvedTheme === 'dark';

  if (variant === 'expanded') {
    return (
      <div className={`space-y-6 p-6 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-zinc-800 shadow-sm ${className}`}>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" />
            <span>Theme & Visual Mode</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Choose your preferred display mode. Light mode is default across all workspaces.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light', icon: Sun, desc: 'Clean, high-contrast' },
            { id: 'dark', label: 'Dark', icon: Moon, desc: 'Sleek, deep obsidian' },
            { id: 'system', label: 'System', icon: Monitor, desc: 'Follows OS theme' },
          ].map((mode) => {
            const Icon = mode.icon;
            const isSelected = theme === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTheme(mode.id as ThemeMode);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between select-none ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/40 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Icon
                    className={`w-4 h-4 ${
                      isSelected
                        ? mode.id === 'light'
                          ? 'text-amber-500'
                          : mode.id === 'dark'
                          ? 'text-indigo-400'
                          : 'text-cyan-500'
                        : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  />
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div>
                  <span
                    className={`text-xs font-bold block ${
                      isSelected ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-900 dark:text-zinc-200'
                    }`}
                  >
                    {mode.label}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 block">{mode.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Accent Color Picker */}
        {showAccentPicker && (
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-zinc-200 block">Accent Color Palette</span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">
                Select your personalized color tone applied across buttons, badges, and highlights.
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ACCENT_OPTIONS.map((opt) => {
                const isSelected = accent === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAccent(opt.id);
                    }}
                    className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all text-xs cursor-pointer select-none ${
                      isSelected
                        ? 'border-indigo-500 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 ring-2 ring-indigo-500/30 font-bold'
                        : 'border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-zinc-950/40 text-slate-800 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-sm border border-black/10 dark:border-white/20 flex items-center justify-center text-white"
                        style={{ backgroundColor: opt.hex }}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && (
                      <span
                        className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                        style={{ backgroundColor: opt.hex }}
                      >
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`} ref={menuRef}>
      {/* 1. Direct Click Toggle (Sun / Moon) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleTheme();
        }}
        title={`Current: ${resolvedTheme} mode (Default: Light). Click to switch to ${
          isDark ? 'light' : 'dark'
        } mode`}
        aria-label="Toggle theme mode"
        className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] group flex items-center justify-center"
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform duration-300" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform duration-300" />
        )}
      </button>

      {/* 2. Color Palette / Options Menu Trigger */}
      {showAccentPicker && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          title="Color & Appearance Settings"
          aria-label="Color and Theme Palette Menu"
          aria-expanded={isOpen}
          className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm flex items-center gap-1 group ${
            isOpen
              ? 'bg-slate-100 dark:bg-zinc-800 border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900 dark:text-white'
              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100'
          }`}
        >
          <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform" />
          <ChevronDown
            className={`w-3 h-3 text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {/* Dropdown Menu - Explicitly Solid, High Stacking Context (z-[100]) */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-full mt-2.5 z-[100] w-72 p-3.5 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-zinc-800 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
          style={{
            backgroundColor: isDark ? '#0c1222' : '#ffffff',
            boxShadow: isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.18), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Theme Mode Segment */}
          <div className="mb-3.5">
            <div className="flex items-center justify-between px-1 mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-zinc-400">
                Display Mode
              </span>
              <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                Light is default
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200/90 dark:border-zinc-800/80">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Monitor },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = theme === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme(m.id as ThemeMode);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm border border-slate-300 dark:border-zinc-700'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200/70 dark:hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isSelected
                          ? m.id === 'light'
                            ? 'text-amber-500'
                            : m.id === 'dark'
                            ? 'text-indigo-400'
                            : 'text-cyan-500'
                          : 'text-slate-400 dark:text-zinc-500'
                      }`}
                    />
                    <span className={isSelected ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-zinc-400'}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color Palette Segment */}
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-zinc-400 block px-1 mb-2">
              Accent Color Scheme
            </span>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {ACCENT_OPTIONS.map((opt) => {
                const isSelected = accent === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAccent(opt.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer select-none group/item ${
                      isSelected
                        ? 'bg-slate-100 dark:bg-zinc-800/90 text-slate-900 dark:text-white font-bold border border-slate-300 dark:border-zinc-700 shadow-xs'
                        : 'text-slate-800 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50 border border-transparent font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-sm border border-black/10 dark:border-white/20 transition-transform group-hover/item:scale-110 flex items-center justify-center text-white"
                        style={{ backgroundColor: opt.hex }}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span className={`truncate ${isSelected ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-800 dark:text-zinc-200 font-medium'}`}>
                        {opt.label}
                      </span>
                    </div>
                    {isSelected && (
                      <span
                        className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: opt.hex }}
                      >
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
