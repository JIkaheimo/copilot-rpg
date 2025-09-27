/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

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
      '@': path.resolve(__dirname, 'src'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@systems': path.resolve(__dirname, 'src/systems'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@components': path.resolve(__dirname, 'src/components'),
      'three': path.resolve(__dirname, 'src/__tests__/__mocks__/three.ts')
    }
  }
});