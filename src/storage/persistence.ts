import {
  GameSettings,
  MatchStats,
  PlayerStats,
  MatchRecord,
  GameMode,
  BoardSize,
  ThemeMode,
} from '../types/game';

export const STATS_STORAGE_KEY = 'ultra_tictactoe_stats_v1';
export const SETTINGS_STORAGE_KEY = 'ultra_tictactoe_settings_v1';

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  wins: 0,
  losses: 0,
  draws: 0,
  winStreak: 0,
  bestStreak: 0,
  totalTimePlayedSeconds: 0,
};

export const DEFAULT_SETTINGS: GameSettings = {
  mode: 'AI_UNBEATABLE',
  boardSize: 3,
  streakToWin: 3,
  timeLimitSecondsPerTurn: 15,
  powerUpsEnabled: false,
  theme: 'CYBERPUNK',
  audio: {
    masterVolume: 0.8,
    sfxEnabled: true,
    bgmEnabled: false,
    hapticFeedback: true,
  },
};

export const DEFAULT_MATCH_STATS: MatchStats = {
  playerX: { ...DEFAULT_PLAYER_STATS },
  playerO: { ...DEFAULT_PLAYER_STATS },
  history: [],
};

const VALID_MODES: GameMode[] = [
  'PVP_LOCAL',
  'PVP_ONLINE',
  'AI_EASY',
  'AI_MEDIUM',
  'AI_HARD',
  'AI_UNBEATABLE',
  'ULTIMATE',
  'QUANTUM',
];

const VALID_THEMES: ThemeMode[] = [
  'CYBERPUNK',
  'GLASSMORPHISM',
  'RETRO_ARCADE',
  'MINIMAL_LUXURY',
  'COSMIC_NEON',
];

/**
 * Sanitizes and validates a PlayerStats object, guaranteeing all fields are numbers >= 0.
 */
function sanitizePlayerStats(rawStats: any): PlayerStats {
  if (!rawStats || typeof rawStats !== 'object' || Array.isArray(rawStats)) {
    return { ...DEFAULT_PLAYER_STATS };
  }

  const parseNum = (val: any, fallback: number = 0): number => {
    if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
      return Number.isInteger(val) ? val : Math.floor(val);
    }
    return fallback;
  };

  return {
    wins: parseNum(rawStats.wins),
    losses: parseNum(rawStats.losses),
    draws: parseNum(rawStats.draws),
    winStreak: parseNum(rawStats.winStreak),
    bestStreak: parseNum(rawStats.bestStreak),
    totalTimePlayedSeconds: parseNum(rawStats.totalTimePlayedSeconds),
  };
}

/**
 * Sanitizes and validates a single MatchRecord item.
 */
