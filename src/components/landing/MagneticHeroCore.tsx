'use client';

import React, { useRef, useEffect, useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// =============================================================================
// MAGNETIC HERO CORE — PREMIUM SCROLL-REVEAL SHOWCASE
// 1. Scroll-driven 3D reveal: the mockup starts tilted back in perspective and
//    "lands" flat, scaling up as the visitor scrolls (cinematic product reveal)
// 2. Rim-light frame: luminous magenta → violet edge, brightest on the top rim,
//    with a slow travelling highlight and a bloom that spills behind the card
// 3. Subtle cursor tilt + spotlight layered on top of the scroll pose
// 4. Soft orbit rings & stardust particles that fade in as the card lands
// All per-frame motion is written straight to the DOM (no React re-renders).
// =============================================================================

interface MagneticHeroCoreProps {
  children: React.ReactNode;
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
// easeOutCubic for a smooth "landing" feel
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export default function MagneticHeroCore({ children }: MagneticHeroCoreProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Shared mutable motion state (read by rAF loops, never triggers renders)
  const motion = useRef({
    mx: 0, my: 0, tx: 0, ty: 0, // cursor tilt (current / target)
    cx: 50, cy: 50,             // cursor % within container
    hover: false,
    progress: 0,                // smoothed scroll progress 0..1
  });

  const prefersReducedMotion = useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_MOTION_QUERY);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );

  // ---------------------------------------------------------------------------
  // Main motion loop: scroll progress + cursor tilt → CSS variables
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;

    if (prefersReducedMotion) {
      container.style.setProperty('--p', '1');
      card.style.transform = 'none';
      return;
    }

    let animId: number;
    const loop = () => {
      const m = motion.current;
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      // 0 when the card's top sits low in the viewport, 1 once it has risen
      // to ~18% from the top. Clamped so a short page still reaches the end.
      const raw = clamp((vh * 0.92 - rect.top) / (vh * 0.62));
      m.progress += (raw - m.progress) * 0.1;
      const p = ease(m.progress);

      m.mx += (m.tx - m.mx) * (m.hover ? 0.12 : 0.06);
      m.my += (m.ty - m.my) * (m.hover ? 0.12 : 0.06);

      const rotateX = (1 - p) * 24 + m.my;   // tilted back → flat
      const rotateY = m.mx;
      const scale = 0.86 + p * 0.14 + (m.hover ? 0.008 : 0);
      const lift = (1 - p) * 40;

      card.style.transform =
        `translate3d(0, ${lift.toFixed(2)}px, 0) rotateX(${rotateX.toFixed(3)}deg) ` +
        `rotateY(${rotateY.toFixed(3)}deg) scale(${scale.toFixed(4)})`;

      container.style.setProperty('--p', p.toFixed(4));
      container.style.setProperty('--cx', `${m.cx.toFixed(1)}%`);
      container.style.setProperty('--cy', `${m.cy.toFixed(1)}%`);
      container.style.setProperty('--hover', m.hover ? '1' : '0');

      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [prefersReducedMotion]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    const ny = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    const m = motion.current;
    m.tx = nx * 3.5;
    m.ty = -ny * 2.5;
    m.cx = ((nx + 1) / 2) * 100;
    m.cy = ((ny + 1) / 2) * 100;
    m.hover = true;
  };

  const handleMouseLeave = () => {
    const m = motion.current;
    m.tx = 0;
    m.ty = 0;
    m.cx = 50;
    m.cy = 50;
    m.hover = false;
  };

  // ---------------------------------------------------------------------------
  // Stardust ribbon particles (created once; reads cursor from the ref)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let isVisible = true;
    let time = 0;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const cyanPalette = ['#00E5FF', '#38BDF8', '#818CF8', '#F8FAFC'];
    const magentaPalette = ['#EC4899', '#F472B6', '#8B5CF6', '#C084FC'];
    const count = window.innerWidth < 768 ? 30 : 64;

    const particles = Array.from({ length: count }, (_, i) => {
      const isCyan = i % 2 === 0;
      const palette = isCyan ? cyanPalette : magentaPalette;
      return {
        cyan: isCyan,
        t: Math.random(),
        speed: 0.0012 + Math.random() * 0.0022,
        radius: 0.7 + Math.random() * 1.2,
        color: palette[i % palette.length],
        glow: isCyan ? 'rgba(0, 229, 255, 0.85)' : 'rgba(236, 72, 153, 0.85)',
        spreadX: (Math.random() - 0.5) * 36,
        spreadY: (Math.random() - 0.5) * 28,
        twinkle: Math.random() * Math.PI * 2,
      };
    });

    const render = () => {
      animId = requestAnimationFrame(render);
      if (!isVisible) return;
      time += 0.03;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const m = motion.current;
      const reveal = ease(m.progress); // particles bloom in as the card lands
      if (reveal < 0.02) return;

      const centerX = w / 2;
      const centerY = h / 2;
      const radiusX = Math.min(w * 0.52, 640);
      const radiusY = Math.min(h * 0.44, 280);
      const mouseX = (m.cx / 100) * w;
      const mouseY = (m.cy / 100) * h;

      for (const p of particles) {
        p.t = (p.t + p.speed) % 1;
        const angle = p.t * Math.PI * 2 + (p.cyan ? 0 : Math.PI);
        const tilt = p.cyan ? -0.38 : 0.38;
        const ox = Math.cos(angle) * radiusX;
        const oy = Math.sin(angle) * radiusY * 0.42;
        let px = centerX + (ox * Math.cos(tilt) - oy * Math.sin(tilt)) + p.spreadX;
        let py = centerY + (ox * Math.sin(tilt) + oy * Math.cos(tilt)) + p.spreadY;
        const z = Math.sin(angle);

        if (m.hover) {
          const dx = mouseX - px;
          const dy = mouseY - py;
          const dist = Math.hypot(dx, dy);
          if (dist < 240 && dist > 1) {
            const pull = (1 - dist / 240) * 16;
            px += (dx / dist) * pull;
            py += (dy / dist) * pull;
          }
        }

        const depthAlpha = z > 0 ? 0.8 + z * 0.2 : 0.25 + (z + 1) * 0.22;
        const depthScale = z > 0 ? 1 + z * 0.3 : 0.75;
        const twinkle = Math.sin(time * 3 + p.twinkle) * 0.25 + 0.75;

        ctx.globalAlpha = clamp(depthAlpha * twinkle * reveal, 0, 0.9);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = z > 0 ? 12 : 5;
        ctx.shadowColor = p.glow;
        ctx.beginPath();
        ctx.arc(px, py, p.radius * depthScale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      cancelAnimationFrame(animId);
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hero-core relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 select-none"
      style={{ perspective: '1600px', '--p': 0, '--hover': 0 } as React.CSSProperties}
    >
      {/* ===== Back bloom: big magenta/violet glow rising behind the card ===== */}
      <div aria-hidden className="hero-bloom absolute pointer-events-none -z-10" />

      {/* ===== Soft orbit rings (fade in as the card lands) ===== */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-visible"
        style={{ opacity: 'calc(var(--p) * 0.55)' }}
      >
        {[
          { id: 'c', rot: 'rotateX(68deg) rotateY(-16deg) rotateZ(-22deg)', a: '#00E5FF', b: '#6366F1', dur: '9s', dir: -1 },
          { id: 'm', rot: 'rotateX(68deg) rotateY(16deg) rotateZ(24deg)', a: '#EC4899', b: '#8B5CF6', dur: '11s', dir: 1 },
        ].map((r) => (
          <div key={r.id} className="absolute w-[112%] sm:w-[118%] h-[120%] sm:h-[135%]" style={{ transform: r.rot }}>
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 500" fill="none">
              <defs>
                <linearGradient id={`orbitGrad-${r.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={r.a} stopOpacity="0" />
                  <stop offset="30%" stopColor={r.a} stopOpacity="0.8" />
                  <stop offset="50%" stopColor={r.b} stopOpacity="0.6" />
                  <stop offset="70%" stopColor={r.a} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={r.a} stopOpacity="0" />
                </linearGradient>
                <filter id={`orbitGlow-${r.id}`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <ellipse cx="500" cy="250" rx="480" ry="210" stroke={`url(#orbitGrad-${r.id})`} strokeWidth="1.6" filter={`url(#orbitGlow-${r.id})`} />
              {!prefersReducedMotion && (
                <ellipse
                  cx="500" cy="250" rx="480" ry="210"
                  stroke="#FFFFFF" strokeWidth="3.5" strokeDasharray="24 2800" strokeLinecap="round"
                  filter={`url(#orbitGlow-${r.id})`}
                  style={{ animation: `${r.dir < 0 ? 'orbitCyanSpin' : 'orbitMagentaSpin'} ${r.dur} linear infinite` }}
                />
              )}
            </svg>
          </div>
        ))}
      </div>

      {/* ===== Stardust ribbon canvas ===== */}
      <div aria-hidden className="absolute -inset-16 sm:-inset-24 pointer-events-none -z-10 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* ===== 3D card (scroll pose + cursor tilt applied by rAF) ===== */}
      <div
        ref={cardRef}
        className="relative will-change-transform"
        style={{ transformStyle: 'preserve-3d', transformOrigin: '50% 0%' }}
      >
        {/* Rim-light frame */}
        <div className="hero-frame relative rounded-2xl sm:rounded-[1.75rem] p-[1.5px]">
          {/* Travelling highlight that sweeps around the rim */}
          {!prefersReducedMotion && (
            <div aria-hidden className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
              <div className="hero-rim-sweep absolute -inset-[150%]" />
            </div>
          )}

          {/* Bright top-edge light line (the "lit from above" rim) */}
          <div aria-hidden className="hero-top-rim absolute left-[8%] right-[8%] -top-px h-px pointer-events-none z-30" />

          <div className="relative rounded-[calc(1rem-1.5px)] sm:rounded-[calc(1.75rem-1.5px)] overflow-hidden bg-slate-950">
            {/* Cursor spotlight + inner edge glow */}
            <div aria-hidden className="hero-spotlight absolute inset-0 pointer-events-none z-20" />
            {/* Glass sheen that glides across once the card lands */}
            {!prefersReducedMotion && <div aria-hidden className="hero-sheen absolute inset-0 pointer-events-none z-20" />}
            {children}
          </div>
        </div>
      </div>

      {/* ===== Floor reflection ===== */}
      <div aria-hidden className="relative w-full flex justify-center pointer-events-none -z-20">
        <div
          className="w-4/5 h-20 -mt-6 sm:-mt-8 rounded-[100%] blur-2xl"
          style={{
            background:
              'linear-gradient(180deg, rgba(236, 72, 153, 0.22) 0%, rgba(139, 92, 246, 0.16) 45%, rgba(0, 229, 255, 0.08) 75%, transparent 100%)',
            opacity: 'calc(0.3 + var(--p) * 0.6)',
            transform: 'scaleY(0.6)',
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes orbitCyanSpin {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -2828; }
        }
        @keyframes orbitMagentaSpin {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 2828; }
        }
        @keyframes heroRimSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes heroSheen {
          0%, 62% { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
          66% { opacity: 1; }
          86%, 100% { transform: translateX(220%) skewX(-18deg); opacity: 0; }
        }

        .hero-core .hero-bloom {
          left: 50%;
          top: -18%;
          width: 130%;
          height: 130%;
          transform: translateX(-50%) scale(calc(0.8 + var(--p) * 0.2));
          background:
            radial-gradient(50% 55% at 50% 40%, rgba(217, 70, 239, 0.45), transparent 70%),
            radial-gradient(40% 50% at 30% 55%, rgba(139, 92, 246, 0.35), transparent 70%),
            radial-gradient(40% 50% at 70% 55%, rgba(236, 72, 153, 0.35), transparent 70%);
          filter: blur(60px);
          opacity: calc(0.25 + var(--p) * 0.75);
        }

        .hero-core .hero-frame {
          background: linear-gradient(
            180deg,
            rgba(244, 114, 182, 0.95) 0%,
            rgba(168, 85, 247, 0.75) 22%,
            rgba(99, 102, 241, 0.35) 60%,
            rgba(99, 102, 241, 0.12) 100%
          );
          box-shadow:
            0 -10px 50px -6px rgba(236, 72, 153, calc(0.3 + var(--p) * 0.4)),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 30px 80px -20px rgba(15, 10, 40, 0.8),
            0 0 calc(45px + var(--hover) * 25px) rgba(168, 85, 247, calc(0.25 + var(--p) * 0.3)),
            0 0 calc(120px + var(--hover) * 40px) rgba(217, 70, 239, calc(0.1 + var(--p) * 0.15));
          transition: box-shadow 0.4s ease;
        }

        .hero-core .hero-rim-sweep {
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            transparent 300deg,
            rgba(244, 114, 182, 0.9) 330deg,
            #ffffff 345deg,
            rgba(129, 140, 248, 0.9) 355deg,
            transparent 360deg
          );
          animation: heroRimSpin 7s linear infinite;
          opacity: 0.85;
        }

        .hero-core .hero-top-rim {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), transparent);
          box-shadow: 0 0 12px 1px rgba(244, 114, 182, 0.8), 0 0 28px 4px rgba(168, 85, 247, 0.5);
          opacity: calc(0.4 + var(--p) * 0.6);
        }

        .hero-core .hero-spotlight {
          background: radial-gradient(
            600px circle at var(--cx, 50%) var(--cy, 50%),
            rgba(255, 255, 255, calc(var(--hover) * 0.06)),
            transparent 60%
          );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 0 40px rgba(168, 85, 247, 0.12);
        }

        .hero-core .hero-sheen::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 35%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.07),
            rgba(255, 255, 255, 0.12),
            rgba(255, 255, 255, 0.07),
            transparent
          );
          animation: heroSheen 9s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
