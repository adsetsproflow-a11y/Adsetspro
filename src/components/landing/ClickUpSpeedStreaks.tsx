'use client';

import React, { useEffect, useRef } from 'react';

interface LaserBeam {
  side: 'left' | 'right';
  baseYPercent: number; // 0 - 100% of container height
  length: number;       // length in px
  color1: string;       // start neon color
  color2: string;       // mid / end neon color
  glowColor: string;    // shadow glow color
  thickness: number;    // line thickness (px)
  waveAmp: number;      // wave oscillation amplitude (px)
  waveFreq: number;     // wave frequency
  speed: number;        // wave oscillation speed
  cometSpeed: number;   // comet head travel speed
  cometProgress: number;// 0 - 1
  phase: number;
}

export default function ClickUpSpeedStreaks() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let time = 0;

    // Handle high DPI screens
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Pause when scrolled off screen for zero CPU usage
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    // ClickUp Laser Beams configuration (exact neon palette and horizontal wave flow)
    const beams: LaserBeam[] = [
      // === LEFT WING ===
      {
        side: 'left',
        baseYPercent: 16,
        length: 380,
        color1: '#f43f5e',
        color2: '#ec4899',
        glowColor: 'rgba(236, 72, 153, 0.9)',
        thickness: 2.5,
        waveAmp: 9,
        waveFreq: 0.015,
        speed: 1.8,
        cometSpeed: 0.007,
        cometProgress: 0.1,
        phase: 0.2,
      },
      {
        side: 'left',
        baseYPercent: 28,
        length: 460,
        color1: '#06b6d4',
        color2: '#38bdf8',
        glowColor: 'rgba(6, 182, 212, 0.95)',
        thickness: 3,
        waveAmp: 13,
        waveFreq: 0.012,
        speed: 1.4,
        cometSpeed: 0.0055,
        cometProgress: 0.55,
        phase: 1.1,
      },
      {
        side: 'left',
        baseYPercent: 42,
        length: 520,
        color1: '#d946ef',
        color2: '#8b5cf6',
        glowColor: 'rgba(217, 70, 239, 0.9)',
        thickness: 3.5,
        waveAmp: 11,
        waveFreq: 0.014,
        speed: 2.1,
        cometSpeed: 0.008,
        cometProgress: 0.3,
        phase: 2.4,
      },
      {
        side: 'left',
        baseYPercent: 55,
        length: 420,
        color1: '#38bdf8',
        color2: '#6366f1',
        glowColor: 'rgba(56, 189, 248, 0.85)',
        thickness: 2,
        waveAmp: 8,
        waveFreq: 0.018,
        speed: 1.6,
        cometSpeed: 0.006,
        cometProgress: 0.8,
        phase: 3.2,
      },
      {
        side: 'left',
        baseYPercent: 68,
        length: 440,
        color1: '#f59e0b',
        color2: '#fb923c',
        glowColor: 'rgba(245, 158, 11, 0.9)',
        thickness: 2.5,
        waveAmp: 10,
        waveFreq: 0.013,
        speed: 1.9,
        cometSpeed: 0.0075,
        cometProgress: 0.45,
        phase: 4.0,
      },
      {
        side: 'left',
        baseYPercent: 82,
        length: 360,
        color1: '#8b5cf6',
        color2: '#a855f7',
        glowColor: 'rgba(139, 92, 246, 0.85)',
        thickness: 2,
        waveAmp: 12,
        waveFreq: 0.016,
        speed: 1.5,
        cometSpeed: 0.005,
        cometProgress: 0.7,
        phase: 5.1,
      },

      // === RIGHT WING ===
      {
        side: 'right',
        baseYPercent: 18,
        length: 400,
        color1: '#06b6d4',
        color2: '#10b981',
        glowColor: 'rgba(16, 185, 129, 0.9)',
        thickness: 2.5,
        waveAmp: 10,
        waveFreq: 0.014,
        speed: 1.6,
        cometSpeed: 0.0065,
        cometProgress: 0.25,
        phase: 0.8,
      },
      {
        side: 'right',
        baseYPercent: 32,
        length: 490,
        color1: '#ec4899',
        color2: '#f43f5e',
        glowColor: 'rgba(236, 72, 153, 0.95)',
        thickness: 3.5,
        waveAmp: 14,
        waveFreq: 0.011,
        speed: 2.2,
        cometSpeed: 0.0085,
        cometProgress: 0.65,
        phase: 1.9,
      },
      {
        side: 'right',
        baseYPercent: 46,
        length: 530,
        color1: '#c084fc',
        color2: '#8b5cf6',
        glowColor: 'rgba(192, 132, 252, 0.9)',
        thickness: 3,
        waveAmp: 11,
        waveFreq: 0.015,
        speed: 1.7,
        cometSpeed: 0.007,
        cometProgress: 0.15,
        phase: 3.0,
      },
      {
        side: 'right',
        baseYPercent: 58,
        length: 430,
        color1: '#38bdf8',
        color2: '#0ea5e9',
        glowColor: 'rgba(56, 189, 248, 0.85)',
        thickness: 2,
        waveAmp: 9,
        waveFreq: 0.017,
        speed: 1.5,
        cometSpeed: 0.0055,
        cometProgress: 0.85,
        phase: 4.2,
      },
      {
        side: 'right',
        baseYPercent: 72,
        length: 450,
        color1: '#fb923c',
        color2: '#f59e0b',
        glowColor: 'rgba(251, 146, 60, 0.9)',
        thickness: 2.5,
        waveAmp: 12,
        waveFreq: 0.013,
        speed: 2.0,
        cometSpeed: 0.0075,
        cometProgress: 0.4,
        phase: 5.3,
      },
      {
        side: 'right',
        baseYPercent: 86,
        length: 370,
        color1: '#d946ef',
        color2: '#ec4899',
        glowColor: 'rgba(217, 70, 239, 0.85)',
        thickness: 2,
        waveAmp: 10,
        waveFreq: 0.016,
        speed: 1.4,
        cometSpeed: 0.005,
        cometProgress: 0.9,
        phase: 6.1,
      },
    ];

    // Cosmic floating star dust
    const stars = Array.from({ length: 28 }, (_, i) => ({
      side: i % 2 === 0 ? 'left' : 'right',
      xRatio: Math.random() * 0.9,
      yRatio: 0.1 + Math.random() * 0.8,
      size: 1 + Math.random() * 2,
      speed: 0.3 + Math.random() * 0.7,
      baseAlpha: 0.3 + Math.random() * 0.7,
      blinkRate: 1.5 + Math.random() * 2.5,
    }));

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      time += 0.02;

      // Accurately calculate the central preview window boundaries inside the canvas
      // The preview window is centered with max-width 1152px (max-w-6xl)
      const windowWidth = Math.min(width * 0.76, 1152);
      const leftWindowEdge = Math.max(80, (width - windowWidth) / 2);
      const rightWindowEdge = Math.min(width - 80, (width + windowWidth) / 2);

      // 1. Draw Star Dust
      stars.forEach((star) => {
        const x =
          star.side === 'left'
            ? star.xRatio * leftWindowEdge
            : rightWindowEdge + star.xRatio * (width - rightWindowEdge);
        const yOffset = Math.sin(time * star.blinkRate + star.xRatio * 10) * 6;
        const y = star.yRatio * height + yOffset;
        const alpha = Math.max(0, Math.min(1, star.baseAlpha + Math.sin(time * star.blinkRate) * 0.3));

        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 2. Draw Flowing Laser Waves & Stream Beams
      beams.forEach((beam) => {
        const baseY = (beam.baseYPercent / 100) * height;

        // Animate comet progress (waves continuously flow like warp speed)
        beam.cometProgress = (beam.cometProgress + beam.cometSpeed) % 1;

        ctx.save();

        if (beam.side === 'left') {
          // Left Side: Stream flows from behind the window (leftWindowEdge) towards outer left edge
          const startX = leftWindowEdge + 40;
          const endX = Math.max(0, startX - beam.length);

          // Build undulating sine wave path
          ctx.beginPath();
          const step = 6;
          for (let x = startX; x >= endX; x -= step) {
            const distFromWindow = startX - x;
            // Sine wave formula: combines two frequencies for natural fluid wave movement
            const waveY =
              Math.sin(distFromWindow * beam.waveFreq + time * beam.speed + beam.phase) * beam.waveAmp +
              Math.cos(distFromWindow * (beam.waveFreq * 0.6) - time * (beam.speed * 0.5)) * (beam.waveAmp * 0.4);

            const currY = baseY + waveY;
            if (x === startX) {
              ctx.moveTo(x, currY);
            } else {
              ctx.lineTo(x, currY);
            }
          }

          // Glowing laser gradient (fades to transparent at outer edge)
          const grad = ctx.createLinearGradient(startX, baseY, endX, baseY);
          grad.addColorStop(0, beam.color1);
          grad.addColorStop(0.5, beam.color2);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.strokeStyle = grad;
          ctx.lineWidth = beam.thickness;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 18;
          ctx.shadowColor = beam.glowColor;
          ctx.stroke();

          // Luminous Comet Photon traveling along the wave
          const cometDist = beam.cometProgress * beam.length;
          const cometX = startX - cometDist;
          const cometWaveY =
            Math.sin(cometDist * beam.waveFreq + time * beam.speed + beam.phase) * beam.waveAmp +
            Math.cos(cometDist * (beam.waveFreq * 0.6) - time * (beam.speed * 0.5)) * (beam.waveAmp * 0.4);
          const cometY = baseY + cometWaveY;

          // Photon head
          ctx.shadowBlur = 22;
          ctx.shadowColor = '#ffffff';
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cometX, cometY, beam.thickness * 1.3, 0, Math.PI * 2);
          ctx.fill();

          // Photon outer corona aura
          ctx.shadowBlur = 30;
          ctx.shadowColor = beam.glowColor;
          ctx.fillStyle = beam.color1;
          ctx.beginPath();
          ctx.arc(cometX, cometY, beam.thickness * 2.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Right Side: Stream flows from behind the window (rightWindowEdge) towards outer right edge
          const startX = rightWindowEdge - 40;
          const endX = Math.min(width, startX + beam.length);

          // Build undulating sine wave path
          ctx.beginPath();
          const step = 6;
          for (let x = startX; x <= endX; x += step) {
            const distFromWindow = x - startX;
            // Sine wave formula: combines two frequencies for natural fluid wave movement
            const waveY =
              Math.sin(distFromWindow * beam.waveFreq + time * beam.speed + beam.phase) * beam.waveAmp +
              Math.cos(distFromWindow * (beam.waveFreq * 0.6) - time * (beam.speed * 0.5)) * (beam.waveAmp * 0.4);

            const currY = baseY + waveY;
            if (x === startX) {
              ctx.moveTo(x, currY);
            } else {
              ctx.lineTo(x, currY);
            }
          }

          // Glowing laser gradient (fades to transparent at outer edge)
          const grad = ctx.createLinearGradient(startX, baseY, endX, baseY);
          grad.addColorStop(0, beam.color1);
          grad.addColorStop(0.5, beam.color2);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.strokeStyle = grad;
          ctx.lineWidth = beam.thickness;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 18;
          ctx.shadowColor = beam.glowColor;
          ctx.stroke();

          // Luminous Comet Photon traveling along the wave
          const cometDist = beam.cometProgress * beam.length;
          const cometX = startX + cometDist;
          const cometWaveY =
            Math.sin(cometDist * beam.waveFreq + time * beam.speed + beam.phase) * beam.waveAmp +
            Math.cos(cometDist * (beam.waveFreq * 0.6) - time * (beam.speed * 0.5)) * (beam.waveAmp * 0.4);
          const cometY = baseY + cometWaveY;

          // Photon head
          ctx.shadowBlur = 22;
          ctx.shadowColor = '#ffffff';
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cometX, cometY, beam.thickness * 1.3, 0, Math.PI * 2);
          ctx.fill();

          // Photon outer corona aura
          ctx.shadowBlur = 30;
          ctx.shadowColor = beam.glowColor;
          ctx.fillStyle = beam.color1;
          ctx.beginPath();
          ctx.arc(cometX, cometY, beam.thickness * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
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
      className="absolute inset-0 -inset-x-16 sm:-inset-x-28 md:-inset-x-48 lg:-inset-x-72 -inset-y-12 sm:-inset-y-16 pointer-events-none overflow-visible select-none -z-10"
    >
      {/* =====================================================================
          1. WIDE COSMIC NEON AURA GLOWS (SMOOTH BREATHING AMBIENCE)
         ===================================================================== */}
      {/* Left Cosmic Wing Aura */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[420px] sm:w-[600px] h-[340px] sm:h-[480px] bg-gradient-to-r from-pink-600/30 via-purple-600/20 to-transparent rounded-full blur-[80px] sm:blur-[110px] animate-cosmic-aura" />

      {/* Right Cosmic Wing Aura */}
      <div
        className="absolute top-1/2 -translate-y-1/2 right-0 w-[420px] sm:w-[600px] h-[340px] sm:h-[480px] bg-gradient-to-l from-cyan-600/30 via-indigo-600/20 to-transparent rounded-full blur-[80px] sm:blur-[110px] animate-cosmic-aura"
        style={{ animationDelay: '2.5s' }}
      />

      {/* Top Radiant Laser Crown */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[500px] sm:w-[800px] h-[160px] bg-gradient-to-b from-fuchsia-500/25 via-indigo-500/15 to-transparent rounded-full blur-[60px]" />

      {/* =====================================================================
          2. 60FPS FLUID CANVAS SINE WAVES & LASER STREAMS
         ===================================================================== */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
}
