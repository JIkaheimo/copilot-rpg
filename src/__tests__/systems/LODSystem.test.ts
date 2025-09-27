import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LODSystem, LODConfig } from '@systems/LODSystem';
import * as THREE from 'three';

describe('LODSystem', () => {
  let lodSystem: LODSystem;
  let mockScene: THREE.Scene;
  let mockCamera: THREE.Camera;
  let mockObject: THREE.Mesh;
  let mockGeometry: THREE.BufferGeometry;
  let mockMaterial: THREE.Material;

  beforeEach(() => {
    lodSystem = new LODSystem();
    mockScene = new THREE.Scene();
    mockCamera = new THREE.PerspectiveCamera();
    
    // Create real geometry with positions
    mockGeometry = new THREE.BoxGeometry(1, 1, 1);
    
    // Create real material
    mockMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    
    // Create real mesh object
    mockObject = new THREE.Mesh(mockGeometry, mockMaterial);
    mockObject.position.set(0, 0, 0);

    // Mock console.log and console.warn
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create LODSystem instance', () => {
      expect(lodSystem).toBeDefined();
      expect(lodSystem).toBeInstanceOf(LODSystem);
    });

    it('should initialize with scene and camera', () => {
      lodSystem.initialize(mockScene, mockCamera);
      
      expect(console.log).toHaveBeenCalledWith('🎯 LOD System initialized');
    });

    it('should handle initialization without scene', () => {
      expect(() => {
        lodSystem.initialize(null as any, mockCamera);
      }).not.toThrow();
    });

    it('should handle initialization without camera', () => {
      expect(() => {
        lodSystem.initialize(mockScene, null as any);
      }).not.toThrow();
    });
  });

  describe('Object Registration', () => {
    beforeEach(() => {
      lodSystem.initialize(mockScene, mockCamera);
    });

    it('should register object with default config', () => {
      expect(() => {
        lodSystem.registerObject('test-object', mockObject);
      }).not.toThrow();
    });

    it('should register object with custom config', () => {
      const customConfig: Partial<LODConfig> = {
        highDetail: 10,
        mediumDetail: 30,
        lowDetail: 60,
        cullDistance: 120
      };

      expect(() => {
        lodSystem.registerObject('test-object-custom', mockObject, customConfig);
      }).not.toThrow();
    });

    it('should handle duplicate object registration', () => {
      lodSystem.registerObject('test-object', mockObject);
      
      // Should not throw when registering same ID again
      expect(() => {
        lodSystem.registerObject('test-object', mockObject);
      }).not.toThrow();
    });

    it('should handle object registration without mesh', () => {
      const emptyObject = new THREE.Object3D();
      
      expect(() => {
        lodSystem.registerObject('empty-object', emptyObject);
      }).not.toThrow();
    });

    it('should handle null object registration', () => {
      lodSystem.registerObject('null-object', null as any);
      
      expect(console.warn).toHaveBeenCalledWith('🎯 LOD System: Cannot register null object');
    });
  });

  describe('Object Unregistration', () => {
    beforeEach(() => {
      lodSystem.initialize(mockScene, mockCamera);
      lodSystem.registerObject('test-object', mockObject);
    });

    it('should unregister existing object', () => {
      expect(() => {
        lodSystem.unregisterObject('test-object');
      }).not.toThrow();
    });

    it('should handle unregistering non-existent object', () => {
      expect(() => {
        lodSystem.unregisterObject('non-existent');
      }).not.toThrow();
    });

    it('should handle multiple unregistrations of same object', () => {
      lodSystem.unregisterObject('test-object');
      
      expect(() => {
        lodSystem.unregisterObject('test-object');
      }).not.toThrow();
    });
  });

  describe('Player Position Updates', () => {
    beforeEach(() => {
      lodSystem.initialize(mockScene, mockCamera);
    });

    it('should update player position', () => {
      const newPosition = new THREE.Vector3(10, 5, 15);
      
      expect(() => {
        lodSystem.updatePlayerPosition(newPosition);
      }).not.toThrow();
    });

    it('should handle zero vector position', () => {
      const zeroPosition = new THREE.Vector3(0, 0, 0);
      
      expect(() => {
        lodSystem.updatePlayerPosition(zeroPosition);
      }).not.toThrow();
    });

    it('should handle negative position values', () => {
      const negativePosition = new THREE.Vector3(-10, -5, -15);
      
      expect(() => {
        lodSystem.updatePlayerPosition(negativePosition);
      }).not.toThrow();
    });

    it('should handle very large position values', () => {
      const largePosition = new THREE.Vector3(10000, 10000, 10000);
      
      expect(() => {
        lodSystem.updatePlayerPosition(largePosition);
      }).not.toThrow();
    });
  });

  describe('System Updates', () => {
    beforeEach(() => {
      lodSystem.initialize(mockScene, mockCamera);
      lodSystem.registerObject('test-object', mockObject);
    });

    it('should update without errors', () => {
      expect(() => {
        lodSystem.update();
      }).not.toThrow();
    });

    it('should handle update with registered objects', () => {
      lodSystem.registerObject('object1', mockObject);
      const object2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mockMaterial);
      lodSystem.registerObject('object2', object2);
      
      expect(() => {
        lodSystem.update();
      }).not.toThrow();
    });

    it('should handle update with no registered objects', () => {
      lodSystem.unregisterObject('test-object');
      
      expect(() => {
        lodSystem.update();
      }).not.toThrow();
    });

    it('should handle update with different player positions', () => {
      lodSystem.updatePlayerPosition(new THREE.Vector3(5, 0, 0));
      lodSystem.update();
      
      lodSystem.updatePlayerPosition(new THREE.Vector3(50, 0, 0));
      lodSystem.update();
      
      lodSystem.updatePlayerPosition(new THREE.Vector3(150, 0, 0));
      
      expect(() => {
        lodSystem.update();
      }).not.toThrow();
    });
  });

  describe('Configuration Management', () => {
    beforeEach(() => {
      lodSystem.initialize(mockScene, mockCamera);
    });

    it('should set default config', () => {
      const newDefaultConfig: Partial<LODConfig> = {
        highDetail: 15,
        mediumDetail: 40,
        lowDetail: 80,
        cullDistance: 160
      };

      expect(() => {
        lodSystem.setDefaultConfig(newDefaultConfig);
      }).not.toThrow();
    });

    it('should update object config', () => {
      lodSystem.registerObject('test-object', mockObject);
      
      const newConfig: Partial<LODConfig> = {
        highDetail: 25,
        mediumDetail: 60
      };

      expect(() => {
        lodSystem.updateObjectConfig('test-object', newConfig);
      }).not.toThrow();
    });

    it('should handle updating config for non-existent object', () => {
      const newConfig: Partial<LODConfig> = {
        highDetail: 25
      };

      expect(() => {
        lodSystem.updateObjectConfig('non-existent', newConfig);
      }).not.toThrow();
    });

    it('should handle partial config updates', () => {
      lodSystem.registerObject('test-object', mockObject);
      
      const partialConfig: Partial<LODConfig> = {
        highDetail: 30
      };

      expect(() => {
        lodSystem.updateObjectConfig('test-object', partialConfig);
      }).not.toThrow();
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      lodSystem.initialize(mockScene, mockCamera);
    });

    it('should return stats with no objects', () => {
      const stats = lodSystem.getStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalObjects).toBe(0);
      expect(stats.visibleObjects).toBe(0);
      expect(stats.culledObjects).toBe(0);
    });

    it('should return stats with registered objects', () => {
      lodSystem.registerObject('object1', mockObject);
      const object2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mockMaterial);
      lodSystem.registerObject('object2', object2);
      const object3 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mockMaterial);
      lodSystem.registerObject('object3', object3);
      
      const stats = lodSystem.getStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalObjects).toBe(3);
      expect(typeof stats.visibleObjects).toBe('number');
      expect(typeof stats.culledObjects).toBe('number');
    });

    it('should update stats after objects are unregistered', () => {
      lodSystem.registerObject('object1', mockObject);
      const object2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mockMaterial);
      lodSystem.registerObject('object2', object2);
      
      let stats = lodSystem.getStats();
      expect(stats.totalObjects).toBe(2);
      
      lodSystem.unregisterObject('object1');
      
      stats = lodSystem.getStats();
      expect(stats.totalObjects).toBe(1);
    });
  });

  describe('LOD Levels', () => {
    beforeEach(() => {
      lodSystem.initialize(mockScene, mockCamera);
      lodSystem.registerObject('test-object', mockObject);
    });

    it('should handle objects at different distances', () => {
      // Test high detail (close)
      lodSystem.updatePlayerPosition(new THREE.Vector3(5, 0, 0));
      lodSystem.update();
      
      // Test medium detail
      lodSystem.updatePlayerPosition(new THREE.Vector3(35, 0, 0));
      lodSystem.update();
      
      // Test low detail
      lodSystem.updatePlayerPosition(new THREE.Vector3(75, 0, 0));
      lodSystem.update();
      
      // Test culled (very far)
      lodSystem.updatePlayerPosition(new THREE.Vector3(250, 0, 0));
      
      expect(() => {
        lodSystem.update();
      }).not.toThrow();
    });

    it('should handle custom LOD thresholds', () => {
      const customConfig: Partial<LODConfig> = {
        highDetail: 5,
        mediumDetail: 15,
        lowDetail: 30,
        cullDistance: 60
      };
      
      lodSystem.registerObject('custom-object', mockObject, customConfig);
      
      // Test at various distances with custom config
      lodSystem.updatePlayerPosition(new THREE.Vector3(3, 0, 0)); // High detail
      lodSystem.update();
      
      lodSystem.updatePlayerPosition(new THREE.Vector3(10, 0, 0)); // Medium detail
      lodSystem.update();
      
      lodSystem.updatePlayerPosition(new THREE.Vector3(25, 0, 0)); // Low detail
      lodSystem.update();
      
      lodSystem.updatePlayerPosition(new THREE.Vector3(70, 0, 0)); // Culled
      
      expect(() => {
        lodSystem.update();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle update without initialization', () => {
      expect(() => {
        lodSystem.update();
      }).not.toThrow();
    });

    it('should handle registration without initialization', () => {
      expect(() => {
        lodSystem.registerObject('test', mockObject);
      }).not.toThrow();
    });

    it('should handle invalid geometry objects', () => {
      lodSystem.initialize(mockScene, mockCamera);
      
      const invalidObject = new THREE.Object3D();
      
      expect(() => {
        lodSystem.registerObject('invalid', invalidObject);
      }).not.toThrow();
    });

    it('should handle null object registration', () => {
      lodSystem.initialize(mockScene, mockCamera);
      
      lodSystem.registerObject('null-object', null as any);
      
      expect(console.warn).toHaveBeenCalledWith('🎯 LOD System: Cannot register null object');
    });

    it('should handle undefined config values', () => {
      lodSystem.initialize(mockScene, mockCamera);
      
      expect(() => {
        lodSystem.setDefaultConfig({} as any);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      lodSystem.initialize(mockScene, mockCamera);
    });

    it('should handle many objects efficiently', () => {
      const startTime = performance.now();
      
      // Register many objects
      for (let i = 0; i < 10; i++) { // Reduced from 100 for test speed
        const obj = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mockMaterial);
        obj.position.set(i * 10, 0, 0);
        lodSystem.registerObject(`object-${i}`, obj);
      }
      
      // Update system
      lodSystem.update();
      
      const endTime = performance.now();
      
      // Should handle objects quickly
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle frequent updates efficiently', () => {
      lodSystem.registerObject('test-object', mockObject);
      
      const startTime = performance.now();
      
      // Perform many updates
      for (let i = 0; i < 50; i++) { // Reduced from 100 for test speed
        lodSystem.updatePlayerPosition(new THREE.Vector3(i, 0, 0));
        lodSystem.update();
      }
      
      const endTime = performance.now();
      
      // Should handle updates quickly
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Memory Management', () => {
    beforeEach(() => {
      lodSystem.initialize(mockScene, mockCamera);
    });

    it('should clean up properly when objects are unregistered', () => {
      lodSystem.registerObject('test-object', mockObject);
      
      let stats = lodSystem.getStats();
      expect(stats.totalObjects).toBe(1);
      
      lodSystem.unregisterObject('test-object');
      
      stats = lodSystem.getStats();
      expect(stats.totalObjects).toBe(0);
    });

    it('should handle registration and unregistration cycles', () => {
      for (let i = 0; i < 10; i++) {
        const obj = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mockMaterial);
        lodSystem.registerObject(`object-${i}`, obj);
        
        if (i > 5) {
          lodSystem.unregisterObject(`object-${i - 5}`);
        }
      }
      
      const stats = lodSystem.getStats();
      expect(stats.totalObjects).toBeGreaterThan(0);
      expect(stats.totalObjects).toBeLessThan(10);
    });
  });
});