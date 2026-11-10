'use client';

import React, { useEffect, useRef } from 'react';

// =============================================================================
// HIGH-SPEED ELECTRIC THUNDER & PLASMA STREAK ENGINE
// Fusing high-speed streaming velocity with organic high-voltage thunder crackle
// =============================================================================

interface ThunderSpeedBeam {
  id: number;
  side: 'left' | 'right';
  yPercent: number;        // 0 to 100 vertical position
  yOffset: number;         // vertical jitter
  headX: number;           // current X position of streak head
  speed: number;           // pixels per frame (high velocity)
  length: number;          // length of streaming plasma tail
  thickness: number;
  color: string;           // neon plasma color
  glowColor: string;
  coreColor: string;
  jitterAmp: number;       // electric thunder amplitude
  jitterFreq: number;      // crackle frequency
  forkTimer: number;       // spontaneous fork counter
}

interface AmbientLightningBolt {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
  color: string;
  glowColor: string;
}

interface ElectricParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
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

    // Color schemes for ultra-premium electric thunder streaks
    const beamPalettes = [
      { color: '#00f0ff', glow: 'rgba(0, 240, 255, 0.95)', core: '#ffffff' }, // Electric Cyan
      { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.95)', core: '#ffffff' }, // Neon Sky Blue
      { color: '#c084fc', glow: 'rgba(192, 132, 252, 0.95)', core: '#ffffff' }, // Electric Violet
      { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.95)', core: '#ffffff' }, // Hot Plasma Pink
      { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.95)', core: '#ffffff' }, // Vivid Purple
      { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.95)', core: '#ffffff' }, // Amber Plasma
      { color: '#10b981', glow: 'rgba(16, 185, 129, 0.95)', core: '#ffffff' }, // Emerald Lightning
    ];

    // =========================================================================
    // 1. INITIALIZE HIGH-SPEED ELECTRIC THUNDER BEAMS
    // =========================================================================
    const leftBeams: ThunderSpeedBeam[] = [];
    const rightBeams: ThunderSpeedBeam[] = [];

    // Left Wing Beams: 8 dynamic high-speed thunder streams
    const leftHeights = [14, 25, 38, 50, 62, 74, 85, 94];
    leftHeights.forEach((yPct, idx) => {
      const palette = beamPalettes[idx % beamPalettes.length];
      leftBeams.push({
        id: idx,
        side: 'left',
        yPercent: yPct,
        yOffset: (Math.random() - 0.5) * 15,
        headX: Math.random() * 800,
        speed: 6.5 + Math.random() * 7.5, // 6.5 to 14 px/frame - HIGH SPEED
        length: 220 + Math.random() * 260, // 220px to 480px streaming tail
        thickness: 2.2 + (idx % 3) * 0.5,
        color: palette.color,
        glowColor: palette.glow,
        coreColor: palette.core,
        jitterAmp: 6.0 + Math.random() * 4.5,
        jitterFreq: 0.04 + Math.random() * 0.03,
        forkTimer: Math.random() * 30,
      });
    });

    // Right Wing Beams: 8 dynamic high-speed thunder streams
    const rightHeights = [12, 22, 35, 48, 60, 72, 84, 92];
    rightHeights.forEach((yPct, idx) => {
      const palette = beamPalettes[(idx + 2) % beamPalettes.length];
      rightBeams.push({
        id: idx + 20,
        side: 'right',
        yPercent: yPct,
        yOffset: (Math.random() - 0.5) * 15,
        headX: Math.random() * 800,
        speed: 6.5 + Math.random() * 7.5,
        length: 220 + Math.random() * 260,
        thickness: 2.2 + (idx % 3) * 0.5,
        color: palette.color,
        glowColor: palette.glow,
        coreColor: palette.core,
        jitterAmp: 6.0 + Math.random() * 4.5,
        jitterFreq: 0.04 + Math.random() * 0.03,
        forkTimer: Math.random() * 30,
      });
    });

    // Spontaneous Atmospheric Lightning Strikes
    const activeStrikes: AmbientLightningBolt[] = [];
    let nextStrikeCounter = 35;

    // Sparks & electric particles
    const sparks: ElectricParticle[] = [];

    // Helper: generate recursive jagged thunder branch
    function generateThunderPoints(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      displacement: number,
      steps: number,
      jitterSeed: number
    ) {
      const pts: { x: number; y: number }[] = [{ x: x1, y: y1 }];
      const dx = x2 - x1;
      const dy = y2 - y1;

      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const bx = x1 + dx * t;
        const by = y1 + dy * t;

        // Multi-frequency electric crackle noise
        const n1 = Math.sin(t * 22 + time * 18 + jitterSeed) * displacement;
        const n2 = Math.cos(t * 44 - time * 26 + jitterSeed * 2.1) * (displacement * 0.55);
        const n3 = (Math.random() - 0.5) * (displacement * 0.4);

        pts.push({
          x: bx,
          y: by + n1 + n2 + n3,
        });
      }

      pts.push({ x: x2, y: y2 });
      return pts;
    }

    // =========================================================================
    // 2. MAIN 60FPS FLUID RENDERING LOOP
    // =========================================================================
    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += 0.045;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Determine dashboard card bounding box (centered on full-screen canvas)
      const maxCardWidth = Math.min(width * 0.84, 1152);
      const cardLeft = (width - maxCardWidth) / 2;
      const cardRight = cardLeft + maxCardWidth;
      const cardTop = height * 0.10;
      const cardBottom = height * 0.90;
      const cornerRadius = 24;

      // =====================================================================
      // A. RENDER HIGH-SPEED ELECTRIC THUNDER BEAMS (LEFT WING)
      //    Streaming at high velocity from far left (0) into the card edge
      // =====================================================================
      leftBeams.forEach((beam) => {
        const baseY = (beam.yPercent / 100) * height + beam.yOffset;

        // Move head forward at high speed
        beam.headX += beam.speed;
        const tailX = beam.headX - beam.length;

        // Reset beam when tail passes the card left boundary
        if (tailX > cardLeft + 40) {
          beam.headX = -Math.random() * 150;
          beam.speed = 6.5 + Math.random() * 8.0;
          beam.length = 220 + Math.random() * 260;
          beam.yOffset = (Math.random() - 0.5) * 20;
        }

        // Clamp visible span within [0, cardLeft + 25]
        const visibleHeadX = Math.min(cardLeft + 15, beam.headX);
        const visibleTailX = Math.max(-50, tailX);

        if (visibleHeadX > visibleTailX && visibleHeadX > 0) {
          const span = visibleHeadX - visibleTailX;
          const steps = Math.max(12, Math.floor(span / 22));

          const pts = generateThunderPoints(
            visibleTailX,
            baseY,
            visibleHeadX,
            baseY,
            beam.jitterAmp,
            steps,
            beam.id * 17.3
          );

          // 1. Outer Neon Plasma Streak with high speed gradient
          ctx.save();
          const grad = ctx.createLinearGradient(visibleTailX, baseY, visibleHeadX, baseY);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          grad.addColorStop(0.35, beam.color);
          grad.addColorStop(1, '#ffffff');

          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let p = 1; p < pts.length; p++) {
            ctx.lineTo(pts[p].x, pts[p].y);
          }
          ctx.strokeStyle = grad;
          ctx.lineWidth = beam.thickness * 1.8;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'bevel';
          ctx.shadowBlur = 28;
          ctx.shadowColor = beam.glowColor;
          ctx.stroke();

          // 2. White-Hot Electrical Core
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let p = 1; p < pts.length; p++) {
            ctx.lineTo(pts[p].x, pts[p].y);
          }
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1.2, beam.thickness * 0.65);
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#ffffff';
          ctx.stroke();
          ctx.restore();

          // 3. Spontaneous High-Voltage Fork Branch
          beam.forkTimer += 0.05;
          if (Math.sin(beam.forkTimer) > 0.7 && pts.length > 6) {
            const forkIdx = Math.floor(pts.length * 0.65);
            const forkPt = pts[forkIdx];
            const forkLen = 35 + Math.random() * 40;
            const forkAngle = (Math.random() > 0.5 ? 0.45 : -0.45);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(forkPt.x, forkPt.y);
            ctx.lineTo(
              forkPt.x + Math.cos(forkAngle) * forkLen * 0.6 + (Math.random() - 0.5) * 8,
              forkPt.y + Math.sin(forkAngle) * forkLen * 0.6 + (Math.random() - 0.5) * 8
            );
            ctx.lineTo(
              forkPt.x + Math.cos(forkAngle) * forkLen,
              forkPt.y + Math.sin(forkAngle) * forkLen
            );
            ctx.strokeStyle = beam.color;
            ctx.lineWidth = 1.3;
            ctx.shadowBlur = 16;
            ctx.shadowColor = beam.glowColor;
            ctx.globalAlpha = 0.75;
            ctx.stroke();
            ctx.restore();
          }

          // 4. Blinding White-Hot Plasma Photon Head
          if (visibleHeadX < cardLeft + 15) {
            const headPt = pts[pts.length - 1];
            ctx.save();
            // Outer plasma halo
            ctx.beginPath();
            ctx.arc(headPt.x, headPt.y, beam.thickness * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = beam.color;
            ctx.shadowBlur = 32;
            ctx.shadowColor = beam.glowColor;
            ctx.fill();

            // Inner white-hot core
            ctx.beginPath();
            ctx.arc(headPt.x, headPt.y, beam.thickness * 1.4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#ffffff';
            ctx.fill();
            ctx.restore();

            // Spawn electric particles shedding behind the speed head
            if (Math.random() < 0.4 && sparks.length < 65) {
              sparks.push({
                x: headPt.x,
                y: headPt.y,
                vx: -beam.speed * 0.35 + (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 3,
                life: 1,
                maxLife: 15,
                color: beam.color,
                size: 1.6,
              });
            }
          }
        }
      });

      // =====================================================================
      // B. RENDER HIGH-SPEED ELECTRIC THUNDER BEAMS (RIGHT WING)
      //    Streaming at high velocity from card right outward to edge (width)
      // =====================================================================
      rightBeams.forEach((beam) => {
        const baseY = (beam.yPercent / 100) * height + beam.yOffset;

        // Move head forward at high speed
        beam.headX += beam.speed;
        const tailX = beam.headX - beam.length;

        // Reset beam when tail passes screen right edge
        if (tailX > width + 40) {
          beam.headX = cardRight - 15;
          beam.speed = 6.5 + Math.random() * 8.0;
          beam.length = 220 + Math.random() * 260;
          beam.yOffset = (Math.random() - 0.5) * 20;
        }

        // Clamp visible span within [cardRight - 15, width + 50]
        const visibleHeadX = Math.min(width + 40, beam.headX);
        const visibleTailX = Math.max(cardRight - 15, tailX);

        if (visibleHeadX > visibleTailX && visibleHeadX > cardRight - 15) {
          const span = visibleHeadX - visibleTailX;
          const steps = Math.max(12, Math.floor(span / 22));

          const pts = generateThunderPoints(
            visibleTailX,
            baseY,
            visibleHeadX,
            baseY,
            beam.jitterAmp,
            steps,
            beam.id * 23.7
          );

          // 1. Outer Neon Plasma Streak with high speed gradient
          ctx.save();
          const grad = ctx.createLinearGradient(visibleTailX, baseY, visibleHeadX, baseY);
          grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          grad.addColorStop(0.35, beam.color);
          grad.addColorStop(1, '#ffffff');

          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let p = 1; p < pts.length; p++) {
            ctx.lineTo(pts[p].x, pts[p].y);
          }
          ctx.strokeStyle = grad;
          ctx.lineWidth = beam.thickness * 1.8;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'bevel';
          ctx.shadowBlur = 28;
          ctx.shadowColor = beam.glowColor;
          ctx.stroke();

          // 2. White-Hot Electrical Core
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let p = 1; p < pts.length; p++) {
            ctx.lineTo(pts[p].x, pts[p].y);
          }
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1.2, beam.thickness * 0.65);
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#ffffff';
          ctx.stroke();
          ctx.restore();

          // 3. Spontaneous High-Voltage Fork Branch
          beam.forkTimer += 0.05;
          if (Math.sin(beam.forkTimer) > 0.7 && pts.length > 6) {
            const forkIdx = Math.floor(pts.length * 0.65);
            const forkPt = pts[forkIdx];
            const forkLen = 35 + Math.random() * 40;
            const forkAngle = (Math.random() > 0.5 ? 0.45 : -0.45);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(forkPt.x, forkPt.y);
            ctx.lineTo(
              forkPt.x + Math.cos(forkAngle) * forkLen * 0.6 + (Math.random() - 0.5) * 8,
              forkPt.y + Math.sin(forkAngle) * forkLen * 0.6 + (Math.random() - 0.5) * 8
            );
            ctx.lineTo(
              forkPt.x + Math.cos(forkAngle) * forkLen,
              forkPt.y + Math.sin(forkAngle) * forkLen
            );
            ctx.strokeStyle = beam.color;
            ctx.lineWidth = 1.3;
            ctx.shadowBlur = 16;
            ctx.shadowColor = beam.glowColor;
            ctx.globalAlpha = 0.75;
            ctx.stroke();
            ctx.restore();
          }

          // 4. Blinding White-Hot Plasma Photon Head
          if (visibleHeadX < width + 10) {
            const headPt = pts[pts.length - 1];
            ctx.save();
            ctx.beginPath();
            ctx.arc(headPt.x, headPt.y, beam.thickness * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = beam.color;
            ctx.shadowBlur = 32;
            ctx.shadowColor = beam.glowColor;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(headPt.x, headPt.y, beam.thickness * 1.4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 18;
            ctx.shadowColor = '#ffffff';
            ctx.fill();
            ctx.restore();

            if (Math.random() < 0.4 && sparks.length < 65) {
              sparks.push({
                x: headPt.x,
                y: headPt.y,
                vx: -beam.speed * 0.35 + (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 3,
                life: 1,
                maxLife: 15,
                color: beam.color,
                size: 1.6,
              });
            }
          }
        }
      });

      // =====================================================================
      // C. SPONTANEOUS MEGA-THUNDERBOLT ATMOSPHERIC DISCHARGES
      // =====================================================================
      nextStrikeCounter--;
      if (nextStrikeCounter <= 0) {
        nextStrikeCounter = 40 + Math.floor(Math.random() * 50); // Every 40-90 frames

        const palette = beamPalettes[Math.floor(Math.random() * beamPalettes.length)];
        const isLeft = Math.random() > 0.5;

        let sX: number;
        let sY: number;
        let eX: number;
        let eY: number;

        if (isLeft) {
          sX = Math.random() * (cardLeft * 0.6);
          sY = Math.random() * (height * 0.4);
          eX = cardLeft + (Math.random() - 0.5) * 30;
          eY = height * 0.3 + Math.random() * (height * 0.6);
        } else {
          sX = width - Math.random() * ((width - cardRight) * 0.6);
          sY = Math.random() * (height * 0.4);
          eX = cardRight + (Math.random() - 0.5) * 30;
          eY = height * 0.3 + Math.random() * (height * 0.6);
        }

        const pts = generateThunderPoints(sX, sY, eX, eY, 45, 16, Math.random() * 100);

        activeStrikes.push({
          startX: sX,
          startY: sY,
          endX: eX,
          endY: eY,
          points: pts,
          life: 0,
          maxLife: 14 + Math.floor(Math.random() * 10),
          color: palette.color,
          glowColor: palette.glow,
        });

        // Contact burst sparks
        for (let k = 0; k < 10; k++) {
          if (sparks.length >= 70) break;
          const spd = 2 + Math.random() * 4;
          const a = Math.random() * Math.PI * 2;
          sparks.push({
            x: eX,
            y: eY,
            vx: Math.cos(a) * spd,
            vy: Math.sin(a) * spd,
            life: 1,
            maxLife: 18,
            color: palette.color,
            size: 1.8,
          });
        }
      }

      // Draw active mega-strikes
      for (let s = activeStrikes.length - 1; s >= 0; s--) {
        const strike = activeStrikes[s];
        strike.life++;

        if (strike.life >= strike.maxLife) {
          activeStrikes.splice(s, 1);
          continue;
        }

        const progress = strike.life / strike.maxLife;
        const flicker = Math.sin(strike.life * 1.8) > 0 ? 1 : 0.65;
        const alpha = (1 - progress) * flicker;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(strike.points[0].x, strike.points[0].y);
        for (let p = 1; p < strike.points.length; p++) {
          ctx.lineTo(strike.points[p].x, strike.points[p].y);
        }
        ctx.strokeStyle = strike.color;
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 35;
        ctx.shadowColor = strike.glowColor;
        ctx.globalAlpha = alpha * 0.85;
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#ffffff';
        ctx.globalAlpha = alpha * 0.95;
        ctx.stroke();
        ctx.restore();
      }

      // =====================================================================
      // D. ELECTRIC PLASMA FLOW CIRCULATING AROUND DASHBOARD PREVIEW
      // =====================================================================
      ctx.save();
      const perimW = cardRight - cardLeft;
      const perimH = cardBottom - cardTop;

      // Glowing perimeter trace
      ctx.beginPath();
      ctx.roundRect(cardLeft - 2, cardTop - 2, perimW + 4, perimH + 4, cornerRadius);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 2.0;
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#38bdf8';
      ctx.stroke();

      // Traveling Electric Plasma Fireball around perimeter
      const perimeterTotal = 2 * (perimW + perimH);
      const headDist = ((time * 0.28) % 1) * perimeterTotal;

      let surgeX = cardLeft;
      let surgeY = cardTop;

      if (headDist < perimW) {
        surgeX = cardLeft + headDist;
        surgeY = cardTop;
      } else if (headDist < perimW + perimH) {
        surgeX = cardRight;
        surgeY = cardTop + (headDist - perimW);
      } else if (headDist < 2 * perimW + perimH) {
        surgeX = cardRight - (headDist - (perimW + perimH));
        surgeY = cardBottom;
      } else {
        surgeX = cardLeft;
        surgeY = cardBottom - (headDist - (2 * perimW + perimH));
      }

      ctx.beginPath();
      ctx.arc(surgeX, surgeY, 6.0, 0, Math.PI * 2);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowBlur = 26;
      ctx.shadowColor = '#00f0ff';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(surgeX, surgeY, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#ffffff';
      ctx.fill();

      // High-Voltage Corner Lightning Leaps
      const corners = [
        { x: cardLeft, y: cardTop, dirX: -1, dirY: -1 },
        { x: cardRight, y: cardTop, dirX: 1, dirY: -1 },
        { x: cardLeft, y: cardBottom, dirX: -1, dirY: 1 },
        { x: cardRight, y: cardBottom, dirX: 1, dirY: 1 },
      ];

      corners.forEach((c, idx) => {
        const dischargeCheck = Math.sin(time * 9 + idx * 88);
        if (dischargeCheck > 0.62) {
          const arcLen = 50 + Math.random() * 60;
          const endX = c.x + c.dirX * arcLen;
          const endY = c.y + c.dirY * arcLen;

          ctx.beginPath();
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(
            c.x + (endX - c.x) * 0.5 + (Math.random() - 0.5) * 12,
            c.y + (endY - c.y) * 0.5 + (Math.random() - 0.5) * 12
          );
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = idx % 2 === 0 ? '#00f0ff' : '#ec4899';
          ctx.lineWidth = 2.2;
          ctx.shadowBlur = 24;
          ctx.shadowColor = idx % 2 === 0 ? '#00f0ff' : '#ec4899';
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      });
      ctx.restore();

      // =====================================================================
      // E. DYNAMIC ELECTRICAL PARTICLES & SHED SPARKS
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
        ctx.shadowBlur = 12;
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
      className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-screen h-[780px] pointer-events-none overflow-hidden select-none -z-10"
    >
      {/* Dynamic Cosmic Ambient Glowing Nebulae filling the wide flanks */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[550px] lg:w-[850px] h-[550px] bg-gradient-to-r from-cyan-500/25 via-indigo-600/18 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[550px] lg:w-[850px] h-[550px] bg-gradient-to-l from-purple-500/25 via-pink-600/18 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-indigo-500/15 via-cyan-500/10 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* 60FPS High-Speed Electric Thunder Streak Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
}
