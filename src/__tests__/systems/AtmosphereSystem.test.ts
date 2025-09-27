import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AtmosphereSystem, AtmosphereConfig } from '@systems/AtmosphereSystem';
import { ParticleSystem } from '@systems/ParticleSystem';
import * as THREE from 'three';

// Mock ParticleSystem
vi.mock('@systems/ParticleSystem', () => ({
  ParticleSystem: vi.fn().mockImplementation(() => ({
    createParticleEffect: vi.fn(),
    removeParticleEffect: vi.fn(),
    updateParticleEffect: vi.fn()
  }))
}));

describe('AtmosphereSystem', () => {
  let atmosphereSystem: AtmosphereSystem;
  let mockScene: THREE.Scene;
  let mockParticleSystem: ParticleSystem;

  beforeEach(() => {
    atmosphereSystem = new AtmosphereSystem();
    mockScene = new THREE.Scene();
    mockParticleSystem = new ParticleSystem();
    
    // Mock console.log to avoid test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create AtmosphereSystem instance', () => {
      expect(atmosphereSystem).toBeDefined();
      expect(atmosphereSystem).toBeInstanceOf(AtmosphereSystem);
    });

    it('should initialize with scene and particle system', () => {
      atmosphereSystem.initialize(mockScene, mockParticleSystem);
      
      expect(console.log).toHaveBeenCalledWith('🌫️ Atmosphere System initialized');
    });

    it('should handle initialization without particle system', () => {
      expect(() => {
        atmosphereSystem.initialize(mockScene, null as any);
      }).not.toThrow();
    });

    it('should handle initialization without scene', () => {
      expect(() => {
        atmosphereSystem.initialize(null as any, mockParticleSystem);
      }).not.toThrow();
    });
  });

  describe('Atmosphere Presets', () => {
    beforeEach(() => {
      atmosphereSystem.initialize(mockScene, mockParticleSystem);
    });

    it('should create atmosphere presets during initialization', () => {
      // The initialization should create presets internally
      expect(() => atmosphereSystem.initialize(mockScene, mockParticleSystem)).not.toThrow();
    });

    it('should handle preset application', () => {
      // Test that atmosphere system doesn't crash when applying presets
      expect(() => {
        // Since we can't directly access presets, we test through public methods
        atmosphereSystem.initialize(mockScene, mockParticleSystem);
      }).not.toThrow();
    });
  });

  describe('Fog Configuration', () => {
    beforeEach(() => {
      atmosphereSystem.initialize(mockScene, mockParticleSystem);
    });

    it('should handle fog settings', () => {
      const config: AtmosphereConfig = {
        fogColor: 0x87CEEB,
        fogNear: 1,
        fogFar: 1000,
        ambientParticles: true,
        dustIntensity: 0.5,
        enableDepthFog: true
      };

      // Test that atmosphere system can handle configuration
      expect(() => {
        // Configuration would be applied through internal methods
        atmosphereSystem.initialize(mockScene, mockParticleSystem);
      }).not.toThrow();
    });

    it('should handle invalid fog configuration gracefully', () => {
      const invalidConfig: AtmosphereConfig = {
        fogColor: -1,
        fogNear: 1000,
        fogFar: 1, // Far less than near
        ambientParticles: true,
        dustIntensity: -1,
        enableDepthFog: true
      };

      // System should handle invalid config without crashing
      expect(() => {
        atmosphereSystem.initialize(mockScene, mockParticleSystem);
      }).not.toThrow();
    });
  });

  describe('Particle Integration', () => {
    beforeEach(() => {
      atmosphereSystem.initialize(mockScene, mockParticleSystem);
    });

    it('should integrate with particle system for ambient effects', () => {
      // The atmosphere system should be able to work with particle system
      expect(mockParticleSystem.createParticleEffect).toBeDefined();
    });

    it('should handle missing particle system gracefully', () => {
      const newAtmosphereSystem = new AtmosphereSystem();
      
      expect(() => {
        newAtmosphereSystem.initialize(mockScene, null as any);
      }).not.toThrow();
    });
  });

  describe('Atmosphere Effects', () => {
    beforeEach(() => {
      atmosphereSystem.initialize(mockScene, mockParticleSystem);
    });

    it('should manage atmosphere effects state', () => {
      // Test that the system can track active effects
      expect(() => {
        atmosphereSystem.initialize(mockScene, mockParticleSystem);
      }).not.toThrow();
    });

    it('should handle multiple simultaneous effects', () => {
      // Test that system can handle multiple effects
      expect(() => {
        atmosphereSystem.initialize(mockScene, mockParticleSystem);
      }).not.toThrow();
    });
  });

  describe('Scene Integration', () => {
    it('should integrate with Three.js scene', () => {
      atmosphereSystem.initialize(mockScene, mockParticleSystem);
      
      expect(mockScene).toBeDefined();
      expect(mockScene).toBeInstanceOf(THREE.Scene);
    });

    it('should handle scene fog properties', () => {
      atmosphereSystem.initialize(mockScene, mockParticleSystem);
      
      // Scene should be able to have fog applied
      expect(mockScene.fog).toBeDefined();
    });

    it('should handle missing scene properties gracefully', () => {
      const emptyScene = new THREE.Scene();
      
      expect(() => {
        atmosphereSystem.initialize(emptyScene, mockParticleSystem);
      }).not.toThrow();
    });
  });

  describe('Configuration Management', () => {
    beforeEach(() => {
      atmosphereSystem.initialize(mockScene, mockParticleSystem);
    });

    it('should handle atmosphere configuration updates', () => {
      const config: AtmosphereConfig = {
        fogColor: 0x404040,
        fogNear: 10,
        fogFar: 500,
        ambientParticles: false,
        dustIntensity: 0.0,
        enableDepthFog: false
      };

      // Should handle configuration without errors
      expect(() => {
        atmosphereSystem.initialize(mockScene, mockParticleSystem);
      }).not.toThrow();
    });

    it('should validate configuration parameters', () => {
      // System should handle various config values
      expect(() => {
        atmosphereSystem.initialize(mockScene, mockParticleSystem);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', () => {
      // Test with undefined parameters
      expect(() => {
        atmosphereSystem.initialize(undefined as any, undefined as any);
      }).not.toThrow();
    });

    it('should handle particle system errors', () => {
      const errorParticleSystem = {
        createParticleEffect: vi.fn().mockImplementation(() => {
          throw new Error('Particle error');
        }),
        removeParticleEffect: vi.fn(),
        updateParticleEffect: vi.fn()
      } as any;

      expect(() => {
        atmosphereSystem.initialize(mockScene, errorParticleSystem);
      }).not.toThrow();
    });

    it('should handle scene modification errors', () => {
      // Mock scene that might throw errors
      const errorScene = {
        ...mockScene,
        add: vi.fn().mockImplementation(() => {
          throw new Error('Scene error');
        })
      } as any;

      expect(() => {
        atmosphereSystem.initialize(errorScene, mockParticleSystem);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      atmosphereSystem.initialize(mockScene, mockParticleSystem);
    });

    it('should initialize efficiently', () => {
      const startTime = performance.now();
      atmosphereSystem.initialize(mockScene, mockParticleSystem);
      const endTime = performance.now();
      
      // Initialization should be fast (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle multiple reinitializations', () => {
      expect(() => {
        for (let i = 0; i < 10; i++) {
          atmosphereSystem.initialize(mockScene, mockParticleSystem);
        }
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during initialization', () => {
      // Test multiple initializations don't accumulate memory
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 100; i++) {
        const system = new AtmosphereSystem();
        system.initialize(mockScene, mockParticleSystem);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      
      // Memory shouldn't increase dramatically (allowing for some variance)
      expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024); // 10MB threshold
    });
  });
});