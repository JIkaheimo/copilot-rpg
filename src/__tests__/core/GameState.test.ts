/**
 * Comprehensive tests for GameState class
 * Tests state management, events, serialization, and game logic
 */
import { GameState, PlayerStats, InventoryItem, Quest } from '../../core/GameState';

describe('GameState', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  describe('Initialization', () => {
    it('should initialize with default player stats', () => {
      expect(gameState.player).toBeDefined();
      expect(gameState.player.level).toBe(1);
      expect(gameState.player.health).toBe(100);
      expect(gameState.player.maxHealth).toBe(100);
      expect(gameState.player.experience).toBe(0);
    });

    it('should initialize with empty inventory', () => {
      expect(gameState.inventory).toEqual([]);
    });

    it('should initialize with empty quest list', () => {
      expect(gameState.quests).toEqual([]);
    });

    it('should initialize with empty equipment slots', () => {
      expect(gameState.equipment).toBeDefined();
      expect(Object.keys(gameState.equipment)).toContain('weapon');
      expect(Object.keys(gameState.equipment)).toContain('armor');
      expect(Object.keys(gameState.equipment)).toContain('helmet');
    });
  });

  describe('Player Stats Management', () => {
    describe('Experience and Leveling', () => {
      it('should add experience correctly', () => {
        const initialXP = gameState.player.experience;
        const addedXP = 50;
        
        const leveledUp = gameState.addExperience(addedXP);
        
        expect(gameState.player.experience).toBe(initialXP + addedXP);
        expect(leveledUp).toBe(false); // Should not level up from 50 XP
      });

      it('should level up when reaching experience threshold', () => {
        const initialLevel = gameState.player.level;
        
        // Add enough experience to level up (usually 100 XP for level 1->2)
        const leveledUp = gameState.addExperience(150);
        
        expect(leveledUp).toBe(true);
        expect(gameState.player.level).toBe(initialLevel + 1);
        expect(gameState.player.skillPoints).toBeGreaterThan(0);
        expect(gameState.player.attributePoints).toBeGreaterThan(0);
      });

      it('should increase max health when leveling up', () => {
        const initialMaxHealth = gameState.player.maxHealth;
        
        gameState.addExperience(150); // Level up
        
        expect(gameState.player.maxHealth).toBeGreaterThan(initialMaxHealth);
        expect(gameState.player.health).toBe(gameState.player.maxHealth); // Should heal to full on level up
      });
    });

    describe('Health Management', () => {
      it('should take damage correctly', () => {
        const initialHealth = gameState.player.health;
        const damage = 25;
        
        const died = gameState.takeDamage(damage);
        
        expect(gameState.player.health).toBe(initialHealth - damage);
        expect(died).toBe(false);
      });

      it('should not go below 0 health', () => {
        const died = gameState.takeDamage(200); // More than max health
        
        expect(gameState.player.health).toBe(0);
        expect(died).toBe(true);
      });

      it('should heal correctly', () => {
        gameState.takeDamage(50); // Take some damage first
        const healthAfterDamage = gameState.player.health;
        
        gameState.heal(25);
        
        expect(gameState.player.health).toBe(healthAfterDamage + 25);
      });

      it('should not heal above max health', () => {
        gameState.heal(200); // Overheal
        
        expect(gameState.player.health).toBe(gameState.player.maxHealth);
      });
    });
  });

  describe('Inventory Management', () => {
    const testItem: InventoryItem = {
      id: 'test-sword',
      name: 'Test Sword',
      type: 'weapon',
      quantity: 1,
      rarity: 'common',
      properties: { damage: 10 }
    };

    it('should add items to inventory', () => {
      const added = gameState.addItem(testItem);
      
      expect(added).toBe(true);
      expect(gameState.inventory).toHaveLength(1);
      expect(gameState.inventory[0]).toEqual(testItem);
    });

    it('should stack identical items', () => {
      const stackableItem: InventoryItem = {
        ...testItem,
        id: 'potion',
        name: 'Health Potion',
        type: 'consumable',
        quantity: 5
      };

      gameState.addItem(stackableItem);
      gameState.addItem({ ...stackableItem, quantity: 3 });
      
      expect(gameState.inventory).toHaveLength(1);
      expect(gameState.inventory[0].quantity).toBe(8);
    });

    it('should remove items from inventory', () => {
      gameState.addItem(testItem);
      
      const removed = gameState.removeItem('test-sword', 1);
      
      expect(removed).toBe(true);
      expect(gameState.inventory).toHaveLength(0);
    });

    it('should handle partial item removal', () => {
      const multiItem: InventoryItem = {
        ...testItem,
        quantity: 5
      };
      gameState.addItem(multiItem);
      
      const removed = gameState.removeItem('test-sword', 2);
      
      expect(removed).toBe(true);
      expect(gameState.inventory[0].quantity).toBe(3);
    });

    it('should fail to remove non-existent items', () => {
      const removed = gameState.removeItem('non-existent', 1);
      
      expect(removed).toBe(false);
    });

    it('should fail to remove more items than available', () => {
      const uniqueItem: InventoryItem = {
        id: 'unique-item',
        name: 'Unique Item',
        type: 'weapon',
        quantity: 1,
        rarity: 'common',
        properties: { damage: 10 }
      };
      
      gameState.addItem(uniqueItem);
      expect(gameState.inventory).toHaveLength(1);
      expect(gameState.inventory[0].quantity).toBe(1);
      
      const removed = gameState.removeItem('unique-item', 5);
      
      expect(removed).toBe(false);
      expect(gameState.inventory).toHaveLength(1); // Item should still exist
      expect(gameState.inventory[0].quantity).toBe(1); // Should remain unchanged
    });
  });

  describe('Quest Management', () => {
    const testQuest: Quest = {
      id: 'test-quest',
      title: 'Test Quest',
      description: 'A test quest',
      type: 'side',
      status: 'available',
      objectives: [
        {
          id: 'obj1',
          description: 'Kill 5 enemies',
          completed: false,
          progress: 0,
          maxProgress: 5
        }
      ],
      rewards: {
        experience: 100,
        gold: 50,
        items: []
      }
    };

    it('should add quests', () => {
      gameState.addQuest(testQuest);
      
      expect(gameState.quests).toHaveLength(1);
      expect(gameState.quests[0]).toEqual(testQuest);
    });

    it('should complete quests', () => {
      gameState.addQuest(testQuest);
      
      gameState.completeQuest('test-quest');
      
      expect(gameState.quests[0].status).toBe('completed');
    });

    it('should update quest progress', () => {
      gameState.addQuest(testQuest);
      
      gameState.updateQuestProgress('test-quest', 'obj1', 1);
      
      expect(gameState.quests[0].objectives[0].progress).toBe(1);
      expect(gameState.quests[0].objectives[0].completed).toBe(false);
    });

    it('should complete objective when progress reaches max', () => {
      gameState.addQuest(testQuest);
      
      gameState.updateQuestProgress('test-quest', 'obj1', 5);
      
      expect(gameState.quests[0].objectives[0].progress).toBe(5);
      expect(gameState.quests[0].objectives[0].completed).toBe(true);
    });
  });

  describe('Event System', () => {
    it('should register and trigger event listeners', () => {
      const mockCallback = jest.fn();
      
      gameState.on('healthChanged', mockCallback);
      gameState.takeDamage(10);
      
      expect(mockCallback).toHaveBeenCalledWith(90);
    });

    it('should trigger multiple event listeners', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      gameState.on('levelUp', mockCallback1);
      gameState.on('levelUp', mockCallback2);
      gameState.addExperience(150); // Level up
      
      expect(mockCallback1).toHaveBeenCalled();
      expect(mockCallback2).toHaveBeenCalled();
    });

    it('should remove event listeners', () => {
      const mockCallback = jest.fn();
      
      gameState.on('itemAdded', mockCallback);
      gameState.off('itemAdded', mockCallback);
      
      gameState.addItem({
        id: 'test',
        name: 'Test',
        type: 'misc',
        quantity: 1,
        rarity: 'common',
        properties: {}
      });
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Serialization', () => {
    it('should serialize game state to JSON', () => {
      // Setup some state
      gameState.addExperience(50);
      gameState.addItem({
        id: 'test-item',
        name: 'Test Item',
        type: 'misc',
        quantity: 1,
        rarity: 'common',
        properties: {}
      });

      const serialized = gameState.serialize();
      
      expect(typeof serialized).toBe('string');
      
      const parsed = JSON.parse(serialized);
      expect(parsed.player).toBeDefined();
      expect(parsed.inventory).toBeDefined();
      expect(parsed.quests).toBeDefined();
      expect(parsed.worldState).toBeDefined();
    });

    it('should deserialize game state from JSON', () => {
      // Setup initial state
      gameState.addExperience(75);
      const testItem = {
        id: 'restore-item',
        name: 'Restore Item',
        type: 'misc',
        quantity: 2,
        rarity: 'uncommon' as const,
        properties: { value: 100 }
      };
      gameState.addItem(testItem);
      
      const serialized = gameState.serialize();
      
      // Create new game state and deserialize
      const newGameState = new GameState();
      newGameState.deserialize(serialized);
      
      expect(newGameState.player.experience).toBe(75);
      expect(newGameState.inventory).toHaveLength(1);
      expect(newGameState.inventory[0].name).toBe('Restore Item');
      expect(newGameState.inventory[0].rarity).toBe('uncommon');
    });
  });

  describe('Update Loop', () => {
    it('should handle update ticks', () => {
      const deltaTime = 0.016; // 16ms
      
      // Should not throw
      expect(() => gameState.update(deltaTime)).not.toThrow();
    });

    it('should regenerate resources over time', () => {
      // Drain some stamina and mana first
      gameState.player.stamina = 50;
      gameState.player.mana = 25;
      
      const initialStamina = gameState.player.stamina;
      const initialMana = gameState.player.mana;
      
      // Update for 1 second worth of frames
      for (let i = 0; i < 60; i++) {
        gameState.update(0.016);
      }
      
      expect(gameState.player.stamina).toBeGreaterThan(initialStamina);
      expect(gameState.player.mana).toBeGreaterThan(initialMana);
    });
  });
});