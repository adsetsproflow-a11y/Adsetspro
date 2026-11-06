'use client';

import React, { useEffect, useRef } from 'react';

interface LaserBeam {
  side: 'left' | 'right';
  yPercent: number;      // 0 to 100% of height
  baseLength: number;    // px
  color1: string;        // start color
  color2: string;        // mid color
  glowColor: string;     // shadow glow
  thickness: number;     // line thickness
  waveAmp: number;       // gentle sine wave oscillation
  waveFreq: number;
  speed: number;
  cometProgress: number; // 0 to 1
  cometSpeed: number;
  phase: number;
}

interface ConstellationNode {
  side: 'left' | 'right';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor: string;
}

interface ConstellationPulse {
  fromNode: number;
  toNode: number;
  progress: number;
  speed: number;
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

    // 1. Sleek Laser Speed Beams (ClickUp Exact Neon Palette)
    const beams: LaserBeam[] = [
      // === LEFT WING ===
      {
        side: 'left',
        yPercent: 15,
        baseLength: 420,
        color1: '#f43f5e',
        color2: '#ec4899',
        glowColor: 'rgba(236, 72, 153, 0.9)',
        thickness: 2.5,
        waveAmp: 7,
        waveFreq: 0.012,
        speed: 1.6,
        cometProgress: 0.15,
        cometSpeed: 0.007,
        phase: 0.2,
      },
      {
        side: 'left',
        yPercent: 28,
        baseLength: 510,
        color1: '#06b6d4',
        color2: '#38bdf8',
        glowColor: 'rgba(6, 182, 212, 0.95)',
        thickness: 3.2,
        waveAmp: 10,
        waveFreq: 0.010,
        speed: 1.3,
        cometProgress: 0.6,
        cometSpeed: 0.0055,
        phase: 1.1,
      },
      {
        side: 'left',
        yPercent: 42,
        baseLength: 560,
        color1: '#d946ef',
        color2: '#8b5cf6',
        glowColor: 'rgba(217, 70, 239, 0.95)',
        thickness: 3.5,
        waveAmp: 9,
        waveFreq: 0.013,
        speed: 2.0,
        cometProgress: 0.3,
        cometSpeed: 0.008,
        phase: 2.3,
      },
      {
        side: 'left',
        yPercent: 55,
        baseLength: 450,
        color1: '#38bdf8',
        color2: '#6366f1',
        glowColor: 'rgba(56, 189, 248, 0.85)',
        thickness: 2.2,
        waveAmp: 6,
        waveFreq: 0.015,
        speed: 1.5,
        cometProgress: 0.85,
        cometSpeed: 0.006,
        phase: 3.2,
      },
      {
        side: 'left',
        yPercent: 68,
        baseLength: 480,
        color1: '#f59e0b',
        color2: '#fb923c',
        glowColor: 'rgba(245, 158, 11, 0.9)',
        thickness: 2.8,
        waveAmp: 8,
        waveFreq: 0.011,
        speed: 1.8,
        cometProgress: 0.45,
        cometSpeed: 0.0075,
        phase: 4.1,
      },
      {
        side: 'left',
        yPercent: 82,
        baseLength: 390,
        color1: '#8b5cf6',
        color2: '#a855f7',
        glowColor: 'rgba(139, 92, 246, 0.85)',
        thickness: 2.2,
        waveAmp: 9,
        waveFreq: 0.014,
        speed: 1.4,
        cometProgress: 0.7,
        cometSpeed: 0.005,
        phase: 5.2,
      },

      // === RIGHT WING ===
      {
        side: 'right',
        yPercent: 17,
        baseLength: 430,
        color1: '#06b6d4',
        color2: '#10b981',
        glowColor: 'rgba(16, 185, 129, 0.9)',
        thickness: 2.5,
        waveAmp: 8,
        waveFreq: 0.013,
        speed: 1.5,
        cometProgress: 0.25,
        cometSpeed: 0.0065,
        phase: 0.8,
      },
      {
        side: 'right',
        yPercent: 31,
        baseLength: 530,
        color1: '#ec4899',
        color2: '#f43f5e',
        glowColor: 'rgba(236, 72, 153, 0.95)',
        thickness: 3.5,
        waveAmp: 11,
        waveFreq: 0.009,
        speed: 2.1,
        cometProgress: 0.65,
        cometSpeed: 0.0085,
        phase: 1.9,
      },
      {
        side: 'right',
        yPercent: 45,
        baseLength: 570,
        color1: '#c084fc',
        color2: '#8b5cf6',
        glowColor: 'rgba(192, 132, 252, 0.9)',
        thickness: 3.0,
        waveAmp: 9,
        waveFreq: 0.014,
        speed: 1.7,
        cometProgress: 0.15,
        cometSpeed: 0.007,
        phase: 3.0,
      },
      {
        side: 'right',
        yPercent: 58,
        baseLength: 440,
        color1: '#38bdf8',
        color2: '#0ea5e9',
        glowColor: 'rgba(56, 189, 248, 0.85)',
        thickness: 2.2,
        waveAmp: 7,
        waveFreq: 0.015,
        speed: 1.4,
        cometProgress: 0.85,
        cometSpeed: 0.0055,
        phase: 4.2,
      },
      {
        side: 'right',
        yPercent: 71,
        baseLength: 490,
        color1: '#fb923c',
        color2: '#f59e0b',
        glowColor: 'rgba(251, 146, 60, 0.9)',
        thickness: 2.8,
        waveAmp: 9,
        waveFreq: 0.011,
        speed: 1.9,
        cometProgress: 0.4,
        cometSpeed: 0.0075,
        phase: 5.3,
      },
      {
        side: 'right',
        yPercent: 85,
        baseLength: 400,
        color1: '#d946ef',
        color2: '#ec4899',
        glowColor: 'rgba(217, 70, 239, 0.85)',
        thickness: 2.2,
        waveAmp: 8,
        waveFreq: 0.013,
        speed: 1.4,
        cometProgress: 0.9,
        cometSpeed: 0.005,
        phase: 6.1,
      },
    ];

