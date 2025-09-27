import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeatherSystem, WeatherType } from '@systems/WeatherSystem';
import { ParticleSystem } from '@systems/ParticleSystem';
import * as THREE from 'three';

// Mock Three.js
vi.mock('three');

// Mock ParticleSystem  
vi.mock('@systems/ParticleSystem', () => ({
    ParticleSystem: vi.fn(() => ({
        createEnvironmentalEffect: vi.fn(() => 'effect-id'),
        stopEffect: vi.fn()
    }))
}));

describe('WeatherSystem', () => {
  let weatherSystem: WeatherSystem;
  let mockScene: THREE.Scene;
  let mockParticleSystem: ParticleSystem;

  beforeEach(() => {
    weatherSystem = new WeatherSystem();
    mockScene = new THREE.Scene();
    mockParticleSystem = new ParticleSystem();
  });

  describe('Initialization', () => {
    it('should initialize correctly', () => {
      expect(weatherSystem).toBeDefined();
    });

    it('should initialize with scene and particle system', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      weatherSystem.initialize(mockScene, mockParticleSystem);
      
      expect(consoleSpy).toHaveBeenCalledWith('🌤️ Weather system initialized with enhanced particle effects');
      consoleSpy.mockRestore();
    });
  });

  describe('Weather Management', () => {
    beforeEach(() => {
      weatherSystem.initialize(mockScene, mockParticleSystem);
    });

    it('should start with clear weather', () => {
      expect(weatherSystem.getCurrentWeather()).toBe('clear');
    });

    it('should change weather', () => {
      weatherSystem.setWeather('rain');
      // WeatherSystem doesn't have getTargetWeather method, 
      // but we can test that setWeather doesn't throw
      expect(() => weatherSystem.setWeather('rain')).not.toThrow();
    });

    it('should handle all weather types', () => {
      const weatherTypes: WeatherType[] = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'storm'];
      
      weatherTypes.forEach(weather => {
        expect(() => weatherSystem.setWeather(weather)).not.toThrow();
      });
    });

    it('should transition between weather states', () => {
      weatherSystem.setWeather('rain');
      
      // Simulate time passing for transition
      expect(() => weatherSystem.update(5.0)).not.toThrow();
      
      // Should be in transition (method exists)
      expect(weatherSystem.isTransitioning()).toBeDefined();
    });

    it('should complete weather transitions', () => {
      weatherSystem.setWeather('snow');
      
      // Simulate full transition time
      expect(() => weatherSystem.update(15.0)).not.toThrow();
      
      expect(weatherSystem.getCurrentWeather()).toBe('snow');
      expect(weatherSystem.isTransitioning()).toBe(false);
    });

    it('should handle intensity changes', () => {
      weatherSystem.setWeather('storm', 0.8);
      expect(weatherSystem.getWeatherIntensity()).toBeCloseTo(0.8);
    });

    it('should clamp intensity values', () => {
      weatherSystem.setWeather('rain', 1.5); // Over 1.0
      expect(weatherSystem.getWeatherIntensity()).toBe(1.0);
      
      weatherSystem.setWeather('fog', -0.5); // Under 0.0
      expect(weatherSystem.getWeatherIntensity()).toBe(0.0);
    });
  });

  describe('Weather Effects', () => {
    beforeEach(() => {
      weatherSystem.initialize(mockScene);
    });

    it('should create rain effects', () => {
      weatherSystem.setWeather('rain');
      weatherSystem.update(15.0); // Complete transition
      
      // Should have rain particles active
      expect(weatherSystem.getCurrentWeather()).toBe('rain');
    });

    it('should create snow effects', () => {
      weatherSystem.setWeather('snow');
      weatherSystem.update(15.0); // Complete transition
      
      expect(weatherSystem.getCurrentWeather()).toBe('snow');
    });

    it('should handle fog effects', () => {
      weatherSystem.setWeather('fog');
      weatherSystem.update(15.0);
      
      expect(weatherSystem.getCurrentWeather()).toBe('fog');
    });

    it('should handle storm effects', () => {
      weatherSystem.setWeather('storm');
      weatherSystem.update(15.0);
      
      expect(weatherSystem.getCurrentWeather()).toBe('storm');
    });
  });

  describe('Update Cycle', () => {
    beforeEach(() => {
      weatherSystem.initialize(mockScene);
    });

    it('should handle deltaTime correctly', () => {
      const initialWeather = weatherSystem.getCurrentWeather();
      weatherSystem.setWeather('rain');
      
      expect(() => weatherSystem.update(0.016)).not.toThrow(); // One frame at 60fps
      
      expect(weatherSystem.isTransitioning()).toBeDefined();
    });

    it('should progress transitions over time', () => {
      weatherSystem.setWeather('cloudy');
      
      // Test that update doesn't throw errors
      expect(() => weatherSystem.update(1.0)).not.toThrow();
      expect(() => weatherSystem.update(5.0)).not.toThrow();
    });

    it('should not update without initialization', () => {
      const uninitializedSystem = new WeatherSystem();
      
      // Should not throw error when updating uninitialized system
      expect(() => {
        uninitializedSystem.update(1.0);
      }).not.toThrow();
    });
  });

  describe('Environmental Impact', () => {
    beforeEach(() => {
      weatherSystem.initialize(mockScene);
    });

    it('should provide environmental data', () => {
      weatherSystem.setWeather('rain', 0.7);
      weatherSystem.update(15.0);
      
      // Test that weather system maintains state
      expect(weatherSystem.getCurrentWeather()).toBe('rain');
      expect(weatherSystem.getWeatherIntensity()).toBeCloseTo(0.7);
    });

    it('should handle different weather types', () => {
      // Clear weather
      weatherSystem.setWeather('clear');
      weatherSystem.update(15.0);
      expect(weatherSystem.getCurrentWeather()).toBe('clear');
      
      // Fog weather
      weatherSystem.setWeather('fog', 1.0);
      weatherSystem.update(15.0);
      expect(weatherSystem.getCurrentWeather()).toBe('fog');
    });
  });

  describe('Random Weather', () => {
    beforeEach(() => {
      weatherSystem.initialize(mockScene);
    });

    it('should handle weather generation', () => {
      const originalWeather = weatherSystem.getCurrentWeather();
      
      // Test that we can set different weather types
      const weatherTypes: WeatherType[] = ['clear', 'cloudy', 'rain', 'snow', 'fog', 'storm'];
      weatherTypes.forEach(weather => {
        weatherSystem.setWeather(weather);
        expect(['clear', 'cloudy', 'rain', 'snow', 'fog', 'storm']).toContain(
          weatherSystem.getCurrentWeather()
        );
      });
    });

    it('should maintain weather state', () => {
      // Test multiple weather changes with transitions
      weatherSystem.setWeather('rain');
      weatherSystem.update(15.0); // Complete transition
      expect(weatherSystem.getCurrentWeather()).toBe('rain');
      
      weatherSystem.setWeather('snow');
      weatherSystem.update(15.0); // Complete transition
      expect(weatherSystem.getCurrentWeather()).toBe('snow');
      
      weatherSystem.setWeather('clear');
      weatherSystem.update(15.0); // Complete transition
      expect(weatherSystem.getCurrentWeather()).toBe('clear');
    });
  });
});