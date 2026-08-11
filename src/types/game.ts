export type PlayerSymbol = 'X' | 'O';
export type CellValue = PlayerSymbol | null;

export type GameMode = 
  | 'PVP_LOCAL'      // 2 Players on same device
  | 'PVP_ONLINE'     // Online multiplayer (WebRTC/Socket)
  | 'AI_EASY'        // Random moves AI
  | 'AI_MEDIUM'      // Heuristic + Defensive AI
  | 'AI_HARD'        // Minimax with Alpha-Beta Pruning
  | 'AI_UNBEATABLE'  // Perfect Minimax + Depth evaluation
  | 'ULTIMATE'       // 9 3x3 grids (Ultimate Tic-Tac-Toe)
  | 'QUANTUM';       // Quantum superposition moves

export type BoardSize = 3 | 4 | 5;

export type ThemeMode = 
  | 'CYBERPUNK' 
  | 'GLASSMORPHISM' 
  | 'RETRO_ARCADE' 
  | 'MINIMAL_LUXURY' 
  | 'COSMIC_NEON';

export type GameStatus = 
  | 'IDLE'           // Lobby / Main Menu
  | 'SETTINGS'       // Customizing match
  | 'PLAYING'        // Active gameplay
  | 'PAUSED'         // Game paused
  | 'VICTORY'        // Someone won
  | 'DRAW';          // Game tied

export type PowerUpType = 'WILDCARD' | 'TIME_REWIND' | 'DOUBLE_MOVE' | 'BOMB';

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestStreak: number;
  totalTimePlayedSeconds: number;
}

export interface MatchRecord {
  id: string;
  timestamp: number;
  mode: GameMode;
  boardSize: BoardSize;
  winner: PlayerSymbol | 'DRAW';
  movesCount: number;
}

export interface MatchStats {
  playerX: PlayerStats;
  playerO: PlayerStats;
  history: MatchRecord[];
}

export interface PlayerProfile {
  id: string;
  name: string;
  symbol: PlayerSymbol;
  avatarUrl?: string;
  color: string;
  stats: PlayerStats;
  powerUpsRemaining: Record<PowerUpType, number>;
}

export interface WinningLine {
  combo: number[];
  direction: 'HORIZONTAL' | 'VERTICAL' | 'DIAGONAL_MAIN' | 'DIAGONAL_SUB';
}

export interface MoveHistoryItem {
  index: number;
  player: PlayerSymbol;
  timestamp: number;
  powerUpUsed?: PowerUpType;
  subBoardIndex?: number;
}

export interface AudioSettings {
  masterVolume: number; // 0.0 - 1.0
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  hapticFeedback: boolean;
}

export interface GameSettings {
  mode: GameMode;
  boardSize: BoardSize;
  streakToWin: number;
  timeLimitSecondsPerTurn: number; // 0 = unlimited
  powerUpsEnabled: boolean;
  theme: ThemeMode;
  audio: AudioSettings;
}

export interface HintResult {
  index: number;
  score: number;
  explanation: string;
}

export interface GameState {
  status: GameStatus;
  board: CellValue[];
  size: BoardSize;
  currentPlayer: PlayerSymbol;
  winner: PlayerSymbol | 'DRAW' | null;
  winningLine: WinningLine | null;
  history: MoveHistoryItem[];
  matchHistory: MatchRecord[];
  turnTimeRemaining: number;
  playerX: PlayerProfile;
  playerO: PlayerProfile;
  settings: GameSettings;
  activeSubBoardIndex: number | null;
  hintResult: HintResult | null;
}
