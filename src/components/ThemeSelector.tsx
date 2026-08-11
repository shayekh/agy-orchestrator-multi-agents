import React from 'react';
import { motion } from 'framer-motion';
import { ThemeMode } from '../types/game';
import { Sparkles, Layers, Tv, Crown, Orbit, Check } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface ThemeOption {
  id: ThemeMode;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  xColor: string;
  oColor: string;
  gradientBg: string;
  borderColor: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'CYBERPUNK',
    name: 'Cyberpunk Neon',
    subtitle: 'High contrast cyan & magenta neon grid',
    icon: Sparkles,
    xColor: '#00f3ff',
    oColor: '#ff007f',
    gradientBg: 'from-[#0a0a12] via-[#171728] to-[#0a0a12]',
    borderColor: 'border-[#00f3ff]/40',
  },
  {
    id: 'GLASSMORPHISM',
    name: 'Glassmorphism Frost',
    subtitle: 'Translucent ice blue & emerald frosted glass',
    icon: Layers,
    xColor: '#38bdf8',
    oColor: '#34d399',
    gradientBg: 'from-[#0f172a] via-[#1e293b] to-[#0f172a]',
    borderColor: 'border-[#38bdf8]/40',
  },
  {
    id: 'RETRO_ARCADE',
    name: 'Retro Synthwave',
    subtitle: '80s arcade hot pink & vivid purple grid',
    icon: Tv,
    xColor: '#f43f5e',
    oColor: '#c084fc',
    gradientBg: 'from-[#180828] via-[#2d104c] to-[#180828]',
    borderColor: 'border-[#f43f5e]/40',
  },
  {
    id: 'MINIMAL_LUXURY',
    name: 'Minimalist Luxury',
    subtitle: 'Obsidian dark with champagne gold glow',
    icon: Crown,
    xColor: '#eab308',
    oColor: '#f59e0b',
    gradientBg: 'from-[#09090b] via-[#18181b] to-[#09090b]',
    borderColor: 'border-[#eab308]/40',
  },
  {
    id: 'COSMIC_NEON',
    name: 'Cosmic Nebula',
    subtitle: 'Deep galactic violet & emerald space dust',
    icon: Orbit,
    xColor: '#8b5cf6',
    oColor: '#10b981',
    gradientBg: 'from-[#090514] via-[#170f2d] to-[#090514]',
    borderColor: 'border-[#8b5cf6]/40',
  },
];

interface ThemeSelectorProps {
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onSelectTheme }) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Accessible combobox select for accessibility & DOM test suites */}
      <select
        role="combobox"
        aria-label="Theme Selection"
        value={currentTheme}
        onChange={(e) => onSelectTheme(e.target.value as ThemeMode)}
        className="sr-only"
      >
        {THEME_OPTIONS.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {THEME_OPTIONS.map((theme) => {
        const Icon = theme.icon;
        const isSelected = currentTheme === theme.id;

        return (
          <motion.button
            key={theme.id}
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              soundEngine.playClick();
              onSelectTheme(theme.id);
            }}
            className={`relative p-5 rounded-2xl text-left border transition-all flex flex-col justify-between overflow-hidden group ${
              isSelected
                ? `${theme.borderColor} bg-white/10 shadow-2xl ring-2 ring-offset-2 ring-offset-slate-950 ring-cyan-500/50`
                : 'border-white/10 bg-slate-900/40 hover:border-white/25 hover:bg-white/5'
            }`}
          >
            {/* Background Glow */}
            <div
              className={`absolute -right-8 -bottom-8 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-r ${theme.gradientBg}`}
            />

            <div className="flex items-start justify-between z-10">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-slate-950/60 shadow-lg"
                  style={{ color: theme.xColor }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-display text-white text-base flex items-center gap-2">
                    {theme.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{theme.subtitle}</p>
                </div>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </motion.div>
              )}
            </div>

            {/* Color Swatch Preview */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between z-10">
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">Palette</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs font-bold font-mono" style={{ color: theme.xColor }}>
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: theme.xColor }} />
                  X
                </div>
                <div className="flex items-center gap-1 text-xs font-bold font-mono" style={{ color: theme.oColor }}>
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: theme.oColor }} />
                  O
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
      </div>
    </div>
  );
};

