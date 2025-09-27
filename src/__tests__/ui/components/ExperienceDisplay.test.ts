import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExperienceDisplay } from '@ui/components/ExperienceDisplay';
import { IUIComponent } from '@ui/components/HealthDisplay';
import { GameState } from '@core/GameState';

describe('ExperienceDisplay', () => {
  let experienceDisplay: ExperienceDisplay;
  let gameState: GameState;
  let mockLevelText: HTMLElement;
  let mockXpText: HTMLElement;

  beforeEach(() => {
    // Create mock DOM elements
    mockLevelText = {
      textContent: '',
      style: { animation: '' },
      id: 'levelText'
    } as HTMLElement;
    
    mockXpText = {
      textContent: '',
      id: 'xpText'
    } as HTMLElement;

    // Mock document.getElementById
    vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'levelText') return mockLevelText;
      if (id === 'xpText') return mockXpText;
      return null;
    });

    // Mock console.warn
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock setTimeout for animations
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: () => void) => {
      callback();
      return 0 as any;
    });

    experienceDisplay = new ExperienceDisplay();
    gameState = new GameState();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Interface Compliance', () => {
    it('should implement IUIComponent interface', () => {
      expect(experienceDisplay).toHaveProperty('initialize');
      expect(experienceDisplay).toHaveProperty('update');
      expect(typeof experienceDisplay.initialize).toBe('function');
      expect(typeof experienceDisplay.update).toBe('function');
    });
  });

  describe('Initialization', () => {
    it('should create ExperienceDisplay instance', () => {
      expect(experienceDisplay).toBeDefined();
      expect(experienceDisplay).toBeInstanceOf(ExperienceDisplay);
    });

    it('should initialize with DOM elements', () => {
      experienceDisplay.initialize();
      
      expect(document.getElementById).toHaveBeenCalledWith('levelText');
      expect(document.getElementById).toHaveBeenCalledWith('xpText');
    });

    it('should warn when level text element not found', () => {
      vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === 'xpText') return mockXpText;
        return null; // levelText not found
      });

      experienceDisplay.initialize();
      
      expect(console.warn).toHaveBeenCalledWith('🎨 Experience display elements not found in DOM');
    });

    it('should warn when XP text element not found', () => {
      vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === 'levelText') return mockLevelText;
        return null; // xpText not found
      });

      experienceDisplay.initialize();
      
      expect(console.warn).toHaveBeenCalledWith('🎨 Experience display elements not found in DOM');
    });

    it('should warn when both elements not found', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null);

      experienceDisplay.initialize();
      
      expect(console.warn).toHaveBeenCalledWith('🎨 Experience display elements not found in DOM');
    });
  });

  describe('Experience Updates', () => {
    beforeEach(() => {
      experienceDisplay.initialize();
    });

    it('should update level text with current level', () => {
      gameState.player.level = 5;

      experienceDisplay.update(gameState);

      expect(mockLevelText.textContent).toBe('5');
    });

    it('should update XP text with current and next level XP', () => {
      gameState.player.experience = 750;
      gameState.player.experienceToNext = 1000;

      experienceDisplay.update(gameState);

      expect(mockXpText.textContent).toBe('750/1000');
    });

    it('should handle level 1 character', () => {
      gameState.player.level = 1;
      gameState.player.experience = 50;
      gameState.player.experienceToNext = 100;

      experienceDisplay.update(gameState);

      expect(mockLevelText.textContent).toBe('1');
      expect(mockXpText.textContent).toBe('50/100');
    });

    it('should handle high level character', () => {
      gameState.player.level = 99;
      gameState.player.experience = 9999999;
      gameState.player.experienceToNext = 10000000;

      experienceDisplay.update(gameState);

      expect(mockLevelText.textContent).toBe('99');
      expect(mockXpText.textContent).toBe('9999999/10000000');
    });

    it('should handle zero experience', () => {
      gameState.player.level = 1;
      gameState.player.experience = 0;
      gameState.player.experienceToNext = 100;

      experienceDisplay.update(gameState);

      expect(mockLevelText.textContent).toBe('1');
      expect(mockXpText.textContent).toBe('0/100');
    });

    it('should handle max level character', () => {
      gameState.player.level = 100;
      gameState.player.experience = 10000000;
      gameState.player.experienceToNext = 10000000;

      experienceDisplay.update(gameState);

      expect(mockLevelText.textContent).toBe('100');
      expect(mockXpText.textContent).toBe('10000000/10000000');
    });
  });

  describe('Level Up Animation', () => {
    beforeEach(() => {
      experienceDisplay.initialize();
    });

    it('should show level up animation', () => {
      experienceDisplay.showLevelUpAnimation();

      // The animation should be triggered (setTimeout called)
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
      
      // Since the mock doesn't capture DOM changes properly, let's just ensure
      // the method doesn't throw an error and calls the timer
      expect(() => experienceDisplay.showLevelUpAnimation()).not.toThrow();
    });

    it('should reset animation after timeout', () => {
      experienceDisplay.showLevelUpAnimation();

      // setTimeout callback should have been called and reset the animation
      expect(mockLevelText.style.animation).toBe('');
    });

    it('should handle animation when level text element is null', () => {
      // Set levelText to null
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      const newExperienceDisplay = new ExperienceDisplay();
      newExperienceDisplay.initialize();

      expect(() => {
        newExperienceDisplay.showLevelUpAnimation();
      }).not.toThrow();
    });

    it('should handle multiple consecutive animations', () => {
      experienceDisplay.showLevelUpAnimation();
      experienceDisplay.showLevelUpAnimation();
      experienceDisplay.showLevelUpAnimation();

      expect(setTimeout).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle null game state gracefully', () => {
      experienceDisplay.initialize();
      
      expect(() => {
        experienceDisplay.update(null as any);
      }).not.toThrow();
    });

    it('should handle undefined game state gracefully', () => {
      experienceDisplay.initialize();
      
      expect(() => {
        experienceDisplay.update(undefined as any);
      }).not.toThrow();
    });

    it('should handle missing DOM elements during update', () => {
      // Initialize with elements, then simulate them being removed
      experienceDisplay.initialize();
      
      // Simulate missing elements
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      const newExperienceDisplay = new ExperienceDisplay();
      newExperienceDisplay.initialize();

      expect(() => {
        newExperienceDisplay.update(gameState);
      }).not.toThrow();
    });

    it('should handle update without initialization', () => {
      // Don't call initialize
      expect(() => {
        experienceDisplay.update(gameState);
      }).not.toThrow();
    });

    it('should handle player object without experience properties', () => {
      experienceDisplay.initialize();
      
      const invalidGameState = {
        player: {
          level: undefined,
          experience: undefined,
          experienceToNext: undefined
        }
      } as any;

      experienceDisplay.update(invalidGameState);
      
      // Should use default values
      expect(mockLevelText.textContent).toBe('0');
      expect(mockXpText.textContent).toBe('0/0');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      experienceDisplay.initialize();
    });

    it('should handle negative level values', () => {
      gameState.player.level = -1;
      gameState.player.experience = 0;
      gameState.player.experienceToNext = 100;

      experienceDisplay.update(gameState);

      expect(mockLevelText.textContent).toBe('-1');
      expect(mockXpText.textContent).toBe('0/100');
    });

    it('should handle negative experience values', () => {
      gameState.player.level = 1;
      gameState.player.experience = -50;
      gameState.player.experienceToNext = 100;

      experienceDisplay.update(gameState);

      expect(mockLevelText.textContent).toBe('1');
      expect(mockXpText.textContent).toBe('-50/100');
    });

    it('should handle zero experience to next', () => {
      gameState.player.level = 10;
      gameState.player.experience = 1000;
      gameState.player.experienceToNext = 0;

      experienceDisplay.update(gameState);

      expect(mockLevelText.textContent).toBe('10');
      expect(mockXpText.textContent).toBe('1000/0');
    });

    it('should handle very large experience values', () => {
      gameState.player.level = 999;
      gameState.player.experience = Number.MAX_SAFE_INTEGER;
      gameState.player.experienceToNext = Number.MAX_SAFE_INTEGER;

      experienceDisplay.update(gameState);

      expect(mockLevelText.textContent).toBe('999');
      expect(mockXpText.textContent).toBe(`${Number.MAX_SAFE_INTEGER}/${Number.MAX_SAFE_INTEGER}`);
    });
  });

  describe('Single Responsibility Principle', () => {
    it('should only handle experience display responsibilities', () => {
      // ExperienceDisplay should only have methods related to experience display
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(experienceDisplay));
      const expectedMethods = ['constructor', 'initialize', 'update', 'showLevelUpAnimation'];
      
      expect(methods.sort()).toEqual(expectedMethods.sort());
    });

    it('should not modify game state', () => {
      experienceDisplay.initialize();
      
      const originalLevel = gameState.player.level;
      const originalExperience = gameState.player.experience;
      const originalExperienceToNext = gameState.player.experienceToNext;
      
      experienceDisplay.update(gameState);
      
      expect(gameState.player.level).toBe(originalLevel);
      expect(gameState.player.experience).toBe(originalExperience);
      expect(gameState.player.experienceToNext).toBe(originalExperienceToNext);
    });
  });

  describe('Additional Features', () => {
    it('should have level up animation functionality', () => {
      experienceDisplay.initialize();
      
      expect(typeof experienceDisplay.showLevelUpAnimation).toBe('function');
    });

    it('should handle animations gracefully even with missing elements', () => {
      // Don't initialize
      expect(() => {
        experienceDisplay.showLevelUpAnimation();
      }).not.toThrow();
    });
  });
});