import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '../types/game';
import { Trophy, RotateCcw, Settings, BarChart2, ShieldAlert, Eye } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface GameOverModalProps {
  gameState: GameState;
  onPlayAgain: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onReviewBoard?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameState,
  onPlayAgain,
  onOpenSettings,
  onOpenStats,
  onReviewBoard,
}) => {
  const { status, winner, playerX, playerO, history } = gameState;
  const isVisible = status === 'VICTORY' || status === 'DRAW';
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissal when game status or winner changes
  useEffect(() => {
    setIsDismissed(false);
  }, [status, winner]);

  if (!isVisible || isDismissed) return null;

  const isXWin = winner === 'X';
  const isOWin = winner === 'O';
  const isDraw = winner === 'DRAW';

  const winningPlayer = isXWin ? playerX : isOWin ? playerO : null;

  const handlePlayAgain = () => {
    soundEngine.playClick();
    onPlayAgain();
  };

  const handleOpenSettings = () => {
    soundEngine.playClick();
    onOpenSettings();
  };

  const handleOpenStats = () => {
    soundEngine.playClick();
    onOpenStats();
  };

  const handleReviewBoard = () => {
    soundEngine.playClick();
    if (onReviewBoard) {
      onReviewBoard();
    }
    setIsDismissed(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md glass-panel rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl z-10 flex flex-col items-center text-center overflow-hidden"
        >
          {/* Header Glow Pill */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 rounded-b-full blur-sm" />

          {/* Trophy / Status Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 border shadow-2xl ${
              isXWin
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-glow-x'
                : isOWin
                ? 'bg-pink-500/20 border-pink-400 text-pink-400 shadow-glow-o'
                : 'bg-amber-500/20 border-amber-400 text-amber-400'
            }`}
          >
            {isDraw ? (
              <ShieldAlert className="w-10 h-10 animate-pulse" />
            ) : (
              <Trophy className="w-10 h-10 animate-bounce" />
            )}
          </motion.div>

          {/* Title Header */}
          <h2 className="text-2xl md:text-3xl font-black font-display tracking-wide uppercase bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            {isXWin && `${playerX.name} Victorious!`}
            {isOWin && `${playerO.name} Victorious!`}
            {isDraw && 'Equilibrium Reached (Draw)'}
          </h2>

          <p className="text-xs font-mono text-slate-400 mt-1 mb-6">
            {isDraw ? 'Neither strategist could claim dominance in this arena match.' : 'Defeated opponent in high-precision strategic battle.'}
          </p>

          {/* Match Stats Ticker */}
          <div className="w-full grid grid-cols-2 gap-3 mb-6 bg-slate-950/60 p-3.5 rounded-2xl border border-white/10">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Moves Played</span>
              <span className="text-lg font-black font-mono text-cyan-400">{history.length}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Win Streak</span>
              <span className="text-lg font-black font-mono text-pink-400">
                {winningPlayer ? winningPlayer.stats.winStreak : 0}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePlayAgain}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-600 to-pink-500 text-slate-950 font-black tracking-wider text-sm flex items-center justify-center gap-2 shadow-glow-x hover:brightness-110 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> PLAY AGAIN
            </motion.button>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleOpenSettings}
                className="py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all"
              >
                <Settings className="w-3.5 h-3.5" /> Modes
              </button>
              <button
                onClick={handleOpenStats}
                className="py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all"
              >
                <BarChart2 className="w-3.5 h-3.5" /> Leaderboard
              </button>
              <button
                onClick={handleReviewBoard}
                className="py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all"
              >
                <Eye className="w-3.5 h-3.5" /> Review Board
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

