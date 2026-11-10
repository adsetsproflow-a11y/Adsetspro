'use client';

import React, { useEffect, useRef } from 'react';

// =============================================================================
// MAGNETIC HYPERDRIVE SPEED STREAKS & CONVERGENT FLUX ENGINE
// Faithful reproduction of ClickUp hero animation:
// Both Left and Right wings stream INWARD towards the central dashboard card
// with authentic magnetic acceleration, photon flare heads aimed at the card,
// perimeter impact glow sparks, anamorphic horizontal optical flares,
// and magnetic stardust converging onto the workspace core.
// =============================================================================

interface MagneticStreak {
  id: number;
  side: 'left' | 'right';
  yRatio: number;          // Target Y level along the card edge (0.1 to 0.9)
  curveOffset: number;     // Vertical displacement at outer edge for magnetic curve
  progress: number;        // 0.0 (outer screen) to 1.0 (card boundary)
  baseSpeed: number;       // Base travel speed
  lengthRatio: number;     // Length of tail relative to wing span (0.25 to 0.65)
  thickness: number;       // Beam thickness (1.8px to 4.2px)
  color: string;           // Plasma color
  glowColor: string;       // Outer shadow bloom
  coreColor: string;       // White core
  trackAlpha: number;      // Subtle persistent laser conduit line opacity
}

interface PerimeterImpact {
  side: 'left' | 'right';
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface AnamorphicFlare {
  side: 'left' | 'right';
  yRatio: number;
  xOffsetRatio: number;    // relative position along wing
  width: number;
  color: string;
  glowColor: string;
  pulsePhase: number;
  pulseSpeed: number;
}

interface MagneticDust {
  side: 'left' | 'right';
  xRatio: number;
  yRatio: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor: string;
  twinklePhase: number;
  twinkleSpeed: number;
}

export default function ClickUpSpeedStreaks() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
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

    // =========================================================================
    // COLOR PALETTES (ClickUp Authentic Magnetic Flux)
    // Left: Cool Ice-Cyan, Royal Electric Blue, High-Energy Violet
    // Right: Cyber Hot-Pink, Neon Magenta, Warm Golden-Amber
    // =========================================================================
    const leftPalettes = [
      { color: '#00f5ff', glow: 'rgba(0, 245, 255, 0.95)' }, // Cyber Ice Cyan
      { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.95)' }, // Electric Sky
      { color: '#818cf8', glow: 'rgba(129, 140, 248, 0.90)' }, // Royal Violet
      { color: '#c084fc', glow: 'rgba(192, 132, 252, 0.90)' }, // Neon Lavender
      { color: '#ffffff', glow: 'rgba(255, 255, 255, 0.95)' }, // Diamond Photon
    ];

    const rightPalettes = [
      { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.95)' }, // Cyber Hot Pink
      { color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.95)' },  // Electric Rose
      { color: '#d946ef', glow: 'rgba(217, 70, 239, 0.95)' }, // Radiant Magenta
      { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.95)' }, // Warm Golden Amber
      { color: '#fb923c', glow: 'rgba(251, 146, 60, 0.95)' }, // Solar Gold
    ];

    // =========================================================================
    // INITIALIZE MAGNETIC STREAKS (14 Left + 14 Right)
    // Both sides are drawn directly inward towards the central card perimeter
    // =========================================================================
    const streaks: MagneticStreak[] = [];

    const leftYLevels = [0.10, 0.16, 0.23, 0.31, 0.38, 0.45, 0.52, 0.59, 0.66, 0.73, 0.80, 0.86, 0.92, 0.97];
    leftYLevels.forEach((y, i) => {
      const palette = leftPalettes[i % leftPalettes.length];
      const isMajor = i === 4 || i === 6 || i === 8;
      streaks.push({
        id: i,
        side: 'left',
        yRatio: y,
        curveOffset: (Math.random() - 0.5) * 35, // subtle magnetic flux curve
        progress: Math.random(),
        baseSpeed: (isMajor ? 0.0065 : 0.0045) + Math.random() * 0.0035,
        lengthRatio: isMajor ? 0.42 + Math.random() * 0.22 : 0.25 + Math.random() * 0.20,
        thickness: isMajor ? 2.8 + Math.random() * 0.8 : 1.6 + Math.random() * 0.6,
        color: palette.color,
        glowColor: palette.glow,
        coreColor: '#ffffff',
        trackAlpha: isMajor ? 0.25 : 0.12,
      });
    });

