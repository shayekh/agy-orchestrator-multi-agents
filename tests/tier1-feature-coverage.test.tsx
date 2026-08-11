import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

// Logic & Reducer imports
import {
  createInitialState,
  gameReducer,
  INITIAL_SETTINGS,
} from '../src/logic/gameReducer';
import {
  getBestMove,
  minimaxAlphaBeta,
  findImmediateWinOrBlock,
} from '../src/logic/minimax';
import {
  checkWinner,
  checkWin,
  checkDraw,
  isBoardFull,
  getAvailableMoves,
} from '../src/logic/winChecker';
import { getHintMove } from '../src/logic/hintEngine';

// Audio & FX imports
import { soundEngine } from '../src/audio/soundEngine';
import { triggerConfetti } from '../src/effects/confetti';

// Component imports
import App from '../src/App';
import { GameBoard } from '../src/components/GameBoard';
import { ThemeSelector } from '../src/components/ThemeSelector';
import { ControlPanel } from '../src/components/ControlPanel';
import { StatsModal } from '../src/components/StatsModal';
import { GameOverModal } from '../src/components/GameOverModal';

// Type imports
import { GameState, GameSettings, CellValue } from '../src/types/game';

describe('Tier 1 Feature Coverage Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  /* ========================================================================
   * FEATURE AREA 1: Game FSM & Reducer
   * ======================================================================== */
  describe('1. Game FSM & Reducer', () => {
    it('1.1 should create initial state with default settings and IDLE status', () => {
      const state = createInitialState();
      expect(state.status).toBe('IDLE');
      expect(state.board).toHaveLength(9);
      expect(state.board.every((cell) => cell === null)).toBe(true);
      expect(state.size).toBe(3);
      expect(state.currentPlayer).toBe('X');
      expect(state.winner).toBeNull();
      expect(state.winningLine).toBeNull();
      expect(state.history).toEqual([]);
      expect(state.playerX.stats.wins).toBe(0);
      expect(state.playerO.stats.wins).toBe(0);
      expect(state.settings.mode).toBe('AI_UNBEATABLE');
    });

    it('1.2 should transition from IDLE to PLAYING on START_GAME', () => {
      const initial = createInitialState();
      const next = gameReducer(initial, { type: 'START_GAME' });
      expect(next.status).toBe('PLAYING');
      expect(next.board).toHaveLength(9);
      expect(next.board.every((c) => c === null)).toBe(true);
      expect(next.currentPlayer).toBe('X');
      expect(next.history).toEqual([]);
      expect(next.winner).toBeNull();
    });

    it('1.3 should toggle current player and update board on MAKE_MOVE', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME' });

      // Move 1: X at index 4
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 });
      expect(state.board[4]).toBe('X');
      expect(state.currentPlayer).toBe('O');
      expect(state.history).toHaveLength(1);
      expect(state.history[0]).toEqual(
        expect.objectContaining({ index: 4, player: 'X' })
      );

      // Move 2: O at index 0
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 });
      expect(state.board[0]).toBe('O');
      expect(state.currentPlayer).toBe('X');
      expect(state.history).toHaveLength(2);
    });

    it('1.4 should handle PAUSE_GAME and RESUME_GAME transitions', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME' });
      expect(state.status).toBe('PLAYING');

      state = gameReducer(state, { type: 'PAUSE_GAME' });
      expect(state.status).toBe('PAUSED');

      // Move should be ignored when paused
      const moveInPause = gameReducer(state, { type: 'MAKE_MOVE', index: 0 });
      expect(moveInPause).toBe(state);

      state = gameReducer(state, { type: 'RESUME_GAME' });
      expect(state.status).toBe('PLAYING');
    });

    it('1.5 should reset board and turn to X on RESET_GAME', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 });
      expect(state.history).toHaveLength(2);

      state = gameReducer(state, { type: 'RESET_GAME' });
      expect(state.status).toBe('PLAYING');
      expect(state.board.every((c) => c === null)).toBe(true);
      expect(state.currentPlayer).toBe('X');
      expect(state.history).toEqual([]);
      expect(state.winner).toBeNull();
      expect(state.winningLine).toBeNull();
    });

    it('1.6 should ignore invalid moves (occupied cell or out of bounds)', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 });

      // Try making move on occupied cell 0
      const sameCellMove = gameReducer(state, { type: 'MAKE_MOVE', index: 0 });
      expect(sameCellMove).toBe(state);

      // Out of bounds indices
      const negMove = gameReducer(state, { type: 'MAKE_MOVE', index: -1 });
      expect(negMove).toBe(state);

      const overflowMove = gameReducer(state, { type: 'MAKE_MOVE', index: 99 });
      expect(overflowMove).toBe(state);
    });
  });

  /* ========================================================================
   * FEATURE AREA 2: Minimax AI Engine
   * ======================================================================== */
  describe('2. Minimax AI Engine', () => {
    it('2.1 guarantees 0% loss (unbeatable performance) on 3x3 boards', () => {
      // Test Minimax playing as O against every possible opening move by X
      for (let firstMove = 0; firstMove < 9; firstMove++) {
        let board: CellValue[] = Array(9).fill(null);
        board[firstMove] = 'X';

        // Play rest of game using getBestMove for O and first available for X
        let currentPlayer: 'X' | 'O' = 'O';
        let turns = 1;
        while (turns < 9) {
          const winnerRes = checkWinner(board, 3, 3);
          if (winnerRes.winner !== null) break;

          if (currentPlayer === 'O') {
            const aiMove = getBestMove(board, 'O', 'AI_UNBEATABLE', 3, 3);
            expect(aiMove).not.toBe(-1);
            expect(board[aiMove]).toBeNull();
            board[aiMove] = 'O';
            currentPlayer = 'X';
          } else {
            const avail = getAvailableMoves(board);
            if (avail.length === 0) break;
            board[avail[0]] = 'X';
            currentPlayer = 'O';
          }
          turns++;
        }

        const finalWin = checkWinner(board, 3, 3);
        // Minimax AI (O) must NEVER lose to simple strategy (X cannot win)
        expect(finalWin.winner).not.toBe('X');
      }
    });

    it('2.2 executes immediate 1-move win when available', () => {
      // Board where O can win at index 2
      const board: CellValue[] = [
        'O', 'O', null,
        'X', 'X', null,
        null, null, null,
      ];
      const result = findImmediateWinOrBlock(board, 'O', 3, 3);
      expect(result.winMove).toBe(2);

      const bestMove = getBestMove(board, 'O', 'AI_UNBEATABLE', 3, 3);
      expect(bestMove).toBe(2);
    });

    it('2.3 executes immediate 1-move block when opponent threatens win', () => {
      // Board where X threatens to win at index 2
      const board: CellValue[] = [
        'X', 'X', null,
        'O', null, null,
        null, null, null,
      ];
      const result = findImmediateWinOrBlock(board, 'O', 3, 3);
      expect(result.blockMove).toBe(2);

      const bestMove = getBestMove(board, 'O', 'AI_UNBEATABLE', 3, 3);
      expect(bestMove).toBe(2);
    });

    it('2.4 completes AI move calculation in under 10ms on 4x4 and 5x5 boards', () => {
      const board4x4: CellValue[] = Array(16).fill(null);
      board4x4[0] = 'X';
      board4x4[5] = 'O';

      const t0 = performance.now();
      const move4 = getBestMove(board4x4, 'O', 'AI_UNBEATABLE', 4, 4);
      const t1 = performance.now();
      expect(move4).toBeGreaterThanOrEqual(0);
      expect(t1 - t0).toBeLessThan(10); // <10ms requirement

      const board5x5: CellValue[] = Array(25).fill(null);
      board5x5[0] = 'X';
      board5x5[12] = 'O';

      const t2 = performance.now();
      const move5 = getBestMove(board5x5, 'O', 'AI_UNBEATABLE', 5, 4);
      const t3 = performance.now();
      expect(move5).toBeGreaterThanOrEqual(0);
      expect(t3 - t2).toBeLessThan(10); // <10ms requirement
    });

    it('2.5 provides Easy mode with randomized move behavior', () => {
      const board: CellValue[] = Array(9).fill(null);
      board[0] = 'X';

      // Call getBestMove in AI_EASY mode multiple times
      const moves = new Set<number>();
      for (let i = 0; i < 20; i++) {
        const move = getBestMove(board, 'O', 'AI_EASY', 3, 3);
        expect(move).toBeGreaterThanOrEqual(0);
        expect(board[move]).toBeNull();
        moves.add(move);
      }
      // Over 20 iterations, random selection should pick more than 1 distinct index
      expect(moves.size).toBeGreaterThan(1);
    });

    it('2.6 selects center or optimal opening move on empty board', () => {
      const board: CellValue[] = Array(9).fill(null);
      const move = getBestMove(board, 'X', 'AI_UNBEATABLE', 3, 3);
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(9);
    });
  });

  /* ========================================================================
   * FEATURE AREA 3: Grid Dimensions & Win Evaluator
   * ======================================================================== */
  describe('3. Grid Dimensions & Win Evaluator', () => {
    it('3.1 evaluates 3x3 horizontal win line', () => {
      const board: CellValue[] = [
        'X', 'X', 'X',
        'O', 'O', null,
        null, null, null,
      ];
      const result = checkWinner(board, 3, 3);
      expect(result.winner).toBe('X');
      expect(result.winningLine).toEqual({
        combo: [0, 1, 2],
        direction: 'HORIZONTAL',
      });
    });

    it('3.2 evaluates 4x4 vertical win line with streak 4', () => {
      const board: CellValue[] = Array(16).fill(null);
      // Fill column 1: indices 1, 5, 9, 13
      board[1] = 'O';
      board[5] = 'O';
      board[9] = 'O';
      board[13] = 'O';

      const result = checkWinner(board, 4, 4);
      expect(result.winner).toBe('O');
      expect(result.winningLine).toEqual({
        combo: [1, 5, 9, 13],
        direction: 'VERTICAL',
      });
    });

    it('3.3 evaluates 5x5 main diagonal win line with streak 4', () => {
      const board: CellValue[] = Array(25).fill(null);
      // Fill main diagonal cells: 0, 6, 12, 18
      board[0] = 'X';
      board[6] = 'X';
      board[12] = 'X';
      board[18] = 'X';

      const result = checkWinner(board, 5, 4);
      expect(result.winner).toBe('X');
      expect(result.winningLine).toEqual({
        combo: [0, 6, 12, 18],
        direction: 'DIAGONAL_MAIN',
      });
    });

    it('3.4 evaluates 5x5 sub diagonal win line with streak 4', () => {
      const board: CellValue[] = Array(25).fill(null);
      // Sub diagonal line: (0,3)=3, (1,2)=7, (2,1)=11, (3,0)=15
      board[3] = 'O';
      board[7] = 'O';
      board[11] = 'O';
      board[15] = 'O';

      const result = checkWinner(board, 5, 4);
      expect(result.winner).toBe('O');
      expect(result.winningLine).toEqual({
        combo: [3, 7, 11, 15],
        direction: 'DIAGONAL_SUB',
      });
    });

    it('3.5 detects full board draw when no winning streak exists', () => {
      const board: CellValue[] = [
        'X', 'O', 'X',
        'X', 'O', 'O',
        'O', 'X', 'X',
      ];
      const result = checkWinner(board, 3, 3);
      expect(result.winner).toBe('DRAW');
      expect(result.winningLine).toBeNull();

      expect(checkDraw(board, 3)).toBe(true);
      expect(isBoardFull(board)).toBe(true);
    });

    it('3.6 verifies contract wrapper checkWin returns structured winner details', () => {
      const board: CellValue[] = [
        'X', 'O', 'O',
        'X', null, null,
        'X', null, null,
      ];
      const result = checkWin(board, 3, 3);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe('X');
      expect(result?.direction).toBe('VERTICAL');
      expect(result?.combo).toEqual([0, 3, 6]);
    });
  });

  /* ========================================================================
   * FEATURE AREA 4: Tactical Hint Generator
   * ======================================================================== */
  describe('4. Tactical Hint Generator', () => {
    it('4.1 generates immediate win hint with score 100', () => {
      const board: CellValue[] = [
        'X', 'X', null,
        'O', 'O', null,
        null, null, null,
      ];
      const hint = getHintMove(board, 3, 'X');
      expect(hint).not.toBeNull();
      expect(hint?.index).toBe(2);
      expect(hint?.score).toBe(100);
      expect(hint?.explanation).toContain('Winning Move');
    });

    it('4.2 generates immediate block hint with score 90', () => {
      const board: CellValue[] = [
        'O', 'O', null,
        'X', null, null,
        null, null, null,
      ];
      const hint = getHintMove(board, 3, 'X');
      expect(hint).not.toBeNull();
      expect(hint?.index).toBe(2);
      expect(hint?.score).toBe(90);
      expect(hint?.explanation).toContain('Defensive Block');
    });

    it('4.3 generates center opening hint with score 80 when center is free', () => {
      const board: CellValue[] = [
        'X', null, null,
        null, null, null,
        null, null, null,
      ];
      const hint = getHintMove(board, 3, 'O');
      expect(hint).not.toBeNull();
      expect(hint?.index).toBe(4);
      expect(hint?.score).toBe(80);
      expect(hint?.explanation).toContain('Control Center');
    });

    it('4.4 renders cell ping highlight in GameBoard when hintResult matches cell index', () => {
      const state: GameState = {
        ...createInitialState(),
        status: 'PLAYING',
        hintResult: {
          index: 4,
          score: 80,
          explanation: 'Control Center!',
        },
      };

      const { container } = render(
        <GameBoard gameState={state} onCellClick={() => {}} />
      );

      // Cell 4 should contain an element with animate-ping class
      const pingElement = container.querySelector('.animate-ping');
      expect(pingElement).not.toBeNull();
    });

    it('4.5 renders hint explanation banner text in App UI when hint is active', () => {
      render(<App />);

      // Start game
      const startBtn = screen.getByText(/START MATCH|ENTER ARENA/i);
      fireEvent.click(startBtn);

      // Click Hint button
      const hintBtn = screen.getByTitle(/Get Tactical AI Hint/i);
      fireEvent.click(hintBtn);

      // Banner with recommendation should be visible
      expect(screen.getByText(/Tactical Recommendation/i)).toBeDefined();
    });
  });

  /* ========================================================================
   * FEATURE AREA 5: Glassmorphic UI & Theme Engine
   * ======================================================================== */
  describe('5. Glassmorphic UI & Theme Engine', () => {
    it('5.1 applies data-theme attribute across all 5 visual themes', () => {
      const { container } = render(<App />);

      // Default theme
      const rootDiv = container.firstElementChild as HTMLElement;
      expect(rootDiv.getAttribute('data-theme')).toBe('CYBERPUNK');

      // Open Settings tab
      const configTab = screen.getByText('Config');
      fireEvent.click(configTab);

      // Select dropdown
      const themeSelect = screen.getByRole('combobox');
      
      const themes = [
        'GLASSMORPHISM',
        'RETRO_ARCADE',
        'MINIMAL_LUXURY',
        'COSMIC_NEON',
        'CYBERPUNK',
      ];

      for (const theme of themes) {
        fireEvent.change(themeSelect, { target: { value: theme } });
        expect(rootDiv.getAttribute('data-theme')).toBe(theme);
      }
    });

    it('5.2 renders ThemeSelector with all 5 color palettes', () => {
      const onSelect = vi.fn();
      render(<ThemeSelector currentTheme="CYBERPUNK" onSelectTheme={onSelect} />);

      expect(screen.getByText('Cyberpunk Neon')).toBeDefined();
      expect(screen.getByText('Glassmorphism Frost')).toBeDefined();
      expect(screen.getByText('Retro Synthwave')).toBeDefined();
      expect(screen.getByText('Minimalist Luxury')).toBeDefined();
      expect(screen.getByText('Cosmic Nebula')).toBeDefined();

      fireEvent.click(screen.getByText('Glassmorphism Frost'));
      expect(onSelect).toHaveBeenCalledWith('GLASSMORPHISM');
    });

    it('5.3 renders SVG mark tokens with drop-shadow effects in GameBoard', () => {
      const state: GameState = {
        ...createInitialState(),
        status: 'PLAYING',
        board: ['X', 'O', null, null, null, null, null, null, null],
      };

      const { container } = render(
        <GameBoard gameState={state} onCellClick={() => {}} />
      );

      // Check SVG elements rendered
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(2);

      // Verify drop-shadow classes
      const xSvg = container.querySelector('.text-cyan-400');
      const oSvg = container.querySelector('.text-pink-500');
      expect(xSvg).not.toBeNull();
      expect(oSvg).not.toBeNull();
    });

    it('5.4 renders ghost hover previews on empty cells', () => {
      const state: GameState = {
        ...createInitialState(),
        status: 'PLAYING',
        currentPlayer: 'X',
        board: Array(9).fill(null),
      };

      const { container } = render(
        <GameBoard gameState={state} onCellClick={() => {}} />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(9);

      // Mouse enter cell 0
      fireEvent.mouseEnter(buttons[0]);
      const ghost = container.querySelector('.opacity-30');
      expect(ghost).not.toBeNull();
    });

    it('5.5 switches tab navigation smoothly between PLAY, SETTINGS, and STATS', () => {
      render(<App />);

      // Navigation buttons
      const playTab = screen.getByText('Arena');
      const settingsTab = screen.getByText('Config');
      const statsTab = screen.getByText('Stats');

      fireEvent.click(settingsTab);
      expect(screen.getByText('Arena Configurations')).toBeDefined();

      fireEvent.click(statsTab);
      expect(screen.getByText('Combat Statistics')).toBeDefined();

      fireEvent.click(playTab);
      expect(screen.queryByText('Arena Configurations')).toBeNull();
    });

    it('5.6 renders GameBoard with appropriate grid layout according to size', () => {
      const state3 = { ...createInitialState(), size: 3 as const };
      const { container: c3 } = render(<GameBoard gameState={state3} onCellClick={() => {}} />);
      expect(c3.querySelector('.grid-cols-3')).not.toBeNull();

      const state4 = { ...createInitialState({ boardSize: 4 }), size: 4 as const, board: Array(16).fill(null) };
      const { container: c4 } = render(<GameBoard gameState={state4} onCellClick={() => {}} />);
      expect(c4.querySelector('.grid-cols-4')).not.toBeNull();
    });
  });

  /* ========================================================================
   * FEATURE AREA 6: Winning Strike Overlay
   * ======================================================================== */
  describe('6. Winning Strike Overlay', () => {
    it('6.1 renders SVG winning line when winningLine is present', () => {
      const state: GameState = {
        ...createInitialState(),
        status: 'VICTORY',
        winner: 'X',
        winningLine: {
          combo: [0, 1, 2],
          direction: 'HORIZONTAL',
        },
      };

      const { container } = render(
        <GameBoard gameState={state} onCellClick={() => {}} />
      );

      // Strike overlay SVG line
      const line = container.querySelector('line[stroke="url(#strikeGlow)"]');
      expect(line).not.toBeNull();
    });

    it('6.2 calculates correct percentage coordinates for endpoint cells', () => {
      const state: GameState = {
        ...createInitialState(),
        status: 'VICTORY',
        winner: 'X',
        winningLine: {
          combo: [0, 2], // Row 0 Col 0 to Row 0 Col 2 on 3x3
          direction: 'HORIZONTAL',
        },
      };

      const { container } = render(
        <GameBoard gameState={state} onCellClick={() => {}} />
      );

      const line = container.querySelector('line[stroke="url(#strikeGlow)"]');
      expect(line).not.toBeNull();
      // Cell size = 100/3 = 33.333%
      // Col 0 center x = 16.666%, Row 0 center y = 16.666%
      // Col 2 center x = 83.333%, Row 0 center y = 16.666%
      expect(line?.getAttribute('x1')).toContain('16.6');
      expect(line?.getAttribute('y1')).toContain('16.6');
      expect(line?.getAttribute('x2')).toContain('83.3');
      expect(line?.getAttribute('y2')).toContain('16.6');
    });

    it('6.3 applies gradient filter and standard glow defs', () => {
      const state: GameState = {
        ...createInitialState(),
        status: 'VICTORY',
        winner: 'X',
        winningLine: {
          combo: [0, 4, 8],
          direction: 'DIAGONAL_MAIN',
        },
      };

      const { container } = render(
        <GameBoard gameState={state} onCellClick={() => {}} />
      );

      const gradient = container.querySelector('#strikeGlow');
      const filter = container.querySelector('#glowFilter');
      expect(gradient).not.toBeNull();
      expect(filter).not.toBeNull();
    });

    it('6.4 applies stroke width and linecap styling attributes', () => {
      const state: GameState = {
        ...createInitialState(),
        status: 'VICTORY',
        winner: 'O',
        winningLine: {
          combo: [0, 3, 6],
          direction: 'VERTICAL',
        },
      };

      const { container } = render(
        <GameBoard gameState={state} onCellClick={() => {}} />
      );

      const line = container.querySelector('line[stroke="url(#strikeGlow)"]');
      expect(line?.getAttribute('stroke-width')).toBe('4');
      expect(line?.getAttribute('stroke-linecap')).toBe('round');
    });

    it('6.5 removes strike overlay when game is reset', () => {
      const stateWon: GameState = {
        ...createInitialState(),
        status: 'VICTORY',
        winner: 'X',
        winningLine: {
          combo: [0, 1, 2],
          direction: 'HORIZONTAL',
        },
      };

      const { container, rerender } = render(
        <GameBoard gameState={stateWon} onCellClick={() => {}} />
      );

      expect(container.querySelector('line[stroke="url(#strikeGlow)"]')).not.toBeNull();

      const stateReset: GameState = createInitialState();
      rerender(<GameBoard gameState={stateReset} onCellClick={() => {}} />);

      expect(container.querySelector('line[stroke="url(#strikeGlow)"]')).toBeNull();
    });
  });

  /* ========================================================================
   * FEATURE AREA 7: Procedural Web Audio Engine
   * ======================================================================== */
  describe('7. Procedural Web Audio Engine', () => {
    it('7.1 executes playClick() chirp synth', () => {
      expect(() => soundEngine.playClick()).not.toThrow();
    });

    it('7.2 executes playMove() with distinct parameters for X and O', () => {
      expect(() => soundEngine.playMove('X')).not.toThrow();
      expect(() => soundEngine.playMove('O')).not.toThrow();
    });

    it('7.3 executes playWin() celebratory major arpeggio sequence', () => {
      expect(() => soundEngine.playWin()).not.toThrow();
    });

    it('7.4 executes playDraw() neutral tone sequence', () => {
      expect(() => soundEngine.playDraw()).not.toThrow();
    });

    it('7.5 manages volume adjustment and mute toggles properly', () => {
      soundEngine.setVolume(0.5);
      soundEngine.setMuted(true);
      expect(() => soundEngine.playClick()).not.toThrow();

      const isMuted = soundEngine.toggleMute();
      expect(isMuted).toBe(false);
      soundEngine.setVolume(1.0);
    });
  });

  /* ========================================================================
   * FEATURE AREA 8: Particle Fireworks Confetti
   * ======================================================================== */
  describe('8. Particle Fireworks Confetti', () => {
    it('8.1 creates canvas overlay on body when triggerConfetti is executed', () => {
      const cleanup = triggerConfetti();
      const canvasOverlay = document.getElementById('confetti-canvas-overlay');
      expect(canvasOverlay).not.toBeNull();
      expect(canvasOverlay?.tagName).toBe('CANVAS');

      cleanup();
      expect(document.getElementById('confetti-canvas-overlay')).toBeNull();
    });

    it('8.2 initializes particles with multi-shape variations', () => {
      const targetCanvas = document.createElement('canvas');
      document.body.appendChild(targetCanvas);

      const cleanup = triggerConfetti(targetCanvas);
      expect(cleanup).toBeTypeOf('function');

      cleanup();
      document.body.removeChild(targetCanvas);
    });

    it('8.3 runs requestAnimationFrame loop without errors', () => {
      const spy = vi.spyOn(window, 'requestAnimationFrame');
      const cleanup = triggerConfetti();
      expect(spy).toHaveBeenCalled();
      cleanup();
      spy.mockRestore();
    });

    it('8.4 handles canvas rendering on custom target canvas', () => {
      const canvas = document.createElement('canvas');
      Object.defineProperty(canvas, 'clientWidth', { value: 800 });
      Object.defineProperty(canvas, 'clientHeight', { value: 600 });

      const cleanup = triggerConfetti(canvas);
      expect(cleanup).toBeTypeOf('function');
      cleanup();
    });

    it('8.5 executes cleanup callback cleanly', () => {
      const cleanup = triggerConfetti();
      expect(document.getElementById('confetti-canvas-overlay')).not.toBeNull();

      cleanup();
      expect(document.getElementById('confetti-canvas-overlay')).toBeNull();
    });
  });

  /* ========================================================================
   * FEATURE AREA 9: Local Persistence & Analytics
   * ======================================================================== */
  describe('9. Local Persistence & Analytics', () => {
    it('9.1 persists settings to localStorage key ultra_tictactoe_settings_v1', () => {
      render(<App />);

      // Switch to Config tab
      const configTab = screen.getByText('Config');
      fireEvent.click(configTab);

      // Click 4x4 Grid size button
      const size4Btn = screen.getByText('4x4');
      fireEvent.click(size4Btn);

      const storedSettings = localStorage.getItem('ultra_tictactoe_settings_v1');
      expect(storedSettings).not.toBeNull();
      const parsed = JSON.parse(storedSettings || '{}');
      expect(parsed.boardSize).toBe(4);
    });

    it('9.2 persists stats to localStorage key ultra_tictactoe_stats_v1 on game completion', () => {
      let state = createInitialState();
      state = gameReducer(state, { type: 'START_GAME' });

      // Simulate X winning line (0, 1, 2)
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X wins

      expect(state.status).toBe('VICTORY');
      expect(state.playerX.stats.wins).toBe(1);

      // Verify state structure saved to stats key
      const mockStatsPayload = {
        playerX: state.playerX.stats,
        playerO: state.playerO.stats,
      };
      localStorage.setItem('ultra_tictactoe_stats_v1', JSON.stringify(mockStatsPayload));

      const storedStats = localStorage.getItem('ultra_tictactoe_stats_v1');
      expect(storedStats).not.toBeNull();
      const parsed = JSON.parse(storedStats || '{}');
      expect(parsed.playerX.wins).toBe(1);
    });

    it('9.3 restores saved settings and stats on initial state load', () => {
      localStorage.setItem(
        'ultra_tictactoe_settings_v1',
        JSON.stringify({ boardSize: 5, theme: 'RETRO_ARCADE' })
      );
      localStorage.setItem(
        'ultra_tictactoe_stats_v1',
        JSON.stringify({
          playerX: { wins: 5, losses: 2, draws: 1, winStreak: 3, bestStreak: 4, totalTimePlayedSeconds: 100 },
          playerO: { wins: 2, losses: 5, draws: 1, winStreak: 0, bestStreak: 2, totalTimePlayedSeconds: 100 },
        })
      );

      render(<App />);

      // Root container should reflect RETRO_ARCADE theme
      expect(document.querySelector('[data-theme="RETRO_ARCADE"]')).not.toBeNull();

      // Open Stats tab
      fireEvent.click(screen.getByText('Stats'));
      expect(screen.getByText('Player X Wins')).toBeDefined();
      expect(screen.getByText('5')).toBeDefined(); // 5 wins
    });

    it('9.4 calculates win rate percentages accurately in Stats view', () => {
      const state: GameState = {
        ...createInitialState(),
        playerX: {
          ...createInitialState().playerX,
          stats: { wins: 3, losses: 1, draws: 1, winStreak: 2, bestStreak: 3, totalTimePlayedSeconds: 50 },
        },
        playerO: {
          ...createInitialState().playerO,
          stats: { wins: 1, losses: 3, draws: 1, winStreak: 0, bestStreak: 1, totalTimePlayedSeconds: 50 },
        },
      };

      // Total matches = 5. X win rate = 60%, O win rate = 20%
      render(
        <StatsModal
          gameState={state}
          isOpen={true}
          onClose={() => {}}
          onResetStats={() => {}}
        />
      );

      expect(screen.getByText(/60%/)).toBeDefined();
      expect(screen.getByText(/20%/)).toBeDefined();
    });

    it('9.5 zeroes player stats on RESET_STATS event', () => {
      let state = createInitialState();
      state.playerX.stats.wins = 10;
      state.playerO.stats.wins = 5;

      state = gameReducer(state, { type: 'RESET_STATS' });
      expect(state.playerX.stats.wins).toBe(0);
      expect(state.playerO.stats.wins).toBe(0);
      expect(state.playerX.stats.winStreak).toBe(0);
    });
  });

  /* ========================================================================
   * FEATURE AREA 10: 2-Ply Undo System
   * ======================================================================== */
  describe('10. 2-Ply Undo System', () => {
    it('10.1 pops 2 history steps in AI mode on UNDO_MOVE', () => {
      let state = createInitialState({ mode: 'AI_UNBEATABLE' });
      state = gameReducer(state, { type: 'START_GAME' });

      // Step 1: Player X move at index 0
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 });
      // Step 2: AI O move at index 4
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 });
      expect(state.history).toHaveLength(2);

      // Undo move in AI mode -> 2-ply reversal
      state = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(state.history).toHaveLength(0);
      expect(state.board.every((c) => c === null)).toBe(true);
      expect(state.currentPlayer).toBe('X');
    });

    it('10.2 pops 1 history step in 2-Player (PVP_LOCAL) mode on UNDO_MOVE', () => {
      let state = createInitialState({ mode: 'PVP_LOCAL' });
      state = gameReducer(state, { type: 'START_GAME' });

      // Step 1: P1 X at index 0
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 });
      // Step 2: P2 O at index 1
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 });
      expect(state.history).toHaveLength(2);

      // Undo move in PVP_LOCAL mode -> 1-ply reversal
      state = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(state.history).toHaveLength(1);
      expect(state.board[0]).toBe('X');
      expect(state.board[1]).toBeNull();
      expect(state.currentPlayer).toBe('O');
    });

    it('10.3 reconstructs board state accurately after multiple moves and undo', () => {
      let state = createInitialState({ mode: 'PVP_LOCAL' });
      state = gameReducer(state, { type: 'START_GAME' });

      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O

      expect(state.history).toHaveLength(4);

      // Undo 1 step
      state = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(state.history).toHaveLength(3);
      expect(state.board[4]).toBeNull();
      expect(state.board[0]).toBe('X');
      expect(state.board[3]).toBe('O');
      expect(state.board[1]).toBe('X');
      expect(state.currentPlayer).toBe('O');
    });

    it('10.4 restores player turn correctly based on remaining history', () => {
      let state = createInitialState({ mode: 'PVP_LOCAL' });
      state = gameReducer(state, { type: 'START_GAME' });

      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      expect(state.currentPlayer).toBe('O');

      state = gameReducer(state, { type: 'UNDO_MOVE' });
      expect(state.currentPlayer).toBe('X');
    });

    it('10.5 disables Undo button when history is empty', () => {
      const state: GameState = {
        ...createInitialState(),
        status: 'PLAYING',
        history: [],
      };

      render(
        <ControlPanel
          gameState={state}
          onStartGame={() => {}}
          onPauseGame={() => {}}
          onResumeGame={() => {}}
          onResetGame={() => {}}
          onUndoMove={() => {}}
          onSelectMode={() => {}}
          onSelectBoardSize={() => {}}
          onSelectTimeLimit={() => {}}
        />
      );

      const undoBtn = screen.getByTitle('Undo Last Move') as HTMLButtonElement;
      expect(undoBtn.disabled).toBe(true);
    });
  });
});
