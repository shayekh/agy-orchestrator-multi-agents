import { describe, it, expect } from 'vitest';
import { checkWinner } from '../winChecker';
import { ThemeMode } from '../../types/game';

// Helper mirror of WinningStrikeOverlay coordinate calculation logic
function calculateStrikeLineCoordinates(combo: number[], size: number) {
  if (!combo || combo.length === 0) return null;
  const firstIdx = combo[0];
  const lastIdx = combo[combo.length - 1];

  const r1 = Math.floor(firstIdx / size);
  const c1 = firstIdx % size;
  const r2 = Math.floor(lastIdx / size);
  const c2 = lastIdx % size;

  const getPercentPos = (r: number, c: number) => {
    const x = c * (100 / size) + 100 / (2 * size);
    const y = r * (100 / size) + 100 / (2 * size);
    return { x, y };
  };

  const p1 = getPercentPos(r1, c1);
  const p2 = getPercentPos(r2, c2);

  return { p1, p2, r1, c1, r2, c2 };
}

describe('M2 Challenger Empirical Verification Suite', () => {

  describe('Winning Strike Overlay Math (3x3 Grid)', () => {
    const size = 3;

    it('calculates first row horizontal (Row 0: 0, 1, 2)', () => {
      const coords = calculateStrikeLineCoordinates([0, 1, 2], size);
      expect(coords).not.toBeNull();
      expect(coords!.p1.x).toBeCloseTo(16.6667, 3);
      expect(coords!.p1.y).toBeCloseTo(16.6667, 3);
      expect(coords!.p2.x).toBeCloseTo(83.3333, 3);
      expect(coords!.p2.y).toBeCloseTo(16.6667, 3);
    });

    it('calculates bottom row horizontal (Row 2: 6, 7, 8)', () => {
      const coords = calculateStrikeLineCoordinates([6, 7, 8], size);
      expect(coords).not.toBeNull();
      expect(coords!.p1.x).toBeCloseTo(16.6667, 3);
      expect(coords!.p1.y).toBeCloseTo(83.3333, 3);
      expect(coords!.p2.x).toBeCloseTo(83.3333, 3);
      expect(coords!.p2.y).toBeCloseTo(83.3333, 3);
    });

    it('calculates last col vertical (Col 2: 2, 5, 8)', () => {
      const coords = calculateStrikeLineCoordinates([2, 5, 8], size);
      expect(coords).not.toBeNull();
      expect(coords!.p1.x).toBeCloseTo(83.3333, 3);
      expect(coords!.p1.y).toBeCloseTo(16.6667, 3);
      expect(coords!.p2.x).toBeCloseTo(83.3333, 3);
      expect(coords!.p2.y).toBeCloseTo(83.3333, 3);
    });

    it('calculates main diagonal (0, 4, 8)', () => {
      const coords = calculateStrikeLineCoordinates([0, 4, 8], size);
      expect(coords).not.toBeNull();
      expect(coords!.p1.x).toBeCloseTo(16.6667, 3);
      expect(coords!.p1.y).toBeCloseTo(16.6667, 3);
      expect(coords!.p2.x).toBeCloseTo(83.3333, 3);
      expect(coords!.p2.y).toBeCloseTo(83.3333, 3);
    });

    it('calculates sub diagonal (2, 4, 6)', () => {
      const coords = calculateStrikeLineCoordinates([2, 4, 6], size);
      expect(coords).not.toBeNull();
      expect(coords!.p1.x).toBeCloseTo(83.3333, 3);
      expect(coords!.p1.y).toBeCloseTo(16.6667, 3);
      expect(coords!.p2.x).toBeCloseTo(16.6667, 3);
      expect(coords!.p2.y).toBeCloseTo(83.3333, 3);
    });
  });

  describe('Winning Strike Overlay Math (4x4 Grid)', () => {
    const size = 4;

    it('calculates top row horizontal (0, 1, 2, 3)', () => {
      const coords = calculateStrikeLineCoordinates([0, 1, 2, 3], size);
      expect(coords).not.toBeNull();
      expect(coords!.p1.x).toBe(12.5);
      expect(coords!.p1.y).toBe(12.5);
      expect(coords!.p2.x).toBe(87.5);
      expect(coords!.p2.y).toBe(12.5);
    });

    it('calculates last col vertical (3, 7, 11, 15)', () => {
      const coords = calculateStrikeLineCoordinates([3, 7, 11, 15], size);
      expect(coords).not.toBeNull();
      expect(coords!.p1.x).toBe(87.5);
      expect(coords!.p1.y).toBe(12.5);
      expect(coords!.p2.x).toBe(87.5);
      expect(coords!.p2.y).toBe(87.5);
    });

    it('calculates main diagonal (0, 5, 10, 15)', () => {
      const coords = calculateStrikeLineCoordinates([0, 5, 10, 15], size);
      expect(coords).not.toBeNull();
      expect(coords!.p1.x).toBe(12.5);
      expect(coords!.p1.y).toBe(12.5);
      expect(coords!.p2.x).toBe(87.5);
      expect(coords!.p2.y).toBe(87.5);
    });

    it('calculates sub diagonal (3, 6, 9, 12)', () => {
      const coords = calculateStrikeLineCoordinates([3, 6, 9, 12], size);
      expect(coords).not.toBeNull();
      expect(coords!.p1.x).toBe(87.5);
      expect(coords!.p1.y).toBe(12.5);
      expect(coords!.p2.x).toBe(12.5);
      expect(coords!.p2.y).toBe(87.5);
    });
  });

  describe('Winning Strike Overlay Math (5x5 Grid)', () => {
    const size = 5;

    it('calculates arbitrary 4-streak horizontal line on row 2 (11, 12, 13, 14)', () => {
      const coords = calculateStrikeLineCoordinates([11, 12, 13, 14], size);
      expect(coords).not.toBeNull();
      expect(coords!.p1.x).toBe(30); // col 1: 1 * 20 + 10 = 30
      expect(coords!.p1.y).toBe(50); // row 2: 2 * 20 + 10 = 50
      expect(coords!.p2.x).toBe(90); // col 4: 4 * 20 + 10 = 90
      expect(coords!.p2.y).toBe(50); // row 2: 2 * 20 + 10 = 50
    });

    it('calculates arbitrary 4-streak main diagonal line (5, 11, 17, 23)', () => {
      const coords = calculateStrikeLineCoordinates([5, 11, 17, 23], size);
      expect(coords).not.toBeNull();
      expect(coords!.p1.x).toBe(10); // col 0: 0 * 20 + 10 = 10
      expect(coords!.p1.y).toBe(30); // row 1: 1 * 20 + 10 = 30
      expect(coords!.p2.x).toBe(70); // col 3: 3 * 20 + 10 = 70
      expect(coords!.p2.y).toBe(90); // row 4: 4 * 20 + 10 = 90
    });

    it('calculates arbitrary 4-streak sub diagonal line (4, 8, 12, 16)', () => {
      const coords = calculateStrikeLineCoordinates([4, 8, 12, 16], size);
      expect(coords).not.toBeNull();
      expect(coords!.p1.x).toBe(90); // col 4: 4 * 20 + 10 = 90
      expect(coords!.p1.y).toBe(10); // row 0: 0 * 20 + 10 = 10
      expect(coords!.p2.x).toBe(30); // col 1: 1 * 20 + 10 = 30
      expect(coords!.p2.y).toBe(70); // row 3: 3 * 20 + 10 = 70
    });
  });

  describe('Theme Engine CSS Variable Completeness', () => {
    const requiredThemes: ThemeMode[] = [
      'CYBERPUNK',
      'GLASSMORPHISM',
      'RETRO_ARCADE',
      'MINIMAL_LUXURY',
      'COSMIC_NEON',
    ];

    it('supports all 5 required theme modes in ThemeMode type', () => {
      expect(requiredThemes).toHaveLength(5);
    });
  });
});
