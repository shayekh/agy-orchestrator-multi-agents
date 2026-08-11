import { useState } from 'react';
import { motion } from 'framer-motion';
import { GameState } from '../types/game';
import { WinningStrikeOverlay } from './WinningStrikeOverlay';

interface GameBoardProps {
  gameState: GameState;
  onCellClick: (index: number) => void;
  isAITurn?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, onCellClick, isAITurn }) => {
  const { board, size, winningLine, currentPlayer, status, hintResult } = gameState;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const winningCombo = winningLine ? winningLine.combo : [];
  const hintIndex = hintResult?.index;

  // Determine grid template columns based on size
  const gridColsClass =
    size === 3 ? 'grid-cols-3' : size === 4 ? 'grid-cols-4' : 'grid-cols-5';

  const isInteractive = status === 'PLAYING' && !isAITurn;

  return (
    <div className="relative w-full max-w-lg aspect-square flex items-center justify-center p-2">
      {/* Outer Glow Halo */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl pointer-events-none" />

      {/* Main Board Container */}
      <div className="relative w-full h-full glass-panel rounded-3xl p-4 md:p-6 border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
        {/* Scanline Effect Overlay */}
        <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />

        {/* Dynamic Grid */}
        <div data-testid="game-board-grid" className={`grid ${gridColsClass} gap-2.5 md:gap-3.5 w-full h-full z-10`}>
          {board.map((cellValue, idx) => {
            const isWinningCell = winningCombo.includes(idx);
            const isHinted = hintIndex === idx;
            const isEmpty = cellValue === null;
            const isHovered = hoverIndex === idx && isEmpty && isInteractive;

            return (
              <motion.button
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: idx * 0.02 }}
                whileHover={isInteractive && isEmpty ? { scale: 1.04, backgroundColor: 'rgba(255, 255, 255, 0.08)' } : {}}
                whileTap={isInteractive && isEmpty ? { scale: 0.95 } : {}}
                onClick={() => isInteractive && isEmpty && onCellClick(idx)}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                disabled={!isInteractive || !isEmpty}
                className={`relative rounded-2xl flex items-center justify-center aspect-square transition-all duration-200 border shadow-lg ${
                  isWinningCell
                    ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/80 shadow-glow-x scale-[1.03] z-20'
                    : isHinted
                    ? 'border-amber-400/80 bg-amber-400/10 shadow-glow-amber'
                    : 'glass-card border-white/10 hover:border-cyan-400/40 bg-slate-900/40'
                } ${!isInteractive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {/* Placed Cell Symbols */}
                {cellValue === 'X' && <XSymbol isWinning={isWinningCell} />}
                {cellValue === 'O' && <OSymbol isWinning={isWinningCell} />}

                {/* Hover Preview Ghost Symbol */}
                {isHovered && (
                  <div className="transition-opacity">
                    {currentPlayer === 'X' ? <XSymbol isGhost /> : <OSymbol isGhost />}
                  </div>
                )}

                {/* Hint Highlight Marker */}
                {isHinted && isEmpty && (
                  <span className="absolute inset-0 border-2 border-amber-400 rounded-2xl animate-ping opacity-75 pointer-events-none" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* SVG Winning Line Overlay */}
        {winningLine && <WinningStrikeOverlay winningLine={winningLine} size={size} />}
      </div>
    </div>
  );
};

// SVG Animated X Symbol
const XSymbol: React.FC<{ isWinning?: boolean; isGhost?: boolean }> = ({ isWinning, isGhost }) => (
  <motion.svg
    initial={{ scale: 0, rotate: -45 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    viewBox="0 0 100 100"
    className={`w-3/5 h-3/5 drop-shadow-md text-cyan-400 ${
      isWinning ? 'text-amber-300 drop-shadow-[0_0_16px_rgba(251,191,36,0.9)]' : ''
    }`}
    style={
      !isWinning
        ? {
            color: 'var(--color-x, #00f3ff)',
            filter: isGhost
              ? undefined
              : 'drop-shadow(0 0 12px var(--glow-x, rgba(0,243,255,0.7)))',
            opacity: isGhost ? 0.4 : 1,
          }
        : undefined
    }
  >
    <motion.line
      x1="20"
      y1="20"
      x2="80"
      y2="80"
      stroke="currentColor"
      strokeWidth="14"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.2 }}
    />
    <motion.line
      x1="80"
      y1="20"
      x2="20"
      y2="80"
      stroke="currentColor"
      strokeWidth="14"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.2, delay: 0.1 }}
    />
  </motion.svg>
);

// SVG Animated O Symbol
const OSymbol: React.FC<{ isWinning?: boolean; isGhost?: boolean }> = ({ isWinning, isGhost }) => (
  <motion.svg
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    viewBox="0 0 100 100"
    className={`w-3/5 h-3/5 drop-shadow-md text-pink-500 ${
      isWinning ? 'text-amber-300 drop-shadow-[0_0_16px_rgba(251,191,36,0.9)]' : ''
    }`}
    style={
      !isWinning
        ? {
            color: 'var(--color-o, #ff007f)',
            filter: isGhost
              ? undefined
              : 'drop-shadow(0 0 12px var(--glow-o, rgba(255,0,127,0.7)))',
            opacity: isGhost ? 0.4 : 1,
          }
        : undefined
    }
  >
    <motion.circle
      cx="50"
      cy="50"
      r="32"
      fill="none"
      stroke="currentColor"
      strokeWidth="13"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.3 }}
    />
  </motion.svg>
);
