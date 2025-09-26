/**
 * Basic setup test to verify Vitest configuration works
 */
import { describe, it, expect } from 'vitest';

describe('Test Setup', () => {
  it('should have vitest working properly', () => {
    expect(true).toBe(true);
  });

  it('should have Three.js mocks available', () => {
    const { Vector3, Scene } = require('three');
    const vector = new Vector3(1, 2, 3);
    expect(vector.x).toBe(1);
    expect(vector.y).toBe(2);
    expect(vector.z).toBe(3);

    const scene = new Scene();
    expect(scene).toBeDefined();
  });

  it('should have DOM mocks available', () => {
    expect(window.innerWidth).toBe(1024);
    expect(window.innerHeight).toBe(768);
    expect(window.localStorage).toBeDefined();
  });
});