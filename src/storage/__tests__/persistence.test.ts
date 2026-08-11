import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadSettings,
  saveSettings,
  loadStats,
  saveStats,
  clearStats,
  sanitizeStats,
  SETTINGS_STORAGE_KEY,
  STATS_STORAGE_KEY,
  DEFAULT_SETTINGS,
  DEFAULT_PLAYER_STATS,
} from '../persistence';
import { GameSettings, MatchStats, MatchRecord } from '../../types/game';

describe('LocalStorage Persistence Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Settings Persistence', () => {
    it('should return default settings when localStorage is empty', () => {
      const settings = loadSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should save and load valid settings roundtrip', () => {
      const customSettings: GameSettings = {
        mode: 'PVP_LOCAL',
        boardSize: 4,
        streakToWin: 4,
        timeLimitSecondsPerTurn: 30,
        powerUpsEnabled: true,
        theme: 'RETRO_ARCADE',
        audio: {
          masterVolume: 0.5,
          sfxEnabled: false,
          bgmEnabled: true,
          hapticFeedback: false,
        },
      };

      saveSettings(customSettings);
      const loaded = loadSettings();
      expect(loaded).toEqual(customSettings);
    });

    it('should recover gracefully with defaults when JSON in storage is corrupted', () => {
      localStorage.setItem(SETTINGS_STORAGE_KEY, '{ invalid json string...');
      const loaded = loadSettings();
      expect(loaded).toEqual(DEFAULT_SETTINGS);
    });

    it('should sanitize partial settings and merge missing nested audio properties', () => {
      const partialRaw = {
        mode: 'AI_HARD',
        audio: {
          masterVolume: 0.2,
          // sfxEnabled, bgmEnabled, hapticFeedback missing
        },
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(partialRaw));

      const loaded = loadSettings();
      expect(loaded.mode).toBe('AI_HARD');
      expect(loaded.boardSize).toBe(3); // default
      expect(loaded.audio.masterVolume).toBe(0.2);
      expect(loaded.audio.sfxEnabled).toBe(true); // default fallback
      expect(loaded.audio.bgmEnabled).toBe(false); // default fallback
    });

    it('should handle localStorage exception gracefully without throwing', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('SecurityError: Access is denied');
      });

      expect(() => loadSettings()).not.toThrow();
      const settings = loadSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('Stats & Match History Persistence', () => {
    it('should return empty default stats when localStorage is empty', () => {
      const stats = loadStats();
      expect(stats.playerX).toEqual(DEFAULT_PLAYER_STATS);
      expect(stats.playerO).toEqual(DEFAULT_PLAYER_STATS);
      expect(stats.history).toEqual([]);
    });

    it('should save and load stats roundtrip with match history', () => {
      const mockRecord: MatchRecord = {
        id: 'match_123',
        timestamp: 1700000000000,
        mode: 'AI_UNBEATABLE',
        boardSize: 3,
        winner: 'X',
        movesCount: 5,
      };

      const testStats: MatchStats = {
        playerX: { wins: 3, losses: 1, draws: 1, winStreak: 2, bestStreak: 3, totalTimePlayedSeconds: 120 },
        playerO: { wins: 1, losses: 3, draws: 1, winStreak: 0, bestStreak: 1, totalTimePlayedSeconds: 120 },
        history: [mockRecord],
      };

      saveStats(testStats);
      const loaded = loadStats();
      expect(loaded.playerX.wins).toBe(3);
      expect(loaded.playerO.wins).toBe(1);
      expect(loaded.history).toHaveLength(1);
      expect(loaded.history[0].id).toBe('match_123');
    });

    it('should sanitize corrupted or negative values in stats', () => {
      const corruptStatsRaw = {
        playerX: { wins: -5, losses: 'corrupted', draws: 2, winStreak: NaN },
        playerO: null,
        history: [
          { id: 'm1', timestamp: 123, mode: 'INVALID_MODE', boardSize: 99, winner: 'X', movesCount: 4 },
          null,
          'invalid item',
        ],
      };

      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(corruptStatsRaw));
      const loaded = loadStats();

      expect(loaded.playerX.wins).toBe(0); // Fallback from -5
      expect(loaded.playerX.losses).toBe(0); // Fallback from invalid string
      expect(loaded.playerX.draws).toBe(2);
      expect(loaded.playerX.winStreak).toBe(0); // Fallback from NaN
      expect(loaded.playerO).toEqual(DEFAULT_PLAYER_STATS); // Fallback from null

      // History item sanitized
      expect(loaded.history).toHaveLength(1);
      expect(loaded.history[0].id).toBe('m1');
      expect(loaded.history[0].mode).toBe('AI_UNBEATABLE'); // Fallback from INVALID_MODE
      expect(loaded.history[0].boardSize).toBe(3); // Fallback from 99
    });

    it('should cap match history at 50 records max', () => {
      const records: MatchRecord[] = Array.from({ length: 65 }, (_, i) => ({
        id: `match_${i}`,
        timestamp: Date.now() + i,
        mode: 'PVP_LOCAL',
        boardSize: 3,
        winner: 'X',
        movesCount: 6,
      }));

      const rawStats = {
        playerX: DEFAULT_PLAYER_STATS,
        playerO: DEFAULT_PLAYER_STATS,
        history: records,
      };

      const sanitized = sanitizeStats(rawStats);
      expect(sanitized.history).toHaveLength(50);
    });

    it('should clear stats from storage using clearStats()', () => {
      const testStats: MatchStats = {
        playerX: { wins: 10, losses: 2, draws: 0, winStreak: 5, bestStreak: 5, totalTimePlayedSeconds: 500 },
        playerO: { wins: 2, losses: 10, draws: 0, winStreak: 0, bestStreak: 2, totalTimePlayedSeconds: 500 },
        history: [{ id: 'm1', timestamp: 100, mode: 'PVP_LOCAL', boardSize: 3, winner: 'X', movesCount: 7 }],
      };

      saveStats(testStats);
      expect(localStorage.getItem(STATS_STORAGE_KEY)).not.toBeNull();

      const cleared = clearStats();
      expect(cleared.playerX.wins).toBe(0);
      expect(cleared.history).toEqual([]);
      expect(localStorage.getItem(STATS_STORAGE_KEY)).toBeNull();
    });
  });
});
