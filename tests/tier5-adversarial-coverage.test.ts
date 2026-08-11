import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadSettings,
  saveSettings,
  loadStats,
  saveStats,
  clearStats,
  sanitizeSettings,
  sanitizeStats,
  DEFAULT_SETTINGS,
  DEFAULT_PLAYER_STATS,
  SETTINGS_STORAGE_KEY,
  STATS_STORAGE_KEY,
} from '../src/storage/persistence';
import {
  createInitialState,
  gameReducer,
  INITIAL_SETTINGS,
  GameEvent,
} from '../src/logic/gameReducer';
import {
  getBestMove,
  minimaxAlphaBeta,
  findImmediateWinOrBlock,
  evaluateHeuristic,
} from '../src/logic/minimax';
import {
  checkWinner,
  checkWin,
  checkDraw,
  isBoardFull,
  getAvailableMoves,
} from '../src/logic/winChecker';
import { getHintMove } from '../src/logic/hintEngine';
import { GameState, GameSettings, MatchStats, CellValue } from '../src/types/game';

describe('Tier 5 Adversarial Coverage Hardening Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ==========================================
  // FOCUS AREA 1: Corrupted localStorage Schemas
  // ==========================================
  describe('1. Corrupted localStorage Schemas & Fallback Recovery', () => {
    it('1.1 should fall back to default settings when storage contains invalid JSON strings', () => {
      const invalidJsonStrings = [
        '{bad_json: true,}',
        'undefined',
        '{',
        '[object Object]',
        'null',
      ];

      invalidJsonStrings.forEach((invalidStr) => {
        localStorage.setItem(SETTINGS_STORAGE_KEY, invalidStr);
        const settings = loadSettings();
        expect(settings).toBeDefined();
        expect(settings.mode).toBe('AI_UNBEATABLE');
        expect(settings.boardSize).toBe(3);
        expect(settings.theme).toBe('CYBERPUNK');
        expect(settings.audio.masterVolume).toBe(0.8);
      });
    });

    it('1.2 should fall back to default stats when stats storage contains invalid JSON strings', () => {
      const invalidJsonStrings = ['{corrupted', 'undefined', '{"playerX":', ''];

      invalidJsonStrings.forEach((invalidStr) => {
        localStorage.setItem(STATS_STORAGE_KEY, invalidStr);
        const stats = loadStats();
        expect(stats).toBeDefined();
        expect(stats.playerX.wins).toBe(0);
        expect(stats.playerO.wins).toBe(0);
        expect(stats.history).toEqual([]);
      });
    });

    it('1.3 should handle primitive or array types stored in settings key gracefully', () => {
      const primitives = [12345, true, 'cyberpunk_string', [1, 2, 3]];

      primitives.forEach((val) => {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(val));
        const settings = loadSettings();
        expect(settings.mode).toBe(DEFAULT_SETTINGS.mode);
        expect(settings.boardSize).toBe(DEFAULT_SETTINGS.boardSize);
        expect(settings.theme).toBe(DEFAULT_SETTINGS.theme);
      });
    });

    it('1.4 should sanitize corrupted/out-of-range individual fields in settings', () => {
      const corruptedSettings = {
        mode: 'SUPER_GOD_MODE', // invalid mode
        boardSize: 99, // invalid board size
        streakToWin: -10, // invalid streak
        timeLimitSecondsPerTurn: 'unlimited', // wrong type
        powerUpsEnabled: 'yes', // wrong type
        theme: 'UNKNOWN_THEME', // invalid theme
        audio: {
          masterVolume: 9999, // out of range
          sfxEnabled: 'true', // wrong type
          bgmEnabled: null, // wrong type
          hapticFeedback: 1, // wrong type
        },
      };

      const sanitized = sanitizeSettings(corruptedSettings);
      expect(sanitized.mode).toBe('AI_UNBEATABLE');
      expect(sanitized.boardSize).toBe(3);
      expect(sanitized.streakToWin).toBe(3);
      expect(sanitized.timeLimitSecondsPerTurn).toBe(DEFAULT_SETTINGS.timeLimitSecondsPerTurn);
      expect(sanitized.powerUpsEnabled).toBe(DEFAULT_SETTINGS.powerUpsEnabled);
      expect(sanitized.theme).toBe('CYBERPUNK');
      expect(sanitized.audio.masterVolume).toBe(1); // clamped to 1
      expect(sanitized.audio.sfxEnabled).toBe(DEFAULT_SETTINGS.audio.sfxEnabled);
      expect(sanitized.audio.bgmEnabled).toBe(DEFAULT_SETTINGS.audio.bgmEnabled);
      expect(sanitized.audio.hapticFeedback).toBe(DEFAULT_SETTINGS.audio.hapticFeedback);
    });

    it('1.5 should clamp negative masterVolume to 0 and non-numeric masterVolume to default', () => {
      const negativeVol = sanitizeSettings({ audio: { masterVolume: -5 } });
      expect(negativeVol.audio.masterVolume).toBe(0);

      const nanVol = sanitizeSettings({ audio: { masterVolume: NaN } });
      expect(nanVol.audio.masterVolume).toBe(DEFAULT_SETTINGS.audio.masterVolume);
    });

    it('1.6 should sanitize player stats with negative, NaN, non-integer, or string values', () => {
      const corruptedStats = {
        playerX: {
          wins: -5,
          losses: NaN,
          draws: '100',
          winStreak: Infinity,
          bestStreak: -1,
          totalTimePlayedSeconds: undefined,
        },
        playerO: null,
        history: 'not_an_array',
      };

      const sanitized = sanitizeStats(corruptedStats);
      expect(sanitized.playerX.wins).toBe(0);
      expect(sanitized.playerX.losses).toBe(0);
      expect(sanitized.playerX.draws).toBe(0);
      expect(sanitized.playerX.winStreak).toBe(0);
      expect(sanitized.playerX.bestStreak).toBe(0);
      expect(sanitized.playerX.totalTimePlayedSeconds).toBe(0);

      expect(sanitized.playerO).toEqual(DEFAULT_PLAYER_STATS);
      expect(sanitized.history).toEqual([]);
    });

    it('1.7 should filter out corrupted match history records and cap total history length at 50', () => {
      const badRecords = [
        null,
        'string_record',
        123,
        {},
        { id: '', timestamp: 'invalid', mode: 'BAD_MODE', boardSize: 10, winner: 'X_WINNER', movesCount: -5 },
      ];

      const oversizedHistory = Array.from({ length: 70 }, (_, i) => ({
        id: `match_${i}`,
        timestamp: Date.now() + i,
        mode: 'AI_UNBEATABLE',
        boardSize: 3,
        winner: 'X',
        movesCount: 5,
      }));

      const rawStats = {
        playerX: { ...DEFAULT_PLAYER_STATS },
        playerO: { ...DEFAULT_PLAYER_STATS },
        history: [...badRecords, ...oversizedHistory],
      };

      const sanitized = sanitizeStats(rawStats);
      // Bad records are filtered out or sanitized to valid record objects, total length max 50
      expect(sanitized.history.length).toBeLessThanOrEqual(50);
      expect(sanitized.history.every((item) => typeof item.id === 'string' && item.id.length > 0)).toBe(true);
    });

    it('1.8 should handle localStorage throwing exceptions (e.g., QuotaExceededError or security block)', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('SecurityError: Access is denied', 'SecurityError');
      });

      const settings = loadSettings();
      expect(settings.mode).toBe('AI_UNBEATABLE');

      const stats = loadStats();
      expect(stats.playerX.wins).toBe(0);

      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError: Storage quota exceeded', 'QuotaExceededError');
      });

      expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();
      expect(() => saveStats({ playerX: DEFAULT_PLAYER_STATS, playerO: DEFAULT_PLAYER_STATS, history: [] })).not.toThrow();

      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new DOMException('PermissionDenied', 'SecurityError');
      });
      const reset = clearStats();
      expect(reset.playerX.wins).toBe(0);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  // ==========================================
  // FOCUS AREA 2: Boundary Undo Reversals
  // ==========================================
  describe('2. Boundary Undo Reversals & FSM State Integrity', () => {
    it('2.1 should safely handle UNDO_MOVE on 0-move history', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME' });

      expect(state.history.length).toBe(0);
      const afterUndo = gameReducer(state, { type: 'UNDO_MOVE' });

      expect(afterUndo.history.length).toBe(0);
      expect(afterUndo.board.every((cell) => cell === null)).toBe(true);
      expect(afterUndo.currentPlayer).toBe('X');
      expect(afterUndo.status).toBe('PLAYING');
    });

    it('2.2 should revert 1 move in PVP_LOCAL mode correctly', () => {
      let state = createInitialState({ mode: 'PVP_LOCAL' });
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X plays 0

      expect(state.history.length).toBe(1);
      expect(state.currentPlayer).toBe('O');

      const afterUndo = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(afterUndo.history.length).toBe(0);
      expect(afterUndo.board[0]).toBeNull();
      expect(afterUndo.currentPlayer).toBe('X');
      expect(afterUndo.status).toBe('PLAYING');
    });

    it('2.3 should handle 2-ply UNDO_MOVE when history has only 1 move in AI mode', () => {
      let state = createInitialState({ mode: 'AI_UNBEATABLE' });
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // Human X plays center before AI turn

      expect(state.history.length).toBe(1);
      const afterUndo = gameReducer(state, { type: 'UNDO_MOVE' });

      expect(afterUndo.history.length).toBe(0);
      expect(afterUndo.board[4]).toBeNull();
      expect(afterUndo.currentPlayer).toBe('X');
      expect(afterUndo.status).toBe('PLAYING');
    });

    it('2.4 should revert 2-ply moves (human + AI) when history >= 2 in AI mode', () => {
      let state = createInitialState({ mode: 'AI_UNBEATABLE' });
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // AI O

      expect(state.history.length).toBe(2);

      const afterUndo = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(afterUndo.history.length).toBe(0);
      expect(afterUndo.board[0]).toBeNull();
      expect(afterUndo.board[4]).toBeNull();
      expect(afterUndo.currentPlayer).toBe('X');
    });

    it('2.5 should revert 2 moves leaving previous human move when history = 3 in AI mode', () => {
      let state = createInitialState({ mode: 'AI_UNBEATABLE' });
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X (move 1)
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O (move 2)
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X (move 3)

      expect(state.history.length).toBe(3);

      const afterUndo = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(afterUndo.history.length).toBe(1);
      expect(afterUndo.board[0]).toBe('X');
      expect(afterUndo.board[4]).toBeNull();
      expect(afterUndo.board[1]).toBeNull();
      expect(afterUndo.currentPlayer).toBe('X');
    });

    it('2.6 should prevent UNDO_MOVE when game status is VICTORY or DRAW', () => {
      let state = createInitialState({ mode: 'PVP_LOCAL' });
      state = gameReducer(state, { type: 'START_GAME' });

      // Create X victory: 0, 1, 2
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X wins

      expect(state.status).toBe('VICTORY');
      expect(state.winner).toBe('X');

      const afterUndo = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(afterUndo.status).toBe('VICTORY');
      expect(afterUndo.winner).toBe('X');
      expect(afterUndo.board[2]).toBe('X');
      expect(afterUndo.history.length).toBe(5);
    });

    it('2.7 should handle rapid multiple UNDO_MOVE actions gracefully without crashing or underflow', () => {
      let state = createInitialState({ mode: 'PVP_LOCAL' });
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 });

      for (let i = 0; i < 5; i++) {
        state = gameReducer(state, { type: 'UNDO_MOVE' });
      }

      expect(state.history.length).toBe(0);
      expect(state.board.every((c) => c === null)).toBe(true);
      expect(state.currentPlayer).toBe('X');
    });
  });

  // ==========================================
  // FOCUS AREA 3: Grid Size State Desyncs
  // ==========================================
  describe('3. Grid Size State Desyncs & Dynamic Win Checking', () => {
    it('3.1 should switch grid dimensions mid-game cleanly and update board size & win streak', () => {
      let state = createInitialState({ mode: 'PVP_LOCAL', boardSize: 3 });
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 });

      // Switch to 4x4
      state = gameReducer(state, { type: 'UPDATE_SETTINGS', settings: { boardSize: 4 } });
      expect(state.size).toBe(4);
      expect(state.board.length).toBe(16);
      expect(state.settings.streakToWin).toBe(4);
      expect(state.status).toBe('IDLE');
      expect(state.board.every((c) => c === null)).toBe(true);

      // Switch to 5x5
      state = gameReducer(state, { type: 'UPDATE_SETTINGS', settings: { boardSize: 5 } });
      expect(state.size).toBe(5);
      expect(state.board.length).toBe(25);
      expect(state.settings.streakToWin).toBe(4);

      // Switch back to 3x3
      state = gameReducer(state, { type: 'UPDATE_SETTINGS', settings: { boardSize: 3 } });
      expect(state.size).toBe(3);
      expect(state.board.length).toBe(9);
      expect(state.settings.streakToWin).toBe(3);
    });

    it('3.2 should require 4-in-a-row to win on 4x4 grid (3-in-a-row does NOT win)', () => {
      const board4x4: CellValue[] = Array(16).fill(null);
      // Fill 3 in a row: indices 0, 1, 2
      board4x4[0] = 'X';
      board4x4[1] = 'X';
      board4x4[2] = 'X';

      const result3 = checkWinner(board4x4, 4, 4);
      expect(result3.winner).toBeNull();
      expect(result3.winningLine).toBeNull();

      // Add 4th mark: index 3
      board4x4[3] = 'X';
      const result4 = checkWinner(board4x4, 4, 4);
      expect(result4.winner).toBe('X');
      expect(result4.winningLine?.combo).toEqual([0, 1, 2, 3]);
      expect(result4.winningLine?.direction).toBe('HORIZONTAL');
    });

    it('3.3 should check vertical, diagonal, and anti-diagonal win lines on 4x4 grid', () => {
      // Vertical win column 1: indices 1, 5, 9, 13
      const vertBoard: CellValue[] = Array(16).fill(null);
      [1, 5, 9, 13].forEach((idx) => (vertBoard[idx] = 'O'));
      const vertRes = checkWinner(vertBoard, 4, 4);
      expect(vertRes.winner).toBe('O');
      expect(vertRes.winningLine?.direction).toBe('VERTICAL');

      // Main diagonal win: indices 0, 5, 10, 15
      const diagBoard: CellValue[] = Array(16).fill(null);
      [0, 5, 10, 15].forEach((idx) => (diagBoard[idx] = 'X'));
      const diagRes = checkWinner(diagBoard, 4, 4);
      expect(diagRes.winner).toBe('X');
      expect(diagRes.winningLine?.direction).toBe('DIAGONAL_MAIN');

      // Sub diagonal win: indices 3, 6, 9, 12
      const subDiagBoard: CellValue[] = Array(16).fill(null);
      [3, 6, 9, 12].forEach((idx) => (subDiagBoard[idx] = 'O'));
      const subDiagRes = checkWinner(subDiagBoard, 4, 4);
      expect(subDiagRes.winner).toBe('O');
      expect(subDiagRes.winningLine?.direction).toBe('DIAGONAL_SUB');
    });

    it('3.4 should evaluate 4-in-a-row sliding window wins on 5x5 grid', () => {
      const board5x5: CellValue[] = Array(25).fill(null);
      // Row 2, offset col 1: indices 11, 12, 13, 14
      [11, 12, 13, 14].forEach((idx) => (board5x5[idx] = 'X'));

      const res = checkWinner(board5x5, 5, 4);
      expect(res.winner).toBe('X');
      expect(res.winningLine?.combo).toEqual([11, 12, 13, 14]);
    });

    it('3.5 should safely reject invalid/out-of-bound MAKE_MOVE indices in reducer', () => {
      let state = createInitialState({ boardSize: 3 });
      state = gameReducer(state, { type: 'START_GAME' });

      // Out of bounds: negative
      const stateNeg = gameReducer(state, { type: 'MAKE_MOVE', index: -1 });
      expect(stateNeg).toBe(state);

      // Out of bounds: >= 9 on 3x3
      const stateOob = gameReducer(state, { type: 'MAKE_MOVE', index: 9 });
      expect(stateOob).toBe(state);

      // Out of bounds: non-integer / extreme
      const stateExtreme = gameReducer(state, { type: 'MAKE_MOVE', index: 999 });
      expect(stateExtreme).toBe(state);

      // Occupied index
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X plays 0
      const stateOccupied = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // O tries 0
      expect(stateOccupied).toBe(state);
    });

    it('3.6 should verify horizontal line checker does NOT wrap across row boundaries', () => {
      const board: CellValue[] = Array(9).fill(null);
      // Row 0 col 2 (2), Row 1 col 0 (3), Row 1 col 1 (4)
      board[2] = 'X';
      board[3] = 'X';
      board[4] = 'X';

      const res = checkWinner(board, 3, 3);
      expect(res.winner).toBeNull();
    });
  });

  // ==========================================
  // FOCUS AREA 4: Minimax AI Edge Cases
  // ==========================================
  describe('4. Minimax AI Edge Cases & Search Stability', () => {
    it('4.1 should return depth limit configuration correctly based on board size', () => {
      // Empty boards of 3x3, 4x4, 5x5
      const b3: CellValue[] = Array(9).fill(null);
      const b4: CellValue[] = Array(16).fill(null);
      const b5: CellValue[] = Array(25).fill(null);

      // Execution completes quickly without stack overflow or time out
      const move3 = getBestMove(b3, 'O', 'AI_UNBEATABLE', 3);
      expect(move3).toBeGreaterThanOrEqual(0);
      expect(move3).toBeLessThan(9);

      const move4 = getBestMove(b4, 'O', 'AI_UNBEATABLE', 4);
      expect(move4).toBeGreaterThanOrEqual(0);
      expect(move4).toBeLessThan(16);

      const move5 = getBestMove(b5, 'O', 'AI_UNBEATABLE', 5);
      expect(move5).toBeGreaterThanOrEqual(0);
      expect(move5).toBeLessThan(25);
    });

    it('4.2 should detect immediate win over block or heuristic search on 3x3', () => {
      const board: CellValue[] = [
        'O', 'O', null,
        'X', 'X', null,
        null, null, null,
      ];
      // O has immediate win at index 2. X has threat at index 5.
      const bestMove = getBestMove(board, 'O', 'AI_UNBEATABLE', 3);
      expect(bestMove).toBe(2);
    });

    it('4.3 should detect immediate block on 3x3 when opponent is about to win', () => {
      const board: CellValue[] = [
        'X', 'X', null,
        'O', null, null,
        null, null, null,
      ];
      // X has immediate win threat at index 2. O must block at index 2.
      const bestMove = getBestMove(board, 'O', 'AI_UNBEATABLE', 3);
      expect(bestMove).toBe(2);
    });

    it('4.4 should detect immediate win and block on 4x4 grid', () => {
      // 4x4 win detection for O (indices 0, 1, 2 filled by O, 3 empty)
      const board4: CellValue[] = Array(16).fill(null);
      board4[0] = 'O';
      board4[1] = 'O';
      board4[2] = 'O';
      board4[4] = 'X';
      board4[5] = 'X';
      board4[6] = 'X';

      // O win move at 3
      const { winMove, blockMove } = findImmediateWinOrBlock(board4, 'O', 4, 4);
      expect(winMove).toBe(3);
      expect(blockMove).toBe(7);

      const aiMove = getBestMove(board4, 'O', 'AI_UNBEATABLE', 4, 4);
      expect(aiMove).toBe(3);
    });

    it('4.5 should produce stable finite scores in evaluateHeuristic on 4x4 and 5x5 boards', () => {
      const b4: CellValue[] = Array(16).fill(null);
      b4[5] = 'X';
      b4[6] = 'O';
      b4[10] = 'X';

      const score4 = evaluateHeuristic(b4, 'X', 'O', 4);
      expect(Number.isFinite(score4)).toBe(true);

      const b5: CellValue[] = Array(25).fill(null);
      b5[12] = 'X'; // Center
      b5[0] = 'O';

      const score5 = evaluateHeuristic(b5, 'X', 'O', 5);
      expect(Number.isFinite(score5)).toBe(true);
      expect(score5).toBeGreaterThan(0); // Center proximity bonus for X
    });

    it('4.6 should return -1 when getBestMove is called on a completely full board', () => {
      const fullBoard: CellValue[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
      const move = getBestMove(fullBoard, 'O', 'AI_UNBEATABLE', 3);
      expect(move).toBe(-1);
    });

    it('4.7 should return null when getHintMove is called on a full board', () => {
      const fullBoard: CellValue[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
      const hint = getHintMove(fullBoard, 3, 'X');
      expect(hint).toBeNull();
    });

    it('4.8 should return Tier 1 Win suggestion in getHintMove when winning move is present', () => {
      const board: CellValue[] = ['X', 'X', null, 'O', 'O', null, null, null, null];
      const hint = getHintMove(board, 3, 'X');
      expect(hint).not.toBeNull();
      expect(hint?.index).toBe(2);
      expect(hint?.score).toBe(100);
      expect(hint?.explanation).toContain('Winning Move');
    });

    it('4.9 should return Tier 2 Block suggestion in getHintMove when defensive block is required', () => {
      const board: CellValue[] = ['O', 'O', null, 'X', null, null, null, null, null];
      const hint = getHintMove(board, 3, 'X');
      expect(hint).not.toBeNull();
      expect(hint?.index).toBe(2);
      expect(hint?.score).toBe(90);
      expect(hint?.explanation).toContain('Defensive Block');
    });

    it('4.10 should return Tier 3 Center Control suggestion in getHintMove on open board', () => {
      const board: CellValue[] = ['X', null, null, null, null, null, null, null, null];
      const hint = getHintMove(board, 3, 'O');
      expect(hint).not.toBeNull();
      expect(hint?.index).toBe(4); // Center cell
      expect(hint?.score).toBe(80);
      expect(hint?.explanation).toContain('Control Center');
    });
  });
});
