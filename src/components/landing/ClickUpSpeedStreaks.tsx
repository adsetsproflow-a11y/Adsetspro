'use client';

import React, { useEffect, useRef } from 'react';

interface LaserBeam {
  side: 'left' | 'right';
  yPercent: number;      // 0 to 100% of height (strictly horizontal straight line)
  baseLength: number;    // px
  color1: string;        // start / lead color
  color2: string;        // trail color
  glowColor: string;     // shadow glow
  thickness: number;     // line thickness
  speed: number;         // dash stream speed
  cometProgress: number; // 0 to 1
  cometSpeed: number;    // speed of traveling photon packet
  streakLength: number;  // length of traveling laser streak
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

    // 1. Sleek Straight Horizontal Laser Speed Beams (ClickUp Exact Neon Palette)
    const beams: LaserBeam[] = [
      // === LEFT WING (Straight Horizontal Moving Laser Streaks) ===
      {
        side: 'left',
        yPercent: 14,
        baseLength: 460,
        color1: '#f43f5e',
        color2: '#ec4899',
        glowColor: 'rgba(236, 72, 153, 0.95)',
        thickness: 2.8,
        speed: 1.8,
        cometProgress: 0.15,
        cometSpeed: 0.0075,
        streakLength: 190,
      },
      {
        side: 'left',
        yPercent: 27,
        baseLength: 540,
        color1: '#06b6d4',
        color2: '#38bdf8',
        glowColor: 'rgba(6, 182, 212, 0.95)',
        thickness: 3.5,
        speed: 2.2,
        cometProgress: 0.62,
        cometSpeed: 0.009,
        streakLength: 240,
      },
      {
        side: 'left',
        yPercent: 41,
        baseLength: 580,
        color1: '#d946ef',
        color2: '#8b5cf6',
        glowColor: 'rgba(217, 70, 239, 0.95)',
        thickness: 3.8,
        speed: 2.6,
        cometProgress: 0.35,
        cometSpeed: 0.0105,
        streakLength: 260,
      },
      {
        side: 'left',
        yPercent: 55,
        baseLength: 490,
        color1: '#38bdf8',
        color2: '#6366f1',
        glowColor: 'rgba(56, 189, 248, 0.9)',
        thickness: 2.5,
        speed: 1.6,
        cometProgress: 0.82,
        cometSpeed: 0.007,
        streakLength: 210,
      },
      {
        side: 'left',
        yPercent: 69,
        baseLength: 520,
        color1: '#f59e0b',
        color2: '#fb923c',
        glowColor: 'rgba(245, 158, 11, 0.95)',
        thickness: 3.0,
        speed: 2.0,
        cometProgress: 0.48,
        cometSpeed: 0.0085,
        streakLength: 220,
      },
      {
        side: 'left',
        yPercent: 83,
        baseLength: 440,
        color1: '#8b5cf6',
        color2: '#a855f7',
        glowColor: 'rgba(139, 92, 246, 0.9)',
        thickness: 2.4,
        speed: 1.5,
        cometProgress: 0.74,
        cometSpeed: 0.0065,
        streakLength: 180,
      },

      // === RIGHT WING (Straight Horizontal Moving Laser Streaks) ===
      {
        side: 'right',
        yPercent: 16,
        baseLength: 470,
        color1: '#06b6d4',
        color2: '#10b981',
        glowColor: 'rgba(16, 185, 129, 0.95)',
        thickness: 2.8,
        speed: 1.9,
        cometProgress: 0.28,
        cometSpeed: 0.008,
        streakLength: 200,
      },
      {
        side: 'right',
        yPercent: 30,
        baseLength: 550,
        color1: '#ec4899',
        color2: '#f43f5e',
        glowColor: 'rgba(236, 72, 153, 0.95)',
        thickness: 3.8,
        speed: 2.5,
        cometProgress: 0.68,
        cometSpeed: 0.010,
        streakLength: 250,
      },
      {
        side: 'right',
        yPercent: 44,
        baseLength: 590,
        color1: '#c084fc',
        color2: '#8b5cf6',
        glowColor: 'rgba(192, 132, 252, 0.95)',
        thickness: 3.2,
        speed: 2.1,
        cometProgress: 0.18,
        cometSpeed: 0.009,
        streakLength: 240,
      },
      {
        side: 'right',
        yPercent: 57,
        baseLength: 480,
        color1: '#38bdf8',
        color2: '#0ea5e9',
        glowColor: 'rgba(56, 189, 248, 0.9)',
        thickness: 2.4,
        speed: 1.6,
        cometProgress: 0.88,
        cometSpeed: 0.007,
        streakLength: 200,
      },
      {
        side: 'right',
        yPercent: 71,
        baseLength: 530,
        color1: '#fb923c',
        color2: '#f59e0b',
        glowColor: 'rgba(251, 146, 60, 0.95)',
        thickness: 3.0,
        speed: 2.3,
        cometProgress: 0.42,
        cometSpeed: 0.0095,
        streakLength: 230,
      },
      {
        side: 'right',
        yPercent: 85,
        baseLength: 450,
        color1: '#d946ef',
        color2: '#ec4899',
        glowColor: 'rgba(217, 70, 239, 0.9)',
        thickness: 2.4,
        speed: 1.5,
        cometProgress: 0.92,
        cometSpeed: 0.0065,
        streakLength: 180,
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
      // 2. DRAW CRISP STRAIGHT HORIZONTAL MOVING LASER SPEED STREAKS
      //    (Strictly Straight Horizontal Trajectories - Zero Curves / Waves)
      // =====================================================================
      beams.forEach((beam) => {
        const baseY = (beam.yPercent / 100) * height;

        // Progress photon travel smoothly across horizontal line
        beam.cometProgress = (beam.cometProgress + beam.cometSpeed) % 1;

        ctx.save();

        if (beam.side === 'left') {
          const startX = leftWindowEdge + 25; // Roots emerge behind the dashboard window
          const endX = Math.max(0, startX - beam.baseLength);

          // A. Static Subtle Straight Rail / Channel Track
          const railGrad = ctx.createLinearGradient(startX, baseY, endX, baseY);
          railGrad.addColorStop(0, beam.color1);
          railGrad.addColorStop(0.4, beam.color2);
          railGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.moveTo(startX, baseY);
          ctx.lineTo(endX, baseY);
          ctx.strokeStyle = railGrad;
          ctx.lineWidth = Math.max(1, beam.thickness * 0.45);
          ctx.lineCap = 'round';
          ctx.globalAlpha = 0.35;
          ctx.shadowBlur = 8;
          ctx.shadowColor = beam.glowColor;
          ctx.stroke();

          // B. High-Speed Straight Animated Dash Stream (Moving Horizontally Left)
          ctx.beginPath();
          ctx.moveTo(startX, baseY);
          ctx.lineTo(endX, baseY);
          ctx.strokeStyle = railGrad;
          ctx.lineWidth = beam.thickness * 0.75;
          ctx.globalAlpha = 0.5;
          ctx.setLineDash([22, 16]);
          ctx.lineDashOffset = time * beam.speed * 45;
          ctx.shadowBlur = 14;
          ctx.shadowColor = beam.glowColor;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1.0;

          // C. Primary Blazing Straight Laser Streak Packet
          const travelSpan = beam.baseLength + beam.streakLength;
          const distMoved = beam.cometProgress * travelSpan;
          const headX = startX - distMoved + beam.streakLength;
          const tailX = Math.min(startX, headX + beam.streakLength);

          if (headX < startX + 50 && tailX > endX - 50) {
            const clampHeadX = Math.max(endX, Math.min(startX, headX));
            const clampTailX = Math.max(endX, Math.min(startX, tailX));

            if (clampTailX > clampHeadX) {
              const streakGrad = ctx.createLinearGradient(clampTailX, baseY, clampHeadX, baseY);
              streakGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
              streakGrad.addColorStop(0.3, beam.color2);
              streakGrad.addColorStop(0.85, beam.color1);
              streakGrad.addColorStop(1, '#ffffff');

              ctx.beginPath();
              ctx.moveTo(clampTailX, baseY);
              ctx.lineTo(clampHeadX, baseY);
              ctx.strokeStyle = streakGrad;
              ctx.lineWidth = beam.thickness;
              ctx.lineCap = 'round';
              ctx.shadowBlur = 26;
              ctx.shadowColor = beam.glowColor;
              ctx.stroke();

              // High-Intensity Traveling Photon Comet Head
              if (clampHeadX > endX && clampHeadX < startX) {
                // Outer Corona Glow
                ctx.fillStyle = beam.color1;
                ctx.shadowBlur = 30;
                ctx.shadowColor = beam.glowColor;
                ctx.beginPath();
                ctx.arc(clampHeadX, baseY, beam.thickness * 2.4, 0, Math.PI * 2);
                ctx.fill();

                // Ultra-Bright White Photon Core
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ffffff';
                ctx.beginPath();
                ctx.arc(clampHeadX, baseY, beam.thickness * 1.3, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // D. Secondary Staggered Straight Streak Packet (Offset 0.5 for continuous flow)
          const p2 = (beam.cometProgress + 0.52) % 1;
          const dist2 = p2 * travelSpan;
          const head2X = startX - dist2 + beam.streakLength;
          const tail2X = Math.min(startX, head2X + beam.streakLength * 0.7);

          if (head2X < startX && tail2X > endX) {
            const streak2Grad = ctx.createLinearGradient(tail2X, baseY, head2X, baseY);
            streak2Grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            streak2Grad.addColorStop(0.5, beam.color2);
            streak2Grad.addColorStop(1, beam.color1);

            ctx.beginPath();
            ctx.moveTo(tail2X, baseY);
            ctx.lineTo(head2X, baseY);
            ctx.strokeStyle = streak2Grad;
            ctx.lineWidth = beam.thickness * 0.75;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 18;
            ctx.shadowColor = beam.glowColor;
            ctx.stroke();
          }

        } else {
          // === RIGHT SIDE (Strictly Straight Horizontal Trajectories) ===
          const startX = rightWindowEdge - 25; // Roots emerge behind the dashboard window
          const endX = Math.min(width, startX + beam.baseLength);

          // A. Static Subtle Straight Rail / Channel Track
          const railGrad = ctx.createLinearGradient(startX, baseY, endX, baseY);
          railGrad.addColorStop(0, beam.color1);
          railGrad.addColorStop(0.4, beam.color2);
          railGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.moveTo(startX, baseY);
          ctx.lineTo(endX, baseY);
          ctx.strokeStyle = railGrad;
          ctx.lineWidth = Math.max(1, beam.thickness * 0.45);
          ctx.lineCap = 'round';
          ctx.globalAlpha = 0.35;
          ctx.shadowBlur = 8;
          ctx.shadowColor = beam.glowColor;
          ctx.stroke();

          // B. High-Speed Straight Animated Dash Stream (Moving Horizontally Right)
          ctx.beginPath();
          ctx.moveTo(startX, baseY);
          ctx.lineTo(endX, baseY);
          ctx.strokeStyle = railGrad;
          ctx.lineWidth = beam.thickness * 0.75;
          ctx.globalAlpha = 0.5;
          ctx.setLineDash([22, 16]);
          ctx.lineDashOffset = -time * beam.speed * 45;
          ctx.shadowBlur = 14;
          ctx.shadowColor = beam.glowColor;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1.0;

          // C. Primary Blazing Straight Laser Streak Packet
          const travelSpan = beam.baseLength + beam.streakLength;
          const distMoved = beam.cometProgress * travelSpan;
          const headX = startX + distMoved - beam.streakLength;
          const tailX = Math.max(startX, headX - beam.streakLength);

          if (headX > startX - 50 && tailX < endX + 50) {
            const clampHeadX = Math.min(endX, Math.max(startX, headX));
            const clampTailX = Math.min(endX, Math.max(startX, tailX));

            if (clampHeadX > clampTailX) {
              const streakGrad = ctx.createLinearGradient(clampTailX, baseY, clampHeadX, baseY);
              streakGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
              streakGrad.addColorStop(0.3, beam.color2);
              streakGrad.addColorStop(0.85, beam.color1);
              streakGrad.addColorStop(1, '#ffffff');

              ctx.beginPath();
              ctx.moveTo(clampTailX, baseY);
              ctx.lineTo(clampHeadX, baseY);
              ctx.strokeStyle = streakGrad;
              ctx.lineWidth = beam.thickness;
              ctx.lineCap = 'round';
              ctx.shadowBlur = 26;
              ctx.shadowColor = beam.glowColor;
              ctx.stroke();

              // High-Intensity Traveling Photon Comet Head
              if (clampHeadX > startX && clampHeadX < endX) {
                // Outer Corona Glow
                ctx.fillStyle = beam.color1;
                ctx.shadowBlur = 30;
                ctx.shadowColor = beam.glowColor;
                ctx.beginPath();
                ctx.arc(clampHeadX, baseY, beam.thickness * 2.4, 0, Math.PI * 2);
                ctx.fill();

                // Ultra-Bright White Photon Core
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ffffff';
                ctx.beginPath();
                ctx.arc(clampHeadX, baseY, beam.thickness * 1.3, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // D. Secondary Staggered Straight Streak Packet (Offset 0.5 for continuous flow)
          const p2 = (beam.cometProgress + 0.52) % 1;
          const dist2 = p2 * travelSpan;
          const head2X = startX + dist2 - beam.streakLength;
          const tail2X = Math.max(startX, head2X - beam.streakLength * 0.7);

          if (head2X > startX && tail2X < endX) {
            const streak2Grad = ctx.createLinearGradient(tail2X, baseY, head2X, baseY);
            streak2Grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            streak2Grad.addColorStop(0.5, beam.color2);
            streak2Grad.addColorStop(1, beam.color1);

            ctx.beginPath();
            ctx.moveTo(tail2X, baseY);
            ctx.lineTo(head2X, baseY);
            ctx.strokeStyle = streak2Grad;
            ctx.lineWidth = beam.thickness * 0.75;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 18;
            ctx.shadowColor = beam.glowColor;
            ctx.stroke();
          }
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
