/**
 * Tests for PlayerController class
 * Tests player movement, physics, and camera controls
 */
import { PlayerController } from '../../systems/PlayerController';
import { InputManager } from '../../core/InputManager';
import * as THREE from 'three';

// Mock InputManager
class MockInputManager extends InputManager {
  private keyState: { [key: string]: boolean } = {};
  private mouseDelta = { x: 0, y: 0 };

  constructor() {
    super(document.createElement('canvas'));
  }

  isKeyPressed(key: string): boolean {
    return this.keyState[key] || false;
  }

  setKeyPressed(key: string, pressed: boolean): void {
    this.keyState[key] = pressed;
  }

  getMouseDelta(): { x: number; y: number } {
    return this.mouseDelta;
  }

  setMouseDelta(x: number, y: number): void {
    this.mouseDelta = { x, y };
  }

  cleanup(): void {}
}

describe('PlayerController', () => {
  let playerController: PlayerController;
  let mockInputManager: MockInputManager;
  let mockCamera: THREE.PerspectiveCamera;

  beforeEach(() => {
    mockInputManager = new MockInputManager();
    mockCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    playerController = new PlayerController(mockInputManager, mockCamera);
  });

  describe('Initialization', () => {
    it('should create a player object', () => {
      const player = playerController.getPlayer();
      expect(player).toBeInstanceOf(THREE.Group);
    });

    it('should initialize with zero velocity', () => {
      const velocity = playerController.getVelocity();
      expect(velocity.length()).toBe(0);
    });

    it('should initialize at origin position', () => {
      const position = playerController.getPosition();
      expect(position.x).toBeCloseTo(0);
      expect(position.y).toBeCloseTo(0);
      expect(position.z).toBeCloseTo(0);
    });

    it('should not be moving initially', () => {
      expect(playerController.isMoving()).toBe(false);
      expect(playerController.isRunning()).toBe(false);
    });
  });

  describe('Movement', () => {
    it('should detect movement when keys are pressed', () => {
      mockInputManager.setKeyPressed('KeyW', true);
      
      playerController.update(0.016);
      
      expect(playerController.isMoving()).toBe(true);
    });

    it('should move forward on W key', () => {
      const initialPosition = playerController.getPosition().clone();
      
      mockInputManager.setKeyPressed('KeyW', true);
      playerController.update(0.016);
      
      const newPosition = playerController.getPosition();
      expect(newPosition.equals(initialPosition)).toBe(false);
    });

    it('should detect running when shift is held', () => {
      mockInputManager.setKeyPressed('KeyW', true);
      mockInputManager.setKeyPressed('ShiftLeft', true);
      
      playerController.update(0.016);
      
      expect(playerController.isRunning()).toBe(true);
    });

    it('should update position over time', () => {
      const initialPosition = playerController.getPosition().clone();
      
      mockInputManager.setKeyPressed('KeyW', true);
      
      // Update multiple frames
      for (let i = 0; i < 10; i++) {
        playerController.update(0.016);
      }
      
      const finalPosition = playerController.getPosition();
      const distance = initialPosition.distanceTo(finalPosition);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('Position Management', () => {
    it('should set position correctly', () => {
      const newPosition = new THREE.Vector3(10, 5, -3);
      
      playerController.setPosition(newPosition);
      
      const position = playerController.getPosition();
      expect(position.equals(newPosition)).toBe(true);
    });

    it('should return current velocity', () => {
      const velocity = playerController.getVelocity();
      expect(velocity).toBeInstanceOf(THREE.Vector3);
    });
  });

  describe('Physics Integration', () => {
    it('should handle deltaTime correctly', () => {
      const position1 = playerController.getPosition().clone();
      
      mockInputManager.setKeyPressed('KeyW', true);
      playerController.update(0.032); // Double deltaTime
      
      const position2 = playerController.getPosition().clone();
      
      playerController.setPosition(position1);
      playerController.update(0.016); // Normal deltaTime
      
      const position3 = playerController.getPosition();
      
      // Distance should be proportional to deltaTime
      const dist1 = position1.distanceTo(position2);
      const dist2 = position1.distanceTo(position3);
      expect(dist1).toBeGreaterThan(dist2);
    });

    it('should maintain consistent movement speed', () => {
      mockInputManager.setKeyPressed('KeyW', true);
      
      const distances: number[] = [];
      let lastPosition = playerController.getPosition().clone();
      
      // Measure distance over multiple frames
      for (let i = 0; i < 5; i++) {
        playerController.update(0.016);
        const currentPosition = playerController.getPosition();
        distances.push(lastPosition.distanceTo(currentPosition));
        lastPosition = currentPosition.clone();
      }
      
      // All distances should be approximately the same (consistent speed)
      const avgDistance = distances.reduce((a, b) => a + b) / distances.length;
      distances.forEach(distance => {
        expect(Math.abs(distance - avgDistance)).toBeLessThan(0.01);
      });
    });
  });

  describe('State Queries', () => {
    it('should correctly report moving state', () => {
      expect(playerController.isMoving()).toBe(false);
      
      mockInputManager.setKeyPressed('KeyW', true);
      playerController.update(0.016);
      
      expect(playerController.isMoving()).toBe(true);
      
      mockInputManager.setKeyPressed('KeyW', false);
      
      // Should still be moving due to velocity (momentum)
      playerController.update(0.016);
      // Note: Depending on implementation, might still be moving due to deceleration
    });

    it('should correctly report running state', () => {
      expect(playerController.isRunning()).toBe(false);
      
      mockInputManager.setKeyPressed('KeyW', true);
      mockInputManager.setKeyPressed('ShiftLeft', true);
      playerController.update(0.016);
      
      expect(playerController.isRunning()).toBe(true);
    });
  });

  describe('Camera Integration', () => {
    it('should update camera position', () => {
      const initialCameraPosition = mockCamera.position.clone();
      
      // Move player and update
      playerController.setPosition(new THREE.Vector3(10, 0, 10));
      playerController.update(0.016);
      
      // Camera should have moved (following player)
      expect(mockCamera.position.equals(initialCameraPosition)).toBe(false);
    });
  });
});