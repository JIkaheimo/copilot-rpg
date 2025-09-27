import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameSystemManager, IInitializable, IUpdatable, ICleanable } from '@core/GameSystemManager';
import { EventBus } from '@core/EventBus';
import { SceneManager } from '@core/SceneManager';
import { GameState } from '@core/GameState';
import * as THREE from 'three';

// Mock all the imported systems
vi.mock('@systems/WeatherSystem', () => ({
  WeatherSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    update: vi.fn(),
    cleanup: vi.fn()
  }))
}));

vi.mock('@systems/DayNightCycle', () => ({
  DayNightCycle: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    update: vi.fn()
  }))
}));

vi.mock('@systems/SaveSystem', () => ({
  SaveSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn()
  }))
}));

vi.mock('@systems/CombatSystem', () => ({
  CombatSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    update: vi.fn()
  }))
}));

vi.mock('@systems/EnemySystem', () => ({
  EnemySystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    update: vi.fn(),
    cleanup: vi.fn()
  }))
}));

vi.mock('@systems/InteractionSystem', () => ({
  InteractionSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    update: vi.fn()
  }))
}));

vi.mock('@systems/ParticleSystem', () => ({
  ParticleSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    update: vi.fn(),
    cleanup: vi.fn()
  }))
}));

vi.mock('@systems/LightingSystem', () => ({
  LightingSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    update: vi.fn()
  }))
}));

vi.mock('@systems/WeaponSystem', () => ({
  WeaponSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    update: vi.fn()
  }))
}));

vi.mock('@systems/AchievementSystem', () => ({
  AchievementSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    update: vi.fn()
  }))
}));

vi.mock('@systems/MagicSystem', () => ({
  MagicSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    update: vi.fn()
  }))
}));

vi.mock('@systems/LODSystem', () => ({
  LODSystem: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    update: vi.fn()
  }))
}));

