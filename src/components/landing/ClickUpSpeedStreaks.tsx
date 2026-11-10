'use client';

import React, { useEffect, useRef } from 'react';

// =============================================================================
// HIGH-VELOCITY LASER SPEED STREAKS & OPTICAL LENS FLARE ENGINE
// Faithful to the reference video: Straight horizontal laser conduits,
// high-speed photon comets, horizontal anamorphic lens flares, and quantum sparks.
// =============================================================================

interface LaserTrack {
  id: number;
  side: 'left' | 'right';
  yPercent: number;          // vertical position percentage
  trackColor: string;
  glowColor: string;
  speedMultiplier: number;
  hasFlare: boolean;         // whether this track hosts an anamorphic lens flare
  flareOffset: number;       // horizontal offset ratio for lens flare
  flareColor: string;
}

interface PhotonComet {
  id: number;
  trackId: number;
  side: 'left' | 'right';
  x: number;                 // current X position
  speed: number;             // px per frame
  tailLength: number;        // length of streaming light tail
  headRadius: number;
  color1: string;            // head / primary glow
  color2: string;            // mid-body
  glowColor: string;
}

interface QuantumSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface AmbientStar {
  xRatio: number;
  yRatio: number;
  radius: number;
  color: string;
  glowColor: string;
  phase: number;
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
    // 1. STRAIGHT HORIZONTAL LASER TRACK DEFINITIONS
    //    Left wing: Cool Ice-Cyan, Electric Blue & Silver
    //    Right wing: Neon Hot-Pink, Electric Violet & Warm Golden Amber
    // =========================================================================
    const tracks: LaserTrack[] = [
      // Left Flank Tracks
      {
        id: 1,
        side: 'left',
        yPercent: 18,
        trackColor: 'rgba(56, 189, 248, 0.22)',
        glowColor: 'rgba(56, 189, 248, 0.8)',
        speedMultiplier: 1.1,
        hasFlare: false,
        flareOffset: 0.5,
        flareColor: '#38bdf8',
      },
      {
        id: 2,
        side: 'left',
        yPercent: 34,
        trackColor: 'rgba(99, 102, 241, 0.25)',
        glowColor: 'rgba(99, 102, 241, 0.85)',
        speedMultiplier: 0.95,
        hasFlare: false,
        flareOffset: 0.65,
        flareColor: '#818cf8',
      },
      {
        id: 3,
        side: 'left',
        yPercent: 50, // Central major anamorphic flare line
        trackColor: 'rgba(0, 240, 255, 0.35)',
        glowColor: 'rgba(0, 240, 255, 0.95)',
        speedMultiplier: 1.25,
        hasFlare: true,
        flareOffset: 0.45,
        flareColor: '#00f0ff',
      },
      {
        id: 4,
        side: 'left',
        yPercent: 66,
        trackColor: 'rgba(56, 189, 248, 0.25)',
        glowColor: 'rgba(56, 189, 248, 0.8)',
        speedMultiplier: 1.05,
        hasFlare: false,
        flareOffset: 0.3,
        flareColor: '#38bdf8',
      },
      {
        id: 5,
        side: 'left',
        yPercent: 82,
        trackColor: 'rgba(129, 140, 248, 0.22)',
        glowColor: 'rgba(129, 140, 248, 0.8)',
        speedMultiplier: 0.9,
        hasFlare: false,
        flareOffset: 0.7,
        flareColor: '#818cf8',
      },

      // Right Flank Tracks
      {
        id: 6,
        side: 'right',
        yPercent: 18,
        trackColor: 'rgba(236, 72, 153, 0.25)',
        glowColor: 'rgba(236, 72, 153, 0.85)',
        speedMultiplier: 1.05,
        hasFlare: false,
        flareOffset: 0.6,
        flareColor: '#ec4899',
      },
      {
        id: 7,
        side: 'right',
        yPercent: 34,
        trackColor: 'rgba(168, 85, 247, 0.25)',
        glowColor: 'rgba(168, 85, 247, 0.85)',
        speedMultiplier: 0.9,
        hasFlare: false,
        flareOffset: 0.35,
        flareColor: '#c084fc',
      },
      {
        id: 8,
        side: 'right',
        yPercent: 50,
        trackColor: 'rgba(236, 72, 153, 0.35)',
        glowColor: 'rgba(236, 72, 153, 0.95)',
        speedMultiplier: 1.2,
        hasFlare: false,
        flareOffset: 0.5,
        flareColor: '#ec4899',
      },
      {
        id: 9,
        side: 'right',
        yPercent: 66, // Warm golden-amber flare line as in reference video
        trackColor: 'rgba(245, 158, 11, 0.35)',
        glowColor: 'rgba(245, 158, 11, 0.95)',
        speedMultiplier: 1.15,
        hasFlare: true,
        flareOffset: 0.55,
        flareColor: '#f59e0b',
      },
      {
        id: 10,
        side: 'right',
        yPercent: 82,
        trackColor: 'rgba(244, 63, 94, 0.25)',
        glowColor: 'rgba(244, 63, 94, 0.8)',
        speedMultiplier: 0.95,
        hasFlare: false,
        flareOffset: 0.4,
        flareColor: '#f43f5e',
      },
    ];

