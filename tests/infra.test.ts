import { describe, it, expect } from 'vitest';

describe('Test Infrastructure Initialization', () => {
  it('mocks AudioContext properly', () => {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    expect(AudioCtx).toBeDefined();
    const ctx = new AudioCtx();
    expect(ctx.state).toBe('running');
    expect(ctx.destination).toBeDefined();
    
    const gain = ctx.createGain();
    expect(gain.gain).toBeDefined();
    gain.gain.setValueAtTime(0.5, 0);
    expect(gain.gain.value).toBe(0.5);
    
    const osc = ctx.createOscillator();
    expect(osc.frequency).toBeDefined();
    osc.start();
    osc.stop();
  });

  it('mocks Canvas 2D context properly', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();
    if (ctx) {
      expect(typeof ctx.fillRect).toBe('function');
      expect(typeof ctx.clearRect).toBe('function');
      expect(typeof ctx.beginPath).toBe('function');
      expect(typeof ctx.arc).toBe('function');
      expect(typeof ctx.fill).toBe('function');
      expect(typeof ctx.stroke).toBe('function');
      expect(typeof ctx.save).toBe('function');
      expect(typeof ctx.restore).toBe('function');
      expect(typeof ctx.translate).toBe('function');
      expect(typeof ctx.rotate).toBe('function');
      expect(typeof ctx.scale).toBe('function');
    }
  });

  it('mocks requestAnimationFrame and cancelAnimationFrame', () => {
    expect(typeof window.requestAnimationFrame).toBe('function');
    expect(typeof window.cancelAnimationFrame).toBe('function');
    const id = window.requestAnimationFrame(() => {});
    expect(typeof id).toBe('number');
    window.cancelAnimationFrame(id);
  });

  it('provides a functioning localStorage', () => {
    expect(window.localStorage).toBeDefined();
    window.localStorage.setItem('infra_test_key', 'infra_test_value');
    expect(window.localStorage.getItem('infra_test_key')).toBe('infra_test_value');
    window.localStorage.removeItem('infra_test_key');
    expect(window.localStorage.getItem('infra_test_key')).toBeNull();
  });
});