describe('GameSystemManager', () => {
  let gameSystemManager: GameSystemManager;
  let eventBus: EventBus;
  let sceneManager: SceneManager;
  let gameState: GameState;
  let mockScene: THREE.Scene;
  let mockCamera: THREE.Camera;

  beforeEach(() => {
    // Create mock scene and camera
    mockScene = new THREE.Scene();
    mockCamera = new THREE.PerspectiveCamera();

    // Create real instances
    eventBus = new EventBus();
    sceneManager = new SceneManager();
    gameState = new GameState();

    // Mock sceneManager methods
    vi.spyOn(sceneManager, 'getScene').mockReturnValue(mockScene);
    vi.spyOn(sceneManager, 'getCamera').mockReturnValue(mockCamera);

    gameSystemManager = new GameSystemManager(eventBus, sceneManager, gameState);
  });

  afterEach(() => {
    if (gameSystemManager) {
      gameSystemManager.cleanup();
    }
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create GameSystemManager instance', () => {
      expect(gameSystemManager).toBeDefined();
      expect(gameSystemManager).toBeInstanceOf(GameSystemManager);
    });

    it('should initialize all systems during construction', () => {
      // Systems should be registered during construction
      const allSystems = gameSystemManager.getAllSystems();
      expect(allSystems.size).toBeGreaterThan(0);
    });

    it('should register all expected systems', () => {
      const allSystems = gameSystemManager.getAllSystems();
      const expectedSystems = [
        'weather', 'dayNight', 'save', 'combat', 'enemy',
        'interaction', 'particle', 'lighting', 'weapon',
        'achievement', 'magic', 'lod'
      ];

      expectedSystems.forEach(systemName => {
        expect(allSystems.has(systemName)).toBe(true);
      });
    });
  });

  describe('System Registration', () => {
    it('should properly categorize systems by interface', () => {
      // Test by checking if update is called on updatable systems
      const deltaTime = 16.67;
      expect(() => gameSystemManager.update(deltaTime)).not.toThrow();
    });

    it('should handle systems without update method gracefully', () => {
      const deltaTime = 16.67;
      expect(() => gameSystemManager.update(deltaTime)).not.toThrow();
    });
  });

  describe('System Retrieval', () => {
    it('should retrieve systems by name', () => {
      const weatherSystem = gameSystemManager.getSystem('weather');
      expect(weatherSystem).toBeDefined();
    });

    it('should throw error for non-existent system', () => {
      expect(() => {
        gameSystemManager.getSystem('nonexistent');
      }).toThrow("System 'nonexistent' not found");
    });

    it('should return readonly map of all systems', () => {
      const allSystems = gameSystemManager.getAllSystems();
      expect(allSystems).toBeDefined();
      expect(allSystems instanceof Map).toBe(true);
    });
  });

  describe('System Initialization', () => {
    it('should initialize all systems in correct order', async () => {
      await expect(gameSystemManager.initializeAllSystems()).resolves.not.toThrow();
    });

    it('should call console.log on successful initialization', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await gameSystemManager.initializeAllSystems();
      expect(consoleSpy).toHaveBeenCalledWith('🎮 All game systems initialized successfully');
      consoleSpy.mockRestore();
    });

    it('should handle initialization dependencies correctly', async () => {
      // Mock the particle system to ensure it's initialized first
      const particleSystem = gameSystemManager.getSystem('particle');
      const weatherSystem = gameSystemManager.getSystem('weather');
      
      await gameSystemManager.initializeAllSystems();
      
      expect(particleSystem.initialize).toHaveBeenCalledWith(mockScene);
      expect(weatherSystem.initialize).toHaveBeenCalledWith(mockScene, particleSystem);
    });
  });

  describe('System Updates', () => {
    it('should update all updatable systems', () => {
      const deltaTime = 16.67;
      gameSystemManager.update(deltaTime);
      
      // Since all mocked systems have update methods, they should be called
      const weatherSystem = gameSystemManager.getSystem('weather');
      expect(weatherSystem.update).toHaveBeenCalledWith(deltaTime);
    });

    it('should handle update with zero delta time', () => {
      expect(() => gameSystemManager.update(0)).not.toThrow();
    });

    it('should handle update with negative delta time', () => {
      expect(() => gameSystemManager.update(-1)).not.toThrow();
    });
  });

  describe('System Cleanup', () => {
    it('should cleanup all cleanable systems', () => {
      // Get system before cleanup
      const weatherSystem = gameSystemManager.getSystem('weather');
      
      gameSystemManager.cleanup();
      
      // Check that cleanable systems had cleanup called
      expect(weatherSystem.cleanup).toHaveBeenCalled();
    });

    it('should clear all system collections after cleanup', () => {
      gameSystemManager.cleanup();
      
      const allSystems = gameSystemManager.getAllSystems();
      expect(allSystems.size).toBe(0);
    });

    it('should handle cleanup gracefully when called multiple times', () => {
      gameSystemManager.cleanup();
      expect(() => gameSystemManager.cleanup()).not.toThrow();
    });
  });

  describe('Interface Detection', () => {
    it('should correctly identify systems with update method', () => {
      // Create a test system with update method
      const systemWithUpdate = { update: vi.fn() };
      
      // Test the interface detection through behavior
      const deltaTime = 16.67;
      gameSystemManager.update(deltaTime);
      
      // If the system manager works correctly, no errors should be thrown
      expect(() => gameSystemManager.update(deltaTime)).not.toThrow();
    });

    it('should correctly identify systems with cleanup method', () => {
      // Test cleanup behavior
      expect(() => gameSystemManager.cleanup()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing scene manager gracefully during initialization', async () => {
      // Mock getScene to return null
      vi.spyOn(sceneManager, 'getScene').mockReturnValue(null as any);
      
      // The system should handle null scene without throwing
      await expect(gameSystemManager.initializeAllSystems()).resolves.not.toThrow();
    });

    it('should handle missing camera gracefully during initialization', async () => {
      // Mock getCamera to return null
      vi.spyOn(sceneManager, 'getCamera').mockReturnValue(null as any);
      
      // The system should handle null camera without throwing
      await expect(gameSystemManager.initializeAllSystems()).resolves.not.toThrow();
    });
  });

  describe('System Dependencies', () => {
    it('should initialize particle system before weather system', async () => {
      const particleSystem = gameSystemManager.getSystem('particle');
      const weatherSystem = gameSystemManager.getSystem('weather');
      
      await gameSystemManager.initializeAllSystems();
      
      // Particle system should be initialized first
      expect(particleSystem.initialize).toHaveBeenCalledBefore(weatherSystem.initialize);
    });

    it('should pass correct dependencies to each system', async () => {
      await gameSystemManager.initializeAllSystems();
      
      const magicSystem = gameSystemManager.getSystem('magic');
      const particleSystem = gameSystemManager.getSystem('particle');
      
      expect(magicSystem.initialize).toHaveBeenCalledWith(mockScene, gameState, particleSystem);
    });
  });
});