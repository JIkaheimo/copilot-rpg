import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { CraftingSystem, CraftingRecipe, CraftingCategory } from '@systems/CraftingSystem';
import { GameState, InventoryItem } from '@core/GameState';

// Mock Three.js
vi.mock('three', async () => {
    const actual = await vi.importActual('three');
    return {
        ...actual,
        Scene: vi.fn(() => ({
            add: vi.fn(),
            remove: vi.fn()
        })),
        BoxGeometry: vi.fn(() => ({
            dispose: vi.fn()
        })),
        CylinderGeometry: vi.fn(() => ({
            dispose: vi.fn()
        })),
        MeshPhongMaterial: vi.fn(() => ({
            dispose: vi.fn()
        })),
        Mesh: vi.fn(() => ({
            position: { copy: vi.fn() },
            geometry: { dispose: vi.fn() },
            material: { dispose: vi.fn() }
        })),
        Vector3: vi.fn((x = 0, y = 0, z = 0) => ({
            x, y, z,
            copy: vi.fn(),
            distanceTo: vi.fn(() => 2), // Default distance
            clone: vi.fn(() => new THREE.Vector3(x, y, z))
        }))
    };
});

/**
 * Comprehensive tests for CraftingSystem
 * Tests recipe management, crafting validation, execution, and station management
 */
