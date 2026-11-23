'use client';

import React, { useEffect, useRef } from 'react';

// =============================================================================
// HYPERDRIVE WARP FIELD (hero background - Ultra Smooth 60/120 FPS Mode)
// Light streaks are born at a vanishing point behind the dashboard and rush
// OUTWARD toward the viewer with true perspective.
// Optimizations for buttery smooth 60fps rendering:
//  - Zero object allocations / zero GC sweeps in the render loop (object pooling)
//  - Zero string template allocations in rAF loop (pre-cached colors & globalAlpha)
//  - Clamped delta-time physics (no micro-stutter, lag or sticking)
//  - High-performance dual-pass glowing strokes (no heavy gradient allocations)
//  - Hardware compositing hints (translate3d, will-change: transform)
// =============================================================================

interface PaletteColor {
  rgb: string;
  glow: string;
  core: string;
}

const LEFT_PALETTE: PaletteColor[] = [
  { rgb: '0,229,255', glow: 'rgba(0,229,255,0.22)', core: 'rgba(0,229,255,0.95)' },
  { rgb: '56,189,248', glow: 'rgba(56,189,248,0.22)', core: 'rgba(56,189,248,0.95)' },
  { rgb: '129,140,248', glow: 'rgba(129,140,248,0.22)', core: 'rgba(129,140,248,0.95)' },
  { rgb: '167,139,250', glow: 'rgba(167,139,250,0.22)', core: 'rgba(167,139,250,0.95)' },
  { rgb: '226,232,255', glow: 'rgba(226,232,255,0.25)', core: 'rgba(255,255,255,0.98)' },
];

const RIGHT_PALETTE: PaletteColor[] = [
  { rgb: '236,72,153', glow: 'rgba(236,72,153,0.22)', core: 'rgba(236,72,153,0.95)' },
  { rgb: '217,70,239', glow: 'rgba(217,70,239,0.22)', core: 'rgba(217,70,239,0.95)' },
  { rgb: '244,114,182', glow: 'rgba(244,114,182,0.22)', core: 'rgba(244,114,182,0.95)' },
  { rgb: '251,146,60', glow: 'rgba(251,146,60,0.22)', core: 'rgba(251,146,60,0.95)' },
  { rgb: '255,228,240', glow: 'rgba(255,228,240,0.25)', core: 'rgba(255,255,255,0.98)' },
];

interface Streak {
  x: number; // world-space position (-1..1 spread)
  y: number;
  z: number; // depth: 1 = far (at vanishing point) -> 0 = at viewer
  color: PaletteColor;
  width: number;
}

interface Spark {
  x: number;
  y: number;
  z: number;
  color: PaletteColor;
  size: number;
  tw: number;
  phase: number;
}

