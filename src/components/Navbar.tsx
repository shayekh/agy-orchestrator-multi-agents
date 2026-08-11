import React from 'react';
import { motion } from 'framer-motion';
import { GameState } from '../types/game';
import { Gamepad2, Settings, Trophy, Volume2, VolumeX, Sparkles, Palette, Clock } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface NavbarProps {
  gameState: GameState;
  activeTab: 'PLAY' | 'SETTINGS' | 'STATS';
  setActiveTab: (tab: 'PLAY' | 'SETTINGS' | 'STATS') => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onOpenThemeSelector?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  gameState,
  activeTab,
  setActiveTab,
  audioEnabled,
  onToggleAudio,
  onOpenThemeSelector,
}) => {
  const { playerX, playerO, currentPlayer, status, settings, turnTimeRemaining } = gameState;
  const isTurnX = currentPlayer === 'X' && status === 'PLAYING';
  const isTurnO = currentPlayer === 'O' && status === 'PLAYING';

  const handleTabClick = (tab: 'PLAY' | 'SETTINGS' | 'STATS') => {
    soundEngine.playClick();
    setActiveTab(tab);
  };

  const handleToggleAudio = () => {
    soundEngine.playClick();
    onToggleAudio();
  };

  const handleOpenTheme = () => {
    soundEngine.playClick();
    if (onOpenThemeSelector) {
      onOpenThemeSelector();
    }
  };

  return (
    <header className="w-full glass-panel rounded-2xl p-4 md:p-5 flex flex-col lg:flex-row items-center justify-between gap-4 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background Accent Lines */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-pink-500/5 pointer-events-none" />

      {/* Brand Title */}
      <div className="flex items-center gap-3.5 z-10">
        <motion.div
          whileHover={{ rotate: 180 }}
          transition={{ duration: 0.6 }}
          className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 p-[2px] shadow-glow-x cursor-pointer"
          onClick={() => handleTabClick('PLAY')}
        >
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
        </motion.div>
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-wider font-display bg-gradient-to-r from-cyan-400 via-white to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
            ULTRA TIC-TAC-TOE
          </h1>
          <p className="text-[11px] text-slate-400 font-mono tracking-wide">
            MODE: <span className="text-cyan-400 font-bold">{settings.mode.replace('_', ' ')}</span> ({settings.boardSize}x{settings.boardSize})
          </p>
        </div>
      </div>

      {/* Turn & Score Indicator Bar (Visible during Play tab) */}
      {activeTab === 'PLAY' && (
        <div className="flex items-center gap-4 bg-slate-950/60 py-2 px-4 rounded-xl border border-white/10 shadow-inner z-10">
          {/* Player X */}
          <div className={`flex items-center gap-2.5 transition-all p-1.5 rounded-lg ${isTurnX ? 'bg-cyan-500/10 ring-1 ring-cyan-400/50 shadow-glow-x' : 'opacity-70'}`}>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center font-black font-display text-cyan-400 shadow-sm text-sm">
              X
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-200 leading-tight">{playerX.name}</div>
              <div className="text-[10px] text-cyan-400 font-mono font-bold">WINS: {playerX.stats.wins}</div>
            </div>
          </div>

          {/* Timer & VS Divider */}
          <div className="flex flex-col items-center justify-center px-1">
            <span className="text-xs font-black font-mono text-slate-400 tracking-wider">VS</span>
            {settings.timeLimitSecondsPerTurn > 0 && status === 'PLAYING' && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-bold mt-0.5">
                <Clock className="w-3 h-3 animate-spin" />
                <span>{turnTimeRemaining}s</span>
              </div>
            )}
          </div>

          {/* Player O */}
          <div className={`flex items-center gap-2.5 transition-all p-1.5 rounded-lg ${isTurnO ? 'bg-pink-500/10 ring-1 ring-pink-400/50 shadow-glow-o' : 'opacity-70'}`}>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-200 leading-tight">{playerO.name}</div>
              <div className="text-[10px] text-pink-400 font-mono font-bold">WINS: {playerO.stats.wins}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-400 flex items-center justify-center font-black font-display text-pink-400 shadow-sm text-sm">
              O
            </div>
          </div>
        </div>
      )}

      {/* Navigation Controls & Action Buttons */}
      <div className="flex items-center gap-2 z-10">
        <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => handleTabClick('PLAY')}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'PLAY'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Gamepad2 className="w-4 h-4" /> Arena
          </button>
          <button
            onClick={() => handleTabClick('SETTINGS')}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'SETTINGS'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" /> Config
          </button>
          <button
            onClick={() => handleTabClick('STATS')}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'STATS'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-4 h-4" /> Stats
          </button>
        </nav>

        {/* Mute/Sound Toggle */}
        <button
          onClick={handleToggleAudio}
          className={`p-2 rounded-xl border transition-all ${
            audioEnabled
              ? 'bg-slate-900/80 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/20'
              : 'bg-slate-900/60 border-white/10 text-slate-500 hover:text-slate-300'
          }`}
          title={audioEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Theme Quick Toggle Button */}
        {onOpenThemeSelector && (
          <button
            onClick={handleOpenTheme}
            className="p-2 rounded-xl bg-slate-900/80 border border-pink-500/40 text-pink-400 hover:bg-pink-500/20 transition-all"
            title="Switch Theme Palette"
          >
            <Palette className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};

