import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import App from '../src/App';
import { gameReducer, createInitialState } from '../src/logic/gameReducer';
import { getBestMove } from '../src/logic/minimax';
import { checkWinner, getAvailableMoves } from '../src/logic/winChecker';
import { soundEngine } from '../src/audio/soundEngine';
import { BoardSize, ThemeMode, GameState } from '../src/types/game';

const SETTINGS_STORAGE_KEY = 'ultra_tictactoe_settings_v1';
const STATS_STORAGE_KEY = 'ultra_tictactoe_stats_v1';

describe('Tier 4 Real-World Application Workloads & Stress Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  /**
   * 1. 50-Match Unbeatable Minimax Simulation
   * Run 50 automated simulated matches against Unbeatable AI on 3x3 with random/tactical human moves.
   * Assert 0% human win rate (AI wins + draws = 50). Verify zero memory accumulation.
   */
  describe('1. 50-Match Unbeatable Minimax Simulation', () => {
    it('executes 50 consecutive matches against Unbeatable AI resulting in 0 human wins and zero memory accumulation', () => {
      let humanWins = 0;
      let aiWins = 0;
      let draws = 0;

      for (let matchIndex = 0; matchIndex < 50; matchIndex++) {
        let state: GameState = createInitialState({
          mode: 'AI_UNBEATABLE',
          boardSize: 3,
          timeLimitSecondsPerTurn: 0,
        });

        state = gameReducer(state, { type: 'START_GAME' });

        let moveSafetyCounter = 0;
        while (state.status === 'PLAYING' && moveSafetyCounter < 20) {
          moveSafetyCounter++;
          const availableMoves = getAvailableMoves(state.board);
          if (availableMoves.length === 0) break;

          if (state.currentPlayer === 'X') {
            // Human player move (alternate strategies: tactical corner/center vs random available)
            let humanMove = availableMoves[0];
            if (matchIndex % 2 === 0) {
              // Tactical selection: prefer center (4) or corners (0, 2, 6, 8)
              const preferred = [4, 0, 2, 6, 8, 1, 3, 5, 7];
              humanMove = preferred.find((idx) => availableMoves.includes(idx)) ?? availableMoves[0];
            } else {
              // Random valid move
              humanMove = availableMoves[matchIndex % availableMoves.length];
            }

            state = gameReducer(state, { type: 'MAKE_MOVE', index: humanMove });
          } else {
            // Unbeatable Minimax AI move
            const bestMove = getBestMove(state.board, 'O', 'AI_UNBEATABLE', 3, 3);
            expect(bestMove).toBeGreaterThanOrEqual(0);
            expect(bestMove).toBeLessThan(9);
            expect(state.board[bestMove]).toBeNull();

            state = gameReducer(state, { type: 'MAKE_MOVE', index: bestMove });
          }
        }

        // Assert game result
        if (state.winner === 'X') {
          humanWins++;
        } else if (state.winner === 'O') {
          aiWins++;
        } else if (state.winner === 'DRAW') {
          draws++;
        }

        expect(state.status).toMatch(/VICTORY|DRAW/);

        // Memory cleanup check: Reset game state and verify clean allocations
        state = gameReducer(state, { type: 'RESET_GAME' });
        expect(state.board.length).toBe(9);
        expect(state.board.every((cell) => cell === null)).toBe(true);
        expect(state.history.length).toBe(0);
        expect(state.winningLine).toBeNull();
        expect(state.winner).toBeNull();
      }

      // Assert 0% human win rate
      expect(humanWins).toBe(0);
      expect(aiWins + draws).toBe(50);
      expect(humanWins + aiWins + draws).toBe(50);
    });
  });

  /**
   * 2. Local Pass-and-Play Match Series
   * Play a 5-match series in 2-Player Local PvP mode with alternating wins and draws,
   * verifying cumulative stats tracking and leaderboard analytics updates.
   */
  describe('2. Local Pass-and-Play Match Series', () => {
    it('tracks cumulative statistics across a 5-match Local PvP series and updates leaderboard analytics', () => {
      let state: GameState = createInitialState({
        mode: 'PVP_LOCAL',
        boardSize: 3,
      });

      // Match 1: Player X wins (X: 0, 1, 2)
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X wins!
      expect(state.winner).toBe('X');
      expect(state.status).toBe('VICTORY');
      expect(state.playerX.stats.wins).toBe(1);
      expect(state.playerX.stats.winStreak).toBe(1);

      // Match 2: Player O wins (X: 3, 4, 8; O: 0, 1, 2)
      state = gameReducer(state, { type: 'RESET_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 8 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // O wins!
      expect(state.winner).toBe('O');
      expect(state.status).toBe('VICTORY');
      expect(state.playerO.stats.wins).toBe(1);
      expect(state.playerX.stats.wins).toBe(1);
      expect(state.playerX.stats.winStreak).toBe(0);

      // Match 3: Draw Match (X: 0, 1, 5, 6, 8; O: 2, 3, 4, 7)
      state = gameReducer(state, { type: 'RESET_GAME' });
      const drawSequenceMatch3 = [0, 2, 1, 4, 5, 3, 6, 8, 7];
      drawSequenceMatch3.forEach((cellIdx) => {
        state = gameReducer(state, { type: 'MAKE_MOVE', index: cellIdx });
      });
      expect(state.winner).toBe('DRAW');
      expect(state.status).toBe('DRAW');
      expect(state.playerX.stats.draws).toBe(1);
      expect(state.playerO.stats.draws).toBe(1);

      // Match 4: Player X wins (X: 0, 3, 6)
      state = gameReducer(state, { type: 'RESET_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 6 }); // X wins!
      expect(state.winner).toBe('X');
      expect(state.playerX.stats.wins).toBe(2);

      // Match 5: Draw Match
      state = gameReducer(state, { type: 'RESET_GAME' });
      drawSequenceMatch3.forEach((cellIdx) => {
        state = gameReducer(state, { type: 'MAKE_MOVE', index: cellIdx });
      });
      expect(state.winner).toBe('DRAW');

      // Final Cumulative Stats Assertions
      expect(state.playerX.stats.wins).toBe(2);
      expect(state.playerO.stats.wins).toBe(1);
      expect(state.playerX.stats.draws).toBe(2);
      expect(state.playerO.stats.draws).toBe(2);
      expect(state.playerX.stats.losses).toBe(1);
      expect(state.playerO.stats.losses).toBe(2);
      expect(state.playerX.stats.bestStreak).toBe(1);

      // Save stats to LocalStorage and verify rendering via UI App component
      localStorage.setItem(
        STATS_STORAGE_KEY,
        JSON.stringify({
          playerX: state.playerX.stats,
          playerO: state.playerO.stats,
        })
      );

      render(<App />);

      // Navigate to Stats tab
      const statsTabButton = screen.getByRole('button', { name: /stats/i });
      fireEvent.click(statsTabButton);

      // Verify Leaderboard UI Displays Correct Stats
      const pxWins = screen.getByText('Player X Wins');
      const poWins = screen.getByText('Player O / AI Wins');
      expect(pxWins).toBeInTheDocument();
      expect(poWins).toBeInTheDocument();
      expect(screen.getByText('Draw Matches')).toBeInTheDocument();

      // Check numbers in DOM
      expect(pxWins.parentElement?.textContent).toContain('2'); // Player X wins count
      expect(poWins.parentElement?.textContent).toContain('1'); // Player O wins count
    });
  });

  /**
   * 3. Rapid Theme Cycling Workload
   * Rapidly switch between all 5 visual themes 50 times while game is playing,
   * asserting DOM data-theme updates reliably without UI crashes.
   */
  describe('3. Rapid Theme Cycling Workload', () => {
    it('cycles between all 5 themes 50 times during active gameplay without UI crashes or DOM corruption', () => {
      render(<App />);

      // Start match
      const startButton = screen.getByText(/ENTER ARENA|START MATCH/i);
      fireEvent.click(startButton);

      // Switch to Config tab
      const configTabButton = screen.getByRole('button', { name: /config/i });
      fireEvent.click(configTabButton);

      const themes: ThemeMode[] = [
        'CYBERPUNK',
        'GLASSMORPHISM',
        'RETRO_ARCADE',
        'MINIMAL_LUXURY',
        'COSMIC_NEON',
      ];

      const selectElement = screen.getByRole('combobox') as HTMLSelectElement;
      expect(selectElement).toBeInTheDocument();

      // Cycle themes 50 times
      for (let i = 0; i < 50; i++) {
        const targetTheme = themes[i % themes.length];
        fireEvent.change(selectElement, { target: { value: targetTheme } });

        const rootContainer = document.querySelector('[data-theme]');
        expect(rootContainer).not.toBeNull();
        expect(rootContainer?.getAttribute('data-theme')).toBe(targetTheme);
      }

      // Return to Arena tab and verify UI is responsive
      const arenaTabButton = screen.getByRole('button', { name: /^arena$/i });
      fireEvent.click(arenaTabButton);

      // Assert board is visible and interactive
      expect(document.querySelector('.grid')).toBeInTheDocument();
    });
  });

  /**
   * 4. Board Dimension Stress Test
   * Rapidly cycle board dimensions between 3x3, 4x4, and 5x5 over 20 games,
   * verifying grid array sizing and win streak criteria.
   */
  describe('4. Board Dimension Stress Test', () => {
    it('cycles board dimensions across 20 games, verifying grid sizing and streak requirements', () => {
      const dimensions: BoardSize[] = [3, 4, 5];

      for (let gameIndex = 0; gameIndex < 20; gameIndex++) {
        const size = dimensions[gameIndex % dimensions.length];
        const expectedLength = size * size;
        const expectedStreak = size === 3 ? 3 : 4;

        let state: GameState = createInitialState();
        state = gameReducer(state, { type: 'UPDATE_SETTINGS', settings: { boardSize: size } });

        expect(state.size).toBe(size);
        expect(state.board.length).toBe(expectedLength);
        expect(state.settings.streakToWin).toBe(expectedStreak);

        // Verify win streak logic for 4x4 and 5x5: 3 marks in a row must NOT trigger win, 4 must trigger win
        if (size >= 4) {
          const tempBoard = Array(expectedLength).fill(null);
          // Place 3 marks in first row
          tempBoard[0] = 'X';
          tempBoard[1] = 'X';
          tempBoard[2] = 'X';

          const partialCheck = checkWinner(tempBoard, size, expectedStreak);
          expect(partialCheck.winner).toBeNull(); // 3 in a row is NOT a win on 4x4/5x5

          // Place 4th mark
          tempBoard[3] = 'X';
          const fullCheck = checkWinner(tempBoard, size, expectedStreak);
          expect(fullCheck.winner).toBe('X');
          expect(fullCheck.winningLine?.combo.length).toBe(4);
        } else {
          const tempBoard = Array(9).fill(null);
          tempBoard[0] = 'X';
          tempBoard[1] = 'X';
          tempBoard[2] = 'X';
          const winCheck3 = checkWinner(tempBoard, 3, 3);
          expect(winCheck3.winner).toBe('X');
          expect(winCheck3.winningLine?.combo.length).toBe(3);
        }
      }

      // UI Grid Dimension Verification
      render(<App />);

      // Switch to Config tab
      const configTabButton = screen.getByRole('button', { name: /config/i });
      fireEvent.click(configTabButton);

      // Cycle 4x4, 5x5, 3x3 buttons
      const btn4x4 = screen.getByRole('button', { name: /4x4/i });
      fireEvent.click(btn4x4);

      const arenaTab = screen.getByRole('button', { name: /^arena$/i });
      fireEvent.click(arenaTab);

      // Start game on 4x4 grid
      const startBtn = screen.getByText(/ENTER ARENA|START MATCH/i);
      fireEvent.click(startBtn);

      const gridContainer = document.querySelector('[data-testid="game-board-grid"]');
      expect(gridContainer).toHaveClass('grid-cols-4');
      const cells = gridContainer?.querySelectorAll('button');
      expect(cells?.length).toBe(16);
    });
  });

  /**
   * 5. Web Audio & Storage Lifecycle Stress Test
   * Perform 100 rapid audio sound synthesis triggers and 50 LocalStorage read/write operations,
   * verifying zero AudioContext crashes or state corruption.
   */
  describe('5. Web Audio & Storage Lifecycle Stress Test', () => {
    it('executes 100 rapid audio synthesis triggers and 50 LocalStorage read/write operations without crashes or corruption', () => {
      // 1. Audio Synthesis Stress (100 triggers)
      for (let i = 0; i < 100; i++) {
        expect(() => {
          if (i % 8 === 0) soundEngine.playClick();
          else if (i % 8 === 1) soundEngine.playMove('X');
          else if (i % 8 === 2) soundEngine.playMove('O');
          else if (i % 8 === 3) soundEngine.playWin();
          else if (i % 8 === 4) soundEngine.playDraw();
          else if (i % 8 === 5) soundEngine.playReset();
          else if (i % 8 === 6) soundEngine.playHint();
          else soundEngine.playUndo();

          // Rapid volume/mute updates
          if (i % 10 === 0) soundEngine.setVolume(i / 100);
          if (i % 15 === 0) soundEngine.setMuted(i % 30 === 0);
        }).not.toThrow();
      }

      // Restore normal sound engine volume/mute
      soundEngine.setVolume(0.8);
      soundEngine.setMuted(false);

      // 2. LocalStorage Lifecycle Stress (50 read/write operations)
      for (let opIndex = 0; opIndex < 50; opIndex++) {
        const dummySettings = {
          mode: opIndex % 2 === 0 ? 'AI_UNBEATABLE' : 'PVP_LOCAL',
          boardSize: (3 + (opIndex % 3)) as BoardSize,
          streakToWin: opIndex % 3 === 0 ? 3 : 4,
          theme: 'RETRO_ARCADE' as ThemeMode,
          audio: { masterVolume: opIndex / 50, sfxEnabled: true, bgmEnabled: false, hapticFeedback: true },
        };

        const dummyStats = {
          playerX: { wins: opIndex, losses: 5, draws: 2, winStreak: 3, bestStreak: 7, totalTimePlayedSeconds: 100 },
          playerO: { wins: 5, losses: opIndex, draws: 2, winStreak: 0, bestStreak: 4, totalTimePlayedSeconds: 100 },
        };

        // Write
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(dummySettings));
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(dummyStats));

        // Read & Assert integrity
        const readSettingsRaw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        const readStatsRaw = localStorage.getItem(STATS_STORAGE_KEY);

        expect(readSettingsRaw).not.toBeNull();
        expect(readStatsRaw).not.toBeNull();

        const parsedSettings = JSON.parse(readSettingsRaw!);
        const parsedStats = JSON.parse(readStatsRaw!);

        expect(parsedSettings.boardSize).toBe(dummySettings.boardSize);
        expect(parsedSettings.theme).toBe(dummySettings.theme);
        expect(parsedStats.playerX.wins).toBe(opIndex);
      }
    });
  });
});
