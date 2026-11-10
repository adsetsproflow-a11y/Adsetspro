'use client';

import React, { useEffect, useRef } from 'react';

// =============================================================================
// HYPERDRIVE LASER SPEED STREAKS & OPTICAL ANAMORPHIC FLARES
// Faithful 1:1 implementation of the reference video:
// Dynamic horizontal laser speed beams with motion blur, blinding photon heads,
// anamorphic horizontal light flares, and floating cosmic stardust.
// =============================================================================

interface SpeedStreak {
  id: number;
  side: 'left' | 'right';
  yRatio: number;          // 0.1 to 0.9 vertical position
  headX: number;           // current X position of streak head
  speed: number;           // velocity in px/frame (fast motion)
  length: number;          // length of streaming light tail (120px to 450px)
  thickness: number;       // 1.5px to 4.0px
  color: string;           // primary plasma color
  glowColor: string;       // intense shadow bloom
  coreColor: string;       // blinding white core
  faintTrackAlpha: number; // opacity of subtle persistent track wake
}

interface AnamorphicFlare {
  side: 'left' | 'right';
  yRatio: number;
  xOffsetRatio: number;    // position along the wing
  width: number;           // horizontal span of the flare sheet (300px - 550px)
  color: string;
  glowColor: string;
  pulsePhase: number;
  pulseSpeed: number;
}

interface StardustParticle {
  xRatio: number;          // 0 to 1 across full canvas width
  yRatio: number;          // 0 to 1 across canvas height
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
    // 1. COLOR PALETTES MATCHING REFERENCE VIDEO
    //    Left Wing: Cool Ice-Cyan, Electric Silver-Blue, Royal Violet
    //    Right Wing: Neon Hot-Pink, Vibrant Magenta, Warm Golden-Amber
    // =========================================================================
    const leftPalettes = [
      { color: '#00f0ff', glow: 'rgba(0, 240, 255, 0.95)' }, // Ice Cyan
      { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.95)' }, // Electric Blue
      { color: '#818cf8', glow: 'rgba(129, 140, 248, 0.9)' }, // Violet Blue
      { color: '#c084fc', glow: 'rgba(192, 132, 252, 0.9)' }, // Light Purple
      { color: '#ffffff', glow: 'rgba(255, 255, 255, 0.95)' }, // Blinding Silver-White
    ];

    const rightPalettes = [
      { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.95)' }, // Hot Pink
      { color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.95)' },  // Rose Magenta
      { color: '#d946ef', glow: 'rgba(217, 70, 239, 0.95)' }, // Electric Fuchsia
      { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.95)' }, // Warm Golden Amber
      { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.95)' }, // Radiant Gold
    ];

    // =========================================================================
    // 2. DYNAMIC SPEED STREAKS (12 LEFT, 12 RIGHT)
    //    Organically distributed across vertical levels with varied speeds & lengths
    // =========================================================================
    const streaks: SpeedStreak[] = [];

    // Left Wing Speed Streaks (Streaming towards the window)
    const leftYLevels = [0.12, 0.20, 0.28, 0.36, 0.44, 0.50, 0.58, 0.65, 0.72, 0.80, 0.88, 0.94];
    leftYLevels.forEach((y, i) => {
      const palette = leftPalettes[i % leftPalettes.length];
      const isMajor = i === 4 || i === 5 || i === 7; // primary active beams
      streaks.push({
        id: i,
        side: 'left',
        yRatio: y,
        headX: Math.random() * 800,
        speed: (isMajor ? 9.5 : 6.5) + Math.random() * 6.0, // 6.5 to 15.5 px/frame
        length: isMajor ? 280 + Math.random() * 180 : 160 + Math.random() * 140,
        thickness: isMajor ? 2.8 + Math.random() * 0.8 : 1.6 + Math.random() * 0.6,
        color: palette.color,
        glowColor: palette.glow,
        coreColor: '#ffffff',
        faintTrackAlpha: isMajor ? 0.28 : 0.14,
      });
    });

    // Right Wing Speed Streaks (Streaming outward from the window)
    const rightYLevels = [0.14, 0.22, 0.30, 0.38, 0.46, 0.54, 0.62, 0.70, 0.78, 0.84, 0.90, 0.95];
    rightYLevels.forEach((y, i) => {
      const palette = rightPalettes[i % rightPalettes.length];
      const isMajor = i === 5 || i === 6 || i === 8; // golden amber & pink major beams
      streaks.push({
        id: i + 20,
        side: 'right',
        yRatio: y,
        headX: Math.random() * 800,
        speed: (isMajor ? 9.5 : 6.5) + Math.random() * 6.0,
        length: isMajor ? 280 + Math.random() * 180 : 160 + Math.random() * 140,
        thickness: isMajor ? 2.8 + Math.random() * 0.8 : 1.6 + Math.random() * 0.6,
        color: palette.color,
        glowColor: palette.glow,
        coreColor: '#ffffff',
        faintTrackAlpha: isMajor ? 0.28 : 0.14,
      });
    });

