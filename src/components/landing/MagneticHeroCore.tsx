'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

// =============================================================================
// MAGNETIC HERO CORE: 3D MAGNETIC ENERGY GLOW & CONVERGENT ORBIT SYSTEM
// Inspired by futuristic AI technology interfaces:
// 1. Dual 3D Magnetic Elliptical Orbit Rings (Cyan & Magenta)
// 2. Twin Ribbon Particle Flux (Parametric Helical Stardust orbiting the card)
// 3. Subtle 3D Interactive Magnetic Tilt & Cursor Tracking
// 4. Perimeter Traveling Circuit Photon Beams & 4 Corner Diamond Nodes
// 5. Deep Multi-Layered Neon Ambient Bloom & Obsidian Ground Mirror Reflection
// =============================================================================

interface MagneticHeroCoreProps {
  children: React.ReactNode;
}

export default function MagneticHeroCore({ children }: MagneticHeroCoreProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D Tilt State (Smooth Spring Lerp)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 }); // percentage 0-100
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, active: false });

  // Reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Smooth tilt interpolation loop
  useEffect(() => {
    if (prefersReducedMotion) return;

    let animId: number;
    const updateTilt = () => {
      // Lerp towards target
      const lerpFactor = mouseRef.current.active ? 0.12 : 0.06;
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * lerpFactor;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * lerpFactor;

      setTilt({
        x: Number(mouseRef.current.y.toFixed(2)),
        y: Number(mouseRef.current.x.toFixed(2)),
      });

      animId = requestAnimationFrame(updateTilt);
    };

    animId = requestAnimationFrame(updateTilt);
    return () => cancelAnimationFrame(animId);
  }, [prefersReducedMotion]);

  // Mouse Move Handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Normalized coordinates (-1 to 1)
      const nx = (clientX / rect.width) * 2 - 1;
      const ny = (clientY / rect.height) * 2 - 1;

      // Max tilt: ±4.5 deg on Y (horizontal mouse), ±3.5 deg on X (vertical mouse)
      mouseRef.current.targetX = Math.max(-1, Math.min(1, nx)) * 4.5;
      mouseRef.current.targetY = -Math.max(-1, Math.min(1, ny)) * 3.5;
      mouseRef.current.active = true;

      // Cursor spotlight percentage (0 to 100)
      setCursorPos({
        x: (clientX / rect.width) * 100,
        y: (clientY / rect.height) * 100,
      });
    },
    [prefersReducedMotion]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
    mouseRef.current.active = true;
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
    mouseRef.current.active = false;
    setCursorPos({ x: 50, y: 50 });
  };

  // =========================================================================
  // TWIN RIBBON PARAMETRIC MAGNETIC PARTICLE CANVAS (60FPS)
  // Two swirling helical streams: Cyan/Blue (Ribbon A) & Magenta/Violet (Ribbon B)
  // Particles wrap around the card with 3D depth and subtle cursor magnetism.
  // =========================================================================
  useEffect(() => {
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

    // Particle Structure
    interface RibbonParticle {
      ribbon: 'cyan' | 'magenta';
      t: number;             // position along the 3D ribbon path (0 to 1)
      speed: number;         // orbit speed
      radius: number;        // size (0.8 to 2.2px)
      color: string;
      glowColor: string;
      spreadX: number;       // lateral spread from ribbon spine
      spreadY: number;       // vertical spread
      twinkleOffset: number;
    }

    const cyanPalette = ['#00E5FF', '#38BDF8', '#2563EB', '#F8FAFC'];
    const magentaPalette = ['#EC4899', '#F43F5E', '#8B5CF6', '#C084FC'];

    const particleCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 90;
    const particles: RibbonParticle[] = Array.from({ length: particleCount }, (_, i) => {
      const isCyan = i % 2 === 0;
      const palette = isCyan ? cyanPalette : magentaPalette;
      return {
        ribbon: isCyan ? 'cyan' : 'magenta',
        t: Math.random(),
        speed: 0.0025 + Math.random() * 0.0035,
        radius: 0.9 + Math.random() * 1.4,
        color: palette[i % palette.length],
        glowColor: isCyan ? 'rgba(0, 229, 255, 0.9)' : 'rgba(236, 72, 153, 0.9)',
        spreadX: (Math.random() - 0.5) * 36,
        spreadY: (Math.random() - 0.5) * 28,
        twinkleOffset: Math.random() * Math.PI * 2,
      };
    });

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      time += 0.03;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;
      const radiusX = Math.min(w * 0.54, 620);
      const radiusY = Math.min(h * 0.44, 280);

      // Mouse influence on particles
      const hasMouse = mouseRef.current.active;
      const mouseCanvasX = (cursorPos.x / 100) * w;
      const mouseCanvasY = (cursorPos.y / 100) * h;

      particles.forEach((p) => {
        p.t = (p.t + p.speed) % 1.0;
        const angle = p.t * Math.PI * 2;

        // Parametric 3D Elliptical Ribbon Formula with Tilts
        // Ribbon Cyan: tilted at ~ -25deg
        // Ribbon Magenta: tilted at ~ +25deg
        const tiltAngle = p.ribbon === 'cyan' ? -0.42 : 0.42;
        const phaseShift = p.ribbon === 'cyan' ? 0 : Math.PI;

        const baseOrbitX = Math.cos(angle + phaseShift) * radiusX;
        const baseOrbitY = Math.sin(angle + phaseShift) * radiusY * 0.42;

        // Rotate in 2D to create the 3D tilted ribbon effect
        const cosT = Math.cos(tiltAngle);
        const sinT = Math.sin(tiltAngle);

        let px = centerX + (baseOrbitX * cosT - baseOrbitY * sinT) + p.spreadX;
        let py = centerY + (baseOrbitX * sinT + baseOrbitY * cosT) + p.spreadY;

        // Subtle 3D Z-depth (Z > 0 is in front of the card, Z < 0 is behind)
        const z = Math.sin(angle + phaseShift);

        // Magnetic Cursor Attraction: if mouse is near, pull particles gently
        if (hasMouse) {
          const dx = mouseCanvasX - px;
          const dy = mouseCanvasY - py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 260 && dist > 1) {
            const pull = (1 - dist / 260) * 18;
            px += (dx / dist) * pull;
            py += (dy / dist) * pull;
          }
        }

        // Particle Alpha & Scale based on Z-depth (behind vs in front)
        const depthAlpha = z > 0 ? 0.85 + z * 0.15 : 0.28 + (z + 1) * 0.25;
        const depthScale = z > 0 ? 1.0 + z * 0.35 : 0.75;
        const twinkle = Math.sin(time * 3 + p.twinkleOffset) * 0.25 + 0.75;
        const finalAlpha = Math.max(0.08, Math.min(1.0, depthAlpha * twinkle));

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.shadowBlur = z > 0 ? 14 : 6;
        ctx.shadowColor = p.glowColor;
        ctx.globalAlpha = finalAlpha;

        ctx.beginPath();
        ctx.arc(px, py, p.radius * depthScale, 0, Math.PI * 2);
        ctx.fill();

        // White hot center for prominent front particles
        if (z > 0.4 && p.radius > 1.2) {
          ctx.beginPath();
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#ffffff';
          ctx.arc(px, py, p.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      cancelAnimationFrame(animId);
    };
  }, [cursorPos]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 select-none"
      style={{ perspective: '1200px' }}
    >
      {/* =======================================================================
          1. 3D MAGNETIC ENERGY ORBIT RINGS (DUAL INTERSECTING ELLIPSES)
          Ring A: Cyan / Electric Blue (North Magnetic Flux)
          Ring B: Magenta / Violet (South Magnetic Flux)
         ======================================================================= */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-visible">
        {/* Ring A: Electric Cyan & Neon Blue 3D Ellipse */}
        <div
          className="absolute w-[112%] sm:w-[118%] h-[120%] sm:h-[135%] transition-transform duration-700 ease-out"
          style={{
            transform: `rotateX(66deg) rotateY(-18deg) rotateZ(-24deg) scale(${isHovered ? 1.03 : 1.0})`,
            transformStyle: 'preserve-3d',
          }}
        >
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 1000 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="orbitCyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.0" />
                <stop offset="25%" stopColor="#00E5FF" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#2563EB" stopOpacity="0.85" />
                <stop offset="75%" stopColor="#00E5FF" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
              </linearGradient>
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Glowing Orbit Path */}
            <ellipse
              cx="500"
              cy="250"
              rx="480"
              ry="210"
              stroke="url(#orbitCyanGrad)"
              strokeWidth="2.8"
              filter="url(#cyanGlow)"
              className="animate-pulse"
              style={{ animationDuration: '3.5s' }}
            />

            {/* Orbiting Photon Pulse Bead */}
            {!prefersReducedMotion && (
              <ellipse
                cx="500"
                cy="250"
                rx="480"
                ry="210"
                stroke="#FFFFFF"
                strokeWidth="4.5"
                strokeDasharray="28 2800"
                strokeLinecap="round"
                filter="url(#cyanGlow)"
                className="animate-spin-slow"
                style={{
                  transformOrigin: '500px 250px',
                  animation: 'orbitCyanSpin 8s linear infinite',
                }}
              />
            )}
          </svg>
        </div>

        {/* Ring B: Cyber Magenta & Electric Violet 3D Ellipse */}
        <div
          className="absolute w-[112%] sm:w-[118%] h-[120%] sm:h-[135%] transition-transform duration-700 ease-out"
          style={{
            transform: `rotateX(66deg) rotateY(18deg) rotateZ(26deg) scale(${isHovered ? 1.03 : 1.0})`,
            transformStyle: 'preserve-3d',
          }}
        >
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 1000 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="orbitMagentaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#EC4899" stopOpacity="0.0" />
                <stop offset="25%" stopColor="#EC4899" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.85" />
                <stop offset="75%" stopColor="#EC4899" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#EC4899" stopOpacity="0.0" />
              </linearGradient>
              <filter id="magentaGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Glowing Orbit Path */}
            <ellipse
              cx="500"
              cy="250"
              rx="480"
              ry="210"
              stroke="url(#orbitMagentaGrad)"
              strokeWidth="2.8"
              filter="url(#magentaGlow)"
              className="animate-pulse"
              style={{ animationDuration: '4.2s' }}
            />

            {/* Orbiting Photon Pulse Bead */}
            {!prefersReducedMotion && (
              <ellipse
                cx="500"
                cy="250"
                rx="480"
                ry="210"
                stroke="#FFFFFF"
                strokeWidth="4.5"
                strokeDasharray="28 2800"
                strokeLinecap="round"
                filter="url(#magentaGlow)"
                style={{
                  transformOrigin: '500px 250px',
                  animation: 'orbitMagentaSpin 10s linear infinite',
                }}
              />
            )}
          </svg>
        </div>
      </div>

      {/* =======================================================================
          2. SWIRLING 3D MAGNETIC STARDUST RIBBON CANVAS (PARTICLE FLUX)
         ======================================================================= */}
      <div className="absolute -inset-16 sm:-inset-24 pointer-events-none -z-10 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* =======================================================================
          3. DYNAMIC MAGNETIC SPOTLIGHT (FOLLOWS CURSOR) & AMBIENT AURA BLOOM
         ======================================================================= */}
      <div
        className="absolute -inset-8 rounded-3xl pointer-events-none -z-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at ${cursorPos.x}% ${cursorPos.y}%, rgba(0, 229, 255, ${
            isHovered ? 0.22 : 0.12
          }), rgba(139, 92, 246, ${isHovered ? 0.16 : 0.08}), rgba(236, 72, 153, ${
            isHovered ? 0.12 : 0.05
          }), transparent 72%)`,
          opacity: isHovered ? 1.0 : 0.8,
        }}
      />

      {/* Soft Multi-Layered Peripheral Ambient Aura */}
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-violet-500/18 to-pink-500/20 rounded-3xl blur-2xl -z-10 opacity-75 dark:opacity-100 transition-all duration-500 group-hover:scale-[1.02] group-hover:opacity-100" />

      {/* =======================================================================
          4. 3D INTERACTIVE TILT CONTAINER
          Encapsulates the Video / Mockup Card with authentic magnetic frame
         ======================================================================= */}
      <div
        className="relative transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform: prefersReducedMotion
            ? 'none'
            : `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${
                isHovered ? 1.012 : 1.0
              }, ${isHovered ? 1.012 : 1.0}, 1)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* MAGNETIC NEON VIDEO FRAME (CIRCUIT PERIMETER) */}
        <div className="relative rounded-2xl sm:rounded-3xl p-[2px] bg-gradient-to-r from-[#00E5FF] via-[#8B5CF6] to-[#EC4899] shadow-2xl overflow-hidden transition-all duration-300">
          {/* Animated Travelling Perimeter Photon Spark Light */}
          {!prefersReducedMotion && (
            <div
              className="absolute -inset-[200%] pointer-events-none animate-spin-slow opacity-90"
              style={{
                background:
                  'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(0, 229, 255, 0.9) 30deg, #FFFFFF 45deg, rgba(236, 72, 153, 0.9) 60deg, transparent 90deg)',
                animationDuration: '6s',
              }}
            />
          )}

          {/* 4 Corner Diamond Energy Nodes */}
          <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-sm bg-white shadow-[0_0_10px_#00E5FF] rotate-45 z-30 pointer-events-none" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-sm bg-white shadow-[0_0_10px_#EC4899] rotate-45 z-30 pointer-events-none" />
          <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-sm bg-white shadow-[0_0_10px_#2563EB] rotate-45 z-30 pointer-events-none" />
          <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-sm bg-white shadow-[0_0_10px_#8B5CF6] rotate-45 z-30 pointer-events-none" />

          {/* Inner Content Card (Preserving existing video/mockup 100%) */}
          <div className="relative rounded-[calc(1rem-2px)] sm:rounded-[calc(1.5rem-2px)] overflow-hidden bg-slate-950/95 dark:bg-zinc-950/95 backdrop-blur-xl">
            {/* Edge Inner Glow Layer */}
            <div
              className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300"
              style={{
                boxShadow: `inset 0 0 32px rgba(0, 229, 255, ${isHovered ? 0.22 : 0.14}), inset 0 0 54px rgba(139, 92, 246, ${isHovered ? 0.16 : 0.09})`,
              }}
            />

            {children}
          </div>
        </div>
      </div>

      {/* =======================================================================
          5. OBSIDIAN GROUND MIRROR REFLECTION (UNDER VIDEO CONTAINER)
         ======================================================================= */}
      <div className="relative w-full flex justify-center pointer-events-none select-none -z-20">
        <div
          className="w-4/5 h-20 -mt-6 sm:-mt-8 rounded-[100%] blur-2xl transition-opacity duration-500"
          style={{
            background:
              'linear-gradient(180deg, rgba(0, 229, 255, 0.22) 0%, rgba(139, 92, 246, 0.16) 45%, rgba(236, 72, 153, 0.10) 70%, transparent 100%)',
            opacity: isHovered ? 1.0 : 0.75,
            transform: 'scaleY(0.65)',
          }}
        />
      </div>

      {/* Keyframe Animations for SVG Orbit Rings */}
      <style jsx global>{`
        @keyframes orbitCyanSpin {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -2828;
          }
        }
        @keyframes orbitMagentaSpin {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: 2828;
          }
        }
      `}</style>
    </div>
  );
}
