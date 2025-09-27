import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ManaDisplay } from '@ui/components/ManaDisplay';
import { IUIComponent } from '@ui/components/HealthDisplay';
import { GameState } from '@core/GameState';

describe('ManaDisplay', () => {
  let manaDisplay: ManaDisplay;
  let gameState: GameState;
  let mockManaBar: HTMLElement;
  let mockManaText: HTMLElement;

  beforeEach(() => {
    // Create mock DOM elements
    mockManaBar = {
      style: { width: '' },
      id: 'manaBar'
    } as HTMLElement;
    
    mockManaText = {
      textContent: '',
      id: 'manaText'
    } as HTMLElement;

    // Mock document.getElementById
    vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'manaBar') return mockManaBar;
      if (id === 'manaText') return mockManaText;
      return null;
    });

    // Mock console.warn
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    manaDisplay = new ManaDisplay();
    gameState = new GameState();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Interface Compliance', () => {
    it('should implement IUIComponent interface', () => {
      expect(manaDisplay).toHaveProperty('initialize');
      expect(manaDisplay).toHaveProperty('update');
      expect(typeof manaDisplay.initialize).toBe('function');
      expect(typeof manaDisplay.update).toBe('function');
    });
  });

  describe('Initialization', () => {
    it('should create ManaDisplay instance', () => {
      expect(manaDisplay).toBeDefined();
      expect(manaDisplay).toBeInstanceOf(ManaDisplay);
    });

    it('should initialize with DOM elements', () => {
      manaDisplay.initialize();
      
      expect(document.getElementById).toHaveBeenCalledWith('manaBar');
      expect(document.getElementById).toHaveBeenCalledWith('manaText');
    });

    it('should warn when mana bar element not found', () => {
      vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === 'manaText') return mockManaText;
        return null; // manaBar not found
      });

      manaDisplay.initialize();
      
      expect(console.warn).toHaveBeenCalledWith('🎨 Mana display elements not found in DOM');
    });

    it('should warn when mana text element not found', () => {
      vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === 'manaBar') return mockManaBar;
        return null; // manaText not found
      });

      manaDisplay.initialize();
      
      expect(console.warn).toHaveBeenCalledWith('🎨 Mana display elements not found in DOM');
    });

    it('should warn when both elements not found', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null);

      manaDisplay.initialize();
      
      expect(console.warn).toHaveBeenCalledWith('🎨 Mana display elements not found in DOM');
    });
  });

  describe('Mana Updates', () => {
    beforeEach(() => {
      manaDisplay.initialize();
    });

    it('should update mana bar width based on mana percentage', () => {
      // Set initial mana values
      gameState.player.mana = 60;
      gameState.player.maxMana = 100;

      manaDisplay.update(gameState);

      expect(mockManaBar.style.width).toBe('60%');
    });

    it('should update mana text with current and max mana', () => {
      gameState.player.mana = 75.8;
      gameState.player.maxMana = 120;

      manaDisplay.update(gameState);

      expect(mockManaText.textContent).toBe('76/120');
    });

    it('should handle zero mana', () => {
      gameState.player.mana = 0;
      gameState.player.maxMana = 100;

      manaDisplay.update(gameState);

      expect(mockManaBar.style.width).toBe('0%');
      expect(mockManaText.textContent).toBe('0/100');
    });

    it('should handle full mana', () => {
      gameState.player.mana = 150;
      gameState.player.maxMana = 150;

      manaDisplay.update(gameState);

      expect(mockManaBar.style.width).toBe('100%');
      expect(mockManaText.textContent).toBe('150/150');
    });

    it('should handle fractional mana values', () => {
      gameState.player.mana = 33.33;
      gameState.player.maxMana = 100;

      manaDisplay.update(gameState);

      expect(mockManaBar.style.width).toBe('33.33%');
      expect(mockManaText.textContent).toBe('33/100');
    });

    it('should handle non-standard max mana values', () => {
      gameState.player.mana = 75;
      gameState.player.maxMana = 150;

      manaDisplay.update(gameState);

      expect(mockManaBar.style.width).toBe('50%');
      expect(mockManaText.textContent).toBe('75/150');
    });
  });

  describe('Error Handling', () => {
    it('should handle null game state gracefully', () => {
      manaDisplay.initialize();
      
      expect(() => {
        manaDisplay.update(null as any);
      }).not.toThrow();
    });

    it('should handle undefined game state gracefully', () => {
      manaDisplay.initialize();
      
      expect(() => {
        manaDisplay.update(undefined as any);
      }).not.toThrow();
    });

    it('should handle missing DOM elements during update', () => {
      // Initialize with elements, then simulate them being removed
      manaDisplay.initialize();
      
      // Simulate missing elements
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      const newManaDisplay = new ManaDisplay();
      newManaDisplay.initialize();

      expect(() => {
        newManaDisplay.update(gameState);
      }).not.toThrow();
    });

    it('should handle update without initialization', () => {
      // Don't call initialize
      expect(() => {
        manaDisplay.update(gameState);
      }).not.toThrow();
    });

    it('should handle player object without mana properties', () => {
      manaDisplay.initialize();
      
      const invalidGameState = {
        player: {}
      } as any;

      expect(() => {
        manaDisplay.update(invalidGameState);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      manaDisplay.initialize();
    });

    it('should handle mana greater than max mana', () => {
      gameState.player.mana = 120;
      gameState.player.maxMana = 100;

      manaDisplay.update(gameState);

      expect(mockManaBar.style.width).toBe('120%');
      expect(mockManaText.textContent).toBe('120/100');
    });

    it('should handle negative mana values', () => {
      gameState.player.mana = -5;
      gameState.player.maxMana = 100;

      manaDisplay.update(gameState);

      expect(mockManaBar.style.width).toBe('-5%');
      expect(mockManaText.textContent).toBe('-5/100');
    });

    it('should handle zero max mana', () => {
      gameState.player.mana = 50;
      gameState.player.maxMana = 0;

      manaDisplay.update(gameState);

      expect(mockManaBar.style.width).toBe('Infinity%');
      expect(mockManaText.textContent).toBe('50/0');
    });

    it('should handle very large mana values', () => {
      gameState.player.mana = 999999;
      gameState.player.maxMana = 1000000;

      manaDisplay.update(gameState);

      expect(mockManaBar.style.width).toBe('99.9999%');
      expect(mockManaText.textContent).toBe('999999/1000000');
    });
  });

  describe('Single Responsibility Principle', () => {
    it('should only handle mana display responsibilities', () => {
      // ManaDisplay should only have methods related to mana display
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(manaDisplay));
      const expectedMethods = ['constructor', 'initialize', 'update'];
      
      expect(methods.sort()).toEqual(expectedMethods.sort());
    });

    it('should not modify game state', () => {
      manaDisplay.initialize();
      
      const originalMana = gameState.player.mana;
      const originalMaxMana = gameState.player.maxMana;
      
      manaDisplay.update(gameState);
      
      expect(gameState.player.mana).toBe(originalMana);
      expect(gameState.player.maxMana).toBe(originalMaxMana);
    });
  });
});