describe('CraftingSystem', () => {
    let craftingSystem: CraftingSystem;
    let mockScene: THREE.Scene;
    let mockGameState: GameState;

    beforeEach(() => {
        mockScene = new THREE.Scene();
        mockGameState = new GameState();
        craftingSystem = new CraftingSystem();
        
        // Add some test materials to inventory
        mockGameState.addItem({
            id: 'iron_ingot',
            name: 'Iron Ingot',
            type: 'resource',
            rarity: 'common',
            quantity: 10,
            description: 'Refined iron',
            value: 15
        });
        
        mockGameState.addItem({
            id: 'wood',
            name: 'Wood',
            type: 'resource',
            rarity: 'common',
            quantity: 5,
            description: 'Sturdy wood',
            value: 3
        });
        
        mockGameState.addItem({
            id: 'leather',
            name: 'Leather',
            type: 'resource',
            rarity: 'common',
            quantity: 8,
            description: 'Tanned hide',
            value: 8
        });
        
        vi.clearAllMocks();
    });

    afterEach(() => {
        craftingSystem.cleanup();
    });

    describe('Initialization', () => {
        it('should initialize crafting system with scene and game state', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            craftingSystem.initialize(mockScene, mockGameState);
            
            expect(consoleSpy).toHaveBeenCalledWith('🔨 Crafting System initialized');
            consoleSpy.mockRestore();
        });

        it('should load recipes and materials during construction', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            new CraftingSystem();
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/🔨 Loaded \d+ crafting materials and \d+ recipes/));
            consoleSpy.mockRestore();
        });

        it('should create crafting stations', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            craftingSystem.initialize(mockScene, mockGameState);
            
            const stations = craftingSystem.getCraftingStations();
            expect(stations.length).toBeGreaterThan(0);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/🔨 Created \d+ crafting stations/));
            
            consoleSpy.mockRestore();
        });
    });

    describe('Recipe Management', () => {
        beforeEach(() => {
            craftingSystem.initialize(mockScene, mockGameState);
        });

        it('should retrieve available recipes', () => {
            const recipes = craftingSystem.getAvailableRecipes();
            expect(recipes.length).toBeGreaterThan(0);
            
            const weaponRecipes = craftingSystem.getAvailableRecipes('weapon');
            expect(weaponRecipes.every(recipe => recipe.category === 'weapon')).toBe(true);
        });

        it('should get specific recipe by id', () => {
            const recipe = craftingSystem.getRecipe('iron_sword');
            expect(recipe).toBeDefined();
            expect(recipe?.name).toBe('Iron Sword');
        });

        it('should return undefined for non-existent recipe', () => {
            const recipe = craftingSystem.getRecipe('non_existent_recipe');
            expect(recipe).toBeUndefined();
        });

        it('should filter craftable recipes based on available materials', () => {
            const craftableRecipes = craftingSystem.getCraftableRecipes();
            
            // Should include iron sword (requires 3 iron ingots + 1 wood, we have 10 + 5)
            const ironSword = craftableRecipes.find(recipe => recipe.id === 'iron_sword');
            expect(ironSword).toBeDefined();
        });

        it('should filter craftable recipes by category', () => {
            const craftableWeapons = craftingSystem.getCraftableRecipes('weapon');
            const craftableArmor = craftingSystem.getCraftableRecipes('armor');
            
            expect(craftableWeapons.every(recipe => recipe.category === 'weapon')).toBe(true);
            expect(craftableArmor.every(recipe => recipe.category === 'armor')).toBe(true);
        });
    });

    describe('Crafting Validation', () => {
        beforeEach(() => {
            craftingSystem.initialize(mockScene, mockGameState);
        });

        it('should validate craftable recipes correctly', () => {
            // Should be able to craft iron sword (have materials and skill level)
            expect(craftingSystem.canCraftRecipe('iron_sword')).toBe(true);
            
            // Should not be able to craft steel sword (requires higher skill level)
            expect(craftingSystem.canCraftRecipe('steel_sword')).toBe(false);
        });

        it('should check material requirements', () => {
            // Remove all wood to make iron sword uncraftable
            const woodIndex = mockGameState.inventory.findIndex(item => item.id === 'wood');
            if (woodIndex !== -1) {
                mockGameState.inventory.splice(woodIndex, 1);
            }
            
            expect(craftingSystem.canCraftRecipe('iron_sword')).toBe(false);
        });

        it('should return false for non-existent recipes', () => {
            expect(craftingSystem.canCraftRecipe('non_existent_recipe')).toBe(false);
        });

        it('should check crafting station availability', () => {
            // All stations should be available initially
            expect(craftingSystem.canCraftRecipe('iron_sword')).toBe(true);
        });
    });

    describe('Crafting Execution', () => {
        beforeEach(() => {
            craftingSystem.initialize(mockScene, mockGameState);
        });

        it('should start crafting successfully with valid recipe', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            const playerPosition = new THREE.Vector3(15, 0, 15); // Near forge
            
            const result = craftingSystem.startCrafting('iron_sword', playerPosition);
            
            expect(result).toBe(true);
            expect(craftingSystem.isCrafting()).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/🔨 Started crafting Iron Sword/));
            
            consoleSpy.mockRestore();
        });

        it('should fail to start crafting without materials', () => {
            // Remove all materials
            mockGameState.inventory = [];
            
            const playerPosition = new THREE.Vector3(15, 0, 15);
            const result = craftingSystem.startCrafting('iron_sword', playerPosition);
            
            expect(result).toBe(false);
            expect(craftingSystem.isCrafting()).toBe(false);
        });

        it('should fail to start crafting when too far from station', () => {
            const playerPosition = new THREE.Vector3(100, 0, 100); // Far from stations
            // Mock distance calculation to return large distance
            const mockDistance = vi.fn(() => 50);
            (playerPosition as any).distanceTo = mockDistance;
            
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
            const result = craftingSystem.startCrafting('iron_sword', playerPosition);
            
            expect(result).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/🔨 Player too far from crafting station/));
            
            consoleSpy.mockRestore();
        });

        it('should consume materials when starting crafting', () => {
            const initialIronCount = mockGameState.inventory.find(item => item.id === 'iron_ingot')?.quantity || 0;
            const initialWoodCount = mockGameState.inventory.find(item => item.id === 'wood')?.quantity || 0;
            
            const playerPosition = new THREE.Vector3(15, 0, 15);
            craftingSystem.startCrafting('iron_sword', playerPosition);
            
            const finalIronCount = mockGameState.inventory.find(item => item.id === 'iron_ingot')?.quantity || 0;
            const finalWoodCount = mockGameState.inventory.find(item => item.id === 'wood')?.quantity || 0;
            
            expect(finalIronCount).toBe(initialIronCount - 3); // Iron sword requires 3 iron
            expect(finalWoodCount).toBe(initialWoodCount - 1); // Iron sword requires 1 wood
        });

        it('should track crafting progress', () => {
            const playerPosition = new THREE.Vector3(15, 0, 15);
            craftingSystem.startCrafting('iron_sword', playerPosition);
            
            const { progress, recipe } = craftingSystem.getCraftingProgress();
            
            expect(progress).toBeGreaterThanOrEqual(0);
            expect(progress).toBeLessThanOrEqual(100);
            expect(recipe).toBeDefined();
            expect(recipe?.id).toBe('iron_sword');
        });
    });

    describe('Crafting Completion', () => {
        beforeEach(() => {
            craftingSystem.initialize(mockScene, mockGameState);
        });

        it('should complete crafting after duration elapses', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            const playerPosition = new THREE.Vector3(15, 0, 15);
            
            // Start crafting
            craftingSystem.startCrafting('iron_sword', playerPosition);
            
            // Mock time passage by directly calling completion
            const initialInventorySize = mockGameState.inventory.length;
            
            // Simulate crafting completion by advancing time
            vi.spyOn(Date, 'now')
                .mockReturnValueOnce(1000) // Start time
                .mockReturnValueOnce(12000); // End time (11 seconds later, > 10s craft time)
            
            craftingSystem.update(0.016);
            
            // Check that crafting completed
            expect(craftingSystem.isCrafting()).toBe(false);
            
            consoleSpy.mockRestore();
        });

        it('should add result item to inventory on completion', () => {
            const playerPosition = new THREE.Vector3(15, 0, 15);
            const initialInventorySize = mockGameState.inventory.length;
            
            // Start and immediately complete crafting
            craftingSystem.startCrafting('iron_sword', playerPosition);
            
            // Force completion by mocking time
            vi.spyOn(Date, 'now')
                .mockReturnValueOnce(1000)
                .mockReturnValueOnce(12000);
            
            craftingSystem.update(0.016);
            
            // Should have added the crafted item
            const ironSword = mockGameState.inventory.find(item => item.id === 'iron_sword');
            expect(ironSword).toBeDefined();
            expect(ironSword?.name).toBe('Iron Sword');
        });
    });

    describe('Crafting Cancellation', () => {
        beforeEach(() => {
            craftingSystem.initialize(mockScene, mockGameState);
        });

        it('should cancel active crafting', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            const playerPosition = new THREE.Vector3(15, 0, 15);
            
            // Start crafting
            craftingSystem.startCrafting('iron_sword', playerPosition);
            expect(craftingSystem.isCrafting()).toBe(true);
            
            // Cancel crafting
            const result = craftingSystem.cancelCrafting();
            
            expect(result).toBe(true);
            expect(craftingSystem.isCrafting()).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('🔨 Crafting cancelled');
            
            consoleSpy.mockRestore();
        });

        it('should return some materials when cancelling', () => {
            const playerPosition = new THREE.Vector3(15, 0, 15);
            
            // Record initial materials
            const initialIronCount = mockGameState.inventory.find(item => item.id === 'iron_ingot')?.quantity || 0;
            const initialWoodCount = mockGameState.inventory.find(item => item.id === 'wood')?.quantity || 0;
            
            // Start and cancel crafting
            craftingSystem.startCrafting('iron_sword', playerPosition);
            craftingSystem.cancelCrafting();
            
            // Should have returned some materials (50% return rate)
            const finalIronCount = mockGameState.inventory.find(item => item.id === 'iron_ingot')?.quantity || 0;
            const finalWoodCount = mockGameState.inventory.find(item => item.id === 'wood')?.quantity || 0;
            
            // Should have returned some materials, but not all
            expect(finalIronCount).toBeGreaterThan(initialIronCount - 3);
            expect(finalIronCount).toBeLessThan(initialIronCount);
        });

        it('should return false when no crafting to cancel', () => {
            const result = craftingSystem.cancelCrafting();
            expect(result).toBe(false);
        });
    });

    describe('Station Management', () => {
        beforeEach(() => {
            craftingSystem.initialize(mockScene, mockGameState);
        });

        it('should retrieve all crafting stations', () => {
            const stations = craftingSystem.getCraftingStations();
            expect(stations.length).toBeGreaterThan(0);
            
            // Should have different types of stations
            const stationTypes = stations.map(station => station.type);
            expect(stationTypes).toContain('forge');
            expect(stationTypes).toContain('workbench');
            expect(stationTypes).toContain('alchemy_table');
        });

        it('should find stations in range', () => {
            const playerPosition = new THREE.Vector3(15, 0, 15); // Near forge
            const stationsInRange = craftingSystem.getStationsInRange(playerPosition, 10);
            
            expect(stationsInRange.length).toBeGreaterThan(0);
        });

        it('should get station by id', () => {
            const stations = craftingSystem.getCraftingStations();
            const firstStation = stations[0];
            
            const retrievedStation = craftingSystem.getStationById(firstStation.id);
            expect(retrievedStation).toBeDefined();
            expect(retrievedStation?.id).toBe(firstStation.id);
        });

        it('should return undefined for non-existent station id', () => {
            const station = craftingSystem.getStationById('non_existent_station');
            expect(station).toBeUndefined();
        });
    });

    describe('Material and Skill Information', () => {
        beforeEach(() => {
            craftingSystem.initialize(mockScene, mockGameState);
        });

        it('should retrieve material information', () => {
            const material = craftingSystem.getMaterial('iron_ingot');
            expect(material).toBeDefined();
            expect(material?.name).toBe('Iron Ingot');
            expect(material?.type).toBe('component');
        });

        it('should retrieve all materials', () => {
            const materials = craftingSystem.getAllMaterials();
            expect(materials.length).toBeGreaterThan(0);
            
            const materialIds = materials.map(mat => mat.id);
            expect(materialIds).toContain('iron_ingot');
            expect(materialIds).toContain('wood');
            expect(materialIds).toContain('leather');
        });

        it('should return undefined for non-existent material', () => {
            const material = craftingSystem.getMaterial('non_existent_material');
            expect(material).toBeUndefined();
        });

        it('should retrieve skill levels', () => {
            const blacksmithingLevel = craftingSystem.getSkillLevel('blacksmithing');
            expect(blacksmithingLevel).toBeGreaterThanOrEqual(1);
            
            const allSkills = craftingSystem.getSkillLevels();
            expect(allSkills.size).toBeGreaterThan(0);
            expect(allSkills.has('blacksmithing')).toBe(true);
            expect(allSkills.has('alchemy')).toBe(true);
        });
    });

    describe('System Updates', () => {
        beforeEach(() => {
            craftingSystem.initialize(mockScene, mockGameState);
        });

        it('should handle update calls', () => {
            // Should not throw
            expect(() => craftingSystem.update(0.016)).not.toThrow();
        });

        it('should handle update when not initialized', () => {
            const newCraftingSystem = new CraftingSystem();
            
            // Should not throw
            expect(() => newCraftingSystem.update(0.016)).not.toThrow();
        });

        it('should process crafting completion during update', () => {
            const playerPosition = new THREE.Vector3(15, 0, 15);
            
            // Start crafting
            craftingSystem.startCrafting('iron_sword', playerPosition);
            expect(craftingSystem.isCrafting()).toBe(true);
            
            // Mock time passage to complete crafting
            vi.spyOn(Date, 'now')
                .mockReturnValueOnce(1000)
                .mockReturnValueOnce(12000); // 11 seconds later
            
            craftingSystem.update(0.016);
            
            // Crafting should be completed
            expect(craftingSystem.isCrafting()).toBe(false);
        });
    });

    describe('Progress Tracking', () => {
        beforeEach(() => {
            craftingSystem.initialize(mockScene, mockGameState);
        });

        it('should return zero progress when not crafting', () => {
            const { progress, recipe } = craftingSystem.getCraftingProgress();
            expect(progress).toBe(0);
            expect(recipe).toBeNull();
        });

        it('should calculate progress correctly', () => {
            const playerPosition = new THREE.Vector3(15, 0, 15);
            
            // Start crafting
            craftingSystem.startCrafting('iron_sword', playerPosition);
            
            // Mock partial progress
            vi.spyOn(Date, 'now')
                .mockReturnValueOnce(1000)
                .mockReturnValueOnce(6000); // 5 seconds into 10 second craft = 50%
            
            const { progress, recipe } = craftingSystem.getCraftingProgress();
            
            expect(progress).toBeGreaterThan(0);
            expect(progress).toBeLessThanOrEqual(100);
            expect(recipe).toBeDefined();
            expect(recipe?.id).toBe('iron_sword');
        });
    });

    describe('Cleanup', () => {
        beforeEach(() => {
            craftingSystem.initialize(mockScene, mockGameState);
        });

        it('should cleanup all resources', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            // Start some crafting to test cleanup
            const playerPosition = new THREE.Vector3(15, 0, 15);
            craftingSystem.startCrafting('iron_sword', playerPosition);
            
            craftingSystem.cleanup();
            
            expect(craftingSystem.isCrafting()).toBe(false);
            expect(craftingSystem.getCraftingStations()).toHaveLength(0);
            expect(consoleSpy).toHaveBeenCalledWith('🔨 Crafting System cleaned up');
            
            consoleSpy.mockRestore();
        });

        it('should cancel active crafting during cleanup', () => {
            const playerPosition = new THREE.Vector3(15, 0, 15);
            
            craftingSystem.startCrafting('iron_sword', playerPosition);
            expect(craftingSystem.isCrafting()).toBe(true);
            
            craftingSystem.cleanup();
            
            expect(craftingSystem.isCrafting()).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        beforeEach(() => {
            craftingSystem.initialize(mockScene, mockGameState);
        });

        it('should handle empty inventory gracefully', () => {
            mockGameState.inventory = [];
            
            const craftableRecipes = craftingSystem.getCraftableRecipes();
            expect(craftableRecipes).toHaveLength(0);
        });

        it('should handle missing game state gracefully', () => {
            const newCraftingSystem = new CraftingSystem();
            // Don't initialize with game state
            
            const craftableRecipes = newCraftingSystem.getCraftableRecipes();
            expect(craftableRecipes).toHaveLength(0);
        });

        it('should handle simultaneous crafting attempts', () => {
            const playerPosition = new THREE.Vector3(15, 0, 15);
            
            // Start first crafting
            const result1 = craftingSystem.startCrafting('iron_sword', playerPosition);
            expect(result1).toBe(true);
            
            // Try to start second crafting (should fail - station busy)
            const result2 = craftingSystem.startCrafting('iron_sword', playerPosition);
            expect(result2).toBe(false);
        });
    });
});