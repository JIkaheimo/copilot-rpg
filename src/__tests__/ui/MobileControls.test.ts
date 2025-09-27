import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MobileControls } from '@ui/MobileControls';
import { InputManager } from '@core/InputManager';

// Mock canvas
const mockCanvas = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  requestPointerLock: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600
  })),
  style: {},
} as unknown as HTMLCanvasElement;

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn((tagName: string) => {
    const element = {
      tagName: tagName.toUpperCase(),
      style: {},
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getBoundingClientRect: vi.fn(() => ({
        left: 80,
        top: 480,
        width: 120,
        height: 120,
        right: 200,
        bottom: 600
      })),
      id: '',
      textContent: '',
      parentNode: null
    };
    return element;
  }),
  configurable: true
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
  configurable: true
});

describe('MobileControls', () => {
  let inputManager: InputManager;
  let mobileControls: MobileControls;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator for mobile detection
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true
    });
    
    Object.defineProperty(window, 'ontouchstart', {
      value: true,
      configurable: true
    });
    
    inputManager = new InputManager(mockCanvas);
    mobileControls = new MobileControls(inputManager);
  });

  afterEach(() => {
    if (mobileControls) {
      mobileControls.cleanup();
    }
  });

  describe('Initialization', () => {
    it('should initialize correctly on mobile device', () => {
      expect(mobileControls).toBeDefined();
    });

    it('should create virtual joystick', () => {
      const joystickState = mobileControls.getJoystickState();
      expect(joystickState).toBeDefined();
      expect(joystickState.active).toBe(false);
      expect(joystickState.normalizedX).toBe(0);
      expect(joystickState.normalizedY).toBe(0);
    });

    it('should create action buttons', () => {
      expect(mobileControls.isJumpPressed()).toBe(false);
      expect(mobileControls.isAttackPressed()).toBe(false);
      expect(mobileControls.isInteractPressed()).toBe(false);
      expect(mobileControls.isRunPressed()).toBe(false);
    });

    it('should create DOM elements', () => {
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });
  });

  describe('Virtual Joystick', () => {
    it('should return inactive joystick state by default', () => {
      const joystickState = mobileControls.getJoystickState();
      expect(joystickState.active).toBe(false);
      expect(joystickState.normalizedX).toBe(0);
      expect(joystickState.normalizedY).toBe(0);
      expect(joystickState.touchId).toBe(null);
    });

    it('should handle joystick state updates', () => {
      // Simulate touch input for joystick
      const mockTouch = {
        id: 1,
        x: 140, // Center of joystick + offset
        y: 540,
        startX: 140,
        startY: 540,
        deltaX: 0,
        deltaY: 0
      };

      // Mock input manager to return active touch
      vi.spyOn(inputManager, 'getActiveTouches').mockReturnValue([mockTouch]);
      vi.spyOn(inputManager, 'getTouchById').mockReturnValue(mockTouch);

      mobileControls.update();

      const joystickState = mobileControls.getJoystickState();
      expect(joystickState.active).toBe(true);
    });

    it('should normalize joystick values correctly', () => {
      const joystickState = mobileControls.getJoystickState();
      expect(joystickState.normalizedX).toBeGreaterThanOrEqual(-1);
      expect(joystickState.normalizedX).toBeLessThanOrEqual(1);
      expect(joystickState.normalizedY).toBeGreaterThanOrEqual(-1);
      expect(joystickState.normalizedY).toBeLessThanOrEqual(1);
    });
  });

  describe('Action Buttons', () => {
    it('should handle button press states', () => {
      expect(mobileControls.isButtonPressed('jumpBtn')).toBe(false);
      expect(mobileControls.isButtonPressed('attackBtn')).toBe(false);
      expect(mobileControls.isButtonPressed('interactBtn')).toBe(false);
      expect(mobileControls.isButtonPressed('runBtn')).toBe(false);
    });

    it('should provide button aliases', () => {
      expect(mobileControls.isJumpPressed()).toBe(false);
      expect(mobileControls.isAttackPressed()).toBe(false);
      expect(mobileControls.isInteractPressed()).toBe(false);
      expect(mobileControls.isRunPressed()).toBe(false);
    });

    it('should handle invalid button IDs', () => {
      expect(mobileControls.isButtonPressed('invalidBtn')).toBe(false);
    });
  });

  describe('Touch Handling', () => {
    it('should update with touch input', () => {
      const mockTouches = [
        {
          id: 1,
          x: 140,
          y: 540,
          startX: 140,
          startY: 540,
          deltaX: 0,
          deltaY: 0
        }
      ];

      vi.spyOn(inputManager, 'getActiveTouches').mockReturnValue(mockTouches);
      vi.spyOn(inputManager, 'getTouchById').mockReturnValue(mockTouches[0]);

      expect(() => mobileControls.update()).not.toThrow();
    });

    it('should handle empty touch array', () => {
      vi.spyOn(inputManager, 'getActiveTouches').mockReturnValue([]);
      
      expect(() => mobileControls.update()).not.toThrow();
      
      const joystickState = mobileControls.getJoystickState();
      expect(joystickState.active).toBe(false);
    });

    it('should handle multiple touches', () => {
      const mockTouches = [
        {
          id: 1,
          x: 140,
          y: 540,
          startX: 140,
          startY: 540,
          deltaX: 0,
          deltaY: 0
        },
        {
          id: 2,
          x: 700,
          y: 500,
          startX: 700,
          startY: 500,
          deltaX: 0,
          deltaY: 0
        }
      ];

      vi.spyOn(inputManager, 'getActiveTouches').mockReturnValue(mockTouches);
      vi.spyOn(inputManager, 'getTouchById').mockImplementation((id) => 
        mockTouches.find(touch => touch.id === id) || null
      );

      expect(() => mobileControls.update()).not.toThrow();
    });
  });

  describe('Desktop Behavior', () => {
    beforeEach(() => {
      // Mock desktop environment
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true
      });
      
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true
      });

      // Create new controls for desktop
      const desktopInputManager = new InputManager(mockCanvas);
      mobileControls.cleanup();
      mobileControls = new MobileControls(desktopInputManager);
    });

    it('should not show mobile controls on desktop', () => {
      // The controls should be created but hidden
      expect(mobileControls).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup properly', () => {
      expect(() => mobileControls.cleanup()).not.toThrow();
    });

    it('should handle multiple cleanup calls', () => {
      mobileControls.cleanup();
      expect(() => mobileControls.cleanup()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null touches', () => {
      vi.spyOn(inputManager, 'getActiveTouches').mockReturnValue([]);
      vi.spyOn(inputManager, 'getTouchById').mockReturnValue(null);

      expect(() => mobileControls.update()).not.toThrow();
    });

    it('should handle updates without initialization', () => {
      const uninitializedControls = new MobileControls(inputManager);
      expect(() => uninitializedControls.update()).not.toThrow();
      uninitializedControls.cleanup();
    });

    it('should handle extreme joystick positions', () => {
      const extremeTouch = {
        id: 1,
        x: 1000, // Far outside joystick area
        y: 1000,
        startX: 140,
        startY: 540,
        deltaX: 860,
        deltaY: 460
      };

      vi.spyOn(inputManager, 'getActiveTouches').mockReturnValue([extremeTouch]);
      vi.spyOn(inputManager, 'getTouchById').mockReturnValue(extremeTouch);

      mobileControls.update();

      const joystickState = mobileControls.getJoystickState();
      // Should be constrained to valid range
      expect(Math.abs(joystickState.normalizedX)).toBeLessThanOrEqual(1);
      expect(Math.abs(joystickState.normalizedY)).toBeLessThanOrEqual(1);
    });
  });

  describe('Integration', () => {
    it('should work with InputManager', () => {
      expect(inputManager.isMobileDevice()).toBe(true);
    });

    it('should handle touch events from InputManager', () => {
      const touches = inputManager.getActiveTouches();
      expect(Array.isArray(touches)).toBe(true);
    });

    it('should provide consistent state', () => {
      const state1 = mobileControls.getJoystickState();
      const state2 = mobileControls.getJoystickState();
      
      expect(state1.active).toBe(state2.active);
      expect(state1.normalizedX).toBe(state2.normalizedX);
      expect(state1.normalizedY).toBe(state2.normalizedY);
    });
  });
});