    const rightYLevels = [0.12, 0.18, 0.25, 0.33, 0.40, 0.48, 0.55, 0.62, 0.69, 0.76, 0.82, 0.88, 0.94, 0.98];
    rightYLevels.forEach((y, i) => {
      const palette = rightPalettes[i % rightPalettes.length];
      const isMajor = i === 5 || i === 7 || i === 9;
      streaks.push({
        id: i + 30,
        side: 'right',
        yRatio: y,
        curveOffset: (Math.random() - 0.5) * 35,
        progress: Math.random(),
        baseSpeed: (isMajor ? 0.0065 : 0.0045) + Math.random() * 0.0035,
        lengthRatio: isMajor ? 0.42 + Math.random() * 0.22 : 0.25 + Math.random() * 0.20,
        thickness: isMajor ? 2.8 + Math.random() * 0.8 : 1.6 + Math.random() * 0.6,
        color: palette.color,
        glowColor: palette.glow,
        coreColor: '#ffffff',
        trackAlpha: isMajor ? 0.25 : 0.12,
      });
    });

    // =========================================================================
    // IMPACT SPARKS & ABSORPTION RIPPLES ON CARD PERIMETER
    // =========================================================================
    const impacts: PerimeterImpact[] = [];

    const addImpact = (side: 'left' | 'right', y: number, color: string) => {
      if (impacts.length > 24) impacts.shift();
      impacts.push({
        side,
        y,
        radius: 3,
        maxRadius: 16 + Math.random() * 12,
        alpha: 0.95,
        color,
      });
    };

    // =========================================================================
    // ANAMORPHIC OPTICAL FLARES
    // =========================================================================
    const flares: AnamorphicFlare[] = [
      {
        side: 'left',
        yRatio: 0.48,
        xOffsetRatio: 0.55,
        width: 460,
        color: '#00f5ff',
        glowColor: 'rgba(0, 245, 255, 0.95)',
        pulsePhase: 0,
        pulseSpeed: 1.8,
      },
      {
        side: 'left',
        yRatio: 0.72,
        xOffsetRatio: 0.35,
        width: 320,
        color: '#818cf8',
        glowColor: 'rgba(129, 140, 248, 0.85)',
        pulsePhase: 2.1,
        pulseSpeed: 2.2,
      },
      {
        side: 'right',
        yRatio: 0.58,
        xOffsetRatio: 0.45,
        width: 480,
        color: '#f59e0b',
        glowColor: 'rgba(245, 158, 11, 0.95)',
        pulsePhase: 1.2,
        pulseSpeed: 1.9,
      },
      {
        side: 'right',
        yRatio: 0.36,
        xOffsetRatio: 0.65,
        width: 340,
        color: '#ec4899',
        glowColor: 'rgba(236, 72, 153, 0.90)',
        pulsePhase: 3.4,
        pulseSpeed: 2.0,
      },
    ];

    // =========================================================================
    // MAGNETIC CONVERGENT COSMIC DUST
    // =========================================================================
    const dustColors = ['#ffffff', '#00f5ff', '#38bdf8', '#ec4899', '#f59e0b', '#c084fc'];
    const dustParticles: MagneticDust[] = Array.from({ length: 44 }, (_, i) => ({
      side: i % 2 === 0 ? 'left' : 'right',
      xRatio: Math.random(),
      yRatio: 0.05 + Math.random() * 0.9,
      vx: 0.0004 + Math.random() * 0.0008, // drifting inward toward center
      vy: (Math.random() - 0.5) * 0.0004,
      radius: 0.8 + Math.random() * 1.3,
      color: dustColors[i % dustColors.length],
      glowColor: dustColors[i % dustColors.length],
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 1.2 + Math.random() * 2.2,
    }));

    // =========================================================================
    // MAIN 60FPS FLUID RENDERING LOOP
    // =========================================================================
    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += 0.035;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Boundaries of central dashboard card
      const maxCardWidth = Math.min(width * 0.84, 1152);
      const cardLeft = (width - maxCardWidth) / 2;
      const cardRight = cardLeft + maxCardWidth;
      const leftWingSpan = Math.max(cardLeft, 50);
      const rightWingSpan = Math.max(width - cardRight, 50);

