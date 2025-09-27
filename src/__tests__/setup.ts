// Vitest setup file for testing environment
import { vi } from 'vitest';

// Mock navigator.getGamepads for testing
Object.defineProperty(global, 'navigator', {
  value: {
    getGamepads: vi.fn(() => [null, null, null, null]),
  },
  writable: true,
});

// Also ensure navigator exists in window if needed
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'navigator', {
    value: {
      getGamepads: vi.fn(() => [null, null, null, null]),
    },
    writable: true,
  });
}

// Mock HTMLCanvasElement and WebGL context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    clearColor: vi.fn(),
    clear: vi.fn(),
    clearDepth: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    viewport: vi.fn(),
    drawElements: vi.fn(),
    drawArrays: vi.fn(),
    createProgram: vi.fn(),
    createShader: vi.fn(),
    compileShader: vi.fn(),
    linkProgram: vi.fn(),
    useProgram: vi.fn(),
    getAttribLocation: vi.fn(),
    getUniformLocation: vi.fn(),
    vertexAttribPointer: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    uniform4f: vi.fn(),
    uniformMatrix4fv: vi.fn(),
    createBuffer: vi.fn(),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    createTexture: vi.fn(),
    bindTexture: vi.fn(),
    texImage2D: vi.fn(),
    texParameteri: vi.fn(),
    generateMipmap: vi.fn(),
  })),
});

// Mock requestAnimationFrame for testing
global.requestAnimationFrame = vi.fn((cb) => {
    const id = setTimeout(cb, 16);
    return id as number;
});
global.cancelAnimationFrame = vi.fn((id: number) => {
    clearTimeout(id);
});

// Mock btoa/atob for save system
global.btoa = vi.fn((str) => Buffer.from(str).toString('base64'));
global.atob = vi.fn((str) => Buffer.from(str, 'base64').toString());

// Mock window methods
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Suppress console.log during tests unless needed
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}