export default function ClickUpSpeedStreaks() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    const streaks: Streak[] = [];
    const sparks: Spark[] = [];

    // Object pooling: resets properties in-place, zero GC allocations during animation
    const resetStreak = (s: Streak, far = true): void => {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.3 + Math.pow(Math.random(), 0.6) * 0.9;
      s.x = Math.cos(angle) * r;
      s.y = Math.sin(angle) * r;
      s.z = far ? 0.85 + Math.random() * 0.15 : 0.05 + Math.random() * 0.95;
      const palette = s.x < 0 ? LEFT_PALETTE : RIGHT_PALETTE;
      s.color = palette[Math.floor(Math.random() * palette.length)];
      s.width = Math.random() < 0.12 ? 1.1 + Math.random() * 0.5 : 0.35 + Math.random() * 0.55;
    };

    const resetSpark = (p: Spark, far = true): void => {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.15 + Math.pow(Math.random(), 0.7) * 1.1;
      p.x = Math.cos(angle) * r;
      p.y = Math.sin(angle) * r;
      p.z = far ? 0.8 + Math.random() * 0.2 : 0.05 + Math.random() * 0.95;
      const palette = p.x < 0 ? LEFT_PALETTE : RIGHT_PALETTE;
      p.color = palette[Math.floor(Math.random() * palette.length)];
      p.size = 0.5 + Math.random() * 0.9;
      p.tw = 0.6 + Math.random() * 1.4;
      p.phase = Math.random() * Math.PI * 2;
    };

    const createStreak = (far = true): Streak => {
      const s: Streak = {
        x: 0,
        y: 0,
        z: 0,
        color: LEFT_PALETTE[0],
        width: 0.5,
      };
      resetStreak(s, far);
      return s;
    };

    const createSpark = (far = true): Spark => {
      const p: Spark = {
        x: 0,
        y: 0,
        z: 0,
        color: LEFT_PALETTE[0],
        size: 0.8,
        tw: 1,
        phase: 0,
      };
      resetSpark(p, far);
      return p;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      // DPR 1 for ultra-lightweight, zero-stutter background fill rate
      const dpr = 1;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Lightweight calibrated density: completely fluid and smooth from frame 1
      const target = w < 640 ? 60 : w < 1024 ? 95 : 130;
      while (streaks.length < target) streaks.push(createStreak(false));
      if (streaks.length > target) streaks.length = target;

      const sparkTarget = w < 640 ? 40 : w < 1024 ? 60 : 80;
      while (sparks.length < sparkTarget) sparks.push(createSpark(false));
      if (sparks.length > sparkTarget) sparks.length = sparkTarget;
    };
    resize();
    window.addEventListener('resize', resize);

    // ---- Interaction state --------------------------------------------------
    let boost = 0; // zero burst on load: starts cruising smoothly from the very first frame
    let lastScrollY = window.scrollY;
    const vp = { x: 0, y: 0, tx: 0, ty: 0 }; // vanishing-point offset (px)

    const onScroll = () => {
      const dy = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      boost = Math.min(0.8, boost + dy * 0.006);
    };
    const onMouse = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      vp.tx = -nx * 40;
      vp.ty = -ny * 20;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouse, { passive: true });

    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    // ---- Smooth Render Loop --------------------------------------------------
    const BASE_SPEED = 0.17; // depth units per second
    let last = performance.now();
    let animId = 0;

    const frame = (now: number) => {
      animId = requestAnimationFrame(frame);
      if (!isVisible) {
        last = now;
        return;
      }

      // Smooth delta time clamp between 8ms (120fps) and 33ms (30fps fallback)
      // Prevents hitching or teleporting when tab is throttled or during GC
      const rawDt = (now - last) / 1000;
      last = now;
      const dt = Math.max(0.008, Math.min(0.033, rawDt));

      boost *= Math.pow(0.25, dt); // smooth decay
      vp.x += (vp.tx - vp.x) * Math.min(1, dt * 2.0);
      vp.y += (vp.ty - vp.y) * Math.min(1, dt * 2.0);

      const speed = BASE_SPEED * (1 + boost);
      const trail = 0.05 + speed * 0.6; // longer streaks when moving faster

      const cx = w / 2 + vp.x;
      const cy = h * 0.46 + vp.y;
      const scaleX = w * 0.42;
      const scaleY = h * 0.5;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      // --- Draw Streaks (High-speed batching, zero gradient creation) ---
      for (let i = 0; i < streaks.length; i++) {
        const s = streaks[i];
        s.z -= speed * dt * (0.7 + (1 - s.z) * 0.5);

        const z = s.z;
        const tz = Math.min(1, z + trail);
        const hx = cx + (s.x / z) * scaleX * 0.32;
        const hy = cy + (s.y / z) * scaleY * 0.32;

        if (z <= 0.02 || hx < -80 || hx > w + 80 || hy < -80 || hy > h + 80) {
          resetStreak(s, true);
          continue;
        }

        const tx = cx + (s.x / tz) * scaleX * 0.32;
        const ty = cy + (s.y / tz) * scaleY * 0.32;

        const near = 1 - z; // 0 far -> 1 near
        const fadeIn = Math.min(1, near / 0.25);
        const alpha = fadeIn * Math.min(1, 0.4 + near * 0.9) * (0.75 + Math.min(boost, 1.5) * 0.15);
        const lw = Math.min(2.6, s.width * (0.5 + near * 1.6));

        // Soft outer glow pass
        ctx.globalAlpha = alpha * 0.22;
        ctx.strokeStyle = s.color.glow;
        ctx.lineWidth = Math.min(6, lw * 2.6);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();

        // Vibrant neon core pass
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = s.color.core;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();
      }

      // --- Draw Small Sparkle Particles ---
      const pSpeed = speed * 0.85;
      for (let i = 0; i < sparks.length; i++) {
        const p = sparks[i];
        p.z -= pSpeed * dt * (0.7 + (1 - p.z) * 0.5);
        const z = p.z;
        const px = cx + (p.x / z) * scaleX * 0.32;
        const py = cy + (p.y / z) * scaleY * 0.32;

        if (z <= 0.02 || px < -20 || px > w + 20 || py < -20 || py > h + 20) {
          resetSpark(p, true);
          continue;
        }

        const near = 1 - z;
        const fadeIn = Math.min(1, near / 0.2);
        const twinkle = 0.65 + Math.sin(now * 0.004 * p.tw + p.phase) * 0.35;
        const a = fadeIn * twinkle * Math.min(1, 0.35 + near);
        const r = Math.min(2.2, p.size * (0.4 + near * 1.6));

        // Halo
        ctx.globalAlpha = a * 0.25;
        ctx.fillStyle = p.color.glow;
        ctx.beginPath();
        ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color.core;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (reduced) cancelAnimationFrame(animId);
    };
    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouse);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-screen h-[520px] sm:h-[760px] lg:h-[920px] pointer-events-none overflow-hidden select-none -z-10"
      style={{
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Core bloom at the vanishing point (sits behind the card) */}
      <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-[70%] h-[55%] rounded-full blur-[120px] bg-[radial-gradient(closest-side,rgba(217,70,239,0.35),rgba(99,102,241,0.18),transparent)]" />
      {/* Side auras: cool left, hot right */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[45%] h-[60%] rounded-full blur-[140px] bg-gradient-to-r from-cyan-500/20 via-indigo-600/10 to-transparent" />
      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[45%] h-[60%] rounded-full blur-[140px] bg-gradient-to-l from-pink-500/20 via-purple-600/10 to-transparent" />

      <canvas
        ref={canvasRef}
        className="relative w-full h-full block opacity-60 dark:opacity-100"
        style={{
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          // Radial vignette + top fade, so streaks never cross the headline / CTA buttons
          maskImage:
            'radial-gradient(ellipse 90% 85% at 50% 50%, black 60%, transparent 100%), linear-gradient(to bottom, transparent 0%, transparent 12%, black 28%, black 90%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 85% at 50% 50%, black 60%, transparent 100%), linear-gradient(to bottom, transparent 0%, transparent 12%, black 28%, black 90%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
      />
    </div>
  );
}