      // =====================================================================
      // 1. MAGNETIC COSMIC DUST DRIFTING TOWARDS THE CENTER CARD
      // =====================================================================
      dustParticles.forEach((p) => {
        p.xRatio += p.vx;
        p.yRatio += p.vy;

        if (p.xRatio > 1.0) {
          p.xRatio = 0.0;
          p.yRatio = 0.05 + Math.random() * 0.9;
        }
        if (p.yRatio < 0.04 || p.yRatio > 0.96) p.vy *= -1;

        let px: number;
        if (p.side === 'left') {
          px = p.xRatio * cardLeft;
        } else {
          px = width - p.xRatio * (width - cardRight);
        }
        const py = p.yRatio * height;

        const pulse = Math.sin(time * p.twinkleSpeed + p.twinklePhase) * 0.35 + 0.65;
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.glowColor;
        ctx.globalAlpha = pulse * 0.75;
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // =====================================================================
      // 2. PERSISTENT HORIZONTAL LASER CONDUIT BASELINES
      // =====================================================================
      streaks.forEach((streak) => {
        const y = streak.yRatio * height;
        const startX = streak.side === 'left' ? 0 : cardRight;
        const endX = streak.side === 'left' ? cardLeft : width;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.strokeStyle = streak.color;
        ctx.lineWidth = 1.0;
        ctx.globalAlpha = streak.trackAlpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = streak.glowColor;
        ctx.stroke();
        ctx.restore();
      });

      // =====================================================================
      // 3. ANAMORPHIC OPTICAL LENS FLARES
      // =====================================================================
      flares.forEach((flare) => {
        const y = flare.yRatio * height;
        const wingSpan = flare.side === 'left' ? cardLeft : (width - cardRight);
        const flareCenter = flare.side === 'left'
          ? wingSpan * flare.xOffsetRatio
          : cardRight + wingSpan * (1 - flare.xOffsetRatio);

        const pulse = Math.sin(time * flare.pulseSpeed + flare.pulsePhase) * 0.25 + 0.75;
        const halfW = (flare.width / 2) * pulse;

        ctx.save();

        const rayGrad = ctx.createLinearGradient(flareCenter - halfW, y, flareCenter + halfW, y);
        rayGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        rayGrad.addColorStop(0.25, flare.glowColor);
        rayGrad.addColorStop(0.5, '#ffffff');
        rayGrad.addColorStop(0.75, flare.glowColor);
        rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.moveTo(flareCenter - halfW, y);
        ctx.lineTo(flareCenter + halfW, y);
        ctx.strokeStyle = rayGrad;
        ctx.lineWidth = 3.2 * pulse;
        ctx.shadowBlur = 35;
        ctx.shadowColor = flare.glowColor;
        ctx.globalAlpha = 0.9 * pulse;
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(flareCenter, y, 32 * pulse, 3.5 * pulse, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 24;
        ctx.shadowColor = '#ffffff';
        ctx.globalAlpha = 1.0;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(flareCenter, y, 12 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = flare.color;
        ctx.shadowBlur = 28;
        ctx.shadowColor = flare.glowColor;
        ctx.globalAlpha = 0.65 * pulse;
        ctx.fill();

        ctx.restore();
      });

      // =====================================================================
      // 4. MAGNETIC ATTRACTION SPEED STREAKS (STREAMING TOWARD CARD)
      //    Magnetic Acceleration: Speed increases exponentially as streak
      //    approaches the card perimeter!
      // =====================================================================
      streaks.forEach((streak) => {
        // Magnetic pull factor: as progress goes from 0.0 -> 1.0, magnetic attraction surges!
        const magneticPull = 1.0 + Math.pow(streak.progress, 2.2) * 2.8;
        streak.progress += streak.baseSpeed * magneticPull;

        // When the streak hits the magnetic border of the card
        if (streak.progress >= 1.0) {
          // Trigger perimeter impact spark
          const impactY = streak.yRatio * height;
          addImpact(streak.side, impactY, streak.color);

          // Reset streak to the outer wing
          streak.progress = 0.0;
          streak.baseSpeed = 0.0045 + Math.random() * 0.0055;
          streak.lengthRatio = 0.28 + Math.random() * 0.32;
        }

        const wingSpan = streak.side === 'left' ? leftWingSpan : rightWingSpan;
        const streakPixelLength = wingSpan * streak.lengthRatio;
        const targetY = streak.yRatio * height;

        // Curve calculation (subtle magnetic convergence: curves at outer edge, straightens at card)
        const currentCurve = streak.curveOffset * Math.pow(1 - streak.progress, 1.8);
        const y = targetY + currentCurve;

        ctx.save();

        if (streak.side === 'left') {
          // ===================================================================
          // LEFT WING: Travel LEFT -> RIGHT towards cardLeft
          // Head is at cardLeft * progress. Tail is to the left.
          // ===================================================================
          const headX = cardLeft * streak.progress;
          const tailX = Math.max(0, headX - streakPixelLength);

          if (headX > tailX && headX > 0) {
            // Motion-blur gradient: 0% tail -> saturated plasma -> 100% blinding white head
            const grad = ctx.createLinearGradient(tailX, y, headX, y);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.35, streak.color);
            grad.addColorStop(0.85, streak.color);
            grad.addColorStop(1, '#ffffff');

            // 1. Plasma Tail
            ctx.beginPath();
            ctx.moveTo(tailX, y);
            ctx.lineTo(headX, y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = streak.thickness * 1.8;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 24;
            ctx.shadowColor = streak.glowColor;
            ctx.stroke();

            // 2. Razor-sharp white photon core
            ctx.beginPath();
            ctx.moveTo(tailX + (headX - tailX) * 0.45, y);
            ctx.lineTo(headX, y);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(1.2, streak.thickness * 0.65);
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
            ctx.stroke();

            // 3. Leading Blinding Photon Head (Facing inward towards card)
            if (headX < cardLeft) {
              ctx.beginPath();
              ctx.arc(headX, y, streak.thickness * 2.2, 0, Math.PI * 2);
              ctx.fillStyle = streak.color;
              ctx.shadowBlur = 26;
              ctx.shadowColor = streak.glowColor;
              ctx.fill();

              ctx.beginPath();
              ctx.arc(headX, y, streak.thickness * 1.1, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.shadowBlur = 16;
              ctx.shadowColor = '#ffffff';
              ctx.fill();
            }
          }
        } else {
          // ===================================================================
          // RIGHT WING: Travel RIGHT -> LEFT towards cardRight
          // Head is at width - rightWingSpan * progress (moving left towards cardRight).
          // Tail is to the right (headX + streakPixelLength).
          // ===================================================================
          const headX = width - rightWingSpan * streak.progress;
          const tailX = Math.min(width, headX + streakPixelLength);

          if (tailX > headX && headX < width) {
            // Motion-blur gradient: tail on right (transparent) -> head on left (white)
            const grad = ctx.createLinearGradient(tailX, y, headX, y);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.35, streak.color);
            grad.addColorStop(0.85, streak.color);
            grad.addColorStop(1, '#ffffff');

            // 1. Plasma Tail
            ctx.beginPath();
            ctx.moveTo(tailX, y);
            ctx.lineTo(headX, y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = streak.thickness * 1.8;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 24;
            ctx.shadowColor = streak.glowColor;
            ctx.stroke();

            // 2. Razor-sharp white photon core
            ctx.beginPath();
            ctx.moveTo(tailX - (tailX - headX) * 0.55, y);
            ctx.lineTo(headX, y);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(1.2, streak.thickness * 0.65);
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
            ctx.stroke();

            // 3. Leading Blinding Photon Head (Facing inward towards cardRight)
            if (headX > cardRight) {
              ctx.beginPath();
              ctx.arc(headX, y, streak.thickness * 2.2, 0, Math.PI * 2);
              ctx.fillStyle = streak.color;
              ctx.shadowBlur = 26;
              ctx.shadowColor = streak.glowColor;
              ctx.fill();

              ctx.beginPath();
              ctx.arc(headX, y, streak.thickness * 1.1, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.shadowBlur = 16;
              ctx.shadowColor = '#ffffff';
              ctx.fill();
            }
          }
        }

        ctx.restore();
      });

      // =====================================================================
      // 5. PERIMETER IMPACT SPARKS & ABSORPTION ENERGY FLASHES
      // =====================================================================
      for (let i = impacts.length - 1; i >= 0; i--) {
        const imp = impacts[i];
        imp.radius += 0.8;
        imp.alpha -= 0.055;

        if (imp.alpha <= 0) {
          impacts.splice(i, 1);
          continue;
        }

        const impactX = imp.side === 'left' ? cardLeft : cardRight;
        ctx.save();

        // Expanding Energy Ring
        ctx.beginPath();
        ctx.arc(impactX, imp.y, imp.radius, 0, Math.PI * 2);
        ctx.strokeStyle = imp.color;
        ctx.lineWidth = 2.0;
        ctx.globalAlpha = imp.alpha;
        ctx.shadowBlur = 18;
        ctx.shadowColor = imp.color;
        ctx.stroke();

        // Central Bright Absorption Dot
        ctx.beginPath();
        ctx.arc(impactX, imp.y, imp.radius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = imp.alpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ffffff';
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-screen h-[760px] pointer-events-none overflow-hidden select-none -z-10"
    >
      {/* Ambient Cosmic Wing Auras spanning wide */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[550px] lg:w-[850px] h-[520px] bg-gradient-to-r from-cyan-600/22 via-indigo-600/14 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[550px] lg:w-[850px] h-[520px] bg-gradient-to-l from-pink-600/22 via-purple-600/14 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[950px] h-[280px] bg-gradient-to-b from-indigo-500/14 via-cyan-500/08 to-transparent rounded-full blur-[110px] pointer-events-none" />

      {/* 60FPS Full-Screen Magnetic Speed Streak Canvas Engine */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
}
