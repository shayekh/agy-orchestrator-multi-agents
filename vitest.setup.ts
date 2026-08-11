// vitest.setup.ts
import '@testing-library/jest-dom';

// Mock Web Audio API
class MockAudioParam {
  value: number = 0;

  setValueAtTime(value: number, _startTime: number): this {
    this.value = value;
    return this;
  }

  exponentialRampToValueAtTime(value: number, _endTime: number): this {
    this.value = value;
    return this;
  }

  linearRampToValueAtTime(value: number, _endTime: number): this {
    this.value = value;
    return this;
  }
}

class MockAudioNode {
  connect(destination?: unknown): unknown {
    return destination;
  }

  disconnect(): void {}

  start(_when?: number): void {}

  stop(_when?: number): void {}
}

class MockGainNode extends MockAudioNode {
  gain = new MockAudioParam();
}

class MockOscillatorNode extends MockAudioNode {
  type: string = 'sine';
  frequency = new MockAudioParam();
  detune = new MockAudioParam();
}

class MockBiquadFilterNode extends MockAudioNode {
  type: string = 'lowpass';
  frequency = new MockAudioParam();
  Q = new MockAudioParam();
  gain = new MockAudioParam();
}

class MockAudioContext {
  state: string = 'running';
  destination = new MockAudioNode();

  createGain(): MockGainNode {
    return new MockGainNode();
  }

  createOscillator(): MockOscillatorNode {
    return new MockOscillatorNode();
  }

  createBiquadFilter(): MockBiquadFilterNode {
    return new MockBiquadFilterNode();
  }

  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }

  suspend(): Promise<void> {
    this.state = 'suspended';
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }
}

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).AudioContext = window.AudioContext || MockAudioContext;
  (window as unknown as Record<string, unknown>).webkitAudioContext = (window as unknown as Record<string, unknown>).webkitAudioContext || MockAudioContext;
}

// Mock HTMLCanvasElement 2D Context
if (typeof window !== 'undefined' && typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (contextId: string, ..._args: unknown[]) {
    if (contextId === '2d') {
      return {
        canvas: this,
        fillRect: () => {},
        clearRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        strokeText: () => {},
        fillText: () => {},
        measureText: () => ({ width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 }),
        drawImage: () => {},
        createImageData: () => ({ data: [] }),
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        setTransform: () => {},
        resetTransform: () => {},
        clip: () => {},
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
      } as unknown as CanvasRenderingContext2D;
    }
    return null;
  } as typeof HTMLCanvasElement.prototype.getContext;
}

// Mock requestAnimationFrame and cancelAnimationFrame
if (typeof window !== 'undefined') {
  let rafId = 0;
  const rafMap = new Map<number, number>();
  window.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const id = ++rafId;
    rafMap.set(id, window.setTimeout(() => {
      rafMap.delete(id);
      callback(performance.now());
    }, 16) as unknown as number);
    return id;
  };
  window.cancelAnimationFrame = (id: number): void => {
    const timeoutId = rafMap.get(id);
    if (timeoutId) window.clearTimeout(timeoutId);
    rafMap.delete(id);
  };
}

// Mock localStorage in-memory fallback
if (typeof window !== 'undefined') {
  const createLocalStorageMock = () => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (index: number) => Object.keys(store)[index] || null,
      get length() {
        return Object.keys(store).length;
      },
    };
  };

  try {
    const testKey = '__test_local_storage__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
  } catch (_e) {
    Object.defineProperty(window, 'localStorage', {
      value: createLocalStorageMock(),
      configurable: true,
      writable: true,
    });
  }
}
