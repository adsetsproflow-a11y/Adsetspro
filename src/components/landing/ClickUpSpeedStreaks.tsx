'use client';

import React, { useEffect, useRef } from 'react';

// =============================================================================
// HYPERDRIVE WARP FIELD (hero background)
// Light streaks are born at a vanishing point behind the dashboard and rush
// OUTWARD toward the viewer with true perspective, so the product feels like
// it is flying at you.
//  - Warp-in burst on page load, then a steady cruising flow
//  - Small sparkle particles fly through the same field for depth
//  - Scrolling injects extra speed ("boost"), which smoothly decays
//  - Vanishing point drifts with the cursor for parallax depth
//  - Cool cyan/violet on the left, hot magenta/amber on the right
//  - Density scales with screen size; pauses off-screen; respects reduced motion
// =============================================================================

interface Streak {
  x: number; // world-space position (-1..1 spread)
  y: number;
  z: number; // depth: 1 = far (at vanishing point) -> 0 = at viewer
  hue: string; // rgb triplet
  width: number;
}

// Weighted palettes: mostly brand hues, white is rare so it reads as a highlight
const LEFT_COLORS = ['0,229,255', '56,189,248', '56,189,248', '129,140,248', '129,140,248', '167,139,250', '226,232,255'];
const RIGHT_COLORS = ['236,72,153', '236,72,153', '217,70,239', '217,70,239', '244,114,182', '251,146,60', '255,228,240'];

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

    const spawn = (s: Partial<Streak> = {}, far = true): Streak => {
      // Polar spawn keeps an empty "eye" in the middle (hidden behind the card anyway)
      const angle = Math.random() * Math.PI * 2;
      // Bias toward the card's edges so more streaks are visible around it
      const r = 0.3 + Math.pow(Math.random(), 0.6) * 0.9;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const palette = x < 0 ? LEFT_COLORS : RIGHT_COLORS;
      return {
        x,
        y,
        z: far ? 0.85 + Math.random() * 0.15 : 0.05 + Math.random() * 0.95,
        hue: palette[Math.floor(Math.random() * palette.length)],
        // Mostly hairlines, a few hero streaks
        width: Math.random() < 0.12 ? 1.1 + Math.random() * 0.5 : 0.35 + Math.random() * 0.55,
        ...s,
      };
    };

    // Small sparkle particles (dots) sharing the same warp field
    interface Spark { x: number; y: number; z: number; hue: string; size: number; tw: number; phase: number }
    const sparks: Spark[] = [];
    const spawnSpark = (far = true): Spark => {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.15 + Math.pow(Math.random(), 0.7) * 1.1;
      const x = Math.cos(angle) * r;
      const palette = x < 0 ? LEFT_COLORS : RIGHT_COLORS;
      return {
        x,
        y: Math.sin(angle) * r,
        z: far ? 0.8 + Math.random() * 0.2 : 0.05 + Math.random() * 0.95,
        hue: Math.random() < 0.25 ? '255,255,255' : palette[Math.floor(Math.random() * palette.length)],
        size: 0.5 + Math.random() * 0.9,
        tw: 0.6 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Responsive density: fewer streaks on phones
      const target = w < 640 ? 110 : w < 1024 ? 200 : 320;
      if (streaks.length < target) {
        for (let i = streaks.length; i < target; i++) streaks.push(spawn({}, false));
      } else {
        streaks.length = target;
      }

      const sparkTarget = w < 640 ? 90 : w < 1024 ? 160 : 260;
      if (sparks.length < sparkTarget) {
        for (let i = sparks.length; i < sparkTarget; i++) sparks.push(spawnSpark(false));
      } else {
        sparks.length = sparkTarget;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // ---- Interaction state --------------------------------------------------
    let boost = reduced ? 0 : 2.2; // gentle warp-in on load
    let lastScrollY = window.scrollY;
    const vp = { x: 0, y: 0, tx: 0, ty: 0 }; // vanishing-point offset (px)

    const onScroll = () => {
      const dy = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      boost = Math.min(2.2, boost + dy * 0.012);
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

    // ---- Render --------------------------------------------------------------
    const BASE_SPEED = 0.17; // depth units per second while cruising (fast but smooth)
    let last = performance.now();
    let animId = 0;

    const frame = (now: number) => {
      animId = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!isVisible) return;

      boost *= Math.pow(0.25, dt); // slow, smooth decay
      vp.x += (vp.tx - vp.x) * Math.min(1, dt * 1.5);
      vp.y += (vp.ty - vp.y) * Math.min(1, dt * 1.5);

      const speed = BASE_SPEED * (1 + boost);
      const trail = 0.05 + speed * 0.6; // longer streaks when going faster

      const cx = w / 2 + vp.x;
      const cy = h * 0.46 + vp.y;
      const scaleX = w * 0.42;
      const scaleY = h * 0.5;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      for (let i = 0; i < streaks.length; i++) {
        const s = streaks[i];
        s.z -= speed * dt * (0.7 + (1 - s.z) * 0.5); // gentle acceleration toward the viewer

        const z = s.z;
        const tz = Math.min(1, z + trail);
        const hx = cx + (s.x / z) * scaleX * 0.32;
        const hy = cy + (s.y / z) * scaleY * 0.32;

        if (z <= 0.02 || hx < -80 || hx > w + 80 || hy < -80 || hy > h + 80) {
          streaks[i] = spawn();
          continue;
        }

        const tx = cx + (s.x / tz) * scaleX * 0.32;
        const ty = cy + (s.y / tz) * scaleY * 0.32;

        const near = 1 - z; // 0 far -> 1 near
        // Fade in from the far plane (no popping) and stay soft overall
        const fadeIn = Math.min(1, near / 0.25);
        const alpha = fadeIn * Math.min(1, 0.4 + near * 0.9) * (0.75 + Math.min(boost, 1.5) * 0.15);
        const lw = Math.min(2.6, s.width * (0.5 + near * 1.6)); // capped: no fat grey bars

        const grad = ctx.createLinearGradient(tx, ty, hx, hy);
        grad.addColorStop(0, `rgba(${s.hue},0)`);
        grad.addColorStop(0.7, `rgba(${s.hue},${(alpha * 0.8).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${s.hue},${alpha.toFixed(3)})`);

        // Soft glow pass
        ctx.strokeStyle = `rgba(${s.hue},${(alpha * 0.16).toFixed(3)})`;
        ctx.lineWidth = Math.min(6, lw * 3);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();

        // Bright core pass
        ctx.strokeStyle = grad;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();
      }

      // ---- Small particles: tiny glowing sparks flying toward the viewer ----
      const pSpeed = speed * 0.85;
      for (let i = 0; i < sparks.length; i++) {
        const p = sparks[i];
        p.z -= pSpeed * dt * (0.7 + (1 - p.z) * 0.5);
        const z = p.z;
        const px = cx + (p.x / z) * scaleX * 0.32;
        const py = cy + (p.y / z) * scaleY * 0.32;

        if (z <= 0.02 || px < -20 || px > w + 20 || py < -20 || py > h + 20) {
          sparks[i] = spawnSpark();
          continue;
        }

        const near = 1 - z;
        const fadeIn = Math.min(1, near / 0.2);
        const twinkle = 0.65 + Math.sin(now * 0.004 * p.tw + p.phase) * 0.35;
        const a = fadeIn * twinkle * Math.min(1, 0.35 + near);
        const r = Math.min(2.2, p.size * (0.4 + near * 1.6));

        // Halo
        ctx.fillStyle = `rgba(${p.hue},${(a * 0.18).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, r * 3, 0, Math.PI * 2);
        ctx.fill();
        // Core
        ctx.fillStyle = `rgba(${p.hue},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      if (reduced) cancelAnimationFrame(animId); // draw one still frame only
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
