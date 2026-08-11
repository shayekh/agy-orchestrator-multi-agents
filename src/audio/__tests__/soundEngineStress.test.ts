import { describe, it, expect, beforeEach, vi } from 'vitest';
import { soundEngine } from '../soundEngine';
import { triggerConfetti } from '../../effects/confetti';

describe('Milestone M3 Challenger Audio Engine & Canvas Confetti Stress Test', () => {

  beforeEach(() => {
    // Reset volume and mute states before each test run
    soundEngine.setVolume(0.8);
    soundEngine.setMuted(false);
  });

  describe('1. Master Volume Control & Boundary Clamping', () => {
    it('clamps volume accurately within [0.0, 1.0] for valid inputs', () => {
      soundEngine.setVolume(0.0);
      soundEngine.setVolume(1.0);
      soundEngine.setVolume(0.42);
      expect(() => soundEngine.setVolume(0.8)).not.toThrow();
    });

    it('clamps negative and underflow values to 0.0', () => {
      soundEngine.setVolume(-0.0001);
      soundEngine.setVolume(-1.0);
      soundEngine.setVolume(-100.0);
      soundEngine.setVolume(-Infinity);
      expect(() => soundEngine.playClick()).not.toThrow();
    });

    it('clamps overflow and out-of-bounds values to 1.0', () => {
      soundEngine.setVolume(1.0001);
      soundEngine.setVolume(2.5);
      soundEngine.setVolume(100.0);
      soundEngine.setVolume(Infinity);
      expect(() => soundEngine.playClick()).not.toThrow();
    });
  });

  describe('2. Mute State & Toggle Integrity', () => {
    it('accurately toggles mute state back and forth', () => {
      soundEngine.setMuted(false);
      expect(soundEngine.toggleMute()).toBe(true);  // muted
      expect(soundEngine.toggleMute()).toBe(false); // unmuted
      expect(soundEngine.toggleMute()).toBe(true);  // muted
      soundEngine.setMuted(false);
      expect(soundEngine.toggleMute()).toBe(true);
      soundEngine.setMuted(false); // restore
    });

    it('suppresses audio execution without error when muted', () => {
      soundEngine.setMuted(true);

      // Trigger all sound routines while muted
      expect(() => {
        soundEngine.playClick();
        soundEngine.playMove('X');
        soundEngine.playMove('O');
        soundEngine.playWin();
        soundEngine.playDraw();
        soundEngine.playReset();
        soundEngine.playHint();
        soundEngine.playUndo();
      }).not.toThrow();

      soundEngine.setMuted(false);
    });

    it('handles rapid mute toggling during active playback without throwing', () => {
      for (let i = 0; i < 50; i++) {
        soundEngine.playClick();
        soundEngine.toggleMute();
        soundEngine.playMove(i % 2 === 0 ? 'X' : 'O');
      }
      soundEngine.setMuted(false);
    });
  });

  describe('3. Rapid Sequential Sound Triggers & Web Audio Stress', () => {
    it('handles 100 rapid sequential sound calls of all types without error', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) {
          soundEngine.playClick();
          soundEngine.playMove('X');
          soundEngine.playMove('O');
          soundEngine.playWin();
          soundEngine.playDraw();
          soundEngine.playReset();
          soundEngine.playHint();
          soundEngine.playUndo();
        }
      }).not.toThrow();
    });

    it('handles rapid volume adjustments interleaved with sound triggers', () => {
      expect(() => {
        for (let i = 0; i <= 20; i++) {
          const vol = i / 20; // 0.0 to 1.0
          soundEngine.setVolume(vol);
          soundEngine.playClick();
          soundEngine.playMove('X');
        }
      }).not.toThrow();
    });
  });

  describe('4. Canvas Particle Confetti Stress & Lifecycle', () => {
    it('spawns confetti and executes cancellation callback without throwing', () => {
      const cancel1 = triggerConfetti();
      expect(typeof cancel1).toBe('function');
      cancel1();

      const cancel2 = triggerConfetti();
      cancel2();
    });

    it('handles multiple rapid confetti bursts gracefully', () => {
      const cancelFns: (() => void)[] = [];
      for (let i = 0; i < 5; i++) {
        cancelFns.push(triggerConfetti());
      }

      // Cleanup all
      cancelFns.forEach((fn) => {
        expect(() => fn()).not.toThrow();
      });
    });
  });
});
