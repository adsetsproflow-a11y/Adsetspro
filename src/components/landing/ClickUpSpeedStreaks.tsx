'use client';

import React, { useEffect, useRef } from 'react';

interface PowerBeam {
  side: 'left' | 'right';
  yPercent: number;      // 0 to 100% of container height
  baseLength: number;    // px
  coreColor: string;     // inner high-energy color
  outerColor: string;    // outer aura color
  glowColor: string;     // shadow glow
  thickness: number;     // line thickness
  speed: number;         // pulse speed
  phase: number;
  packets: {
    progress: number;    // 0 to 1
    speed: number;
    length: number;      // length of the energy packet capsule
  }[];
}

interface WarpParticle {
  side: 'left' | 'right';
  xRatio: number;        // 0 to 1 outward
  yPercent: number;      // 0 to 100%
  speed: number;
  length: number;
  color: string;
  alpha: number;
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

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
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

    // Blazing Energy Beams (True ClickUp Power Source Architecture)
    const beams: PowerBeam[] = [
      // === LEFT POWER SOURCE ===
      {
        side: 'left',
        yPercent: 15,
        baseLength: 420,
        coreColor: '#ffffff',
        outerColor: '#ec4899',
        glowColor: 'rgba(236, 72, 153, 0.95)',
        thickness: 3.5,
        speed: 2.2,
        phase: 0.1,
        packets: [
          { progress: 0.1, speed: 0.012, length: 55 },
          { progress: 0.6, speed: 0.015, length: 40 },
        ],
      },
      {
        side: 'left',
        yPercent: 27,
        baseLength: 520,
        coreColor: '#ffffff',
        outerColor: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.95)',
        thickness: 4.5,
        speed: 1.8,
        phase: 1.2,
        packets: [
          { progress: 0.3, speed: 0.011, length: 65 },
          { progress: 0.8, speed: 0.014, length: 45 },
        ],
      },
      {
        side: 'left',
        yPercent: 41,
        baseLength: 580,
        coreColor: '#ffffff',
        outerColor: '#d946ef',
        glowColor: 'rgba(217, 70, 239, 1)',
        thickness: 5,
        speed: 2.5,
        phase: 2.4,
        packets: [
          { progress: 0.05, speed: 0.016, length: 75 },
          { progress: 0.55, speed: 0.013, length: 50 },
        ],
      },
      {
        side: 'left',
        yPercent: 54,
        baseLength: 460,
        coreColor: '#ffffff',
        outerColor: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.9)',
        thickness: 3,
        speed: 1.9,
        phase: 3.3,
        packets: [{ progress: 0.4, speed: 0.012, length: 45 }],
      },
      {
        side: 'left',
        yPercent: 67,
        baseLength: 490,
        coreColor: '#ffffff',
        outerColor: '#f59e0b',
        glowColor: 'rgba(245, 158, 11, 0.95)',
        thickness: 4,
        speed: 2.1,
        phase: 4.1,
        packets: [
          { progress: 0.2, speed: 0.014, length: 60 },
          { progress: 0.7, speed: 0.012, length: 40 },
        ],
      },
      {
        side: 'left',
        yPercent: 81,
        baseLength: 400,
        coreColor: '#ffffff',
        outerColor: '#8b5cf6',
        glowColor: 'rgba(139, 92, 246, 0.9)',
        thickness: 3,
        speed: 1.7,
        phase: 5.2,
        packets: [{ progress: 0.5, speed: 0.011, length: 50 }],
      },

      // === RIGHT POWER SOURCE ===
      {
        side: 'right',
        yPercent: 17,
        baseLength: 430,
        coreColor: '#ffffff',
        outerColor: '#10b981',
        glowColor: 'rgba(16, 185, 129, 0.95)',
        thickness: 3.5,
        speed: 1.9,
        phase: 0.7,
        packets: [
          { progress: 0.15, speed: 0.013, length: 50 },
          { progress: 0.65, speed: 0.015, length: 40 },
        ],
      },
      {
        side: 'right',
        yPercent: 30,
        baseLength: 540,
        coreColor: '#ffffff',
        outerColor: '#ec4899',
        glowColor: 'rgba(236, 72, 153, 1)',
        thickness: 5,
        speed: 2.4,
        phase: 1.8,
        packets: [
          { progress: 0.25, speed: 0.017, length: 70 },
          { progress: 0.75, speed: 0.013, length: 45 },
        ],
      },
      {
        side: 'right',
        yPercent: 44,
        baseLength: 590,
        coreColor: '#ffffff',
        outerColor: '#a855f7',
        glowColor: 'rgba(168, 85, 247, 1)',
        thickness: 4.5,
        speed: 2.0,
        phase: 2.9,
        packets: [
          { progress: 0.1, speed: 0.014, length: 65 },
          { progress: 0.6, speed: 0.016, length: 50 },
        ],
      },
      {
        side: 'right',
        yPercent: 57,
        baseLength: 450,
        coreColor: '#ffffff',
        outerColor: '#0ea5e9',
        glowColor: 'rgba(14, 165, 233, 0.9)',
        thickness: 3,
        speed: 1.7,
        phase: 4.0,
        packets: [{ progress: 0.45, speed: 0.012, length: 45 }],
      },
      {
        side: 'right',
        yPercent: 70,
        baseLength: 500,
        coreColor: '#ffffff',
        outerColor: '#f97316',
        glowColor: 'rgba(249, 115, 22, 0.95)',
        thickness: 4,
        speed: 2.2,
        phase: 4.9,
        packets: [
          { progress: 0.3, speed: 0.015, length: 55 },
          { progress: 0.8, speed: 0.013, length: 40 },
        ],
      },
      {
        side: 'right',
        yPercent: 84,
        baseLength: 410,
        coreColor: '#ffffff',
        outerColor: '#d946ef',
        glowColor: 'rgba(217, 70, 239, 0.9)',
        thickness: 3,
        speed: 1.6,
        phase: 5.8,
        packets: [{ progress: 0.55, speed: 0.011, length: 50 }],
      },
    ];

    // Warp-Speed Ionized Particle Streaks
    const warpParticles: WarpParticle[] = Array.from({ length: 32 }, (_, i) => ({
      side: i % 2 === 0 ? 'left' : 'right',
      xRatio: Math.random(),
      yPercent: 12 + Math.random() * 76,
      speed: 0.008 + Math.random() * 0.016,
      length: 20 + Math.random() * 35,
      color: ['#ffffff', '#38bdf8', '#ec4899', '#f59e0b', '#c084fc'][Math.floor(Math.random() * 5)],
      alpha: 0.4 + Math.random() * 0.6,
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

      time += 0.025;

      // Calculate the central preview window boundaries inside the canvas
      // The preview window sits centered at max-w-6xl
      const windowWidth = Math.min(width * 0.74, 1140);
      const leftWindowEdge = Math.max(60, (width - windowWidth) / 2);
      const rightWindowEdge = Math.min(width - 60, (width + windowWidth) / 2);

      // 1. Draw Warp-Speed Ionized Particles
      warpParticles.forEach((p) => {
        p.xRatio = (p.xRatio + p.speed) % 1;
        const y = (p.yPercent / 100) * height;

        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.6;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = p.alpha;

        if (p.side === 'left') {
          // Stream outward to the left (from leftWindowEdge towards 0)
          const startX = leftWindowEdge - p.xRatio * leftWindowEdge;
          const endX = Math.max(0, startX - p.length);
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();
        } else {
          // Stream outward to the right (from rightWindowEdge towards width)
          const availableWidth = width - rightWindowEdge;
          const startX = rightWindowEdge + p.xRatio * availableWidth;
          const endX = Math.min(width, startX + p.length);
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();
        }

        ctx.restore();
      });

      // 2. Draw Heavy Power Beams & Warp Laser Streams
      beams.forEach((beam) => {
        const y = (beam.yPercent / 100) * height;

        // Dynamic breathing energy pulse in length & intensity
        const pulseRatio = 0.88 + 0.12 * Math.sin(time * beam.speed + beam.phase);
        const currentLength = beam.baseLength * pulseRatio;

        ctx.save();

        if (beam.side === 'left') {
          const startX = leftWindowEdge + 25; // Root starts slightly behind the window
          const endX = Math.max(0, startX - currentLength);

          // Outer Volumetric Energy Halo (Wide Bloom)
          const outerGrad = ctx.createLinearGradient(startX, y, endX, y);
          outerGrad.addColorStop(0, beam.outerColor);
          outerGrad.addColorStop(0.5, beam.outerColor);
          outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.strokeStyle = outerGrad;
          ctx.lineWidth = beam.thickness * 2.8;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 32;
          ctx.shadowColor = beam.glowColor;
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();

          // Inner Intense White-Hot Core Beam
          const coreGrad = ctx.createLinearGradient(startX, y, endX, y);
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.3, beam.outerColor);
          coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.strokeStyle = coreGrad;
          ctx.lineWidth = beam.thickness;
          ctx.shadowBlur = 16;
          ctx.shadowColor = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();

          // Window Contact Flare / Energy Eruption Node
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 24;
          ctx.shadowColor = beam.glowColor;
          ctx.beginPath();
          ctx.arc(startX - 2, y, beam.thickness * 1.4, 0, Math.PI * 2);
          ctx.fill();

          // High-Speed Energy Packets traveling along the beam
          beam.packets.forEach((pkt) => {
            pkt.progress = (pkt.progress + pkt.speed) % 1;
            const pktDist = pkt.progress * currentLength;
            const pktHeadX = startX - pktDist;
            const pktTailX = Math.min(startX, pktHeadX + pkt.length);

            const pktGrad = ctx.createLinearGradient(pktTailX, y, pktHeadX, y);
            pktGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            pktGrad.addColorStop(1, '#ffffff');

            ctx.strokeStyle = pktGrad;
            ctx.lineWidth = beam.thickness * 1.5;
            ctx.shadowBlur = 28;
            ctx.shadowColor = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(pktTailX, y);
            ctx.lineTo(pktHeadX, y);
            ctx.stroke();

            // Blazing Packet Head Flare
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 30;
            ctx.shadowColor = beam.outerColor;
            ctx.beginPath();
            ctx.arc(pktHeadX, y, beam.thickness * 1.6, 0, Math.PI * 2);
            ctx.fill();
          });
        } else {
          // Right Side
          const startX = rightWindowEdge - 25; // Root starts slightly behind the window
          const endX = Math.min(width, startX + currentLength);

          // Outer Volumetric Energy Halo (Wide Bloom)
          const outerGrad = ctx.createLinearGradient(startX, y, endX, y);
          outerGrad.addColorStop(0, beam.outerColor);
          outerGrad.addColorStop(0.5, beam.outerColor);
          outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.strokeStyle = outerGrad;
          ctx.lineWidth = beam.thickness * 2.8;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 32;
          ctx.shadowColor = beam.glowColor;
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();

          // Inner Intense White-Hot Core Beam
          const coreGrad = ctx.createLinearGradient(startX, y, endX, y);
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.3, beam.outerColor);
          coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.strokeStyle = coreGrad;
          ctx.lineWidth = beam.thickness;
          ctx.shadowBlur = 16;
          ctx.shadowColor = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();

          // Window Contact Flare / Energy Eruption Node
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 24;
          ctx.shadowColor = beam.glowColor;
          ctx.beginPath();
          ctx.arc(startX + 2, y, beam.thickness * 1.4, 0, Math.PI * 2);
          ctx.fill();

          // High-Speed Energy Packets traveling along the beam
          beam.packets.forEach((pkt) => {
            pkt.progress = (pkt.progress + pkt.speed) % 1;
            const pktDist = pkt.progress * currentLength;
            const pktHeadX = startX + pktDist;
            const pktTailX = Math.max(startX, pktHeadX - pkt.length);

            const pktGrad = ctx.createLinearGradient(pktTailX, y, pktHeadX, y);
            pktGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            pktGrad.addColorStop(1, '#ffffff');

            ctx.strokeStyle = pktGrad;
            ctx.lineWidth = beam.thickness * 1.5;
            ctx.shadowBlur = 28;
            ctx.shadowColor = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(pktTailX, y);
            ctx.lineTo(pktHeadX, y);
            ctx.stroke();

            // Blazing Packet Head Flare
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 30;
            ctx.shadowColor = beam.outerColor;
            ctx.beginPath();
            ctx.arc(pktHeadX, y, beam.thickness * 1.6, 0, Math.PI * 2);
            ctx.fill();
          });
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
          1. WIDE COSMIC NEON AURA GLOWS (POWER REACTOR BREATHING)
         ===================================================================== */}
      {/* Left Cosmic Wing Aura */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[450px] sm:w-[650px] h-[360px] sm:h-[520px] bg-gradient-to-r from-pink-600/35 via-purple-600/25 to-transparent rounded-full blur-[85px] sm:blur-[120px] animate-cosmic-aura" />

      {/* Right Cosmic Wing Aura */}
      <div
        className="absolute top-1/2 -translate-y-1/2 right-0 w-[450px] sm:w-[650px] h-[360px] sm:h-[520px] bg-gradient-to-l from-cyan-600/35 via-indigo-600/25 to-transparent rounded-full blur-[85px] sm:blur-[120px] animate-cosmic-aura"
        style={{ animationDelay: '2.5s' }}
      />

      {/* Center Top Power Crown */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[520px] sm:w-[840px] h-[180px] bg-gradient-to-b from-fuchsia-500/30 via-indigo-500/20 to-transparent rounded-full blur-[65px]" />

      {/* =====================================================================
          2. 60FPS BLISSFUL HIGH-ENERGY ACCELERATOR BEAMS & WARP PARTICLES
         ===================================================================== */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
}
