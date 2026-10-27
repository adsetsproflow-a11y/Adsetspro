'use client';

import React from 'react';

interface CenterLoaderProps {
  message?: string;
  subtitle?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function CenterLoader({
  message = 'Loading...',
  subtitle = 'Fetching workspace data and state',
  fullScreen = false,
  size = 'md',
}: CenterLoaderProps) {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/90 dark:bg-[#070b14]/90 backdrop-blur-md transition-all duration-300'
    : 'min-h-[380px] w-full flex flex-col items-center justify-center p-8 transition-all duration-300';

  return (
    <div className={containerClasses} role="status" aria-label="Loading">
      <div className="relative flex flex-col items-center text-center select-none">
        {/* Ambient Radial Glow */}
        <div className="absolute -inset-10 bg-gradient-to-tr from-indigo-600/20 via-cyan-500/15 to-purple-600/20 rounded-full blur-2xl animate-pulse pointer-events-none" />

        {/* Center Logo & Spinner Ring Container */}
        <div className="relative flex items-center justify-center mb-5">
          {/* Outer glowing pulsing ring */}
          <div
            className={`absolute rounded-full border border-indigo-500/20 animate-ping opacity-35 ${
              isLarge ? 'w-24 h-24' : isSmall ? 'w-14 h-14' : 'w-20 h-20'
            }`}
          />

          {/* Rotating gradient loader ring */}
          <div
            className={`rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-cyan-400 to-purple-500 animate-spin shadow-lg shadow-indigo-500/25 ${
              isLarge ? 'w-20 h-20' : isSmall ? 'w-12 h-12' : 'w-16 h-16'
            }`}
          >
            {/* Inner Mask */}
            <div className="w-full h-full bg-white dark:bg-[#070b14] rounded-full flex items-center justify-center p-2.5 shadow-sm">
              {/* Brand Logo Emblem SVG */}
              <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`w-full h-full text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] transform hover:scale-105 transition-transform duration-300`}
              >
                {/* Modern Geometric Flow Emblem */}
                <defs>
                  <linearGradient id="loader-brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <path
                  d="M20 4L34 12V28L20 36L6 28V12L20 4Z"
                  stroke="url(#loader-brand-grad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20 12L28 17V27L20 32L12 27V17L20 12Z"
                  fill="url(#loader-brand-grad)"
                  fillOpacity="0.25"
                  stroke="url(#loader-brand-grad)"
                  strokeWidth="1.5"
                />
                <circle cx="20" cy="22" r="3.5" fill="#38bdf8" className="animate-pulse" />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading Message */}
        <h3
          className={`font-bold tracking-tight text-slate-900 dark:text-white mb-1.5 flex items-center justify-center gap-1.5 ${
            isLarge ? 'text-lg' : isSmall ? 'text-xs' : 'text-sm'
          }`}
        >
          <span>{message}</span>
          <span className="flex space-x-0.5">
            <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" />
          </span>
        </h3>

        {/* Subtitle / Tip */}
        {subtitle && (
          <p className="text-[11px] text-zinc-400 max-w-xs leading-relaxed font-medium">
            {subtitle}
          </p>
        )}

        {/* Sleek Minimal Progress Shimmer Bar */}
        <div className="w-36 h-1 bg-zinc-800/80 rounded-full mt-4 overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 w-1/2 rounded-full animate-[shimmer_1.4s_infinite_linear]" />
        </div>
      </div>
    </div>
  );
}