function sanitizeMatchRecord(rawRecord: any): MatchRecord | null {
  if (!rawRecord || typeof rawRecord !== 'object') return null;

  const id =
    typeof rawRecord.id === 'string' && rawRecord.id.trim().length > 0
      ? rawRecord.id
      : `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const timestamp =
    typeof rawRecord.timestamp === 'number' && !isNaN(rawRecord.timestamp)
      ? rawRecord.timestamp
      : Date.now();

  const mode: GameMode = VALID_MODES.includes(rawRecord.mode)
    ? rawRecord.mode
    : 'AI_UNBEATABLE';

  const boardSize: BoardSize = [3, 4, 5].includes(rawRecord.boardSize)
    ? (rawRecord.boardSize as BoardSize)
    : 3;

  const winner = ['X', 'O', 'DRAW'].includes(rawRecord.winner)
    ? rawRecord.winner
    : 'DRAW';

  const movesCount =
    typeof rawRecord.movesCount === 'number' &&
    !isNaN(rawRecord.movesCount) &&
    rawRecord.movesCount >= 0
      ? rawRecord.movesCount
      : 0;

  return {
    id,
    timestamp,
    mode,
    boardSize,
    winner,
    movesCount,
  };
}

/**
 * Sanitizes and validates a GameSettings object, performing deep merges on nested audio properties.
 */
export function sanitizeSettings(rawSettings: any): GameSettings {
  if (!rawSettings || typeof rawSettings !== 'object' || Array.isArray(rawSettings)) {
    return { ...DEFAULT_SETTINGS, audio: { ...DEFAULT_SETTINGS.audio } };
  }

  const mode: GameMode = VALID_MODES.includes(rawSettings.mode)
    ? rawSettings.mode
    : DEFAULT_SETTINGS.mode;
  const boardSize: BoardSize = [3, 4, 5].includes(rawSettings.boardSize)
    ? rawSettings.boardSize
    : DEFAULT_SETTINGS.boardSize;

  const streakToWin =
    typeof rawSettings.streakToWin === 'number' && rawSettings.streakToWin > 0
      ? rawSettings.streakToWin
      : boardSize === 3
      ? 3
      : 4;

  const timeLimitSecondsPerTurn =
    typeof rawSettings.timeLimitSecondsPerTurn === 'number' &&
    rawSettings.timeLimitSecondsPerTurn >= 0
      ? rawSettings.timeLimitSecondsPerTurn
      : DEFAULT_SETTINGS.timeLimitSecondsPerTurn;

  const powerUpsEnabled =
    typeof rawSettings.powerUpsEnabled === 'boolean'
      ? rawSettings.powerUpsEnabled
      : DEFAULT_SETTINGS.powerUpsEnabled;

  const theme: ThemeMode = VALID_THEMES.includes(rawSettings.theme)
    ? rawSettings.theme
    : DEFAULT_SETTINGS.theme;

  const rawAudio =
    rawSettings.audio && typeof rawSettings.audio === 'object'
      ? rawSettings.audio
      : {};

  const masterVolume =
    typeof rawAudio.masterVolume === 'number' && !isNaN(rawAudio.masterVolume)
      ? Math.max(0, Math.min(1, rawAudio.masterVolume))
      : DEFAULT_SETTINGS.audio.masterVolume;

  const sfxEnabled =
    typeof rawAudio.sfxEnabled === 'boolean'
      ? rawAudio.sfxEnabled
      : DEFAULT_SETTINGS.audio.sfxEnabled;
  const bgmEnabled =
    typeof rawAudio.bgmEnabled === 'boolean'
      ? rawAudio.bgmEnabled
      : DEFAULT_SETTINGS.audio.bgmEnabled;
  const hapticFeedback =
    typeof rawAudio.hapticFeedback === 'boolean'
      ? rawAudio.hapticFeedback
      : DEFAULT_SETTINGS.audio.hapticFeedback;

  return {
    mode,
    boardSize,
    streakToWin,
    timeLimitSecondsPerTurn,
    powerUpsEnabled,
    theme,
    audio: {
      masterVolume,
      sfxEnabled,
      bgmEnabled,
      hapticFeedback,
    },
  };
}

/**
 * Sanitizes and validates a MatchStats object, guaranteeing playerX, playerO, and history array.
 */
export function sanitizeStats(rawStats: any): MatchStats {
  if (!rawStats || typeof rawStats !== 'object' || Array.isArray(rawStats)) {
    return {
      playerX: { ...DEFAULT_PLAYER_STATS },
      playerO: { ...DEFAULT_PLAYER_STATS },
      history: [],
    };
  }

  const playerX = sanitizePlayerStats(rawStats.playerX);
  const playerO = sanitizePlayerStats(rawStats.playerO);

  let history: MatchRecord[] = [];
  if (Array.isArray(rawStats.history)) {
    history = rawStats.history
      .map(sanitizeMatchRecord)
      .filter((rec: MatchRecord | null): rec is MatchRecord => rec !== null)
      .slice(0, 50); // Capped at 50 items max
  }

  return {
    playerX,
    playerO,
    history,
  };
}

/**
 * Load settings from localStorage with deep fallback sanitization.
 */
export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS, audio: { ...DEFAULT_SETTINGS.audio } };
    const parsed = JSON.parse(raw);
    return sanitizeSettings(parsed);
  } catch (error) {
    console.warn('Failed to load settings from localStorage, using defaults:', error);
    return { ...DEFAULT_SETTINGS, audio: { ...DEFAULT_SETTINGS.audio } };
  }
}

/**
 * Save settings to localStorage safely.
 */
export function saveSettings(settings: GameSettings): void {
  try {
    const sanitized = sanitizeSettings(settings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error);
  }
}

/**
 * Load stats from localStorage with deep fallback sanitization.
 */
export function loadStats(): MatchStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw)
      return {
        playerX: { ...DEFAULT_PLAYER_STATS },
        playerO: { ...DEFAULT_PLAYER_STATS },
        history: [],
      };
    const parsed = JSON.parse(raw);
    return sanitizeStats(parsed);
  } catch (error) {
    console.warn('Failed to load stats from localStorage, using defaults:', error);
    return {
      playerX: { ...DEFAULT_PLAYER_STATS },
      playerO: { ...DEFAULT_PLAYER_STATS },
      history: [],
    };
  }
}

/**
 * Save stats to localStorage safely.
 */
export function saveStats(stats: MatchStats): void {
  try {
    const sanitized = sanitizeStats(stats);
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (error) {
    console.warn('Failed to save stats to localStorage:', error);
  }
}

/**
 * Clear stats from localStorage and return reset default stats object.
 */
export function clearStats(): MatchStats {
  const resetStats: MatchStats = {
    playerX: { ...DEFAULT_PLAYER_STATS },
    playerO: { ...DEFAULT_PLAYER_STATS },
    history: [],
  };
  try {
    localStorage.removeItem(STATS_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear stats from localStorage:', error);
  }
  return resetStats;
}
