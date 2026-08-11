import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '../types/game';
import { Trophy, Flame, RotateCcw, X, Award, History } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface StatsModalProps {
  gameState: GameState;
  isOpen: boolean;
  onClose: () => void;
  onResetStats: () => void;
}

const formatModeName = (mode: string): string => {
  switch (mode) {
    case 'PVP_LOCAL':
      return '2P Pass & Play';
    case 'PVP_ONLINE':
      return '2P Online';
    case 'AI_EASY':
      return 'Cyber Novice AI';
    case 'AI_MEDIUM':
      return 'Tactical AI';
    case 'AI_HARD':
      return 'Minimax AI';
    case 'AI_UNBEATABLE':
      return 'Unbeatable AI';
    case 'ULTIMATE':
      return 'Ultimate Tic-Tac-Toe';
    case 'QUANTUM':
      return 'Quantum Mode';
    default:
      return mode;
  }
};

const formatDate = (timestamp: number): string => {
  try {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch {
    return 'Recent';
  }
};

export const StatsModal: React.FC<StatsModalProps> = ({
  gameState,
  isOpen,
  onClose,
  onResetStats,
}) => {
  if (!isOpen) return null;

  const { playerX, playerO, matchHistory = [] } = gameState;

  const totalMatches = playerX.stats.wins + playerO.stats.wins + playerX.stats.draws;
  const winRateX = totalMatches > 0 ? Math.round((playerX.stats.wins / totalMatches) * 100) : 0;
  const winRateO = totalMatches > 0 ? Math.round((playerO.stats.wins / totalMatches) * 100) : 0;

  const handleClose = () => {
    soundEngine.playClick();
    onClose();
  };

  const handleResetStats = () => {
    soundEngine.playClick();
    onResetStats();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl z-10 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-pink-500 p-[2px] shadow-glow-o">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-extrabold font-display text-white">ARENA LEADERBOARD & STATS</h2>
                <p className="text-xs text-slate-400 font-mono">HEAD-TO-HEAD MATCH PERFORMANCE</p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Win Ratio Comparison Bar */}
          <div className="flex flex-col gap-2 bg-slate-950/60 p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between items-center text-xs font-mono font-bold">
              <span className="text-cyan-400">{playerX.name}: {winRateX}%</span>
              <span className="text-slate-400">{totalMatches} TOTAL MATCHES</span>
              <span className="text-pink-400">{playerO.name}: {winRateO}%</span>
            </div>

            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-white/10">
              <div
                className="h-full bg-cyan-400 transition-all duration-500 shadow-glow-x"
                style={{ width: `${winRateX}%` }}
              />
              <div
                className="h-full bg-slate-700 transition-all duration-500"
                style={{ width: `${totalMatches > 0 ? (playerX.stats.draws / totalMatches) * 100 : 100}%` }}
              />
              <div
                className="h-full bg-pink-500 transition-all duration-500 shadow-glow-o"
                style={{ width: `${winRateO}%` }}
              />
            </div>
          </div>

          {/* Player Cards Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Player X Stats Card */}
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-cyan-500/30 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center font-black">X</span>
                  {playerX.name}
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">P1</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <div className="text-xl font-black font-mono text-cyan-400">{playerX.stats.wins}</div>
                  <div className="text-[10px] text-slate-400 font-mono">VICTORIES</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <div className="text-xl font-black font-mono text-slate-400">{playerX.stats.losses}</div>
                  <div className="text-[10px] text-slate-400 font-mono">DEFEATS</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-300 pt-1">
                <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-amber-400" /> Current Streak:</span>
                <span className="font-bold text-cyan-400">{playerX.stats.winStreak}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-amber-400" /> Best Streak:</span>
                <span className="font-bold text-amber-400">{playerX.stats.bestStreak}</span>
              </div>
            </div>

            {/* Player O Stats Card */}
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-pink-500/30 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-sm text-pink-400 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-pink-500/20 flex items-center justify-center font-black">O</span>
                  {playerO.name}
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">P2 / AI</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <div className="text-xl font-black font-mono text-pink-400">{playerO.stats.wins}</div>
                  <div className="text-[10px] text-slate-400 font-mono">VICTORIES</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <div className="text-xl font-black font-mono text-slate-400">{playerO.stats.losses}</div>
                  <div className="text-[10px] text-slate-400 font-mono">DEFEATS</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-300 pt-1">
                <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-amber-400" /> Current Streak:</span>
                <span className="font-bold text-pink-400">{playerO.stats.winStreak}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-amber-400" /> Best Streak:</span>
                <span className="font-bold text-amber-400">{playerO.stats.bestStreak}</span>
              </div>
            </div>
          </div>

          {/* Scrollable Match History Log */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-300 tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" /> MATCH HISTORY LOG ({matchHistory.length})
              </h3>
            </div>

            <div className="max-h-48 overflow-y-auto pr-1 flex flex-col gap-2 rounded-2xl bg-slate-950/40 p-3 border border-white/5 custom-scrollbar">
              {matchHistory.length === 0 ? (
                <div className="text-center py-6 text-xs font-mono text-slate-500">
                  NO MATCHES RECORDED YET
                </div>
              ) : (
                matchHistory.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      {record.winner === 'X' && (
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 font-black border border-cyan-500/40 flex items-center gap-1">
                          X WIN
                        </span>
                      )}
                      {record.winner === 'O' && (
                        <span className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-400 font-black border border-pink-500/40 flex items-center gap-1">
                          O WIN
                        </span>
                      )}
                      {record.winner === 'DRAW' && (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold border border-white/10 flex items-center gap-1">
                          DRAW
                        </span>
                      )}

                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200">{formatModeName(record.mode)}</span>
                        <span className="text-[10px] text-slate-400">
                          {record.boardSize}x{record.boardSize} Grid • {record.movesCount} Moves
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(record.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer & Reset Action */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-xs font-mono text-slate-400">DRAW MATCHES: <span className="text-white font-bold">{playerX.stats.draws}</span></span>
            <button
              onClick={handleResetStats}
              className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-bold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Statistics
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
