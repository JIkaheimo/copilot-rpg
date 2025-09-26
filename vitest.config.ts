/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    environment: 'jsdom',
    root: 'src',
    include: [
      '**/__tests__/**/*.+(ts|tsx|js)',
      '**/*.(test|spec).+(ts|tsx|js)'
    ],
    exclude: [
      '__tests__/setup.ts',
      '__tests__/__mocks__/'
    ],
    setupFiles: ['__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: '../coverage',
      include: [
        '**/*.{ts,tsx}'
      ],
      exclude: [
        '**/*.d.ts',
        'main.ts',
        'index.html',
        '__tests__/**'
      ]
    },
    testTimeout: 10000,
    globals: true
  },
  resolve: {
    alias: {
      '@': '/src',
      'three': '/__tests__/__mocks__/three.ts'
    }
  }
});