    // =========================================================================
    // 3. ANAMORPHIC HORIZONTAL OPTICAL LENS FLARES (KEY FEATURE FROM VIDEO)
    //    Left: Ice Cyan / Electric Blue Anamorphic Sheet (Middle Height)
    //    Right: Warm Golden Amber / Hot Pink Anamorphic Sheet (Lower Middle)
    // =========================================================================
    const flares: AnamorphicFlare[] = [
      {
        side: 'left',
        yRatio: 0.48, // Matches the prominent central horizontal flare on the left
        xOffsetRatio: 0.52,
        width: 440,
        color: '#00f0ff',
        glowColor: 'rgba(0, 240, 255, 0.95)',
        pulsePhase: 0,
        pulseSpeed: 1.8,
      },
      {
        side: 'left',
        yRatio: 0.72,
        xOffsetRatio: 0.38,
        width: 320,
        color: '#818cf8',
        glowColor: 'rgba(129, 140, 248, 0.85)',
        pulsePhase: 2.1,
        pulseSpeed: 2.2,
      },
      {
        side: 'right',
        yRatio: 0.62, // Matches the iconic warm amber horizontal flare in the video
        xOffsetRatio: 0.48,
        width: 460,
        color: '#f59e0b',
        glowColor: 'rgba(245, 158, 11, 0.95)',
        pulsePhase: 1.2,
        pulseSpeed: 1.9,
      },
      {
        side: 'right',
        yRatio: 0.36,
        xOffsetRatio: 0.60,
        width: 340,
        color: '#ec4899',
        glowColor: 'rgba(236, 72, 153, 0.9)',
        pulsePhase: 3.4,
        pulseSpeed: 2.0,
      },
    ];

    // =========================================================================
    // 4. FLOATING COSMIC STARDUST PARTICLES (BACKGROUND DEPTH)
    // =========================================================================
    const particleColors = ['#ffffff', '#00f0ff', '#38bdf8', '#ec4899', '#f59e0b', '#c084fc'];
    const stardust: StardustParticle[] = Array.from({ length: 48 }, (_, i) => ({
      xRatio: Math.random(),
      yRatio: 0.05 + Math.random() * 0.9,
      vx: (Math.random() - 0.5) * 0.0006,
      vy: (Math.random() - 0.5) * 0.0006,
      radius: 0.8 + Math.random() * 1.2,
      color: particleColors[i % particleColors.length],
      glowColor: particleColors[i % particleColors.length],
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 1.2 + Math.random() * 2.2,
    }));

    // =========================================================================
    // 5. MAIN 60FPS FLUID RENDERING LOOP
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

      // Determine dashboard window bounds (centered on canvas)
      const maxCardWidth = Math.min(width * 0.84, 1152);
      const cardLeft = (width - maxCardWidth) / 2;
      const cardRight = cardLeft + maxCardWidth;

      // =====================================================================
      // A. RENDER FLOATING COSMIC STARDUST (SUBTLE AMBIENCE)
      // =====================================================================
      stardust.forEach((p) => {
        p.xRatio += p.vx;
        p.yRatio += p.vy;
        if (p.xRatio < 0.01 || p.xRatio > 0.99) p.vx *= -1;
        if (p.yRatio < 0.04 || p.yRatio > 0.96) p.vy *= -1;

        const px = p.xRatio * width;
        const py = p.yRatio * height;

        // Don't render behind opaque dashboard card
        if (px > cardLeft + 15 && px < cardRight - 15) return;

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
      // B. RENDER PERSISTENT SUBTLE LASER BASELINE TRACKS (CINEMATIC DEPTH)
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
        ctx.globalAlpha = streak.faintTrackAlpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = streak.glowColor;
        ctx.stroke();
        ctx.restore();
      });