    // =========================================================================
    // 2. HIGH-SPEED PHOTON COMETS STREAMING ALONG THE TRACKS
    // =========================================================================
    const comets: PhotonComet[] = [];

    // Left comets (2 comets per track with staggered initial X positions)
    tracks
      .filter((t) => t.side === 'left')
      .forEach((t) => {
        // Comet 1
        comets.push({
          id: t.id * 10 + 1,
          trackId: t.id,
          side: 'left',
          x: Math.random() * 600,
          speed: (6.0 + Math.random() * 4.5) * t.speedMultiplier,
          tailLength: 200 + Math.random() * 180,
          headRadius: 3.5,
          color1: '#00f0ff',
          color2: '#38bdf8',
          glowColor: 'rgba(0, 240, 255, 0.95)',
        });
        // Comet 2 (Staggered offset)
        comets.push({
          id: t.id * 10 + 2,
          trackId: t.id,
          side: 'left',
          x: -150 - Math.random() * 300,
          speed: (7.5 + Math.random() * 4.0) * t.speedMultiplier,
          tailLength: 240 + Math.random() * 200,
          headRadius: 4.0,
          color1: '#ffffff',
          color2: '#6366f1',
          glowColor: 'rgba(99, 102, 241, 0.95)',
        });
      });

    // Right comets (2 comets per track streaming outward)
    tracks
      .filter((t) => t.side === 'right')
      .forEach((t) => {
        const isAmberTrack = t.id === 9;
        comets.push({
          id: t.id * 10 + 1,
          trackId: t.id,
          side: 'right',
          x: Math.random() * 600,
          speed: (6.0 + Math.random() * 4.5) * t.speedMultiplier,
          tailLength: 200 + Math.random() * 180,
          headRadius: 3.5,
          color1: isAmberTrack ? '#fbbf24' : '#ec4899',
          color2: isAmberTrack ? '#f59e0b' : '#d946ef',
          glowColor: isAmberTrack ? 'rgba(245, 158, 11, 0.95)' : 'rgba(236, 72, 153, 0.95)',
        });
        comets.push({
          id: t.id * 10 + 2,
          trackId: t.id,
          side: 'right',
          x: -150 - Math.random() * 300,
          speed: (7.5 + Math.random() * 4.0) * t.speedMultiplier,
          tailLength: 240 + Math.random() * 200,
          headRadius: 4.0,
          color1: '#ffffff',
          color2: isAmberTrack ? '#f59e0b' : '#c084fc',
          glowColor: isAmberTrack ? 'rgba(245, 158, 11, 0.95)' : 'rgba(192, 132, 252, 0.95)',
        });
      });

    // Quantum sparks shedding from photon comets
    const sparks: QuantumSpark[] = [];

    // Ambient twinkling stars
    const starColors = ['#ffffff', '#38bdf8', '#c084fc', '#ec4899', '#f59e0b'];
    const ambientStars: AmbientStar[] = Array.from({ length: 42 }, (_, i) => ({
      xRatio: Math.random(),
      yRatio: 0.05 + Math.random() * 0.9,
      radius: 0.9 + Math.random() * 1.3,
      color: starColors[i % starColors.length],
      glowColor: starColors[i % starColors.length],
      phase: Math.random() * Math.PI * 2,
      speed: 1.5 + Math.random() * 2.5,
    }));

