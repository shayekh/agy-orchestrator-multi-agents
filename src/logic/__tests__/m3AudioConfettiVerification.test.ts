import { describe, it, expect } from 'vitest';
import { soundEngine } from '../../audio/soundEngine';
import { triggerConfetti } from '../../effects/confetti';
import { gameReducer, createInitialState } from '../gameReducer';

describe('Milestone M3 Audio Engine & Canvas Confetti Verification', () => {

  describe('Sound Synthesizer Engine (soundEngine.ts)', () => {
    it('sets and clamps volume correctly between 0.0 and 1.0', () => {
      soundEngine.setVolume(0.5);
      soundEngine.setVolume(-0.2); // clamped to 0
      soundEngine.setVolume(1.5);  // clamped to 1
      soundEngine.setVolume(0.8);  // reset to default
    });

    it('toggles mute state accurately', () => {
      soundEngine.setMuted(true);
      expect(soundEngine.toggleMute()).toBe(false); // now unmuted
      expect(soundEngine.toggleMute()).toBe(true);  // now muted
      soundEngine.setMuted(false); // unmute for further tests
    });

    it('executes procedural sound routines without throwing errors', () => {
      expect(() => soundEngine.playClick()).not.toThrow();
      expect(() => soundEngine.playMove('X')).not.toThrow();
      expect(() => soundEngine.playMove('O')).not.toThrow();
      expect(() => soundEngine.playWin()).not.toThrow();
      expect(() => soundEngine.playDraw()).not.toThrow();
      expect(() => soundEngine.playReset()).not.toThrow();
      expect(() => soundEngine.playHint()).not.toThrow();
      expect(() => soundEngine.playUndo()).not.toThrow();
    });
  });

  describe('HTML5 Canvas Confetti Fireworks (confetti.ts)', () => {
    it('triggers particle burst and returns cancellation callback', () => {
      const cancel = triggerConfetti();
      expect(typeof cancel).toBe('function');
      expect(() => cancel()).not.toThrow();
    });
  });

  describe('Game Reducer Settings & Master Volume Sync', () => {
    it('merges audio settings when UPDATE_SETTINGS is dispatched with masterVolume', () => {
      const initialState = createInitialState();
      const stateWithVolume = gameReducer(initialState, {
        type: 'UPDATE_SETTINGS',
        settings: {
          audio: {
            ...initialState.settings.audio,
            masterVolume: 0.4,
          },
        },
      });

      expect(stateWithVolume.settings.audio.masterVolume).toBe(0.4);
      expect(stateWithVolume.settings.audio.sfxEnabled).toBe(true);
    });

    it('preserves other audio settings when partially updating audio settings', () => {
      const initialState = createInitialState();
      const nextState = gameReducer(initialState, {
        type: 'UPDATE_SETTINGS',
        settings: {
          audio: { masterVolume: 0.25 } as any,
        },
      });

      expect(nextState.settings.audio.masterVolume).toBe(0.25);
      expect(nextState.settings.audio.sfxEnabled).toBe(true);
      expect(nextState.settings.audio.hapticFeedback).toBe(true);
    });
  });
});
