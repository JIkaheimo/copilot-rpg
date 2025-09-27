import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
/**
 * Tests for SaveSystem class
 * Tests game persistence, save/load functionality
 */
import { SaveSystem } from '../../systems/SaveSystem';
import { GameState } from '../../core/GameState';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Replace global localStorage with mock
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

describe('SaveSystem', () => {
  let saveSystem: SaveSystem;
  let gameState: GameState;

  beforeEach(() => {
    saveSystem = new SaveSystem();
    gameState = new GameState();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize correctly', () => {
      expect(saveSystem).toBeDefined();
    });
  });

  describe('Save Game', () => {
    it('should save game state to localStorage', async () => {
      // Set up some game state
      gameState.addExperience(100);
      
      await saveSystem.saveGame(gameState);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      expect(typeof savedData).toBe('string');
      
      // Should be valid JSON
      expect(() => JSON.parse(savedData)).not.toThrow();
    });

    it('should save with numerical slot', async () => {
      await saveSystem.saveGame(gameState, 0);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'copilot-rpg-save-0', 
        expect.any(String)
      );
    });

    it('should save with custom slot number', async () => {
      await saveSystem.saveGame(gameState, 5);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'copilot-rpg-save-5', 
        expect.any(String)
      );
    });

    it('should include timestamp in save data', async () => {
      await saveSystem.saveGame(gameState);
      
      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      const parsedData = JSON.parse(savedData);
      
      expect(parsedData.timestamp).toBeDefined();
      expect(typeof parsedData.timestamp).toBe('number');
    });
  });

  describe('Load Game', () => {
    it('should load game state from localStorage', async () => {
      const mockSaveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState: JSON.stringify({
          player: { level: 5, experience: 500 },
          inventory: [],
          quests: [],
          equipment: {},
          worldState: {},
          gameSettings: {}
        }),
        playTime: 1000,
        saveSlot: 0,
        description: 'Test save'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSaveData));
      
      const result = await saveSystem.loadGame(gameState, 0);
      
      expect(result).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('copilot-rpg-save-0');
    });

    it('should load from custom slot', async () => {
      const mockSaveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        gameState: JSON.stringify({
          player: { level: 2, experience: 150 },
          inventory: [],
          quests: [],
          equipment: {},
          worldState: {},
          gameSettings: {}
        }),
        playTime: 500,
        saveSlot: 3,
        description: 'Custom save'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSaveData));
      
      const result = await saveSystem.loadGame(gameState, 3);
      
      expect(result).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('copilot-rpg-save-3');
    });

    it('should handle missing save data gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await saveSystem.loadGame(gameState);
      
      expect(result).toBe(false);
    });

    it('should handle corrupted save data', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
      mockLocalStorage.getItem.mockReturnValue('invalid json data');
      
      const result = await saveSystem.loadGame(gameState);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load game:', expect.any(SyntaxError));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Save Management', () => {
    it('should list available save slots', () => {
      // Mock multiple saves
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'copilot-rpg-save-0') {
          return JSON.stringify({ version: '1.0.0', timestamp: 1000, gameState: '{}', playTime: 100, saveSlot: 0, description: 'Save 1' });
        }
        if (key === 'copilot-rpg-save-1') { 
          return JSON.stringify({ version: '1.0.0', timestamp: 2000, gameState: '{}', playTime: 200, saveSlot: 1, description: 'Save 2' });
        }
        return null;
      });
      
      const saves = saveSystem.getSaveSlots();
      
      expect(saves).toHaveLength(2);
      expect(saves[0].saveSlot).toBe(1); // Sorted by timestamp (newest first)
      expect(saves[1].saveSlot).toBe(0);
    });

    it('should delete save slots', () => {
      const result = saveSystem.deleteSave(1);
      
      expect(result).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('copilot-rpg-save-1');
    });

    it('should check if save exists', () => {
      mockLocalStorage.getItem.mockReturnValue('{"timestamp":123}');
      
      const exists = saveSystem.hasSave(0);
      
      expect(exists).toBe(true);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('copilot-rpg-save-0');
    });

    it('should return false for non-existent saves', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const exists = saveSystem.hasSave(5);
      
      expect(exists).toBe(false);
    });

    it('should export save data', () => {
      const mockSaveData = '{"version":"1.0.0","timestamp":123,"gameState":"{}"}';
      mockLocalStorage.getItem.mockReturnValue(mockSaveData);
      
      const exported = saveSystem.exportSave(0);
      
      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');
      expect(exported).toBe(btoa(mockSaveData));
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors during save', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const result = await saveSystem.saveGame(gameState);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save game:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle localStorage errors during load', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      
      const result = await saveSystem.loadGame(gameState);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load game:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});