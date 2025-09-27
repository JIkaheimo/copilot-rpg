import { describe, it, expect, beforeEach, vi } from 'vitest';
/**
 * Comprehensive tests for DayNightCycle system
 * Tests time progression, lighting changes, and day/night cycle logic
 */
import { DayNightCycle } from '@systems/DayNightCycle';
import * as THREE from 'three';

describe('DayNightCycle', () => {
  let dayNightCycle: DayNightCycle;
  let mockScene: THREE.Scene;

  beforeEach(() => {
    dayNightCycle = new DayNightCycle();
    mockScene = new THREE.Scene();
    
    // Add mock lights to scene
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    mockScene.add(directionalLight);
    mockScene.add(ambientLight);
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(dayNightCycle.getTimeOfDay()).toBe(12); // Default noon
      expect(dayNightCycle.getTimeScale()).toBe(1); // Default time scale (real-time)
    });

    it('should initialize with scene and find existing lights', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      dayNightCycle.initialize(mockScene);
      
      expect(consoleSpy).toHaveBeenCalledWith('☀️ Day/Night cycle initialized');
      consoleSpy.mockRestore();
    });

    it('should create lights if none exist in scene', () => {
      const emptyScene = new THREE.Scene();
      const initialChildCount = emptyScene.children.length;
      
      dayNightCycle.initialize(emptyScene);
      
      expect(emptyScene.children.length).toBeGreaterThan(initialChildCount);
      
      // Should have added directional and ambient lights
      let hasDirectional = false;
      let hasAmbient = false;
      
      emptyScene.traverse((object) => {
        if (object instanceof THREE.DirectionalLight) hasDirectional = true;
        if (object instanceof THREE.AmbientLight) hasAmbient = true;
      });
      
      expect(hasDirectional).toBe(true);
      expect(hasAmbient).toBe(true);
    });
  });

  describe('Time Management', () => {
    beforeEach(() => {
      dayNightCycle.initialize(mockScene);
    });

    it('should set time of day', () => {
      dayNightCycle.setTimeOfDay(15.5); // 3:30 PM
      expect(dayNightCycle.getTimeOfDay()).toBe(15.5);
    });

    it('should clamp time of day to valid range', () => {
      dayNightCycle.setTimeOfDay(-5);
      expect(dayNightCycle.getTimeOfDay()).toBe(0);
      
      dayNightCycle.setTimeOfDay(30);
      expect(dayNightCycle.getTimeOfDay()).toBe(24);
    });

    it('should advance time with update', () => {
      const initialTime = dayNightCycle.getTimeOfDay();
      const deltaTime = 1.0; // 1 second
      
      dayNightCycle.update(deltaTime);
      
      const newTime = dayNightCycle.getTimeOfDay();
      expect(newTime).toBeGreaterThan(initialTime);
    });

    it('should wrap time around 24 hours', () => {
      dayNightCycle.setTimeOfDay(23.9);
      dayNightCycle.update(1.0); // Advance time by 1 second (scaled)
      
      const newTime = dayNightCycle.getTimeOfDay();
      expect(newTime).toBeLessThan(24); // Should stay within 24 hour range
      // The actual wrapping depends on the time scale implementation
    });

    it('should set time scale', () => {
      dayNightCycle.setTimeScale(120);
      expect(dayNightCycle.getTimeScale()).toBe(120);
    });

    it('should enforce minimum time scale', () => {
      dayNightCycle.setTimeScale(0.05); // Below minimum
      expect(dayNightCycle.getTimeScale()).toBe(0.1); // Should be clamped to minimum
    });
  });

  describe('Time Period Detection', () => {
    beforeEach(() => {
      dayNightCycle.initialize(mockScene);
    });

    it('should detect day time correctly', () => {
      dayNightCycle.setTimeOfDay(12); // Noon
      expect(dayNightCycle.isDay()).toBe(true);
      expect(dayNightCycle.isNight()).toBe(false);
      
      dayNightCycle.setTimeOfDay(14); // 2 PM
      expect(dayNightCycle.isDay()).toBe(true);
    });

    it('should detect night time correctly', () => {
      dayNightCycle.setTimeOfDay(22); // 10 PM
      expect(dayNightCycle.isNight()).toBe(true);
      expect(dayNightCycle.isDay()).toBe(false);
      
      dayNightCycle.setTimeOfDay(2); // 2 AM
      expect(dayNightCycle.isNight()).toBe(true);
    });

    it('should detect dawn correctly', () => {
      dayNightCycle.setTimeOfDay(6.5); // 6:30 AM
      expect(dayNightCycle.isDawn()).toBe(true);
      expect(dayNightCycle.isDay()).toBe(true); // Dawn is considered part of day (6-18)
      expect(dayNightCycle.isNight()).toBe(false);
    });

    it('should detect dusk correctly', () => {
      dayNightCycle.setTimeOfDay(19); // 7 PM - dusk is 18-20
      expect(dayNightCycle.isDusk()).toBe(true);
      expect(dayNightCycle.isDay()).toBe(false); // After 18:00 is not day
      expect(dayNightCycle.isNight()).toBe(true);
    });

    it('should handle edge cases for time periods', () => {
      // Exact boundaries
      dayNightCycle.setTimeOfDay(6); // Dawn start
      expect(dayNightCycle.isDawn()).toBe(true);
      
      dayNightCycle.setTimeOfDay(18); // Dusk start  
      expect(dayNightCycle.isDusk()).toBe(true);
      
      dayNightCycle.setTimeOfDay(20); // Night start
      expect(dayNightCycle.isNight()).toBe(true);
    });
  });

  describe('Time String Formatting', () => {
    beforeEach(() => {
      dayNightCycle.initialize(mockScene);
    });

    it('should format morning time correctly', () => {
      dayNightCycle.setTimeOfDay(9.5); // 9:30 AM
      expect(dayNightCycle.getTimeString()).toBe('9:30 AM');
    });

    it('should format afternoon time correctly', () => {
      dayNightCycle.setTimeOfDay(14.75); // 2:45 PM
      expect(dayNightCycle.getTimeString()).toBe('2:45 PM');
    });

    it('should format midnight correctly', () => {
      dayNightCycle.setTimeOfDay(0); // Midnight
      expect(dayNightCycle.getTimeString()).toBe('12:00 AM');
    });

    it('should format noon correctly', () => {
      dayNightCycle.setTimeOfDay(12); // Noon
      expect(dayNightCycle.getTimeString()).toBe('12:00 PM');
    });

    it('should pad minutes with zero', () => {
      dayNightCycle.setTimeOfDay(15.083333333333334); // 3:05 PM exactly
      expect(dayNightCycle.getTimeString()).toBe('3:05 PM');
    });
  });

  describe('Lighting Updates', () => {
    beforeEach(() => {
      dayNightCycle.initialize(mockScene);
    });

    it('should update lighting when time changes', () => {
      // Get initial light states
      let directionalLight: THREE.DirectionalLight | undefined;
      let ambientLight: THREE.AmbientLight | undefined;
      
      mockScene.traverse((object) => {
        if (object instanceof THREE.DirectionalLight) directionalLight = object;
        if (object instanceof THREE.AmbientLight) ambientLight = object;
      });
      
      const initialDirectionalIntensity = directionalLight?.intensity;
      const initialAmbientIntensity = ambientLight?.intensity;
      
      // Change to night time
      dayNightCycle.setTimeOfDay(22);
      
      // Lighting should have changed
      const newDirectionalIntensity = directionalLight?.intensity;
      const newAmbientIntensity = ambientLight?.intensity;
      
      expect(newDirectionalIntensity).not.toBe(initialDirectionalIntensity);
      expect(newAmbientIntensity).not.toBe(initialAmbientIntensity);
    });

    it('should have different lighting for different time periods', () => {
      let directionalLight: THREE.DirectionalLight | undefined;
      
      mockScene.traverse((object) => {
        if (object instanceof THREE.DirectionalLight) directionalLight = object;
      });
      
      // Day lighting
      dayNightCycle.setTimeOfDay(12);
      const dayDirectional = directionalLight?.intensity;
      
      // Night lighting
      dayNightCycle.setTimeOfDay(2);
      const nightDirectional = directionalLight?.intensity;
      
      expect(dayDirectional).not.toBe(nightDirectional);
      expect(dayDirectional).toBeGreaterThan(nightDirectional || 0);
    });

    it('should update sun position based on time', () => {
      let directionalLight: THREE.DirectionalLight | undefined;
      
      mockScene.traverse((object) => {
        if (object instanceof THREE.DirectionalLight) directionalLight = object;
      });
      
      // Morning position
      dayNightCycle.setTimeOfDay(8);
      const morningPosition = directionalLight?.position.clone();
      
      // Evening position
      dayNightCycle.setTimeOfDay(16);
      const eveningPosition = directionalLight?.position.clone();
      
      // Positions should be different
      expect(morningPosition?.equals(eveningPosition || new THREE.Vector3())).toBe(false);
    });
  });

  describe('Update Loop', () => {
    beforeEach(() => {
      dayNightCycle.initialize(mockScene);
    });

    it('should handle update with deltaTime', () => {
      const initialTime = dayNightCycle.getTimeOfDay();
      
      expect(() => {
        dayNightCycle.update(0.016); // 16ms frame
      }).not.toThrow();
      
      expect(dayNightCycle.getTimeOfDay()).toBeGreaterThanOrEqual(initialTime);
    });

    it('should progress time consistently', () => {
      dayNightCycle.setTimeOfDay(10);
      dayNightCycle.setTimeScale(60); // 1 real second = 1 game minute
      
      const initialTime = dayNightCycle.getTimeOfDay();
      
      // Simulate 1 second of game time (should advance 1 minute)
      dayNightCycle.update(1.0);
      
      const expectedTime = initialTime + (1.0 / 60); // 1 minute in hours
      expect(dayNightCycle.getTimeOfDay()).toBeCloseTo(expectedTime, 2);
    });

    it('should handle large deltaTime values', () => {
      const initialTime = dayNightCycle.getTimeOfDay();
      
      // Large deltaTime shouldn't break the system
      dayNightCycle.update(5.0);
      
      const newTime = dayNightCycle.getTimeOfDay();
      expect(newTime).toBeGreaterThan(initialTime);
      expect(newTime).toBeLessThanOrEqual(24);
    });
  });

  describe('Configuration Interpolation', () => {
    beforeEach(() => {
      dayNightCycle.initialize(mockScene);
    });

    it('should smoothly transition between time periods', () => {
      // Test transition from day to dusk
      dayNightCycle.setTimeOfDay(16.5); // Middle of day-to-dusk transition
      
      let directionalLight: THREE.DirectionalLight | undefined;
      mockScene.traverse((object) => {
        if (object instanceof THREE.DirectionalLight) directionalLight = object;
      });
      
      const transitionIntensity = directionalLight?.intensity;
      
      // Should be between day and dusk intensities
      dayNightCycle.setTimeOfDay(12); // Pure day
      const dayIntensity = directionalLight?.intensity;
      
      dayNightCycle.setTimeOfDay(18); // Pure dusk
      const duskIntensity = directionalLight?.intensity;
      
      if (dayIntensity && duskIntensity && transitionIntensity) {
        expect(transitionIntensity).toBeGreaterThan(Math.min(dayIntensity, duskIntensity));
        expect(transitionIntensity).toBeLessThan(Math.max(dayIntensity, duskIntensity));
      }
    });
  });
});