import React from 'react';
import { motion } from 'framer-motion';
import { GameState, GameMode, BoardSize } from '../types/game';
import { Play, Pause, RotateCcw, Undo2, Cpu, Users, Zap, ShieldAlert, Timer, Grid3X3, Volume2, VolumeX, Lightbulb } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface ControlPanelProps {
  gameState: GameState;
  onStartGame: () => void;
  onPauseGame: () => void;
  onResumeGame: () => void;
  onResetGame: () => void;
  onUndoMove: () => void;
  onShowHint?: () => void;
  onSelectMode: (mode: GameMode) => void;
  onSelectBoardSize: (size: BoardSize) => void;
  onSelectTimeLimit: (seconds: number) => void;
  onSelectVolume?: (volume: number) => void;
}

const AI_MODES: { id: GameMode; name: string; desc: string; icon: React.ElementType; badge: string }[] = [
  { id: 'AI_UNBEATABLE', name: 'Unbeatable AI', desc: 'Minimax algorithm (0% loss rate)', icon: Zap, badge: 'PRO' },
  { id: 'AI_HARD', name: 'Hard AI', desc: 'Deep lookahead tactical AI', icon: Cpu, badge: 'HARD' },
  { id: 'AI_MEDIUM', name: 'Medium AI', desc: 'Heuristic + defensive block', icon: ShieldAlert, badge: 'MED' },
  { id: 'AI_EASY', name: 'Easy AI', desc: 'Casual random moves', icon: Cpu, badge: 'EASY' },
  { id: 'PVP_LOCAL', name: '2-Player Local', desc: 'Pass & play on same device', icon: Users, badge: 'PvP' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({
  gameState,
  onStartGame,
  onPauseGame,
  onResumeGame,
  onResetGame,
  onUndoMove,
  onShowHint,
  onSelectMode,
  onSelectBoardSize,
  onSelectTimeLimit,
  onSelectVolume,
}) => {
  const { status, settings, history } = gameState;
  const isPlaying = status === 'PLAYING';
  const isPaused = status === 'PAUSED';
  const canUndo = isPlaying && history.length > 0;

  const handleStart = () => {
    soundEngine.playClick();
    onStartGame();
  };

  const handleResume = () => {
    soundEngine.playClick();
    onResumeGame();
  };

  const handlePause = () => {
    soundEngine.playClick();
    onPauseGame();
  };

  const handleReset = () => {
    soundEngine.playClick();
    onResetGame();
  };

  const handleUndo = () => {
    soundEngine.playClick();
    onUndoMove();
  };

  const handleMode = (mode: GameMode) => {
    soundEngine.playClick();
    onSelectMode(mode);
  };

  const handleBoardSize = (size: BoardSize) => {
    soundEngine.playClick();
    onSelectBoardSize(size);
  };

  const handleTimeLimit = (sec: number) => {
    soundEngine.playClick();
    onSelectTimeLimit(sec);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    soundEngine.setVolume(vol);
    if (onSelectVolume) {
      onSelectVolume(vol);
    }
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 md:p-6 flex flex-col gap-6 border border-white/10 shadow-2xl">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Main Action Button */}
          {status === 'IDLE' ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleStart}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black tracking-wide text-sm flex items-center gap-2 shadow-glow-x hover:brightness-110 transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> START MATCH
            </motion.button>
          ) : isPaused ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleResume}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-600 text-slate-950 font-black tracking-wide text-sm flex items-center gap-2 shadow-glow-o hover:brightness-110 transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> RESUME
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePause}
              className="px-5 py-3 rounded-xl bg-slate-800/90 border border-amber-500/40 text-amber-400 font-bold text-sm flex items-center gap-2 hover:bg-amber-500/10 transition-all"
            >
              <Pause className="w-4 h-4 fill-current" /> PAUSE
            </motion.button>
          )}

          {/* Restart Match */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleReset}
            className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all"
            title="Reset Board"
          >
            <RotateCcw className="w-4 h-4" /> Restart
          </motion.button>

          {/* Undo Move */}
          <motion.button
            whileHover={canUndo ? { scale: 1.03 } : {}}
            whileTap={canUndo ? { scale: 0.97 } : {}}
            onClick={handleUndo}
            disabled={!canUndo}
            className={`px-4 py-3 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all ${
              canUndo
                ? 'bg-slate-900/80 border-purple-500/40 text-purple-400 hover:bg-purple-500/10 cursor-pointer'
                : 'bg-slate-950/40 border-white/5 text-slate-600 cursor-not-allowed'
            }`}
            title="Undo Last Move"
          >
            <Undo2 className="w-4 h-4" /> Undo
          </motion.button>

          {/* Tactical AI Hint */}
          <motion.button
            whileHover={isPlaying ? { scale: 1.03 } : {}}
            whileTap={isPlaying ? { scale: 0.97 } : {}}
            onClick={() => {
              soundEngine.playClick();
              if (onShowHint) onShowHint();
            }}
            disabled={!isPlaying}
            className={`px-4 py-3 rounded-xl border text-sm font-bold flex items-center gap-2 transition-all ${
              isPlaying
                ? 'bg-slate-900/80 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 cursor-pointer'
                : 'bg-slate-950/40 border-white/5 text-slate-600 cursor-not-allowed'
            }`}
            title="Get Tactical AI Hint"
          >
            <Lightbulb className="w-4 h-4" /> Hint
          </motion.button>
        </div>

        {/* Current Game Status Indicator */}
        <div className="flex items-center gap-2 bg-slate-950/60 px-4 py-2 rounded-xl border border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            {status === 'IDLE' && 'LOBBY READY'}
            {status === 'PLAYING' && `PLAYER ${gameState.currentPlayer}'S TURN`}
            {status === 'PAUSED' && 'MATCH PAUSED'}
            {status === 'VICTORY' && `VICTORY: ${gameState.winner}`}
            {status === 'DRAW' && 'DRAW MATCH'}
          </span>
        </div>
      </div>

      {/* Mode & Grid Config Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Game Mode Selector */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" /> Mode Selection
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {AI_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = settings.mode === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => handleMode(mode.id)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/10 text-white shadow-glow-x'
                      : 'border-white/10 bg-slate-900/40 text-slate-400 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold font-display text-slate-100 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-cyan-400" /> {mode.name}
                    </span>
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-950 border border-white/10 text-cyan-400">
                      {mode.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 line-clamp-1">{mode.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Board Size & Turn Timer & Master Volume Settings */}
        <div className="flex flex-col gap-5">
          {/* Board Size */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Grid3X3 className="w-4 h-4 text-pink-400" /> Grid Dimension
            </label>
            <div className="flex gap-2.5">
              {[3, 4, 5].map((size) => (
                <button
                  key={size}
                  onClick={() => handleBoardSize(size as BoardSize)}
                  className={`flex-1 py-2.5 rounded-xl font-mono font-bold text-xs transition-all border ${
                    settings.boardSize === size
                      ? 'bg-gradient-to-r from-pink-500 to-rose-600 border-pink-400 text-white shadow-glow-o'
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {size}x{size} Grid
                </button>
              ))}
            </div>
          </div>

          {/* Turn Timer Selector */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-amber-400" /> Turn Time Limit
            </label>
            <div className="flex gap-2">
              {[
                { sec: 0, label: 'Off' },
                { sec: 10, label: '10s' },
                { sec: 15, label: '15s' },
                { sec: 30, label: '30s' },
              ].map((item) => (
                <button
                  key={item.sec}
                  onClick={() => handleTimeLimit(item.sec)}
                  className={`flex-1 py-2 rounded-xl font-mono font-bold text-xs transition-all border ${
                    settings.timeLimitSecondsPerTurn === item.sec
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Master Volume Slider */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Volume2 className="w-4 h-4" /> Master Volume
              </span>
              <span className="font-mono text-cyan-400 font-bold">
                {Math.round((settings.audio?.masterVolume ?? 0.8) * 100)}%
              </span>
            </label>
            <div className="flex items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-white/10">
              <VolumeX className="w-4 h-4 text-slate-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.audio?.masterVolume ?? 0.8}
                onChange={handleVolumeChange}
                className="w-full accent-cyan-400 cursor-pointer h-2 rounded-lg bg-slate-800"
              />
              <Volume2 className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

