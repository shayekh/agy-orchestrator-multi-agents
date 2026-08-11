import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import React from 'react';
import App from '../src/App';
import { GameBoard } from '../src/components/GameBoard';
import { useGameState } from '../src/hooks/useGameState';
import {
  gameReducer,
  createInitialState,
  INITIAL_SETTINGS,
} from '../src/logic/gameReducer';
import { checkWinner, checkDraw } from '../src/logic/winChecker';
import { getBestMove } from '../src/logic/minimax';
import { CellValue } from '../src/types/game';

const SETTINGS_STORAGE_KEY = 'ultra_tictactoe_settings_v1';
const STATS_STORAGE_KEY = 'ultra_tictactoe_stats_v1';

describe('Tier 2: Boundary & Corner Cases Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  // =========================================================================
  // 1. Board Grid Initialization Boundary Checks
  // =========================================================================
  describe('1. Board Grid Initialization Boundary Checks', () => {
    it('initializes 3x3 board with exactly 9 null cells', () => {
      const state = createInitialState({ boardSize: 3 });
      expect(state.size).toBe(3);
      expect(state.board).toHaveLength(9);
      expect(state.board.every((cell) => cell === null)).toBe(true);
    });

    it('initializes 4x4 board with exactly 16 null cells', () => {
      const state = createInitialState({ boardSize: 4 });
      expect(state.settings.boardSize).toBe(4);
      expect(state.board).toHaveLength(16);
      expect(state.board.every((cell) => cell === null)).toBe(true);
    });

    it('initializes 5x5 board with exactly 25 null cells', () => {
      const state = createInitialState({ boardSize: 5 });
      expect(state.settings.boardSize).toBe(5);
      expect(state.board).toHaveLength(25);
      expect(state.board.every((cell) => cell === null)).toBe(true);
    });

    it('re-initializes grid size dynamically when UPDATE_SETTINGS, START_GAME, or RESET_GAME are dispatched', () => {
      let state = createInitialState({ boardSize: 3 });
      expect(state.board).toHaveLength(9);

      // Update to 4x4
      state = gameReducer(state, { type: 'UPDATE_SETTINGS', settings: { boardSize: 4 } });
      expect(state.size).toBe(4);
      expect(state.board).toHaveLength(16);

      // Start game on 4x4
      state = gameReducer(state, { type: 'START_GAME' });
      expect(state.status).toBe('PLAYING');
      expect(state.board).toHaveLength(16);
      expect(state.board.every((cell) => cell === null)).toBe(true);

      // Update to 5x5 and reset
      state = gameReducer(state, { type: 'UPDATE_SETTINGS', settings: { boardSize: 5 } });
      state = gameReducer(state, { type: 'RESET_GAME' });
      expect(state.board).toHaveLength(25);
      expect(state.board.every((cell) => cell === null)).toBe(true);
    });

    it('renders the correct number of interactive cell buttons in GameBoard component for 3x3, 4x4, and 5x5', () => {
      const state3 = createInitialState({ boardSize: 3 });
      state3.status = 'PLAYING';
      const { rerender, container } = render(
        <GameBoard gameState={state3} onCellClick={() => {}} />
      );
      let buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(9);

      const state4 = createInitialState({ boardSize: 4 });
      state4.status = 'PLAYING';
      state4.size = 4;
      rerender(<GameBoard gameState={state4} onCellClick={() => {}} />);
      buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(16);

      const state5 = createInitialState({ boardSize: 5 });
      state5.status = 'PLAYING';
      state5.size = 5;
      rerender(<GameBoard gameState={state5} onCellClick={() => {}} />);
      buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(25);
    });
  });

  // =========================================================================
  // 2. Full Board Draw with 0 Winning Lines
  // =========================================================================
  describe('2. Full Board Draw with 0 Winning Lines', () => {
    it('detects a full board draw on 3x3 with 0 winning lines', () => {
      // Board layout:
      // X O X
      // X O O
      // O X X
      const drawBoard3x3: CellValue[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];

      const result = checkWinner(drawBoard3x3, 3, 3);
      expect(result.winner).toBe('DRAW');
      expect(result.winningLine).toBeNull();
      expect(checkDraw(drawBoard3x3, 3)).toBe(true);
    });

    it('detects a full board draw on 4x4 grid with 0 winning lines (streakToWin = 4)', () => {
      // Board layout:
      // X X O O
      // O O X X
      // X X O O
      // O O X X
      const drawBoard4x4: CellValue[] = [
        'X', 'X', 'O', 'O',
        'O', 'O', 'X', 'X',
        'X', 'X', 'O', 'O',
        'O', 'O', 'X', 'X',
      ];

      const result = checkWinner(drawBoard4x4, 4, 4);
      expect(result.winner).toBe('DRAW');
      expect(result.winningLine).toBeNull();
      expect(checkDraw(drawBoard4x4, 4)).toBe(true);
    });

    it('detects a full board draw on 5x5 grid with 0 winning lines (streakToWin = 4)', () => {
      // Board layout:
      // X X O O X
      // O O X X O
      // X X O O X
      // O O X X O
      // X X O O X
      const drawBoard5x5: CellValue[] = [
        'X', 'X', 'O', 'O', 'X',
        'O', 'O', 'X', 'X', 'O',
        'X', 'X', 'O', 'O', 'X',
        'O', 'O', 'X', 'X', 'O',
        'X', 'X', 'O', 'O', 'X',
      ];

      const result = checkWinner(drawBoard5x5, 5, 4);
      expect(result.winner).toBe('DRAW');
      expect(result.winningLine).toBeNull();
      expect(checkDraw(drawBoard5x5, 5)).toBe(true);
    });

    it('transitions game state status to DRAW via gameReducer when last move is made without win', () => {
      let state = createInitialState({ boardSize: 3 });
      state = gameReducer(state, { type: 'START_GAME' });

      // Setup 8 moves
      const moves = [0, 1, 2, 4, 3, 5, 7, 6];
      // Board becomes:
      // 0:X, 1:O, 2:X
      // 3:X, 4:O, 5:O
      // 6:X, 7:O, 8:null
      moves.forEach((idx) => {
        state = gameReducer(state, { type: 'MAKE_MOVE', index: idx });
      });

      expect(state.status).toBe('PLAYING');
      expect(state.board[8]).toBeNull();

      // Dispatch 9th move at index 8 (X plays 8)
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 8 });

      expect(state.status).toBe('DRAW');
      expect(state.winner).toBe('DRAW');
      expect(state.winningLine).toBeNull();
    });
  });

  // =========================================================================
  // 3. Last Available Cell Victory (9th cell in 3x3 resulting in victory over draw)
  // =========================================================================
  describe('3. Last Available Cell Victory', () => {
    it('prioritizes victory over draw when the 9th move in a 3x3 grid forms a main diagonal winning line', () => {
      let state = createInitialState({ boardSize: 3 });
      state = gameReducer(state, { type: 'START_GAME' });

      // Board setup before move 9:
      // X O X
      // O X O
      // X O .  (Index 8 is empty, X's turn)
      const moves = [
        0, // X at 0
        1, // O at 1
        2, // O at 2
        3, // X at 3
        4, // X at 4 (center)
        5, // O at 5
        6, // O at 6
        7, // X at 7
      ];

      moves.forEach((idx) => {
        state = gameReducer(state, { type: 'MAKE_MOVE', index: idx });
      });

      expect(state.status).toBe('PLAYING');
      expect(state.currentPlayer).toBe('X');
      expect(state.board[8]).toBeNull();

      // X plays index 8 - forming main diagonal [0, 4, 8]
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 8 });

      // Crucial Assertion: Board is 100% full, but result MUST BE VICTORY for X, NOT DRAW!
      expect(state.board.every((cell) => cell !== null)).toBe(true);
      expect(state.status).toBe('VICTORY');
      expect(state.winner).toBe('X');
      expect(state.winningLine).toEqual({
        combo: [0, 4, 8],
        direction: 'DIAGONAL_MAIN',
      });
    });

    it('prioritizes victory over draw when the 9th move forms a horizontal winning line', () => {
      let state = createInitialState({ boardSize: 3 });
      state = gameReducer(state, { type: 'START_GAME' });

      // Board setup before move 9:
      // X X .  (index 2 empty)
      // O O X
      // X O O
      const moves = [
        0, // X at 0
        3, // O at 3
        1, // X at 1
        4, // O at 4
        5, // X at 5
        6, // O at 6
        7, // X at 7 (wait, player order: X0, O3, X1, O4, X5, O6, X7, O8)
        8, // O at 8
      ];

      moves.forEach((idx) => {
        state = gameReducer(state, { type: 'MAKE_MOVE', index: idx });
      });

      expect(state.status).toBe('PLAYING');
      expect(state.currentPlayer).toBe('X');
      expect(state.board[2]).toBeNull();

      // X plays index 2 - forming top row [0, 1, 2]
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 });

      expect(state.board.every((cell) => cell !== null)).toBe(true);
      expect(state.status).toBe('VICTORY');
      expect(state.winner).toBe('X');
      expect(state.winningLine).toEqual({
        combo: [0, 1, 2],
        direction: 'HORIZONTAL',
      });
    });
  });

  // =========================================================================
  // 4. Corner and Edge Winning Lines on 4x4 and 5x5
  // =========================================================================
  describe('4. Corner and Edge Winning Lines on 4x4 and 5x5', () => {
    it('detects row 3 (bottom edge) winning line on 4x4 grid (indices 12, 13, 14, 15)', () => {
      const board4x4: CellValue[] = Array(16).fill(null);
      board4x4[12] = 'X';
      board4x4[13] = 'X';
      board4x4[14] = 'X';
      board4x4[15] = 'X';

      const result = checkWinner(board4x4, 4, 4);
      expect(result.winner).toBe('X');
      expect(result.winningLine).toEqual({
        combo: [12, 13, 14, 15],
        direction: 'HORIZONTAL',
      });
    });

    it('detects col 3 (rightmost edge) winning line on 4x4 grid (indices 3, 7, 11, 15)', () => {
      const board4x4: CellValue[] = Array(16).fill(null);
      board4x4[3] = 'O';
      board4x4[7] = 'O';
      board4x4[11] = 'O';
      board4x4[15] = 'O';

      const result = checkWinner(board4x4, 4, 4);
      expect(result.winner).toBe('O');
      expect(result.winningLine).toEqual({
        combo: [3, 7, 11, 15],
        direction: 'VERTICAL',
      });
    });

    it('detects sub-diagonal winning line on 5x5 grid (indices 3, 7, 11, 15) with streakToWin = 4', () => {
      // 5x5 coordinates:
      // idx 3 = row 0, col 3
      // idx 7 = row 1, col 2
      // idx 11 = row 2, col 1
      // idx 15 = row 3, col 0
      const board5x5: CellValue[] = Array(25).fill(null);
      board5x5[3] = 'X';
      board5x5[7] = 'X';
      board5x5[11] = 'X';
      board5x5[15] = 'X';

      const result = checkWinner(board5x5, 5, 4);
      expect(result.winner).toBe('X');
      expect(result.winningLine).toEqual({
        combo: [3, 7, 11, 15],
        direction: 'DIAGONAL_SUB',
      });
    });

    it('processes 4x4 and 5x5 edge/corner winning lines through gameReducer correctly', () => {
      let state = createInitialState({ boardSize: 4 });
      state = gameReducer(state, { type: 'START_GAME' });

      // Build col 3 win for X on 4x4
      const moves = [3, 0, 7, 1, 11, 2, 15]; // X at 3, 7, 11, 15
      moves.forEach((idx) => {
        state = gameReducer(state, { type: 'MAKE_MOVE', index: idx });
      });

      expect(state.status).toBe('VICTORY');
      expect(state.winner).toBe('X');
      expect(state.winningLine?.combo).toEqual([3, 7, 11, 15]);
      expect(state.winningLine?.direction).toBe('VERTICAL');
    });
  });

  // =========================================================================
  // 5. 2-Ply Undo Boundary Scenarios
  // =========================================================================
  describe('5. 2-Ply Undo Boundary Scenarios', () => {
    it('undoes 1 human move + 1 AI response (2-ply) back to empty board in AI mode', () => {
      let state = createInitialState({ mode: 'AI_UNBEATABLE', boardSize: 3 });
      state = gameReducer(state, { type: 'START_GAME' });

      // Human X plays at 0
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 });
      // AI O plays at 4
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 });

      expect(state.history).toHaveLength(2);
      expect(state.board[0]).toBe('X');
      expect(state.board[4]).toBe('O');

      // Dispatch UNDO_MOVE
      state = gameReducer(state, { type: 'UNDO_MOVE' });

      expect(state.history).toHaveLength(0);
      expect(state.board.every((c) => c === null)).toBe(true);
      expect(state.currentPlayer).toBe('X');
      expect(state.status).toBe('PLAYING');
    });

    it('safely handles UNDO_MOVE when move history is completely empty', () => {
      let state = createInitialState({ mode: 'AI_UNBEATABLE', boardSize: 3 });
      state = gameReducer(state, { type: 'START_GAME' });

      expect(state.history).toHaveLength(0);

      // Undo on empty history
      const nextState = gameReducer(state, { type: 'UNDO_MOVE' });

      expect(nextState).toEqual(state);
      expect(nextState.history).toHaveLength(0);
      expect(nextState.board.every((c) => c === null)).toBe(true);
    });

    it('undoes only 1 move (1-ply) when UNDO_MOVE is called in 2-Player Local mode with 1 move', () => {
      let state = createInitialState({ mode: 'PVP_LOCAL', boardSize: 3 });
      state = gameReducer(state, { type: 'START_GAME' });

      // Player X plays at index 0
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 });
      expect(state.history).toHaveLength(1);
      expect(state.currentPlayer).toBe('O');

      // Dispatch UNDO_MOVE in 2P mode
      state = gameReducer(state, { type: 'UNDO_MOVE' });

      expect(state.history).toHaveLength(0);
      expect(state.board[0]).toBeNull();
      expect(state.currentPlayer).toBe('X');
    });

    it('undoes 2-ply in AI mode when history length is >= 2, leaving prior moves intact', () => {
      let state = createInitialState({ mode: 'AI_UNBEATABLE', boardSize: 3 });
      state = gameReducer(state, { type: 'START_GAME' });

      // Move 1: X at 0
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 });
      // Move 2: O at 4
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 });
      // Move 3: X at 8
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 8 });
      // Move 4: O at 2
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 });

      expect(state.history).toHaveLength(4);

      // Undo 2-ply (removes O at 2 and X at 8)
      state = gameReducer(state, { type: 'UNDO_MOVE' });

      expect(state.history).toHaveLength(2);
      expect(state.board[0]).toBe('X');
      expect(state.board[4]).toBe('O');
      expect(state.board[8]).toBeNull();
      expect(state.board[2]).toBeNull();
      expect(state.currentPlayer).toBe('X');
    });
  });

  // =========================================================================
  // 6. Turn Countdown Timer Expiry Auto-Switching Turn
  // =========================================================================
  describe('6. Turn Countdown Timer Expiry', () => {
    it('auto-switches turn from X to O upon timer expiry (TIME_TICK when timeRemaining <= 1)', () => {
      let state = createInitialState({ timeLimitSecondsPerTurn: 15 });
      state = gameReducer(state, { type: 'START_GAME' });

      state.turnTimeRemaining = 1;
      expect(state.currentPlayer).toBe('X');

      // Dispatch TIME_TICK on last second
      state = gameReducer(state, { type: 'TIME_TICK' });

      expect(state.currentPlayer).toBe('O');
      expect(state.turnTimeRemaining).toBe(15);
    });

    it('decrements turnTimeRemaining without switching turn when timeRemaining > 1', () => {
      let state = createInitialState({ timeLimitSecondsPerTurn: 10 });
      state = gameReducer(state, { type: 'START_GAME' });

      state.turnTimeRemaining = 10;
      state = gameReducer(state, { type: 'TIME_TICK' });

      expect(state.currentPlayer).toBe('X');
      expect(state.turnTimeRemaining).toBe(9);
    });

    it('does not decrement turnTimeRemaining when timeLimitSecondsPerTurn is 0 (unlimited)', () => {
      let state = createInitialState({ timeLimitSecondsPerTurn: 0 });
      state = gameReducer(state, { type: 'START_GAME' });

      const initialTime = state.turnTimeRemaining;
      state = gameReducer(state, { type: 'TIME_TICK' });

      expect(state.turnTimeRemaining).toBe(initialTime);
      expect(state.currentPlayer).toBe('X');
    });

    it('auto-switches turn via hook timer interval when timer ticks down in active game', () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useGameState());

      act(() => {
        result.current.updateSettings({ timeLimitSecondsPerTurn: 3, mode: 'PVP_LOCAL' });
        result.current.startGame();
      });

      expect(result.current.gameState.status).toBe('PLAYING');
      expect(result.current.gameState.currentPlayer).toBe('X');

      // Fast forward 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.gameState.currentPlayer).toBe('O');
    });
  });

  // =========================================================================
  // 7. Rapid Double-Clicks on Same Cell
  // =========================================================================
  describe('7. Rapid Double-Clicks on Same Cell', () => {
    it('safely ignores MAKE_MOVE on an already occupied cell in gameReducer', () => {
      let state = createInitialState({ boardSize: 3 });
      state = gameReducer(state, { type: 'START_GAME' });

      // Move 1: X plays at index 4
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 });
      expect(state.board[4]).toBe('X');
      expect(state.currentPlayer).toBe('O');
      expect(state.history).toHaveLength(1);

      // Move 2: Attempting to play at index 4 again (rapid double click)
      const duplicateState = gameReducer(state, { type: 'MAKE_MOVE', index: 4 });

      expect(duplicateState).toEqual(state);
      expect(duplicateState.board[4]).toBe('X');
      expect(duplicateState.currentPlayer).toBe('O');
      expect(duplicateState.history).toHaveLength(1);
    });

    it('safely ignores out-of-bounds move indices (< 0 or >= board.length)', () => {
      let state = createInitialState({ boardSize: 3 });
      state = gameReducer(state, { type: 'START_GAME' });

      const underflowState = gameReducer(state, { type: 'MAKE_MOVE', index: -1 });
      expect(underflowState).toEqual(state);

      const overflowState = gameReducer(state, { type: 'MAKE_MOVE', index: 99 });
      expect(overflowState).toEqual(state);
    });

    it('ignores secondary clicks on occupied cells in useGameState makeMove callback', () => {
      const { result } = renderHook(() => useGameState());

      act(() => {
        result.current.updateSettings({ mode: 'PVP_LOCAL' });
        result.current.startGame();
      });

      // First click on cell 0
      act(() => {
        result.current.makeMove(0);
      });
      expect(result.current.gameState.board[0]).toBe('X');
      expect(result.current.gameState.currentPlayer).toBe('O');

      // Rapid second click on cell 0
      act(() => {
        result.current.makeMove(0);
      });
      expect(result.current.gameState.board[0]).toBe('X');
      expect(result.current.gameState.currentPlayer).toBe('O');
      expect(result.current.gameState.history).toHaveLength(1);
    });
  });

  // =========================================================================
  // 8. Corrupted/Invalid JSON in LocalStorage Fallback
  // =========================================================================
  describe('8. Corrupted/Invalid JSON in LocalStorage Fallback', () => {
    it('handles corrupted JSON in LocalStorage for settings and stats without crashing', () => {
      // Set corrupted strings in localStorage
      localStorage.setItem(SETTINGS_STORAGE_KEY, '{invalid_json_format:::');
      localStorage.setItem(STATS_STORAGE_KEY, '<<<UNPARSABLE_DATA>>>');

      // Rendering useGameState should catch exception and load default initial state
      const { result } = renderHook(() => useGameState());

      expect(result.current.gameState.settings.mode).toBe('AI_UNBEATABLE');
      expect(result.current.gameState.settings.boardSize).toBe(3);
      expect(result.current.gameState.playerX.stats).toEqual({
        wins: 0,
        losses: 0,
        draws: 0,
        winStreak: 0,
        bestStreak: 0,
        totalTimePlayedSeconds: 0,
      });
      expect(result.current.gameState.playerO.stats).toEqual({
        wins: 0,
        losses: 0,
        draws: 0,
        winStreak: 0,
        bestStreak: 0,
        totalTimePlayedSeconds: 0,
      });
    });

    it('recovers cleanly when App component mounts with corrupted localStorage', () => {
      localStorage.setItem(SETTINGS_STORAGE_KEY, '{"boardSize": "invalid"}');
      localStorage.setItem(STATS_STORAGE_KEY, 'null');

      expect(() => render(<App />)).not.toThrow();
      expect(screen.getByText(/ULTRA TIC-TAC-TOE/i)).toBeTruthy();
    });
  });

  // =========================================================================
  // 9. Resetting Stats from Maximum Numbers Down to Zero
  // =========================================================================
  describe('9. Resetting Stats from Maximum Numbers Down to Zero', () => {
    it('resets playerX and playerO statistics from maximum numeric values back to zero', () => {
      let state = createInitialState();
      state.playerX.stats = {
        wins: 999999,
        losses: 888888,
        draws: 777777,
        winStreak: 1234,
        bestStreak: 5678,
        totalTimePlayedSeconds: 9999999,
      };
      state.playerO.stats = {
        wins: 555555,
        losses: 444444,
        draws: 333333,
        winStreak: 50,
        bestStreak: 90,
        totalTimePlayedSeconds: 8888888,
      };

      // Dispatch RESET_STATS
      state = gameReducer(state, { type: 'RESET_STATS' });

      const zeroStats = {
        wins: 0,
        losses: 0,
        draws: 0,
        winStreak: 0,
        bestStreak: 0,
        totalTimePlayedSeconds: 0,
      };

      expect(state.playerX.stats).toEqual(zeroStats);
      expect(state.playerO.stats).toEqual(zeroStats);
    });

    it('resets stats via useGameState resetStats action', () => {
      const { result } = renderHook(() => useGameState());

      // Simulate match win to increment stats
      act(() => {
        result.current.dispatch({
          type: 'MAKE_MOVE',
          index: 0,
        });
      });

      // Reset stats
      act(() => {
        result.current.resetStats();
      });

      expect(result.current.gameState.playerX.stats.wins).toBe(0);
      expect(result.current.gameState.playerO.stats.wins).toBe(0);
    });
  });

  // =========================================================================
  // 10. Unbeatable AI Response when Human Plays Corner Opening
  // =========================================================================
  describe('10. Unbeatable AI Response to Corner Opening', () => {
    it('responds with center cell (index 4) when human plays top-left corner (index 0) on 3x3 board', () => {
      const board: CellValue[] = ['X', null, null, null, null, null, null, null, null];
      const bestMove = getBestMove(board, 'O', 'AI_UNBEATABLE', 3, 3);
      expect(bestMove).toBe(4);
    });

    it('responds with center cell (index 4) when human plays top-right corner (index 2) on 3x3 board', () => {
      const board: CellValue[] = [null, null, 'X', null, null, null, null, null, null];
      const bestMove = getBestMove(board, 'O', 'AI_UNBEATABLE', 3, 3);
      expect(bestMove).toBe(4);
    });

    it('responds with center cell (index 4) when human plays bottom-left corner (index 6) on 3x3 board', () => {
      const board: CellValue[] = [null, null, null, null, null, null, 'X', null, null];
      const bestMove = getBestMove(board, 'O', 'AI_UNBEATABLE', 3, 3);
      expect(bestMove).toBe(4);
    });

    it('responds with center cell (index 4) when human plays bottom-right corner (index 8) on 3x3 board', () => {
      const board: CellValue[] = [null, null, null, null, null, null, null, null, 'X'];
      const bestMove = getBestMove(board, 'O', 'AI_UNBEATABLE', 3, 3);
      expect(bestMove).toBe(4);
    });

    it('guarantees unbeatable minimax AI never loses against human corner openings', () => {
      const cornerIndices = [0, 2, 6, 8];
      cornerIndices.forEach((cornerIdx) => {
        const board: CellValue[] = Array(9).fill(null);
        board[cornerIdx] = 'X';
        const aiMove = getBestMove(board, 'O', 'AI_UNBEATABLE', 3, 3);
        expect(aiMove).toBe(4);
      });
    });
  });
});
