import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { triggerConfetti } from '../src/effects/confetti';

describe('Confetti Particle Engine & Overlay Lifecycle (confetti.ts)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Ensure clean DOM
    document.body.innerHTML = '';
    // Set default window dimensions
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
    Object.defineProperty(window, 'devicePixelRatio', { writable: true, configurable: true, value: 1 });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('Multi-launch Concurrency & Stress Testing', () => {
    it('handles 50 rapid consecutive calls to triggerConfetti without errors', () => {
      const cancelFns: Array<() => void> = [];
      expect(() => {
        for (let i = 0; i < 50; i++) {
          const cancel = triggerConfetti();
          cancelFns.push(cancel);
        }
      }).not.toThrow();

      // 50 canvas overlay elements should be attached to document.body
      const overlays = document.querySelectorAll('#confetti-canvas-overlay');
      expect(overlays.length).toBe(50);

      // All returned cancel functions should be callable without errors
      expect(() => {
        cancelFns.forEach((cancel) => cancel());
      }).not.toThrow();

      // After cancelling all, all overlay canvases should be removed
      const remainingOverlays = document.querySelectorAll('#confetti-canvas-overlay');
      expect(remainingOverlays.length).toBe(0);
    });

    it('manages independent particle animation frame loops for concurrent launches', () => {
      const cancel1 = triggerConfetti();
      const cancel2 = triggerConfetti();

      expect(document.querySelectorAll('#confetti-canvas-overlay').length).toBe(2);

      // Advance timers by a few frames (e.g. 100ms)
      vi.advanceTimersByTime(100);

      // Cancel only the first launch
      cancel1();

      // One canvas should remain in DOM for the second launch
      expect(document.querySelectorAll('#confetti-canvas-overlay').length).toBe(1);

      // Cancel the second launch
      cancel2();
      expect(document.querySelectorAll('#confetti-canvas-overlay').length).toBe(0);
    });
  });

  describe('Dynamic DOM Overlay Cleanup Lifecycle', () => {
    it('creates canvas overlay with correct styling and zIndex', () => {
      triggerConfetti();
      const canvas = document.querySelector('#confetti-canvas-overlay') as HTMLCanvasElement;
      expect(canvas).not.toBeNull();
      expect(canvas.style.position).toBe('fixed');
      expect(canvas.style.top).toBe('0px');
      expect(canvas.style.left).toBe('0px');
      expect(canvas.style.width).toBe('100vw');
      expect(canvas.style.height).toBe('100vh');
      expect(canvas.style.pointerEvents).toBe('none');
      expect(canvas.style.zIndex).toBe('9999');
    });

    it('automatically removes canvas overlay from DOM when animation completes (activeParticles === 0)', () => {
      triggerConfetti();
      expect(document.querySelector('#confetti-canvas-overlay')).not.toBeNull();

      // Advance time sufficiently for all particles to decay (decay rate is ~0.008 to 0.02 per frame => ~125 frames max)
      // Advance time for particle animation loop to complete
      vi.runAllTimers();

      expect(document.querySelector('#confetti-canvas-overlay')).toBeNull();
    });

    it('preserves targetCanvas in DOM when targetCanvas is explicitly provided', () => {
      const customCanvas = document.createElement('canvas');
      customCanvas.id = 'custom-user-canvas';
      document.body.appendChild(customCanvas);

      const cancel = triggerConfetti(customCanvas);
      expect(document.querySelector('#custom-user-canvas')).not.toBeNull();

      // Advance time until particles decay
      vi.advanceTimersByTime(5000);

      // Custom canvas must NOT be removed from DOM automatically
      expect(document.querySelector('#custom-user-canvas')).not.toBeNull();

      // Calling cancel should also preserve custom canvas node
      cancel();
      expect(document.querySelector('#custom-user-canvas')).not.toBeNull();
    });
  });

  describe('Explicit Cleanup Callback Execution', () => {
    it('cancels requestAnimationFrame and immediately removes overlay canvas mid-animation', () => {
      const cancel = triggerConfetti();
      expect(document.querySelector('#confetti-canvas-overlay')).not.toBeNull();

      // Advance timers by 1 frame (16ms)
      vi.advanceTimersByTime(16);

      // Execute cleanup callback mid-animation
      cancel();

      // Overlay canvas should be removed immediately from DOM
      expect(document.querySelector('#confetti-canvas-overlay')).toBeNull();
    });

    it('is safe to call cleanup callback multiple times (idempotency)', () => {
      const cancel = triggerConfetti();
      expect(() => {
        cancel();
        cancel();
        cancel();
      }).not.toThrow();
      expect(document.querySelector('#confetti-canvas-overlay')).toBeNull();
    });
  });

  describe('Device Pixel Ratio (DPI) & Window Dimensions', () => {
    it('resizes canvas resolution based on devicePixelRatio = 1', () => {
      Object.defineProperty(window, 'devicePixelRatio', { writable: true, configurable: true, value: 1 });
      triggerConfetti();
      const canvas = document.querySelector('#confetti-canvas-overlay') as HTMLCanvasElement;
      expect(canvas.width).toBe(1024);
      expect(canvas.height).toBe(768);
    });

    it('resizes canvas resolution based on high DPI (devicePixelRatio = 2)', () => {
      Object.defineProperty(window, 'devicePixelRatio', { writable: true, configurable: true, value: 2 });
      triggerConfetti();
      const canvas = document.querySelector('#confetti-canvas-overlay') as HTMLCanvasElement;
      expect(canvas.width).toBe(2048);
      expect(canvas.height).toBe(1536);
    });

    it('handles high DPI devicePixelRatio = 3 (Retina / 4K)', () => {
      Object.defineProperty(window, 'devicePixelRatio', { writable: true, configurable: true, value: 3 });
      triggerConfetti();
      const canvas = document.querySelector('#confetti-canvas-overlay') as HTMLCanvasElement;
      expect(canvas.width).toBe(3072);
      expect(canvas.height).toBe(2304);
    });

    it('falls back safely when devicePixelRatio is undefined or falsy', () => {
      Object.defineProperty(window, 'devicePixelRatio', { writable: true, configurable: true, value: undefined });
      triggerConfetti();
      const canvas = document.querySelector('#confetti-canvas-overlay') as HTMLCanvasElement;
      // If devicePixelRatio is undefined, width should be numeric (1024), not NaN
      expect(Number.isNaN(canvas.width)).toBe(false);
      expect(canvas.width).toBeGreaterThan(0);
    });
  });
});
