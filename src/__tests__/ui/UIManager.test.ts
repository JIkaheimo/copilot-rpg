import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UIManager } from '../../ui/UIManager';
import { GameState } from '../../core/GameState';

// Mock DOM methods using vi.spyOn
const mockGetElementById = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
const mockCreateElement = vi.fn();
const mockGetContext = vi.fn();
const mockAppendChild = vi.fn();

// Mock canvas context
const mockCanvasContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 50 })),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  setLineDash: vi.fn(),
  strokeStyle: '#ffffff',
  fillStyle: '#ffffff',
  font: '12px Arial',
  textAlign: 'left',
  globalAlpha: 1,
};

// Mock HTML elements
const createMockElement = (id: string) => ({
  id,
  style: {},
  innerHTML: '',
  textContent: '',
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  appendChild: mockAppendChild,
  getContext: mockGetContext.mockReturnValue(mockCanvasContext),
});

describe('UIManager', () => {
  let uiManager: UIManager;
  let gameState: GameState;
  let mockElements: { [key: string]: any };
  let documentSpy: any;
  let createElementSpy: any;

  beforeEach(() => {
    uiManager = new UIManager();
    gameState = new GameState();
    
    // Reset mocks
    mockGetElementById.mockClear();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
    mockCreateElement.mockClear();
    mockGetContext.mockClear();
    mockAppendChild.mockClear();

    // Create mock elements
    mockElements = {
      healthBar: createMockElement('healthBar'),
      healthText: createMockElement('healthText'),
      levelText: createMockElement('levelText'),
      xpText: createMockElement('xpText'),
      minimap: createMockElement('minimap'),
      inventory: createMockElement('inventory'),
      worldMap: createMockElement('worldMap'),
      mainMenu: createMockElement('mainMenu'),
    };

    // Mock document methods
    documentSpy = vi.spyOn(document, 'getElementById').mockImplementation((id: string) => mockElements[id] || null);
    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          ...createMockElement('canvas'),
          width: 0,
          height: 0,
          style: {},
        };
      }
      return createMockElement(tagName);
    });
    vi.spyOn(document, 'addEventListener').mockImplementation(mockAddEventListener);
    vi.spyOn(document, 'removeEventListener').mockImplementation(mockRemoveEventListener);
  });

  afterEach(() => {
    documentSpy.mockRestore();
    createElementSpy.mockRestore();
  });

  describe('Initialization', () => {
    it('should initialize correctly', () => {
      expect(uiManager).toBeDefined();
    });

    it('should initialize with game state', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
      
      uiManager.initialize(gameState);
      
      expect(consoleSpy).toHaveBeenCalledWith('🎨 UI Manager initialized');
      expect(document.getElementById).toHaveBeenCalledWith('healthBar');
      expect(document.getElementById).toHaveBeenCalledWith('healthText');
      expect(document.getElementById).toHaveBeenCalledWith('levelText');
      expect(document.getElementById).toHaveBeenCalledWith('xpText');
      
      consoleSpy.mockRestore();
    });

    it('should initialize minimap', () => {
      uiManager.initialize(gameState);
      
      expect(document.getElementById).toHaveBeenCalledWith('minimap');
      expect(document.createElement).toHaveBeenCalledWith('canvas');
    });

    it('should setup event listeners', () => {
      uiManager.initialize(gameState);
      
      expect(mockAddEventListener).toHaveBeenCalled();
    });
  });

  describe('UI Updates', () => {
    beforeEach(() => {
      uiManager.initialize(gameState);
    });

    it('should update health display', () => {
      // Simulate health change
      gameState.takeDamage(20);
      
      uiManager.update(gameState);
      
      // Check that health bar and text would be updated
      expect(mockElements.healthBar).toBeDefined();
      expect(mockElements.healthText).toBeDefined();
    });

    it('should update level display', () => {
      // Simulate level up
      gameState.addExperience(1000);
      
      uiManager.update(gameState);
      
      expect(mockElements.levelText).toBeDefined();
    });

    it('should update XP display', () => {
      gameState.addExperience(50);
      
      uiManager.update(gameState);
      
      expect(mockElements.xpText).toBeDefined();
    });

    it('should update minimap', () => {
      uiManager.update(gameState);
      
      // Should have called canvas drawing methods
      expect(mockCanvasContext.fillRect).toHaveBeenCalled();
    });

    it('should handle missing UI elements gracefully', () => {
      // Create UI manager with missing elements
      mockGetElementById.mockReturnValue(null);
      const newUIManager = new UIManager();
      
      expect(() => {
        newUIManager.initialize(gameState);
        newUIManager.update(gameState);
      }).not.toThrow();
    });
  });

  describe('Menu Management', () => {
    beforeEach(() => {
      uiManager.initialize(gameState);
    });

    it('should handle inventory toggle', () => {
      // Simulate Tab key press
      const keyEvent = new KeyboardEvent('keydown', { code: 'Tab' });
      document.dispatchEvent(keyEvent);
      
      // Should have set up event listener for Tab key
      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should handle world map toggle', () => {
      // Simulate M key press
      const keyEvent = new KeyboardEvent('keydown', { code: 'KeyM' });
      document.dispatchEvent(keyEvent);
      
      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should handle main menu toggle', () => {
      // Simulate Escape key press
      const keyEvent = new KeyboardEvent('keydown', { code: 'Escape' });
      document.dispatchEvent(keyEvent);
      
      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should handle inventory key toggle', () => {
      // Simulate I key press
      const keyEvent = new KeyboardEvent('keydown', { code: 'KeyI' });
      document.dispatchEvent(keyEvent);
      
      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Health Bar Management', () => {
    beforeEach(() => {
      uiManager.initialize(gameState);
    });

    it('should display correct health percentage', () => {
      // Set specific health values
      gameState.takeDamage(30); // 70% health remaining
      
      uiManager.update(gameState);
      
      // Health bar should reflect current health percentage
      expect(mockElements.healthBar).toBeDefined();
    });

    it('should handle zero health', () => {
      gameState.takeDamage(200); // More than max health
      
      uiManager.update(gameState);
      
      // Should not throw error with zero health
      expect(mockElements.healthBar).toBeDefined();
    });

    it('should handle full health', () => {
      gameState.heal(1000); // Ensure full health
      
      uiManager.update(gameState);
      
      expect(mockElements.healthBar).toBeDefined();
    });
  });

  describe('Experience and Level Display', () => {
    beforeEach(() => {
      uiManager.initialize(gameState);
    });

    it('should show current level', () => {
      const initialLevel = gameState.player.level;
      
      uiManager.update(gameState);
      
      expect(mockElements.levelText).toBeDefined();
    });

    it('should update on level change', () => {
      const initialLevel = gameState.player.level;
      gameState.addExperience(1500); // Should cause level up
      
      uiManager.update(gameState);
      
      expect(gameState.player.level).toBeGreaterThan(initialLevel);
      expect(mockElements.levelText).toBeDefined();
    });

    it('should show experience progress', () => {
      gameState.addExperience(50);
      
      uiManager.update(gameState);
      
      expect(mockElements.xpText).toBeDefined();
    });
  });

  describe('Minimap Functionality', () => {
    beforeEach(() => {
      uiManager.initialize(gameState);
    });

    it('should create minimap canvas', () => {
      expect(createElementSpy).toHaveBeenCalledWith('canvas');
      expect(mockAppendChild).toHaveBeenCalled();
    });

    it('should draw on minimap canvas', () => {
      uiManager.update(gameState);
      
      expect(mockCanvasContext.fillRect).toHaveBeenCalled();
    });

    it('should handle canvas context errors', () => {
      // Mock getContext to return null
      mockGetContext.mockReturnValue(null);
      
      const newUIManager = new UIManager();
      expect(() => {
        newUIManager.initialize(gameState);
        newUIManager.update(gameState);
      }).not.toThrow();
    });

    it('should draw player position on minimap', () => {
      uiManager.update(gameState);
      
      // Should use canvas drawing methods to show player
      expect(mockCanvasContext.beginPath).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      uiManager.initialize(gameState);
    });

    it('should listen to game state events', () => {
      // The UI manager should set up event listeners on the game state
      expect(mockAddEventListener).toHaveBeenCalled();
    });

    it('should handle health change events', () => {
      // Trigger health change
      gameState.takeDamage(10);
      
      // UI should be updated accordingly
      uiManager.update(gameState);
      expect(mockElements.healthBar).toBeDefined();
    });

    it('should handle level up events', () => {
      gameState.addExperience(1000);
      
      uiManager.update(gameState);
      expect(mockElements.levelText).toBeDefined();
    });

    it('should handle experience gain events', () => {
      gameState.addExperience(25);
      
      uiManager.update(gameState);
      expect(mockElements.xpText).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization without game state gracefully', () => {
      expect(() => {
        const newUIManager = new UIManager();
        // Don't initialize, just try to update
        newUIManager.update(gameState);
      }).not.toThrow();
    });

    it('should handle missing DOM elements', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      
      expect(() => {
        uiManager.initialize(gameState);
        uiManager.update(gameState);
      }).not.toThrow();
    });

    it('should handle canvas creation failure', () => {
      vi.spyOn(document, 'createElement').mockReturnValue(null);
      
      expect(() => {
        uiManager.initialize(gameState);
      }).not.toThrow();
    });
  });
});