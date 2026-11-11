'use client';

import React from 'react';

// =============================================================================
// SECTION AMBIENCE: animated background layer for a section (logo palette)
//  - Drifting glow orbs (teal / blue / indigo)
//  - Small particles that float upward and twinkle
//  - Thin light beams that sweep across
//  - A slowly rotating dashed orbit ring behind the focal element
// Pure CSS, decorative only, sits behind the section content.
// Usage: put <SectionAmbience focus="right" /> as the first child of a
// `relative` section.
// =============================================================================

type Focus = 'left' | 'right' | 'center';

// Fixed (not random) so server and client render identically
const PARTICLES = [
  { x: 6, y: 78, s: 3, d: 0, t: 11 },
  { x: 14, y: 30, s: 2, d: 2.5, t: 13 },
  { x: 22, y: 64, s: 2, d: 5, t: 10 },
  { x: 31, y: 18, s: 3, d: 1.2, t: 14 },
  { x: 39, y: 86, s: 2, d: 3.8, t: 12 },
  { x: 47, y: 42, s: 2, d: 6.2, t: 15 },
  { x: 55, y: 72, s: 3, d: 0.6, t: 11 },
  { x: 63, y: 24, s: 2, d: 4.4, t: 13 },
  { x: 71, y: 58, s: 2, d: 2, t: 10 },
  { x: 79, y: 82, s: 3, d: 5.6, t: 14 },
  { x: 87, y: 36, s: 2, d: 3.1, t: 12 },
  { x: 94, y: 66, s: 2, d: 1.7, t: 13 },
];

const COLORS = ['#2dd4bf', '#38bdf8', '#818cf8'];

export default function SectionAmbience({ focus = 'center' }: { focus?: Focus }) {
  const ringX = focus === 'left' ? '27%' : focus === 'right' ? '73%' : '50%';

  return (
    <div aria-hidden className="sa-root pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
      {/* Glow orbs */}
      <span
        className="sa-orb sa-orb-a"
        style={{ left: focus === 'right' ? '58%' : focus === 'left' ? '2%' : '20%', top: '8%' }}
      />
      <span
        className="sa-orb sa-orb-b"
        style={{ left: focus === 'right' ? '8%' : focus === 'left' ? '60%' : '58%', top: '52%' }}
      />
      <span className="sa-orb sa-orb-c" style={{ left: '40%', top: '30%' }} />

      {/* Orbit ring behind the focal element */}
      <span className="sa-ring" style={{ left: ringX }} />
      <span className="sa-ring sa-ring-inner" style={{ left: ringX }} />

      {/* Light beams */}
      <span className="sa-beam" style={{ top: '22%', animationDelay: '0s' }} />
      <span className="sa-beam sa-beam-rev" style={{ top: '74%', animationDelay: '3.5s' }} />

      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="sa-dot"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.s,
              height: p.s,
              background: COLORS[i % 3],
              boxShadow: `0 0 8px 1px ${COLORS[i % 3]}`,
              animationDelay: `${p.d}s`,
              animationDuration: `${p.t}s`,
            } as React.CSSProperties
          }
        />
      ))}

      <style jsx global>{`
        .sa-root {
          mask-image: linear-gradient(to bottom, transparent, black 12%, black 88%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 12%, black 88%, transparent);
        }
        .sa-root .sa-orb {
          position: absolute;
          width: min(460px, 60vw);
          height: min(460px, 60vw);
          border-radius: 9999px;
          filter: blur(90px);
          opacity: 0.22;
          animation: saDrift 22s ease-in-out infinite alternate;
        }
        .sa-root .sa-orb-a { background: radial-gradient(circle, #2dd4bf, transparent 70%); }
        .sa-root .sa-orb-b { background: radial-gradient(circle, #6366f1, transparent 70%); animation-duration: 26s; animation-delay: -8s; }
        .sa-root .sa-orb-c { background: radial-gradient(circle, #3b82f6, transparent 70%); opacity: 0.14; animation-duration: 30s; animation-delay: -14s; }
        @keyframes saDrift {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, -40px) scale(1.12); }
          100% { transform: translate(-50px, 30px) scale(0.95); }
        }

        .sa-root .sa-ring {
          position: absolute;
          top: 50%;
          width: min(620px, 80vw);
          aspect-ratio: 1;
          translate: -50% -50%;
          border-radius: 9999px;
          border: 1px dashed rgba(96, 165, 250, 0.16);
          animation: saSpin 90s linear infinite;
        }
        .sa-root .sa-ring-inner {
          width: min(440px, 60vw);
          border: 1px solid rgba(45, 212, 191, 0.08);
          animation-duration: 60s;
          animation-direction: reverse;
        }
        .sa-root .sa-ring::after {
          content: '';
          position: absolute;
          top: -3px;
          left: 50%;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #7dd3fc;
          box-shadow: 0 0 12px 3px rgba(56, 189, 248, 0.8);
        }
        @keyframes saSpin {
          to { transform: rotate(360deg); }
        }

        .sa-root .sa-beam {
          position: absolute;
          left: -30%;
          width: 30%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(45, 212, 191, 0.7), rgba(129, 140, 248, 0.7), transparent);
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
          transform: rotate(-8deg);
          animation: saBeam 9s ease-in-out infinite;
        }
        .sa-root .sa-beam-rev {
          transform: rotate(6deg);
          animation-name: saBeamRev;
        }
        @keyframes saBeam {
          0% { left: -30%; opacity: 0; }
          10% { opacity: 1; }
          60% { opacity: 1; }
          75%, 100% { left: 110%; opacity: 0; }
        }
        @keyframes saBeamRev {
          0% { left: 110%; opacity: 0; }
          10% { opacity: 1; }
          60% { opacity: 1; }
          75%, 100% { left: -30%; opacity: 0; }
        }

        .sa-root .sa-dot {
          position: absolute;
          border-radius: 9999px;
          opacity: 0;
          animation-name: saFloat;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        @keyframes saFloat {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          20% { opacity: 0.9; }
          50% { transform: translateY(-60px) scale(1); opacity: 0.5; }
          80% { opacity: 0.9; }
          100% { transform: translateY(-120px) scale(0.6); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sa-root .sa-orb, .sa-root .sa-ring, .sa-root .sa-beam, .sa-root .sa-dot { animation: none; }
          .sa-root .sa-beam { display: none; }
          .sa-root .sa-dot { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
