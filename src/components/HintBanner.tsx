import React from 'react';
import { Lightbulb } from 'lucide-react';
import { GameState } from '../types/game';

interface HintBannerProps {
  gameState: GameState;
}

export const HintBanner: React.FC<HintBannerProps> = ({ gameState }) => {
  const { hintResult, status } = gameState;

  if (!hintResult || status !== 'PLAYING') return null;

  return (
    <div className="glass-panel p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center gap-3 animate-fadeIn">
      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
        <Lightbulb className="w-5 h-5 animate-pulse" />
      </div>
      <div className="flex-1">
        <div className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">
          Tactical Recommendation (Cell #{hintResult.index + 1})
        </div>
        <div className="text-sm text-slate-200">{hintResult.explanation}</div>
      </div>
    </div>
  );
};
