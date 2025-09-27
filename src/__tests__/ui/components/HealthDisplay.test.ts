import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HealthDisplay, IUIComponent } from '@ui/components/HealthDisplay';
import { GameState } from '@core/GameState';

describe('HealthDisplay', () => {
  let healthDisplay: HealthDisplay;
  let gameState: GameState;
  let mockHealthBar: HTMLElement;
  let mockHealthText: HTMLElement;

  beforeEach(() => {
    // Create mock DOM elements
    mockHealthBar = {
      style: { width: '' },
      id: 'healthBar'
    } as HTMLElement;
    
    mockHealthText = {
      textContent: '',
      id: 'healthText'
    } as HTMLElement;

    // Mock document.getElementById
    vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'healthBar') return mockHealthBar;
      if (id === 'healthText') return mockHealthText;
      return null;
    });

    // Mock console.warn
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    healthDisplay = new HealthDisplay();
    gameState = new GameState();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Interface Compliance', () => {
    it('should implement IUIComponent interface', () => {
      expect(healthDisplay).toHaveProperty('initialize');
      expect(healthDisplay).toHaveProperty('update');
      expect(typeof healthDisplay.initialize).toBe('function');
      expect(typeof healthDisplay.update).toBe('function');
    });
  });

  describe('Initialization', () => {
    it('should create HealthDisplay instance', () => {
      expect(healthDisplay).toBeDefined();
      expect(healthDisplay).toBeInstanceOf(HealthDisplay);
    });

    it('should initialize with DOM elements', () => {
      healthDisplay.initialize();
      
      expect(document.getElementById).toHaveBeenCalledWith('healthBar');
      expect(document.getElementById).toHaveBeenCalledWith('healthText');
    });

    it('should warn when health bar element not found', () => {
      vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === 'healthText') return mockHealthText;
        return null; // healthBar not found
      });

      healthDisplay.initialize();
      
      expect(console.warn).toHaveBeenCalledWith('🎨 Health display elements not found in DOM');
    });

    it('should warn when health text element not found', () => {
      vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === 'healthBar') return mockHealthBar;
        return null; // healthText not found
      });

      healthDisplay.initialize();
      
      expect(console.warn).toHaveBeenCalledWith('🎨 Health display elements not found in DOM');
    });

    it('should warn when both elements not found', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null);

      healthDisplay.initialize();
      
      expect(console.warn).toHaveBeenCalledWith('🎨 Health display elements not found in DOM');
    });
  });

  describe('Health Updates', () => {
    beforeEach(() => {
      healthDisplay.initialize();
    });

    it('should update health bar width based on health percentage', () => {
      // Set initial health values
      gameState.player.health = 75;
      gameState.player.maxHealth = 100;

      healthDisplay.update(gameState);

      expect(mockHealthBar.style.width).toBe('75%');
    });

    it('should update health text with current and max health', () => {
      gameState.player.health = 85.7;
      gameState.player.maxHealth = 100;

      healthDisplay.update(gameState);

      expect(mockHealthText.textContent).toBe('86/100');
    });

    it('should handle zero health', () => {
      gameState.player.health = 0;
      gameState.player.maxHealth = 100;

      healthDisplay.update(gameState);

      expect(mockHealthBar.style.width).toBe('0%');
      expect(mockHealthText.textContent).toBe('0/100');
    });

    it('should handle full health', () => {
      gameState.player.health = 100;
      gameState.player.maxHealth = 100;

      healthDisplay.update(gameState);

      expect(mockHealthBar.style.width).toBe('100%');
      expect(mockHealthText.textContent).toBe('100/100');
    });

    it('should handle fractional health values', () => {
      gameState.player.health = 33.33;
      gameState.player.maxHealth = 100;

      healthDisplay.update(gameState);

      expect(mockHealthBar.style.width).toBe('33.33%');
      expect(mockHealthText.textContent).toBe('33/100');
    });

    it('should handle non-standard max health values', () => {
      gameState.player.health = 150;
      gameState.player.maxHealth = 200;

      healthDisplay.update(gameState);

      expect(mockHealthBar.style.width).toBe('75%');
      expect(mockHealthText.textContent).toBe('150/200');
    });
  });

  describe('Error Handling', () => {
    it('should handle null game state gracefully', () => {
      healthDisplay.initialize();
      
      expect(() => {
        healthDisplay.update(null as any);
      }).not.toThrow();
    });

    it('should handle undefined game state gracefully', () => {
      healthDisplay.initialize();
      
      expect(() => {
        healthDisplay.update(undefined as any);
      }).not.toThrow();
    });

    it('should handle missing DOM elements during update', () => {
      // Initialize with elements, then simulate them being removed
      healthDisplay.initialize();
      
      // Simulate missing elements
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      const newHealthDisplay = new HealthDisplay();
      newHealthDisplay.initialize();

      expect(() => {
        newHealthDisplay.update(gameState);
      }).not.toThrow();
    });

    it('should handle update without initialization', () => {
      // Don't call initialize
      expect(() => {
        healthDisplay.update(gameState);
      }).not.toThrow();
    });

    it('should handle player object without health properties', () => {
      healthDisplay.initialize();
      
      const invalidGameState = {
        player: {}
      } as any;

      expect(() => {
        healthDisplay.update(invalidGameState);
      }).not.toThrow();
    });
  });

  describe('Single Responsibility Principle', () => {
    it('should only handle health display responsibilities', () => {
      // HealthDisplay should only have methods related to health display
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(healthDisplay));
      const expectedMethods = ['constructor', 'initialize', 'update'];
      
      expect(methods.sort()).toEqual(expectedMethods.sort());
    });

    it('should not modify game state', () => {
      healthDisplay.initialize();
      
      const originalHealth = gameState.player.health;
      const originalMaxHealth = gameState.player.maxHealth;
      
      healthDisplay.update(gameState);
      
      expect(gameState.player.health).toBe(originalHealth);
      expect(gameState.player.maxHealth).toBe(originalMaxHealth);
    });
  });
});