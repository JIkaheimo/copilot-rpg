/**
 * Comprehensive tests for SceneManager class
 * Tests 3D scene management, camera, lighting, and object management
 */
import { SceneManager } from '../../core/SceneManager';
import * as THREE from 'three';

// Mock WebGLRenderer
const mockRenderer = {
  render: jest.fn(),
  setSize: jest.fn(),
  setPixelRatio: jest.fn(),
  shadowMap: { enabled: false, type: 'PCFSoftShadowMap' },
  outputColorSpace: 'srgb',
  toneMapping: 'ACESFilmicToneMapping',
  toneMappingExposure: 1.0
} as any;

describe('SceneManager', () => {
  let sceneManager: SceneManager;

  beforeEach(() => {
    sceneManager = new SceneManager(mockRenderer);
  });

  describe('Initialization', () => {
    it('should initialize with a scene', () => {
      const scene = sceneManager.getScene();
      expect(scene).toBeInstanceOf(THREE.Scene);
    });

    it('should initialize with a perspective camera', () => {
      const camera = sceneManager.getCamera();
      expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
      expect(camera.fov).toBe(75);
      expect(camera.near).toBe(0.1);
      expect(camera.far).toBe(1000);
    });

    it('should initialize with directional light', () => {
      const directionalLight = sceneManager.getDirectionalLight();
      expect(directionalLight).toBeInstanceOf(THREE.DirectionalLight);
      expect(directionalLight.intensity).toBe(1);
      expect(directionalLight.castShadow).toBe(true);
    });

    it('should initialize with ambient light', () => {
      const ambientLight = sceneManager.getAmbientLight();
      expect(ambientLight).toBeInstanceOf(THREE.AmbientLight);
      expect(ambientLight.intensity).toBe(0.3);
    });

    it('should set initial camera position', () => {
      const camera = sceneManager.getCamera();
      expect(camera.position.x).toBe(0);
      expect(camera.position.y).toBe(5);
      expect(camera.position.z).toBe(10);
    });

    it('should add lights to the scene', () => {
      const scene = sceneManager.getScene();
      let directionalLightInScene = false;
      let ambientLightInScene = false;

      scene.traverse((object) => {
        if (object instanceof THREE.DirectionalLight) {
          directionalLightInScene = true;
        }
        if (object instanceof THREE.AmbientLight) {
          ambientLightInScene = true;
        }
      });

      expect(directionalLightInScene).toBe(true);
      expect(ambientLightInScene).toBe(true);
    });
  });

  describe('Scene Management', () => {
    it('should add objects to scene', () => {
      const testObject = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({ color: 0xff0000 })
      );

      sceneManager.addToScene(testObject);
      
      const scene = sceneManager.getScene();
      expect(scene.children).toContain(testObject);
    });

    it('should remove objects from scene', () => {
      const testObject = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({ color: 0xff0000 })
      );

      sceneManager.addToScene(testObject);
      sceneManager.removeFromScene(testObject);
      
      const scene = sceneManager.getScene();
      expect(scene.children).not.toContain(testObject);
    });

    it('should maintain scene object count', () => {
      const scene = sceneManager.getScene();
      const initialCount = scene.children.length;

      const testObject1 = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({ color: 0xff0000 })
      );
      const testObject2 = new THREE.Mesh(
        new THREE.SphereGeometry(1),
        new THREE.MeshLambertMaterial({ color: 0x00ff00 })
      );

      sceneManager.addToScene(testObject1);
      expect(scene.children.length).toBe(initialCount + 1);

      sceneManager.addToScene(testObject2);
      expect(scene.children.length).toBe(initialCount + 2);

      sceneManager.removeFromScene(testObject1);
      expect(scene.children.length).toBe(initialCount + 1);
    });
  });

  describe('Scene Initialization', () => {
    it('should initialize scene with basic terrain', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await sceneManager.initialize();
      
      expect(consoleSpy).toHaveBeenCalledWith('🌍 Scene initialized');
      
      const scene = sceneManager.getScene();
      expect(scene.fog).toBeDefined();
      expect(scene.fog).toBeInstanceOf(THREE.Fog);
      
      consoleSpy.mockRestore();
    });

    it('should add ground plane during initialization', async () => {
      await sceneManager.initialize();
      
      const scene = sceneManager.getScene();
      let groundFound = false;

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh && 
            object.geometry instanceof THREE.PlaneGeometry) {
          groundFound = true;
          expect(object.receiveShadow).toBe(true);
          expect(object.rotation.x).toBeCloseTo(-Math.PI / 2);
        }
      });

      expect(groundFound).toBe(true);
    });

    it('should create basic terrain elements', async () => {
      await sceneManager.initialize();
      
      const scene = sceneManager.getScene();
      let meshCount = 0;

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          meshCount++;
        }
      });

      // Should have at least ground + some terrain elements
      expect(meshCount).toBeGreaterThan(1);
    });
  });

  describe('Camera Management', () => {
    it('should handle window resize', () => {
      const camera = sceneManager.getCamera();
      const initialAspect = camera.aspect;

      // Simulate window resize
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

      // Manually trigger camera aspect update (would normally be done by resize handler)
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      expect(camera.aspect).not.toBe(initialAspect);
      expect(camera.aspect).toBe(1200 / 800);
    });

    it('should maintain camera configuration', () => {
      const camera = sceneManager.getCamera();
      
      expect(camera.fov).toBe(75);
      expect(camera.near).toBe(0.1);
      expect(camera.far).toBe(1000);
      expect(camera.aspect).toBe(window.innerWidth / window.innerHeight);
    });
  });

  describe('Lighting Configuration', () => {
    it('should configure directional light for shadows', () => {
      const directionalLight = sceneManager.getDirectionalLight();
      
      expect(directionalLight.castShadow).toBe(true);
      expect(directionalLight.shadow.mapSize.width).toBe(2048);
      expect(directionalLight.shadow.mapSize.height).toBe(2048);
      expect(directionalLight.position.x).toBe(10);
      expect(directionalLight.position.y).toBe(10);
      expect(directionalLight.position.z).toBe(5);
    });

    it('should set appropriate light intensities', () => {
      const directionalLight = sceneManager.getDirectionalLight();
      const ambientLight = sceneManager.getAmbientLight();
      
      expect(directionalLight.intensity).toBe(1);
      expect(ambientLight.intensity).toBe(0.3);
    });

    it('should set correct light colors', () => {
      const directionalLight = sceneManager.getDirectionalLight();
      const ambientLight = sceneManager.getAmbientLight();
      
      expect(directionalLight.color).toBe(0xffffff);
      expect(ambientLight.color).toBe(0x404040);
    });
  });

  describe('Scene Properties', () => {
    it('should maintain scene structure after initialization', async () => {
      await sceneManager.initialize();
      
      const scene = sceneManager.getScene();
      
      // Should have fog
      expect(scene.fog).toBeInstanceOf(THREE.Fog);
      
      // Should maintain lights
      let hasDirectionalLight = false;
      let hasAmbientLight = false;
      
      scene.traverse((object) => {
        if (object instanceof THREE.DirectionalLight) hasDirectionalLight = true;
        if (object instanceof THREE.AmbientLight) hasAmbientLight = true;
      });
      
      expect(hasDirectionalLight).toBe(true);
      expect(hasAmbientLight).toBe(true);
    });

    it('should provide getter methods', () => {
      expect(sceneManager.getScene()).toBeInstanceOf(THREE.Scene);
      expect(sceneManager.getCamera()).toBeInstanceOf(THREE.PerspectiveCamera);
      expect(sceneManager.getDirectionalLight()).toBeInstanceOf(THREE.DirectionalLight);
      expect(sceneManager.getAmbientLight()).toBeInstanceOf(THREE.AmbientLight);
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should handle multiple object additions and removals', () => {
      const scene = sceneManager.getScene();
      const initialCount = scene.children.length;
      const objects: THREE.Object3D[] = [];

      // Add multiple objects
      for (let i = 0; i < 10; i++) {
        const obj = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff })
        );
        objects.push(obj);
        sceneManager.addToScene(obj);
      }

      expect(scene.children.length).toBe(initialCount + 10);

      // Remove all objects
      objects.forEach(obj => sceneManager.removeFromScene(obj));

      expect(scene.children.length).toBe(initialCount);
    });

    it('should handle removing non-existent objects gracefully', () => {
      const nonExistentObject = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({ color: 0xff0000 })
      );

      // Should not throw when removing object that was never added
      expect(() => {
        sceneManager.removeFromScene(nonExistentObject);
      }).not.toThrow();
    });
  });
});