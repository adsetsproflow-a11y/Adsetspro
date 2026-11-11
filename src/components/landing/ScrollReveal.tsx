'use client';

import { useEffect, useRef } from 'react';

// =============================================================================
// SCROLL REVEAL + SCROLL PROGRESS (mount once on the landing page)
//
// Any element with a `data-reveal` attribute animates in the first time it
// scrolls into view:
//   data-reveal="up"    fade + rise (default)
//   data-reveal="left"  fade + slide in from the left
//   data-reveal="right" fade + slide in from the right
//   data-reveal="zoom"  fade + scale up
// Optional stagger: style={{ '--rd': '120ms' }}
//
// Also renders a thin brand-gradient progress bar at the top of the window.
// Content stays fully visible without JS and for reduced-motion users.
// =============================================================================

export default function ScrollReveal() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    // Opt in only once JS runs, so content is never hidden if it doesn't
    root.classList.add('sr-ready');

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.revealed = 'true';
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => io.observe(el));

    // Scroll progress bar
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = root.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      root.classList.remove('sr-ready');
    };
  }, []);

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
        <div
          ref={barRef}
          className="h-full origin-left bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-500 shadow-[0_0_10px_rgba(56,189,248,0.8)]"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      <style jsx global>{`
        .sr-ready [data-reveal] {
          opacity: 0;
          filter: blur(6px);
          transform: translateY(32px);
          transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
            filter 0.9s ease;
          transition-delay: var(--rd, 0ms);
          will-change: opacity, transform;
        }
        .sr-ready [data-reveal='left'] { transform: translateX(-40px); }
        .sr-ready [data-reveal='right'] { transform: translateX(40px); }
        .sr-ready [data-reveal='zoom'] { transform: scale(0.94) translateY(20px); }
        .sr-ready [data-reveal][data-revealed='true'] {
          opacity: 1;
          filter: none;
          transform: none;
        }

        /* Progress bars fill once their row has revealed */
        .hp-fill {
          transform-origin: left;
          transition: transform 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.9s;
        }
        .sr-ready [data-reveal]:not([data-revealed='true']) .hp-fill {
          transform: scaleX(0);
        }

        /* Gentle idle float for showcase cards */
        .hp-float-slow {
          animation: hpFloatSlow 7s ease-in-out infinite;
        }
        @keyframes hpFloatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hp-float-slow { animation: none; }
        }
      `}</style>
    </>
  );
}