    // 2. Fine Wire-Like Starry Constellation Sky Network (The exact requested feature)
    const starColors = [
      { fill: '#38bdf8', glow: 'rgba(56, 189, 248, 0.6)' },
      { fill: '#c084fc', glow: 'rgba(192, 132, 252, 0.6)' },
      { fill: '#ec4899', glow: 'rgba(236, 72, 153, 0.6)' },
      { fill: '#ffffff', glow: 'rgba(255, 255, 255, 0.8)' },
      { fill: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' },
    ];

    // Left Wing Constellation Nodes (22 stars)
    const leftNodes: ConstellationNode[] = Array.from({ length: 22 }, (_, i) => {
      const scheme = starColors[i % starColors.length];
      return {
        side: 'left',
        x: Math.random(),
        y: 0.1 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 0.0012,
        vy: (Math.random() - 0.5) * 0.0012,
        radius: 1.2 + Math.random() * 1.6,
        color: scheme.fill,
        glowColor: scheme.glow,
      };
    });

    // Right Wing Constellation Nodes (22 stars)
    const rightNodes: ConstellationNode[] = Array.from({ length: 22 }, (_, i) => {
      const scheme = starColors[(i + 2) % starColors.length];
      return {
        side: 'right',
        x: Math.random(),
        y: 0.1 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 0.0012,
        vy: (Math.random() - 0.5) * 0.0012,
        radius: 1.2 + Math.random() * 1.6,
        color: scheme.fill,
        glowColor: scheme.glow,
      };
    });

    const leftPulses: ConstellationPulse[] = [];
    const rightPulses: ConstellationPulse[] = [];

    // Periodic pulse spawner
    const pulseTimer = setInterval(() => {
      if (!isVisible) return;
      if (leftNodes.length > 1 && leftPulses.length < 5) {
        const i1 = Math.floor(Math.random() * leftNodes.length);
        const i2 = (i1 + 1 + Math.floor(Math.random() * 3)) % leftNodes.length;
        leftPulses.push({ fromNode: i1, toNode: i2, progress: 0, speed: 0.015 });
      }
      if (rightNodes.length > 1 && rightPulses.length < 5) {
        const i1 = Math.floor(Math.random() * rightNodes.length);
        const i2 = (i1 + 1 + Math.floor(Math.random() * 3)) % rightNodes.length;
        rightPulses.push({ fromNode: i1, toNode: i2, progress: 0, speed: 0.015 });
      }
    }, 600);

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

      // Calculate the preview window boundaries inside the canvas
      const windowWidth = Math.min(width * 0.74, 1140);
      const leftWindowEdge = Math.max(60, (width - windowWidth) / 2);
      const rightWindowEdge = Math.min(width - 60, (width + windowWidth) / 2);

      // =====================================================================
      // 1. DRAW FINE WIRE-LIKE STARRY CONSTELLATION SKY (LEFT & RIGHT)
      // =====================================================================
      const maxConnectDist = 140;

      // Draw Left Wing Constellation Mesh
      for (let i = 0; i < leftNodes.length; i++) {
        const n = leftNodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0.02 || n.x > 0.98) n.vx *= -1;
        if (n.y < 0.08 || n.y > 0.92) n.vy *= -1;

        const posX = n.x * leftWindowEdge;
        const posY = n.y * height;

        // Wire connections to nearby stars
        for (let j = i + 1; j < leftNodes.length; j++) {
          const n2 = leftNodes[j];
          const pos2X = n2.x * leftWindowEdge;
          const pos2Y = n2.y * height;
          const dx = pos2X - posX;
          const dy = pos2Y - posY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const alpha = (1 - dist / maxConnectDist) * 0.35;
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(posX, posY);
            ctx.lineTo(pos2X, pos2Y);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Draw star node
        ctx.save();
        ctx.fillStyle = n.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = n.glowColor;
        ctx.beginPath();
        ctx.arc(posX, posY, n.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Left Wing Traveling Wire Pulses
      for (let p = leftPulses.length - 1; p >= 0; p--) {
        const pulse = leftPulses[p];
        pulse.progress += pulse.speed;
        if (pulse.progress >= 1) {
          leftPulses.splice(p, 1);
          continue;
        }
        const n1 = leftNodes[pulse.fromNode];
        const n2 = leftNodes[pulse.toNode];
        if (!n1 || !n2) continue;

        const p1X = n1.x * leftWindowEdge;
        const p1Y = n1.y * height;
        const p2X = n2.x * leftWindowEdge;
        const p2Y = n2.y * height;
        const curX = p1X + (p2X - p1X) * pulse.progress;
        const curY = p1Y + (p2Y - p1Y) * pulse.progress;

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#38bdf8';
        ctx.beginPath();
        ctx.arc(curX, curY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Right Wing Constellation Mesh
      const rightAvailable = width - rightWindowEdge;
      for (let i = 0; i < rightNodes.length; i++) {
        const n = rightNodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0.02 || n.x > 0.98) n.vx *= -1;
        if (n.y < 0.08 || n.y > 0.92) n.vy *= -1;

        const posX = rightWindowEdge + n.x * rightAvailable;
        const posY = n.y * height;

        // Wire connections
        for (let j = i + 1; j < rightNodes.length; j++) {
          const n2 = rightNodes[j];
          const pos2X = rightWindowEdge + n2.x * rightAvailable;
          const pos2Y = n2.y * height;
          const dx = pos2X - posX;
          const dy = pos2Y - posY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDist) {
            const alpha = (1 - dist / maxConnectDist) * 0.35;
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(posX, posY);
            ctx.lineTo(pos2X, pos2Y);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Star node
        ctx.save();
        ctx.fillStyle = n.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = n.glowColor;
        ctx.beginPath();
        ctx.arc(posX, posY, n.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Right Wing Traveling Wire Pulses
      for (let p = rightPulses.length - 1; p >= 0; p--) {
        const pulse = rightPulses[p];
        pulse.progress += pulse.speed;
        if (pulse.progress >= 1) {
          rightPulses.splice(p, 1);
          continue;
        }
        const n1 = rightNodes[pulse.fromNode];
        const n2 = rightNodes[pulse.toNode];
        if (!n1 || !n2) continue;

        const p1X = rightWindowEdge + n1.x * rightAvailable;
        const p1Y = n1.y * height;
        const p2X = rightWindowEdge + n2.x * rightAvailable;
        const p2Y = n2.y * height;
        const curX = p1X + (p2X - p1X) * pulse.progress;
        const curY = p1Y + (p2Y - p1Y) * pulse.progress;

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ec4899';
        ctx.beginPath();
        ctx.arc(curX, curY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // =====================================================================
      // 2. DRAW SLEEK HORIZONTAL SPEED LASER BEAMS & PHOTON HEADS
      // =====================================================================
      beams.forEach((beam) => {
        const baseY = (beam.yPercent / 100) * height;

        // Progress photon travel
        beam.cometProgress = (beam.cometProgress + beam.cometSpeed) % 1;

        ctx.save();

        if (beam.side === 'left') {
          const startX = leftWindowEdge + 30; // Roots emerge behind the window
          const endX = Math.max(0, startX - beam.baseLength);

          // Build subtle wave laser path
          ctx.beginPath();
          const step = 6;
          for (let x = startX; x >= endX; x -= step) {
            const dist = startX - x;
            const waveY = Math.sin(dist * beam.waveFreq + time * beam.speed + beam.phase) * beam.waveAmp;
            const y = baseY + waveY;
            if (x === startX) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          // Laser Gradient
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

          // Photon Comet Head
          const cometDist = beam.cometProgress * beam.baseLength;
          const cometX = startX - cometDist;
          const cometWaveY = Math.sin(cometDist * beam.waveFreq + time * beam.speed + beam.phase) * beam.waveAmp;
          const cometY = baseY + cometWaveY;

          // Photon Core
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 22;
          ctx.shadowColor = '#ffffff';
          ctx.beginPath();
          ctx.arc(cometX, cometY, beam.thickness * 1.3, 0, Math.PI * 2);
          ctx.fill();

          // Photon Corona Glow
          ctx.fillStyle = beam.color1;
          ctx.shadowBlur = 26;
          ctx.shadowColor = beam.glowColor;
          ctx.beginPath();
          ctx.arc(cometX, cometY, beam.thickness * 2.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Right Side
          const startX = rightWindowEdge - 30;
          const endX = Math.min(width, startX + beam.baseLength);

          // Build subtle wave laser path
          ctx.beginPath();
          const step = 6;
          for (let x = startX; x <= endX; x += step) {
            const dist = x - startX;
            const waveY = Math.sin(dist * beam.waveFreq + time * beam.speed + beam.phase) * beam.waveAmp;
            const y = baseY + waveY;
            if (x === startX) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          // Laser Gradient
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

          // Photon Comet Head
          const cometDist = beam.cometProgress * beam.baseLength;
          const cometX = startX + cometDist;
          const cometWaveY = Math.sin(cometDist * beam.waveFreq + time * beam.speed + beam.phase) * beam.waveAmp;
          const cometY = baseY + cometWaveY;

          // Photon Core
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 22;
          ctx.shadowColor = '#ffffff';
          ctx.beginPath();
          ctx.arc(cometX, cometY, beam.thickness * 1.3, 0, Math.PI * 2);
          ctx.fill();

          // Photon Corona Glow
          ctx.fillStyle = beam.color1;
          ctx.shadowBlur = 26;
          ctx.shadowColor = beam.glowColor;
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
      clearInterval(pulseTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -inset-x-16 sm:-inset-x-28 md:-inset-x-48 lg:-inset-x-72 -inset-y-12 sm:-inset-y-16 pointer-events-none overflow-visible select-none -z-10"
    >
      {/* Ambient Cosmic Wing Auras */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[420px] sm:w-[600px] h-[340px] sm:h-[480px] bg-gradient-to-r from-pink-600/30 via-purple-600/20 to-transparent rounded-full blur-[80px] sm:blur-[110px] animate-cosmic-aura" />

      <div
        className="absolute top-1/2 -translate-y-1/2 right-0 w-[420px] sm:w-[600px] h-[340px] sm:h-[480px] bg-gradient-to-l from-cyan-600/30 via-indigo-600/20 to-transparent rounded-full blur-[80px] sm:blur-[110px] animate-cosmic-aura"
        style={{ animationDelay: '2.5s' }}
      />

      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[500px] sm:w-[800px] h-[160px] bg-gradient-to-b from-fuchsia-500/25 via-indigo-500/15 to-transparent rounded-full blur-[60px]" />

      {/* 60FPS Fluid Canvas: Fine Wire-like Starry Sky + Laser Speed Beams */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
}