      // =====================================================================
      // C. RENDER ANAMORPHIC HORIZONTAL OPTICAL LENS FLARES (HOLLYWOOD FLARE)
      // =====================================================================
      flares.forEach((flare) => {
        const y = flare.yRatio * height;
        const wingSpan = flare.side === 'left' ? cardLeft : (width - cardRight);
        const flareCenter = flare.side === 'left'
          ? wingSpan * flare.xOffsetRatio
          : cardRight + wingSpan * flare.xOffsetRatio;

        const pulse = Math.sin(time * flare.pulseSpeed + flare.pulsePhase) * 0.25 + 0.75;
        const halfW = (flare.width / 2) * pulse;

        ctx.save();

        // 1. Extended Horizontal Anamorphic Ray (Soft Outer Gradient)
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

        // 2. Central Blinding Optical Ellipse Core
        ctx.beginPath();
        ctx.ellipse(flareCenter, y, 32 * pulse, 3.5 * pulse, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 24;
        ctx.shadowColor = '#ffffff';
        ctx.globalAlpha = 1.0;
        ctx.fill();

        // 3. Radiant Optical Halo
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
      // D. RENDER HIGH-SPEED STREAMING LASER SPEED STREAKS WITH MOTION BLUR
      // =====================================================================
      streaks.forEach((streak) => {
        const y = streak.yRatio * height;

        if (streak.side === 'left') {
          // Left Wing: Streams from far left (0) into cardLeft
          streak.headX += streak.speed;

          // When streak exits to the card edge, loop back smoothly
          if (streak.headX - streak.length > cardLeft) {
            streak.headX = -Math.random() * 120;
            streak.speed = 6.5 + Math.random() * 8.5;
            streak.length = 200 + Math.random() * 240;
          }

          const headX = Math.min(cardLeft, streak.headX);
          const tailX = Math.max(0, streak.headX - streak.length);

          if (headX > tailX && headX > 0) {
            ctx.save();

            // Dynamic Motion Blur Gradient from transparent tail to blazing white head
            const grad = ctx.createLinearGradient(tailX, y, headX, y);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.4, streak.color);
            grad.addColorStop(0.85, streak.color);
            grad.addColorStop(1, '#ffffff');

            // 1. Outer Glowing Plasma Streak
            ctx.beginPath();
            ctx.moveTo(tailX, y);
            ctx.lineTo(headX, y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = streak.thickness * 1.8;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 24;
            ctx.shadowColor = streak.glowColor;
            ctx.stroke();

            // 2. Razor-Sharp White-Hot Core
            ctx.beginPath();
            ctx.moveTo(tailX + (headX - tailX) * 0.35, y);
            ctx.lineTo(headX, y);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(1.2, streak.thickness * 0.65);
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
            ctx.stroke();

            // 3. Blinding Photon Flare Head
            if (headX < cardLeft) {
              // Outer glow circle
              ctx.beginPath();
              ctx.arc(headX, y, streak.thickness * 2.2, 0, Math.PI * 2);
              ctx.fillStyle = streak.color;
              ctx.shadowBlur = 24;
              ctx.shadowColor = streak.glowColor;
              ctx.fill();

              // Blinding white center
              ctx.beginPath();
              ctx.arc(headX, y, streak.thickness * 1.1, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.shadowBlur = 14;
              ctx.shadowColor = '#ffffff';
              ctx.fill();
            }

            ctx.restore();
          }
        } else {
          // Right Wing: Streams from cardRight outward to screen width
          streak.headX += streak.speed;

          if (streak.headX - streak.length > width) {
            streak.headX = cardRight;
            streak.speed = 6.5 + Math.random() * 8.5;
            streak.length = 200 + Math.random() * 240;
          }

          const headX = Math.min(width, streak.headX);
          const tailX = Math.max(cardRight, streak.headX - streak.length);

          if (headX > tailX && headX > cardRight) {
            ctx.save();

            const grad = ctx.createLinearGradient(tailX, y, headX, y);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.4, streak.color);
            grad.addColorStop(0.85, streak.color);
            grad.addColorStop(1, '#ffffff');

            ctx.beginPath();
            ctx.moveTo(tailX, y);
            ctx.lineTo(headX, y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = streak.thickness * 1.8;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 24;
            ctx.shadowColor = streak.glowColor;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(tailX + (headX - tailX) * 0.35, y);
            ctx.lineTo(headX, y);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(1.2, streak.thickness * 0.65);
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
            ctx.stroke();

            if (headX < width) {
              ctx.beginPath();
              ctx.arc(headX, y, streak.thickness * 2.2, 0, Math.PI * 2);
              ctx.fillStyle = streak.color;
              ctx.shadowBlur = 24;
              ctx.shadowColor = streak.glowColor;
              ctx.fill();

              ctx.beginPath();
              ctx.arc(headX, y, streak.thickness * 1.1, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.shadowBlur = 14;
              ctx.shadowColor = '#ffffff';
              ctx.fill();
            }

            ctx.restore();
          }
        }
      });

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
      className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-screen h-[720px] pointer-events-none overflow-hidden select-none -z-10"
    >
      {/* Ambient Cosmic Wing Auras spanning wide */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[550px] lg:w-[850px] h-[500px] bg-gradient-to-r from-cyan-600/22 via-indigo-600/14 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[550px] lg:w-[850px] h-[500px] bg-gradient-to-l from-pink-600/22 via-purple-600/14 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[900px] h-[260px] bg-gradient-to-b from-indigo-500/14 via-cyan-500/08 to-transparent rounded-full blur-[110px] pointer-events-none" />

      {/* 60FPS Full-Screen Laser Speed Canvas Engine */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
}
