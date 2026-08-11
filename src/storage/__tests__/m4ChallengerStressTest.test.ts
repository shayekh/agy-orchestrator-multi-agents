import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gameReducer, createInitialState } from '../../logic/gameReducer';
import {
  loadSettings,
  saveSettings,
  loadStats,
  saveStats,
  clearStats,
  SETTINGS_STORAGE_KEY,
  STATS_STORAGE_KEY,
  DEFAULT_SETTINGS,
  DEFAULT_PLAYER_STATS,
} from '../persistence';
import { GameState, GameSettings, MatchStats } from '../../types/game';

describe('M4 Empirical Challenger Stress Testing', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  /**
   * Test Scenario 1: Rapid succession of 100+ match completions (Match history capping at 50)
   */
  describe('Scenario 1: 100+ Match Completions & History Log Capping', () => {
    it('should cap match history at exactly 50 records when 120 matches complete in rapid succession', () => {
      let state = createInitialState();
      
      // Simulate 120 quick games where X wins each game on a 3x3 board
      for (let gameNum = 1; gameNum <= 120; gameNum++) {
        state = gameReducer(state, { type: 'START_GAME' });
        // Moves: X at 0, O at 3, X at 1, O at 4, X at 2 -> X wins!
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X (Win!)
        
        expect(state.status).toBe('VICTORY');
        expect(state.winner).toBe('X');
        
        // Save stats to localStorage on each match completion as useGameState hook would
        saveStats({
          playerX: state.playerX.stats,
          playerO: state.playerO.stats,
          history: state.matchHistory,
        });
      }

      // 1. Verify in-memory state history count
      expect(state.matchHistory).toHaveLength(50);

      // 2. Verify total wins accrued
      expect(state.playerX.stats.wins).toBe(120);
      expect(state.playerO.stats.losses).toBe(120);

      // 3. Verify LocalStorage reload persistence & capping
      const loadedStats = loadStats();
      expect(loadedStats.history).toHaveLength(50);
      expect(loadedStats.playerX.wins).toBe(120);
      expect(loadedStats.playerO.losses).toBe(120);

      // 4. Verify ordering: newest match record is at index 0
      // Since history is prepended, the latest matches are index 0..49
      expect(loadedStats.history[0]).toBeDefined();
      expect(loadedStats.history[0].winner).toBe('X');
      expect(loadedStats.history[0].movesCount).toBe(5);
    });
  });

  /**
   * Test Scenario 2: Rapid Stats Reset Operations in Succession
   */
  describe('Scenario 2: Rapid Stats Reset Operations', () => {
    it('should maintain consistent zeroed stats and empty history across 50 rapid reset calls', () => {
      let state = createInitialState();

      // Accumulate some stats first (3 matches)
      for (let i = 0; i < 3; i++) {
        state = gameReducer(state, { type: 'START_GAME' });
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X win
      }

      expect(state.playerX.stats.wins).toBe(3);
      expect(state.matchHistory).toHaveLength(3);
      saveStats({
        playerX: state.playerX.stats,
        playerO: state.playerO.stats,
        history: state.matchHistory,
      });

      // Rapid stats reset: call clearStats and dispatch RESET_STATS 50 times
      for (let r = 0; r < 50; r++) {
        const cleared = clearStats();
        state = gameReducer(state, { type: 'RESET_STATS' });
        saveStats({
          playerX: state.playerX.stats,
          playerO: state.playerO.stats,
          history: state.matchHistory,
        });

        expect(cleared.playerX.wins).toBe(0);
        expect(cleared.history).toEqual([]);
      }

      // Verify clean zeroed state after 50 resets
      expect(state.playerX.stats).toEqual(DEFAULT_PLAYER_STATS);
      expect(state.playerO.stats).toEqual(DEFAULT_PLAYER_STATS);
      expect(state.matchHistory).toEqual([]);

      const reloadedStats = loadStats();
      expect(reloadedStats.playerX).toEqual(DEFAULT_PLAYER_STATS);
      expect(reloadedStats.playerO).toEqual(DEFAULT_PLAYER_STATS);
      expect(reloadedStats.history).toEqual([]);

      // Ensure subsequent match completion after rapid resets works cleanly
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X win

      expect(state.playerX.stats.wins).toBe(1);
      expect(state.matchHistory).toHaveLength(1);
    });
  });

  /**
   * Test Scenario 3: Dynamic Grid Size Persistence (3x3 vs 4x4 vs 5x5)
   */
  describe('Scenario 3: Dynamic Grid Size & Settings Reload Persistence', () => {
    it('should correctly save, load, and transition between 3x3, 4x4, and 5x5 grid settings', () => {
      let state = createInitialState();
      expect(state.size).toBe(3);
      expect(state.settings.boardSize).toBe(3);

      // 1. Transition to 4x4 grid
      state = gameReducer(state, { type: 'UPDATE_SETTINGS', settings: { boardSize: 4 } });
      expect(state.size).toBe(4);
      expect(state.board).toHaveLength(16);
      expect(state.settings.streakToWin).toBe(4);

      saveSettings(state.settings);
      let reloadedSettings = loadSettings();
      expect(reloadedSettings.boardSize).toBe(4);
      expect(reloadedSettings.streakToWin).toBe(4);

      // Verify createInitialState with reloaded 4x4 settings
      let stateFromReload = createInitialState(reloadedSettings);
      expect(stateFromReload.size).toBe(4);
      expect(stateFromReload.board).toHaveLength(16);

      // 2. Transition to 5x5 grid
      state = gameReducer(state, { type: 'UPDATE_SETTINGS', settings: { boardSize: 5 } });
      expect(state.size).toBe(5);
      expect(state.board).toHaveLength(25);
      expect(state.settings.streakToWin).toBe(4);

      saveSettings(state.settings);
      reloadedSettings = loadSettings();
      expect(reloadedSettings.boardSize).toBe(5);
      expect(reloadedSettings.streakToWin).toBe(4);

      stateFromReload = createInitialState(reloadedSettings);
      expect(stateFromReload.size).toBe(5);
      expect(stateFromReload.board).toHaveLength(25);

      // 3. Transition back to 3x3 grid
      state = gameReducer(state, { type: 'UPDATE_SETTINGS', settings: { boardSize: 3 } });
      expect(state.size).toBe(3);
      expect(state.board).toHaveLength(9);
      expect(state.settings.streakToWin).toBe(3);

      saveSettings(state.settings);
      reloadedSettings = loadSettings();
      expect(reloadedSettings.boardSize).toBe(3);
      expect(reloadedSettings.streakToWin).toBe(3);
    });
  });

  /**
   * Test Scenario 4: Streak Calculation Consistency (Wins, Losses, Best Streak Tracking)
   */
  describe('Scenario 4: Streak Calculation Consistency & Best Streak Tracking', () => {
    it('should track winStreak and bestStreak accurately across win streaks, losses, draws, and streak breaks', () => {
      let state = createInitialState();

      // Match 1: X Wins (X Streak 1, X Best 1)
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X win
      expect(state.playerX.stats.winStreak).toBe(1);
      expect(state.playerX.stats.bestStreak).toBe(1);
      expect(state.playerO.stats.winStreak).toBe(0);

      // Match 2: X Wins (X Streak 2, X Best 2)
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X win
      expect(state.playerX.stats.winStreak).toBe(2);
      expect(state.playerX.stats.bestStreak).toBe(2);

      // Match 3: X Wins (X Streak 3, X Best 3)
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X win
      expect(state.playerX.stats.winStreak).toBe(3);
      expect(state.playerX.stats.bestStreak).toBe(3);

      // Match 4: O Wins -> Breaks X's streak! (X Streak 0, X Best remains 3; O Streak 1, O Best 1)
      state = gameReducer(state, { type: 'START_GAME' });
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 8 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // O win
      expect(state.playerX.stats.winStreak).toBe(0);
      expect(state.playerX.stats.bestStreak).toBe(3); // Best streak preserved!
      expect(state.playerO.stats.winStreak).toBe(1);
      expect(state.playerO.stats.bestStreak).toBe(1);

      // Match 5: Draw -> Breaks O's streak as well!
      // Board: X: 0,1,5; O: 2,3,4 (Draw simulation)
      state = gameReducer(state, { type: 'START_GAME' });
      // 0 1 2
      // 3 4 5
      // 6 7 8
      // X:0, O:1, X:2, O:4, X:3, O:5, X:7, O:6, X:8 -> Draw
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 5 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 7 }); // X
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 6 }); // O
      state = gameReducer(state, { type: 'MAKE_MOVE', index: 8 }); // X (Draw)
      expect(state.winner).toBe('DRAW');
      expect(state.playerX.stats.winStreak).toBe(0);
      expect(state.playerX.stats.bestStreak).toBe(3);
      expect(state.playerO.stats.winStreak).toBe(0);
      expect(state.playerO.stats.bestStreak).toBe(1);

      // Match 6-9: X wins 4 games in a row (New best streak = 4)
      for (let i = 1; i <= 4; i++) {
        state = gameReducer(state, { type: 'START_GAME' });
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 0 }); // X
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 3 }); // O
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 1 }); // X
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 4 }); // O
        state = gameReducer(state, { type: 'MAKE_MOVE', index: 2 }); // X win
      }
      expect(state.playerX.stats.winStreak).toBe(4);
      expect(state.playerX.stats.bestStreak).toBe(4); // New high record!

      // Aggregate totals verification:
      // X wins: 3 (matches 1-3) + 0 (match 4) + 0 (match 5) + 4 (matches 6-9) = 7 wins
      // X losses: 1 (match 4)
      // X draws: 1 (match 5)
      expect(state.playerX.stats.wins).toBe(7);
      expect(state.playerX.stats.losses).toBe(1);
      expect(state.playerX.stats.draws).toBe(1);

      // O totals:
      // O wins: 1 (match 4)
      // O losses: 7
      // O draws: 1
      expect(state.playerO.stats.wins).toBe(1);
      expect(state.playerO.stats.losses).toBe(7);
      expect(state.playerO.stats.draws).toBe(1);

      // Reload persistence verification
      saveStats({
        playerX: state.playerX.stats,
        playerO: state.playerO.stats,
        history: state.matchHistory,
      });

      const loaded = loadStats();
      expect(loaded.playerX.bestStreak).toBe(4);
      expect(loaded.playerX.winStreak).toBe(4);
      expect(loaded.playerX.wins).toBe(7);
      expect(loaded.playerO.bestStreak).toBe(1);
      expect(loaded.playerO.winStreak).toBe(0);
      expect(loaded.playerO.wins).toBe(1);
    });
  });
});
