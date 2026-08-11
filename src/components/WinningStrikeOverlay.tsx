import React from 'react';
import { motion } from 'framer-motion';

interface WinningStrikeOverlayProps {
  winningLine: { combo: number[]; direction: string };
  size: number;
}

export const WinningStrikeOverlay: React.FC<WinningStrikeOverlayProps> = ({
  winningLine,
  size,
}) => {
  const { combo } = winningLine;
  if (!combo || combo.length === 0) return null;

  const firstIdx = combo[0];
  const lastIdx = combo[combo.length - 1];

  // Convert 1D cell index to (row, col)
  const r1 = Math.floor(firstIdx / size);
  const c1 = firstIdx % size;
  const r2 = Math.floor(lastIdx / size);
  const c2 = lastIdx % size;

  // Exact cell center percentage formula:
  // x% = c * (100 / N) + (100 / (2 * N))
  // y% = r * (100 / N) + (100 / (2 * N))
  const getPercentPos = (r: number, c: number) => {
    const x = c * (100 / size) + 100 / (2 * size);
    const y = r * (100 / size) + 100 / (2 * size);
    return { x, y };
  };

  const p1 = getPercentPos(r1, c1);
  const p2 = getPercentPos(r2, c2);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-30 p-4 md:p-6"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="strikeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-x, #00f3ff)" />
          <stop offset="50%" stopColor="var(--color-accent, #b000ff)" />
          <stop offset="100%" stopColor="var(--color-o, #ff007f)" />
        </linearGradient>
        <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.line
        x1={`${p1.x}%`}
        y1={`${p1.y}%`}
        x2={`${p2.x}%`}
        y2={`${p2.y}%`}
        stroke="url(#strikeGlow)"
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#glowFilter)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </svg>
  );
};
