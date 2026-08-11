import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadSettings,
  saveSettings,
  loadStats,
  saveStats,
  clearStats,
  sanitizeSettings,
  sanitizeStats,
  SETTINGS_STORAGE_KEY,
  STATS_STORAGE_KEY,
  DEFAULT_SETTINGS,
  DEFAULT_PLAYER_STATS,
  DEFAULT_MATCH_STATS,
} from '../persistence';
import { createInitialState } from '../../logic/gameReducer';

describe('LocalStorage & State Initialization Stress & Corruption Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Adversarial & Corrupted LocalStorage Inputs', () => {
    it('handles malformed JSON strings in SETTINGS_STORAGE_KEY', () => {
      const corruptInputs = [
        '{ invalid json string',
        'undefined',
        'NaN',
        '[1, 2,',
        '"{ "mode": "PVP" }"', // valid JSON string wrapping invalid structure
        '<<<XML></XML>>>',
        '{"mode": ',
      ];

      corruptInputs.forEach((input) => {
        localStorage.setItem(SETTINGS_STORAGE_KEY, input);
        expect(() => loadSettings()).not.toThrow();
        const settings = loadSettings();
        expect(settings).toBeDefined();
        expect(settings.mode).toBe(DEFAULT_SETTINGS.mode);
        expect(settings.boardSize).toBe(3);
        expect(settings.audio).toBeDefined();
        expect(typeof settings.audio.masterVolume).toBe('number');
        expect(isNaN(settings.audio.masterVolume)).toBe(false);
      });
    });

    it('handles malformed JSON strings in STATS_STORAGE_KEY', () => {
      const corruptInputs = [
        '{ invalid json string',
        'undefined',
        'NaN',
        '[1, 2,',
        '""',
        'false',
        '12345',
      ];

      corruptInputs.forEach((input) => {
        localStorage.setItem(STATS_STORAGE_KEY, input);
        expect(() => loadStats()).not.toThrow();
        const stats = loadStats();
        expect(stats).toBeDefined();
        expect(stats.playerX).toEqual(DEFAULT_PLAYER_STATS);
        expect(stats.playerO).toEqual(DEFAULT_PLAYER_STATS);
        expect(Array.isArray(stats.history)).toBe(true);
      });
    });

    it('handles null, primitive, or array root values in sanitizeSettings', () => {
      const nullables = [null, undefined, 0, false, 'string', 123.45, Symbol('test'), [1, 2, 3]];
      nullables.forEach((val) => {
        const res = sanitizeSettings(val);
        expect(res).toBeDefined();
        expect(typeof res.boardSize).toBe('number');
        expect(isNaN(res.boardSize)).toBe(false);
        expect(res.audio).toBeDefined();
        expect(typeof res.audio.masterVolume).toBe('number');
        expect(isNaN(res.audio.masterVolume)).toBe(false);
      });
    });

    it('handles null, primitive, or array root values in sanitizeStats', () => {
      const nullables = [null, undefined, 0, false, 'string', 123.45, Symbol('test'), [1, 2, 3]];
      nullables.forEach((val) => {
        const res = sanitizeStats(val);
        expect(res).toBeDefined();
        expect(res.playerX).toBeDefined();
        expect(res.playerO).toBeDefined();
        expect(Array.isArray(res.history)).toBe(true);
      });
    });

    it('sanitizes invalid data types for numeric fields without returning NaN', () => {
      const invalidTypesInput = {
        playerX: {
          wins: 'one hundred',
          losses: null,
          draws: undefined,
          winStreak: {},
          bestStreak: [10],
          totalTimePlayedSeconds: NaN,
        },
        playerO: {
          wins: -50,
          losses: -1,
          draws: Infinity,
          winStreak: -Infinity,
          bestStreak: true,
          totalTimePlayedSeconds: '999',
        },
        history: 'not an array',
      };

      const sanitized = sanitizeStats(invalidTypesInput);
      expect(sanitized.playerX.wins).toBe(0);
      expect(sanitized.playerX.losses).toBe(0);
      expect(sanitized.playerX.draws).toBe(0);
      expect(sanitized.playerX.winStreak).toBe(0);
      expect(sanitized.playerX.bestStreak).toBe(0);
      expect(sanitized.playerX.totalTimePlayedSeconds).toBe(0);

      expect(sanitized.playerO.wins).toBe(0);
      expect(sanitized.playerO.losses).toBe(0);
      expect(sanitized.playerO.draws).toBe(0);
      expect(sanitized.playerO.winStreak).toBe(0);
      expect(sanitized.playerO.bestStreak).toBe(0);
      expect(sanitized.playerO.totalTimePlayedSeconds).toBe(0);

      expect(Array.isArray(sanitized.history)).toBe(true);
      expect(sanitized.history).toHaveLength(0);
    });

    it('sanitizes invalid setting options, out-of-bound audio volumes, and bad types', () => {
      const invalidSettings = {
        mode: 'NON_EXISTENT_MODE',
        boardSize: 99,
        streakToWin: -5,
        timeLimitSecondsPerTurn: 'unlimited',
        powerUpsEnabled: 'yes',
        theme: 'UNKNOWN_THEME',
        audio: {
          masterVolume: 2.5, // > 1
          sfxEnabled: 'true',
          bgmEnabled: null,
          hapticFeedback: undefined,
        },
      };

      const sanitized = sanitizeSettings(invalidSettings);
      expect(sanitized.mode).toBe('AI_UNBEATABLE');
      expect(sanitized.boardSize).toBe(3);
      expect(sanitized.streakToWin).toBe(3);
      expect(sanitized.timeLimitSecondsPerTurn).toBe(DEFAULT_SETTINGS.timeLimitSecondsPerTurn);
      expect(sanitized.powerUpsEnabled).toBe(DEFAULT_SETTINGS.powerUpsEnabled);
      expect(sanitized.theme).toBe('CYBERPUNK');
      expect(sanitized.audio.masterVolume).toBe(1); // Clamped to 1
      expect(sanitized.audio.sfxEnabled).toBe(true); // Default fallback
      expect(sanitized.audio.bgmEnabled).toBe(false);
      expect(sanitized.audio.hapticFeedback).toBe(true);
    });

    it('handles negative masterVolume by clamping to 0', () => {
      const input = {
        audio: {
          masterVolume: -0.5,
        },
      };
      const sanitized = sanitizeSettings(input);
      expect(sanitized.audio.masterVolume).toBe(0);
    });

    it('sanitizes corrupted history items in stats array', () => {
      const corruptStats = {
        playerX: DEFAULT_PLAYER_STATS,
        playerO: DEFAULT_PLAYER_STATS,
        history: [
          null,
          undefined,
          'random string',
          12345,
          { id: '', timestamp: 'invalid', mode: 'BAD_MODE', boardSize: 10, winner: 'NOBODY', movesCount: -5 },
          { id: 'valid_1', timestamp: 1600000000000, mode: 'PVP_LOCAL', boardSize: 4, winner: 'X', movesCount: 9 },
        ],
      };

      const sanitized = sanitizeStats(corruptStats);
      expect(sanitized.history).toHaveLength(2); // The object gets sanitized with defaults, invalid primitives discarded
      
      const item1 = sanitized.history[0];
      expect(item1.id).toBeDefined();
      expect(item1.id.startsWith('match_')).toBe(true);
      expect(typeof item1.timestamp).toBe('number');
      expect(item1.mode).toBe('AI_UNBEATABLE');
      expect(item1.boardSize).toBe(3);
      expect(item1.winner).toBe('DRAW');
      expect(item1.movesCount).toBe(0);

      const item2 = sanitized.history[1];
      expect(item2.id).toBe('valid_1');
      expect(item2.timestamp).toBe(1600000000000);
      expect(item2.mode).toBe('PVP_LOCAL');
      expect(item2.boardSize).toBe(4);
      expect(item2.winner).toBe('X');
      expect(item2.movesCount).toBe(9);
    });
  });

  describe('LocalStorage Exception & Resilience Hardening', () => {
    it('does not throw when localStorage.getItem throws SecurityError or QuotaExceededError', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      });

      expect(() => loadSettings()).not.toThrow();
      expect(() => loadStats()).not.toThrow();
      expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
      expect(loadStats()).toEqual(DEFAULT_MATCH_STATS);
    });

    it('does not throw when localStorage.setItem throws QuotaExceededError', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      });

      expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();
      expect(() => saveStats(DEFAULT_MATCH_STATS)).not.toThrow();
    });

    it('does not throw when localStorage.removeItem throws SecurityError', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new DOMException('Access denied', 'SecurityError');
      });

      expect(() => clearStats()).not.toThrow();
      const cleared = clearStats();
      expect(cleared).toEqual(DEFAULT_MATCH_STATS);
    });
  });

  describe('State Initialization with Persistence Fallbacks', () => {
    it('creates a clean initial state when passed corrupted loaded settings and stats', () => {
      localStorage.setItem(SETTINGS_STORAGE_KEY, '{ corrupt settings }');
      localStorage.setItem(STATS_STORAGE_KEY, '{ corrupt stats }');

      const loadedSettings = loadSettings();
      const loadedStats = loadStats();

      expect(() => createInitialState(loadedSettings, loadedStats)).not.toThrow();
      const state = createInitialState(loadedSettings, loadedStats);

      expect(state.status).toBe('IDLE');
      expect(state.board).toHaveLength(9);
      expect(state.size).toBe(3);
      expect(state.settings.mode).toBe('AI_UNBEATABLE');
      expect(state.playerX.stats.wins).toBe(0);
      expect(state.playerO.stats.wins).toBe(0);
      expect(state.matchHistory).toEqual([]);
      expect(isNaN(state.turnTimeRemaining)).toBe(false);
      expect(state.turnTimeRemaining).toBe(15);
    });

    it('creates clean initial state when passed undefined or empty custom objects', () => {
      const state = createInitialState(undefined, undefined);
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
      expect(state.playerX.stats).toEqual(DEFAULT_PLAYER_STATS);
      expect(state.playerO.stats).toEqual(DEFAULT_PLAYER_STATS);
      expect(state.matchHistory).toEqual([]);
    });
  });
});
