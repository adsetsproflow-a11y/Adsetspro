'use client';

import React, { useEffect, useRef } from 'react';

interface AiNeuralCanvasProps {
  className?: string;
  particleCount?: number;
}

export default function AiNeuralCanvas({
  className = '',
  particleCount = 45,
}: AiNeuralCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let pulseInterval: NodeJS.Timeout | null = null;
    let isVisible = true;
    let isRunning = false;

    // Cap DPR to 1.5 to prevent GPU fill-rate bottlenecks on 4K/Retina displays
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = canvas.parentElement?.clientWidth || window.innerWidth;
    let height = canvas.parentElement?.clientHeight || 600;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    const isDarkMode = () => document.documentElement.classList.contains('dark');

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      glowColor: string;
    }

    interface Pulse {
      fromIndex: number;
      toIndex: number;
      progress: number;
      speed: number;
    }

    const nodes: Node[] = [];
    const pulses: Pulse[] = [];
    const maxDistance = 135;

    const colors = [
      { fill: '#6366f1', glow: 'rgba(99, 102, 241, 0.35)' },
      { fill: '#06b6d4', glow: 'rgba(6, 182, 212, 0.35)' },
      { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.35)' },
      { fill: '#38bdf8', glow: 'rgba(56, 189, 248, 0.35)' },
    ];

    for (let i = 0; i < particleCount; i++) {
      const colorScheme = colors[i % colors.length];
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1,
        color: colorScheme.fill,
        glowColor: colorScheme.glow,
      });
    }

    // Spawn pulses periodically
    const spawnPulse = () => {
      if (!isVisible || nodes.length < 2 || pulses.length > 8) return;
      const i1 = Math.floor(Math.random() * nodes.length);
      const candidates: number[] = [];
      for (let i = 0; i < nodes.length; i++) {
        if (i === i1) continue;
        const dx = nodes[i].x - nodes[i1].x;
        const dy = nodes[i].y - nodes[i1].y;
        if (dx * dx + dy * dy < maxDistance * maxDistance) {
          candidates.push(i);
        }
      }
      if (candidates.length > 0) {
        const i2 = candidates[Math.floor(Math.random() * candidates.length)];
        pulses.push({
          fromIndex: i1,
          toIndex: i2,
          progress: 0,
          speed: 0.025 + Math.random() * 0.02,
        });
      }
    };

    let mouseX = -9999;
    let mouseY = -9999;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) return;
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    let resizeTimeout: any = null;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!canvas) return;
        width = canvas.parentElement?.clientWidth || window.innerWidth;
        height = canvas.parentElement?.clientHeight || 600;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.scale(dpr, dpr);
      }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Target ~60 FPS cap to prevent 144Hz/240Hz battery drain
    let lastFrameTime = 0;
    const frameInterval = 1000 / 60;

    const render = (time: number) => {
      if (!isVisible) {
        isRunning = false;
        return;
      }

      animationFrameId = requestAnimationFrame(render);

      const delta = time - lastFrameTime;
      if (delta < frameInterval) return;
      lastFrameTime = time - (delta % frameInterval);

      ctx.clearRect(0, 0, width, height);

      const dark = isDarkMode();
      const lineColorBase = dark ? 'rgba(99, 102, 241,' : 'rgba(79, 70, 229,';

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        if (mouseX > 0 && mouseY > 0) {
          const mdx = mouseX - n.x;
          const mdy = mouseY - n.y;
          const mdistSq = mdx * mdx + mdy * mdy;
          if (mdistSq < 14400) { // 120^2
            const mdist = Math.sqrt(mdistSq);
            const force = (120 - mdist) / 120;
            n.x -= (mdx / mdist) * force * 1.5;
            n.y -= (mdy / mdist) * force * 1.5;
          }
        }

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n.x;
          const dy = n2.y - n.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistance * maxDistance) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / maxDistance) * (dark ? 0.3 : 0.16);
            ctx.beginPath();
            ctx.strokeStyle = `${lineColorBase}${alpha.toFixed(2)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
      }

      // Draw pulses
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }

        const n1 = nodes[pulse.fromIndex];
        const n2 = nodes[pulse.toIndex];
        if (!n1 || !n2) {
          pulses.splice(p, 1);
          continue;
        }

        const px = n1.x + (n2.x - n1.x) * pulse.progress;
        const py = n1.y + (n2.y - n1.y) * pulse.progress;

        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#22d3ee';
        ctx.fill();
      }
    };

    const startAnimation = () => {
      if (!isRunning && isVisible && !prefersReducedMotion) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(render);
        if (!pulseInterval) {
          pulseInterval = setInterval(spawnPulse, 400);
        }
      }
    };

    const stopAnimation = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (pulseInterval) {
        clearInterval(pulseInterval);
        pulseInterval = null;
      }
      isRunning = false;
    };

    // If reduced motion is preferred, render 1 static frame
    if (prefersReducedMotion) {
      render(0);
    } else {
      // IntersectionObserver stops canvas execution completely when scrolled off-screen
      const observer = new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          startAnimation();
        } else {
          stopAnimation();
        }
      });
      observer.observe(canvas);

      startAnimation();

      return () => {
        stopAnimation();
        if (resizeTimeout) clearTimeout(resizeTimeout);
        window.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
        window.removeEventListener('resize', handleResize);
        observer.disconnect();
      };
    }

    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
      style={{ opacity: 0.85 }}
    />
  );
}