    // =========================================================================
    // 3. MAIN 60FPS FLUID RENDERING LOOP
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
      // A. SUBTLE STARRY SKY PARTICLES (BACKGROUND DEPTH)
      // =====================================================================
      ambientStars.forEach((star) => {
        const px = star.xRatio * width;
        const py = star.yRatio * height;

        // Don't render behind opaque dashboard
        if (px > cardLeft + 20 && px < cardRight - 20) return;

        const pulse = Math.sin(time * star.speed + star.phase) * 0.35 + 0.65;
        ctx.save();
        ctx.fillStyle = star.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = star.glowColor;
        ctx.globalAlpha = pulse * 0.75;
        ctx.beginPath();
        ctx.arc(px, py, star.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // =====================================================================
      // B. STRAIGHT HORIZONTAL LASER TRACKS & OPTICAL LENS FLARES
      // =====================================================================
      tracks.forEach((track) => {
        const y = (track.yPercent / 100) * height;

        let startX = 0;
        let endX = cardLeft;

        if (track.side === 'right') {
          startX = cardRight;
          endX = width;
        }

        // 1. Draw crisp baseline laser conduit
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.strokeStyle = track.trackColor;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = track.glowColor;
        ctx.stroke();

        // 2. Anamorphic Horizontal Optical Lens Flare (Central Feature from Video)
        if (track.hasFlare) {
          const flareX = startX + (endX - startX) * track.flareOffset;
          const flarePulse = Math.sin(time * 3 + track.id) * 0.2 + 0.8;

          // Extended Horizontal Light Bar (Anamorphic Streak)
          const beamGrad = ctx.createLinearGradient(
            flareX - 160,
            y,
            flareX + 160,
            y
          );
          beamGrad.addColorStop(0, 'rgba(0,0,0,0)');
          beamGrad.addColorStop(0.3, track.flareColor);
          beamGrad.addColorStop(0.5, '#ffffff');
          beamGrad.addColorStop(0.7, track.flareColor);
          beamGrad.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.beginPath();
          ctx.moveTo(flareX - 180, y);
          ctx.lineTo(flareX + 180, y);
          ctx.strokeStyle = beamGrad;
          ctx.lineWidth = 2.8 * flarePulse;
          ctx.shadowBlur = 32;
          ctx.shadowColor = track.glowColor;
          ctx.stroke();

          // Intense Blinding Optical Center Ellipse
          ctx.beginPath();
          ctx.ellipse(flareX, y, 28 * flarePulse, 3.2 * flarePulse, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 28;
          ctx.shadowColor = '#ffffff';
          ctx.fill();

          // Outer Plasma Halo
          ctx.beginPath();
          ctx.arc(flareX, y, 10 * flarePulse, 0, Math.PI * 2);
          ctx.fillStyle = track.flareColor;
          ctx.shadowBlur = 24;
          ctx.shadowColor = track.glowColor;
          ctx.globalAlpha = 0.65;
          ctx.fill();
        }

        ctx.restore();
      });

      // =====================================================================
      // C. HIGH-SPEED PHOTON COMETS STREAMING ALONG THE TRACKS
      // =====================================================================
      comets.forEach((comet) => {
        const track = tracks.find((t) => t.id === comet.trackId);
        if (!track) return;

        const y = (track.yPercent / 100) * height;

        if (comet.side === 'left') {
          // Left wing: comets rush from screen edge (0) towards cardLeft
          comet.x += comet.speed;

          // When head reaches card left edge, loop back to left screen edge
          if (comet.x - comet.tailLength > cardLeft) {
            comet.x = -Math.random() * 150;
            comet.speed = (6.0 + Math.random() * 5.5) * track.speedMultiplier;
            comet.tailLength = 200 + Math.random() * 200;
          }

          const headX = Math.min(cardLeft, comet.x);
          const tailX = Math.max(0, comet.x - comet.tailLength);

          if (headX > tailX && headX > 0) {
            // Draw streaming plasma tail (Linear Gradient from transparent to white head)
            ctx.save();
            const grad = ctx.createLinearGradient(tailX, y, headX, y);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.35, comet.color2);
            grad.addColorStop(0.85, comet.color1);
            grad.addColorStop(1, '#ffffff');

            ctx.beginPath();
            ctx.moveTo(tailX, y);
            ctx.lineTo(headX, y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 22;
            ctx.shadowColor = comet.glowColor;
            ctx.stroke();

            // White-hot photon head
            if (headX < cardLeft) {
              // Outer plasma corona
              ctx.beginPath();
              ctx.arc(headX, y, comet.headRadius * 1.8, 0, Math.PI * 2);
              ctx.fillStyle = comet.color1;
              ctx.shadowBlur = 24;
              ctx.shadowColor = comet.glowColor;
              ctx.fill();

              // Blinding white center
              ctx.beginPath();
              ctx.arc(headX, y, comet.headRadius, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.shadowBlur = 14;
              ctx.shadowColor = '#ffffff';
              ctx.fill();

              // Shed occasional quantum sparks
              if (Math.random() < 0.35 && sparks.length < 50) {
                sparks.push({
                  x: headX,
                  y,
                  vx: -comet.speed * 0.3 + (Math.random() - 0.5) * 1.5,
                  vy: (Math.random() - 0.5) * 2,
                  life: 1,
                  maxLife: 16,
                  color: comet.color1,
                  size: 1.4,
                });
              }
            }
            ctx.restore();
          }
        } else {
          // Right wing: comets rush from cardRight outward to screen edge (width)
          comet.x += comet.speed;

          if (comet.x - comet.tailLength > width) {
            comet.x = cardRight;
            comet.speed = (6.0 + Math.random() * 5.5) * track.speedMultiplier;
            comet.tailLength = 200 + Math.random() * 200;
          }

          const headX = Math.min(width, comet.x);
          const tailX = Math.max(cardRight, comet.x - comet.tailLength);

          if (headX > tailX && headX > cardRight) {
            ctx.save();
            const grad = ctx.createLinearGradient(tailX, y, headX, y);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.35, comet.color2);
            grad.addColorStop(0.85, comet.color1);
            grad.addColorStop(1, '#ffffff');

            ctx.beginPath();
            ctx.moveTo(tailX, y);
            ctx.lineTo(headX, y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';
            ctx.shadowBlur = 22;
            ctx.shadowColor = comet.glowColor;
            ctx.stroke();

            if (headX < width) {
              ctx.beginPath();
              ctx.arc(headX, y, comet.headRadius * 1.8, 0, Math.PI * 2);
              ctx.fillStyle = comet.color1;
              ctx.shadowBlur = 24;
              ctx.shadowColor = comet.glowColor;
              ctx.fill();

              ctx.beginPath();
              ctx.arc(headX, y, comet.headRadius, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.shadowBlur = 14;
              ctx.shadowColor = '#ffffff';
              ctx.fill();

              if (Math.random() < 0.35 && sparks.length < 50) {
                sparks.push({
                  x: headX,
                  y,
                  vx: -comet.speed * 0.3 + (Math.random() - 0.5) * 1.5,
                  vy: (Math.random() - 0.5) * 2,
                  life: 1,
                  maxLife: 16,
                  color: comet.color1,
                  size: 1.4,
                });
              }
            }
            ctx.restore();
          }
        }
      });

      // =====================================================================
      // D. DYNAMIC QUANTUM SPARKS
      // =====================================================================
      for (let s = sparks.length - 1; s >= 0; s--) {
        const p = sparks[s];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life++;

        if (p.life >= p.maxLife) {
          sparks.splice(s, 1);
          continue;
        }

        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = alpha;
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
      className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-screen h-[720px] pointer-events-none overflow-hidden select-none -z-10"
    >
      {/* Ambient Cosmic Wing Auras spanning wide */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[550px] lg:w-[850px] h-[500px] bg-gradient-to-r from-cyan-600/20 via-indigo-600/12 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[550px] lg:w-[850px] h-[500px] bg-gradient-to-l from-pink-600/20 via-purple-600/12 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[900px] h-[260px] bg-gradient-to-b from-indigo-500/12 via-cyan-500/08 to-transparent rounded-full blur-[110px] pointer-events-none" />

      {/* 60FPS Full-Screen Laser Speed Canvas Engine */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
}
