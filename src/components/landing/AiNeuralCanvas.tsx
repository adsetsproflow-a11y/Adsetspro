'use client';

import React, { useEffect, useRef } from 'react';

interface AiNeuralCanvasProps {
  className?: string;
  particleCount?: number;
}

export default function AiNeuralCanvas({
  className = '',
  particleCount = 55,
}: AiNeuralCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const isDarkMode = () => document.documentElement.classList.contains('dark');

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

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
    const maxDistance = 140;

    const colors = [
      { fill: '#6366f1', glow: 'rgba(99, 102, 241, 0.4)' },
      { fill: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
      { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
      { fill: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)' },
    ];

    for (let i = 0; i < particleCount; i++) {
      const colorScheme = colors[Math.floor(Math.random() * colors.length)];
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.2 + 1.2,
        color: colorScheme.fill,
        glowColor: colorScheme.glow,
      });
    }

    // Spawn pulses periodically
    const spawnPulse = () => {
      if (nodes.length < 2) return;
      const i1 = Math.floor(Math.random() * nodes.length);
      // find a neighbor within maxDistance
      const candidates: number[] = [];
      for (let i = 0; i < nodes.length; i++) {
        if (i === i1) continue;
        const dx = nodes[i].x - nodes[i1].x;
        const dy = nodes[i].y - nodes[i1].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDistance) {
          candidates.push(i);
        }
      }
      if (candidates.length > 0) {
        const i2 = candidates[Math.floor(Math.random() * candidates.length)];
        pulses.push({
          fromIndex: i1,
          toIndex: i2,
          progress: 0,
          speed: 0.025 + Math.random() * 0.025,
        });
      }
    };

    const pulseInterval = setInterval(spawnPulse, 350);

    // Mouse interactive gravitation
    let mouseX = -9999;
    let mouseY = -9999;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || 600;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);

    // Visibility observer to pause animation when off-screen
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(canvas);

    // Main animation loop
    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const dark = isDarkMode();
      const lineColorBase = dark ? 'rgba(99, 102, 241,' : 'rgba(79, 70, 229,';

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Move
        n.x += n.vx;
        n.y += n.vy;

        // Bounce on boundary
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        // Gentle mouse interaction
        if (mouseX > 0 && mouseY > 0) {
          const mdx = mouseX - n.x;
          const mdy = mouseY - n.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 130) {
            const force = (130 - mdist) / 130;
            n.x -= (mdx / mdist) * force * 1.5;
            n.y -= (mdy / mdist) * force * 1.5;
          }
        }

        // Draw connections
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n.x;
          const dy = n2.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * (dark ? 0.35 : 0.18);
            ctx.beginPath();
            ctx.strokeStyle = `${lineColorBase}${alpha})`;
            ctx.lineWidth = 1;
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }

        // Draw node circle with soft radial glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.glowColor;
        ctx.shadowBlur = dark ? 10 : 4;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      // Draw pulses traveling down neural synapses
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
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#22d3ee';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(pulseInterval);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
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
