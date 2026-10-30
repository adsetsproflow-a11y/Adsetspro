'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;
          setScrollProgress(progress);
          setShowScrollTop(scrollTop > 200);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-300 transform ${
        showScrollTop
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        title={`Scroll to top (${Math.round(scrollProgress * 100)}% scrolled)`}
        aria-label="Scroll back to top"
        className="relative w-12 h-12 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 shadow-2xl backdrop-blur-md text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500/80 hover:shadow-indigo-500/25 transition-all duration-200 transform hover:scale-110 active:scale-95 cursor-pointer group flex items-center justify-center"
      >
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5"
          viewBox="0 0 48 48"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            className="stroke-slate-200 dark:stroke-zinc-800/80 fill-none"
            strokeWidth="2.5"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            className="stroke-indigo-600 dark:stroke-indigo-400 fill-none transition-[stroke-dashoffset] duration-150 ease-out"
            strokeWidth="2.5"
            strokeDasharray={125.66}
            strokeDashoffset={125.66 - scrollProgress * 125.66}
            strokeLinecap="round"
          />
        </svg>
        <ArrowUp className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 relative z-10" />
      </button>
    </div>
  );
}
