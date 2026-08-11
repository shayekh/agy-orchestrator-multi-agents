import {
  GameState,
  PlayerSymbol,
  GameSettings,
  MoveHistoryItem,
  MatchRecord,
  MatchStats,
} from '../types/game';
import { checkWinner } from './winChecker';
import { getHintMove } from './hintEngine';

export type GameEvent =
  | { type: 'START_GAME' }
  | { type: 'MAKE_MOVE'; index: number }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'SHOW_HINT' }
  | { type: 'CLEAR_HINT' }
  | { type: 'UNDO_MOVE' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<GameSettings> }
  | { type: 'RESET_STATS' }
  | { type: 'TIME_TICK' };

export type GameAction = GameEvent;

export const INITIAL_SETTINGS: GameSettings = {
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

export const createInitialState = (
  customSettings?: Partial<GameSettings>,
  customStats?: Partial<MatchStats>
): GameState => {
  const boardSize = customSettings?.boardSize ?? INITIAL_SETTINGS.boardSize;
  const boardLength = boardSize * boardSize;

  const streakToWin = customSettings?.streakToWin ?? (boardSize === 3 ? 3 : 4);

  const audio = {
    ...INITIAL_SETTINGS.audio,
    ...(customSettings?.audio ?? {}),
  };

  const settings: GameSettings = {
    ...INITIAL_SETTINGS,
    boardSize,
    streakToWin,
    ...customSettings,
    audio,
  };

  const playerXStats = customStats?.playerX ?? {
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    bestStreak: 0,
    totalTimePlayedSeconds: 0,
  };

  const playerOStats = customStats?.playerO ?? {
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    bestStreak: 0,
    totalTimePlayedSeconds: 0,
  };

  const matchHistory = customStats?.history ?? [];

  return {
    status: 'IDLE',
    board: Array(boardLength).fill(null),
    size: boardSize,
    currentPlayer: 'X',
    winner: null,
    winningLine: null,
    history: [],
    matchHistory,
    turnTimeRemaining: settings.timeLimitSecondsPerTurn,
    playerX: {
      id: 'p1',
      name: 'Cyber Champion',
      symbol: 'X',
      color: '#00f3ff',
      stats: playerXStats,
      powerUpsRemaining: { WILDCARD: 1, TIME_REWIND: 1, DOUBLE_MOVE: 0, BOMB: 0 },
    },
    playerO: {
      id: 'p2',
      name: 'A.I. Overlord',
      symbol: 'O',
      color: '#ff007f',
      stats: playerOStats,
      powerUpsRemaining: { WILDCARD: 1, TIME_REWIND: 1, DOUBLE_MOVE: 0, BOMB: 0 },
    },
    settings,
    activeSubBoardIndex: null,
    hintResult: null,
  };
};

/**
 * Finite State Machine reducer for canonical game state management
 */
export function gameReducer(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'START_GAME': {
      const size = state.settings.boardSize;
      const boardLength = size * size;
      return {
        ...state,
        size,
        status: 'PLAYING',
        board: Array(boardLength).fill(null),
        currentPlayer: 'X',
        winner: null,
        winningLine: null,
        history: [],
        turnTimeRemaining: state.settings.timeLimitSecondsPerTurn,
        hintResult: null,
      };
    }

    case 'MAKE_MOVE': {
      if (state.status !== 'PLAYING') return state;
      const { index } = event;
      if (index < 0 || index >= state.board.length || state.board[index] !== null) {
        return state;
      }

      const newBoard = [...state.board];
      newBoard[index] = state.currentPlayer;

      const newHistoryItem: MoveHistoryItem = {
        index,
        player: state.currentPlayer,
        timestamp: Date.now(),
      };
      const updatedHistory = [...state.history, newHistoryItem];

      // Check win or draw condition
      const { winner, winningLine } = checkWinner(
        newBoard,
        state.settings.boardSize,
        state.settings.streakToWin
      );

      if (winner) {
        const isXWin = winner === 'X';
        const isOWin = winner === 'O';
        const isDraw = winner === 'DRAW';

        // Update statistics for player X and player O
        const updatedPlayerX = {
          ...state.playerX,
          stats: {
            ...state.playerX.stats,
            wins: state.playerX.stats.wins + (isXWin ? 1 : 0),
            losses: state.playerX.stats.losses + (isOWin ? 1 : 0),
            draws: state.playerX.stats.draws + (isDraw ? 1 : 0),
            winStreak: isXWin ? state.playerX.stats.winStreak + 1 : 0,
            bestStreak: isXWin
              ? Math.max(state.playerX.stats.bestStreak, state.playerX.stats.winStreak + 1)
              : state.playerX.stats.bestStreak,
          },
        };

        const updatedPlayerO = {
          ...state.playerO,
          stats: {
            ...state.playerO.stats,
            wins: state.playerO.stats.wins + (isOWin ? 1 : 0),
            losses: state.playerO.stats.losses + (isXWin ? 1 : 0),
            draws: state.playerO.stats.draws + (isDraw ? 1 : 0),
            winStreak: isOWin ? state.playerO.stats.winStreak + 1 : 0,
            bestStreak: isOWin
              ? Math.max(state.playerO.stats.bestStreak, state.playerO.stats.winStreak + 1)
              : state.playerO.stats.bestStreak,
          },
        };

        const matchRecord: MatchRecord = {
          id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          mode: state.settings.mode,
          boardSize: state.settings.boardSize,
          winner: winner,
          movesCount: updatedHistory.length,
        };

        const newMatchHistory = [matchRecord, ...(state.matchHistory || [])].slice(0, 50);

        return {
          ...state,
          board: newBoard,
          history: updatedHistory,
          matchHistory: newMatchHistory,
          winner,
          winningLine,
          status: isDraw ? 'DRAW' : 'VICTORY',
          playerX: updatedPlayerX,
          playerO: updatedPlayerO,
          hintResult: null,
        };
      }

      // Switch turns
      const nextPlayer: PlayerSymbol = state.currentPlayer === 'X' ? 'O' : 'X';
      return {
        ...state,
        board: newBoard,
        currentPlayer: nextPlayer,
        history: updatedHistory,
        turnTimeRemaining: state.settings.timeLimitSecondsPerTurn,
        hintResult: null,
      };
    }

    case 'SHOW_HINT': {
      if (state.status !== 'PLAYING') return state;
      const hint = getHintMove(
        state.board,
        state.settings.boardSize,
        state.currentPlayer,
        state.settings.streakToWin
      );
      return {
        ...state,
        hintResult: hint,
      };
    }

    case 'CLEAR_HINT': {
      return { ...state, hintResult: null };
    }

    case 'PAUSE_GAME': {
      if (state.status !== 'PLAYING') return state;
      return { ...state, status: 'PAUSED' };
    }

    case 'RESUME_GAME': {
      if (state.status !== 'PAUSED') return state;
      return { ...state, status: 'PLAYING' };
    }

    case 'RESET_GAME': {
      const size = state.settings.boardSize;
      const boardLength = size * size;
      return {
        ...state,
        size,
        status: 'PLAYING',
        board: Array(boardLength).fill(null),
        currentPlayer: 'X',
        winner: null,
        winningLine: null,
        history: [],
        turnTimeRemaining: state.settings.timeLimitSecondsPerTurn,
        hintResult: null,
      };
    }

    case 'UNDO_MOVE': {
      if (state.status === 'VICTORY' || state.status === 'DRAW') return state;
      if (state.history.length === 0) return state;

      const isAiMode = state.settings.mode.startsWith('AI_');
      // If playing against AI, undo both AI's move and human's move (2-ply) if available
      const stepsToUndo = isAiMode && state.history.length >= 2 ? 2 : 1;

      const newHistory = state.history.slice(0, -stepsToUndo);
      const boardLength = state.board.length;
      const newBoard = Array(boardLength).fill(null);

      // Replay history to rebuild clean board state
      newHistory.forEach((item) => {
        newBoard[item.index] = item.player;
      });

      const nextPlayer: PlayerSymbol = isAiMode
        ? 'X'
        : (newHistory.length % 2 === 0 ? 'X' : 'O');

      return {
        ...state,
        board: newBoard,
        history: newHistory,
        currentPlayer: nextPlayer,
        winner: null,
        winningLine: null,
        status: 'PLAYING',
        turnTimeRemaining: state.settings.timeLimitSecondsPerTurn,
        hintResult: null,
      };
    }

    case 'UPDATE_SETTINGS': {
      const updatedAudio = event.settings.audio
        ? { ...state.settings.audio, ...event.settings.audio }
        : state.settings.audio;

      const updatedSettings = {
        ...state.settings,
        ...event.settings,
        audio: updatedAudio,
      };
      const newSize = updatedSettings.boardSize;

      // Automatically adjust streak to win based on size
      if (event.settings.boardSize) {
        updatedSettings.streakToWin = newSize === 3 ? 3 : 4;
      }

      // Update AI player name based on selected mode
      const aiModeNames: Record<string, string> = {
        AI_EASY: 'Cyber Novice AI',
        AI_MEDIUM: 'Tactical AI',
        AI_HARD: 'Minimax AI',
        AI_UNBEATABLE: 'A.I. Overlord (Minimax)',
        PVP_LOCAL: 'Player 2 (Local)',
      };

      const playerOName = aiModeNames[updatedSettings.mode] || 'Opponent';

      return {
        ...state,
        settings: updatedSettings,
        size: newSize,
        board: Array(newSize * newSize).fill(null),
        status: 'IDLE',
        playerO: {
          ...state.playerO,
          name: playerOName,
        },
        hintResult: null,
      };
    }

    case 'RESET_STATS': {
      const zeroStats = { wins: 0, losses: 0, draws: 0, winStreak: 0, bestStreak: 0, totalTimePlayedSeconds: 0 };
      return {
        ...state,
        playerX: { ...state.playerX, stats: zeroStats },
        playerO: { ...state.playerO, stats: zeroStats },
        matchHistory: [],
      };
    }

    case 'TIME_TICK': {
      if (state.status !== 'PLAYING' || state.settings.timeLimitSecondsPerTurn === 0) return state;

      if (state.turnTimeRemaining <= 1) {
        // Switch turn on timeout
        const nextPlayer: PlayerSymbol = state.currentPlayer === 'X' ? 'O' : 'X';
        return {
          ...state,
          currentPlayer: nextPlayer,
          turnTimeRemaining: state.settings.timeLimitSecondsPerTurn,
          hintResult: null,
        };
      }
      return {
        ...state,
        turnTimeRemaining: state.turnTimeRemaining - 1,
      };
    }

    default:
      return state;
  }
}

export const gameStateReducer = gameReducer;
