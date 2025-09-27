import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InteractionSystem, InteractableObject } from '@systems/InteractionSystem';
import { GameState } from '@core/GameState';
import * as THREE from 'three';

/**
 * Comprehensive tests for InteractionSystem
 * Tests interactive objects, chest mechanics, and resource harvesting
 */
describe('InteractionSystem', () => {
    let interactionSystem: InteractionSystem;
    let mockScene: THREE.Scene;
    let gameState: GameState;

    beforeEach(() => {
        interactionSystem = new InteractionSystem();
        mockScene = new THREE.Scene();
        gameState = new GameState();
        vi.clearAllTimers();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Initialization', () => {
        it('should initialize correctly', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            interactionSystem.initialize(mockScene);
            
            expect(consoleSpy).toHaveBeenCalledWith('🎯 Interaction system initialized');
            consoleSpy.mockRestore();
        });

        it('should spawn initial objects on initialization', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            interactionSystem.initialize(mockScene);
            
            const allInteractables = interactionSystem.getAllInteractables();
            expect(allInteractables.length).toBeGreaterThan(0);
            
            // Should have chests and resource nodes
            const chests = allInteractables.filter(obj => obj.type === 'chest');
            const resources = allInteractables.filter(obj => obj.type === 'resource');
            
            expect(chests.length).toBeGreaterThan(0);
            expect(resources.length).toBeGreaterThan(0);
            
            consoleSpy.mockRestore();
        });

        it('should add objects to scene', () => {
            const initialChildCount = mockScene.children.length;
            
            interactionSystem.initialize(mockScene);
            
            expect(mockScene.children.length).toBeGreaterThan(initialChildCount);
        });
    });

    describe('Treasure Chest Mechanics', () => {
        beforeEach(() => {
            interactionSystem.initialize(mockScene);
        });

        it('should create chest with items', () => {
            const position = new THREE.Vector3(10, 0, 10);
            const testItems = [
                { id: 'test_item', name: 'Test Item', type: 'misc', quantity: 1, rarity: 'common' as const, properties: {} }
            ];
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            // Use the new factory-based public API
            const chestId = interactionSystem.createInteractable('chest', position, { items: testItems });
            
            expect(chestId).toBeTruthy();
            expect(consoleSpy).toHaveBeenCalledWith(
                '🎯 Added chest: Treasure Chest at position',
                expect.any(THREE.Vector3)
            );
            
            const chest = interactionSystem.getInteractable(chestId);
            expect(chest).toBeDefined();
            expect(chest?.type).toBe('chest');
            expect(chest?.name).toBe('Treasure Chest');
            expect(chest?.data.items).toEqual(testItems);
            expect(chest?.data.opened).toBe(false);
            
            consoleSpy.mockRestore();
        });

        it('should open chest and give items', () => {
            const position = new THREE.Vector3(10, 0, 10);
            const testItems = [
                { id: 'gold', name: 'Gold Coin', type: 'currency', quantity: 5, rarity: 'common' as const, properties: {} }
            ];
            
            const chestId = interactionSystem.createInteractable('chest', position, { items: testItems });
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            const eventSpy = vi.fn();
            interactionSystem.on('chestOpened', eventSpy);
            
            const initialInventorySize = gameState.inventory.length;
            
            const success = interactionSystem.interact(chestId, gameState);
            
            expect(success).toBe(true);
            expect(gameState.inventory.length).toBe(initialInventorySize + 1);
            expect(gameState.inventory[gameState.inventory.length - 1].id).toBe('gold');
            
            const chest = interactionSystem.getInteractable(chestId);
            expect(chest?.data.opened).toBe(true);
            expect(chest?.isInteractable).toBe(false);
            
            expect(consoleSpy).toHaveBeenCalledWith('📦 Found: Gold Coin');
            expect(eventSpy).toHaveBeenCalledWith({
                chestId,
                items: testItems
            });
            
            consoleSpy.mockRestore();
        });

        it('should not interact with already opened chest', () => {
            const position = new THREE.Vector3(10, 0, 10);
            const testItems = [{ id: 'test', name: 'Test', type: 'misc', quantity: 1, rarity: 'common' as const, properties: {} }];
            
            // Use factory pattern instead
            const chestId = interactionSystem.createInteractable("chest", position, { items: testItems });
            
            // Open chest first time
            interactionSystem.interact(chestId, gameState);
            
            const initialInventorySize = gameState.inventory.length;
            
            // Try to open again - should fail because chest is no longer interactable
            const success = interactionSystem.interact(chestId, gameState);
            
            // After opening, the chest is no longer interactable, so interaction should fail
            expect(success).toBe(false); // Chest is not interactable anymore
            expect(gameState.inventory.length).toBe(initialInventorySize); // No new items
        });
    });

    describe('Resource Node Mechanics', () => {
        beforeEach(() => {
            interactionSystem.initialize(mockScene);
        });

        it('should create tree resource node', () => {
            const position = new THREE.Vector3(15, 0, 15);
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            // Use factory pattern instead
            const nodeId = interactionSystem.createInteractable("tree", position, { resourceType: "wood" });
            
            expect(nodeId).toBeTruthy();
            expect(consoleSpy).toHaveBeenCalledWith(
                '🎯 Added resource: Tree at position',
                expect.any(THREE.Vector3)
            );
            
            const node = interactionSystem.getInteractable(nodeId);
            expect(node).toBeDefined();
            expect(node?.type).toBe('resource');
            expect(node?.name).toBe('Tree');
            expect(node?.data.resourceType).toBe('wood');
            expect(node?.data.harvestCount).toBe(0);
            
            consoleSpy.mockRestore();
        });

        it('should create rock resource node', () => {
            const position = new THREE.Vector3(20, 0, 20);
            
            // Use factory pattern instead
            const nodeId = interactionSystem.createInteractable("rock", position, { resourceType: "stone" });
            
            const node = interactionSystem.getInteractable(nodeId);
            expect(node?.name).toBe('Rock');
            expect(node?.data.resourceType).toBe('stone');
        });

        it('should harvest resources from nodes', () => {
            const position = new THREE.Vector3(15, 0, 15);
            
            // Use factory pattern instead
            const nodeId = interactionSystem.createInteractable("tree", position, { resourceType: "wood" });
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            const eventSpy = vi.fn();
            interactionSystem.on('resourceHarvested', eventSpy);
            
            const initialInventorySize = gameState.inventory.length;
            
            const success = interactionSystem.interact(nodeId, gameState);
            
            expect(success).toBe(true);
            expect(gameState.inventory.length).toBe(initialInventorySize + 1);
            
            const woodItem = gameState.inventory.find(item => item.id === 'wood');
            expect(woodItem).toBeDefined();
            expect(woodItem?.name).toBe('Wood');
            expect(woodItem?.quantity).toBe(1);
            
            const node = interactionSystem.getInteractable(nodeId);
            expect(node?.data.harvestCount).toBe(1);
            
            expect(consoleSpy).toHaveBeenCalledWith('🌳 Harvested: Wood');
            expect(eventSpy).toHaveBeenCalledWith({
                nodeId,
                resourceType: 'wood',
                remaining: 2 // maxHarvest - harvestCount
            });
            
            consoleSpy.mockRestore();
        });

        it('should deplete resource nodes after max harvests', () => {
            const position = new THREE.Vector3(15, 0, 15);
            
            // Use factory pattern instead
            const nodeId = interactionSystem.createInteractable("tree", position, { resourceType: "wood" });
            
            const node = interactionSystem.getInteractable(nodeId);
            const maxHarvest = node!.data.maxHarvest;
            
            // Harvest until depleted
            for (let i = 0; i < maxHarvest; i++) {
                interactionSystem.interact(nodeId, gameState);
            }
            
            expect(node?.data.harvestCount).toBe(maxHarvest);
            expect(node?.isInteractable).toBe(false);
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            // Try to harvest from depleted node
            const success = interactionSystem.interact(nodeId, gameState);
            
            expect(success).toBe(false); // Should fail because node is not interactable
            
            consoleSpy.mockRestore();
        });

        it('should respawn depleted resource nodes', () => {
            const position = new THREE.Vector3(15, 0, 15);
            
            // Use factory pattern instead
            const nodeId = interactionSystem.createInteractable("tree", position, { resourceType: "wood" });
            
            const node = interactionSystem.getInteractable(nodeId);
            const maxHarvest = node!.data.maxHarvest;
            
            // Deplete the node
            for (let i = 0; i < maxHarvest; i++) {
                interactionSystem.interact(nodeId, gameState);
            }
            
            expect(node?.isInteractable).toBe(false);
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            // Fast-forward time to trigger respawn
            vi.advanceTimersByTime(30000); // 30 seconds
            
            expect(node?.data.harvestCount).toBe(0);
            expect(node?.isInteractable).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith('🌳 Tree has respawned');
            
            consoleSpy.mockRestore();
        });

        it('should scale resource node size based on harvest count', () => {
            const position = new THREE.Vector3(15, 0, 15);
            
            // Use factory pattern instead
            const nodeId = interactionSystem.createInteractable("tree", position, { resourceType: "wood" });
            
            const node = interactionSystem.getInteractable(nodeId);
            const initialScale = node!.mesh.scale.x;
            
            // Harvest once
            interactionSystem.interact(nodeId, gameState);
            
            const newScale = node!.mesh.scale.x;
            expect(newScale).toBeLessThan(initialScale);
        });
    });

    describe('Interaction Queries', () => {
        beforeEach(() => {
            interactionSystem.initialize(mockScene);
        });

        it('should find interactables in range', () => {
            const queryPosition = new THREE.Vector3(0, 0, 0);
            
            const nearbyInteractables = interactionSystem.getInteractablesInRange(queryPosition, 15);
            const allInteractables = interactionSystem.getInteractablesInRange(queryPosition, 100);
            
            expect(nearbyInteractables.length).toBeGreaterThan(0);
            expect(allInteractables.length).toBeGreaterThanOrEqual(nearbyInteractables.length);
            
            // Should be sorted by distance
            for (let i = 1; i < nearbyInteractables.length; i++) {
                const prevDistance = queryPosition.distanceTo(nearbyInteractables[i - 1].position);
                const currentDistance = queryPosition.distanceTo(nearbyInteractables[i].position);
                expect(currentDistance).toBeGreaterThanOrEqual(prevDistance);
            }
        });

        it('should not include non-interactable objects', () => {
            const position = new THREE.Vector3(5, 0, 5);
            const testItems = [{ id: 'test', name: 'Test', type: 'misc', quantity: 1, rarity: 'common' as const, properties: {} }];
            
            // Use factory pattern instead
            const chestId = interactionSystem.createInteractable("chest", position, { items: testItems });
            
            // Open the chest to make it non-interactable
            interactionSystem.interact(chestId, gameState);
            
            const nearbyInteractables = interactionSystem.getInteractablesInRange(position, 10);
            const openedChest = nearbyInteractables.find(obj => obj.id === chestId);
            
            expect(openedChest).toBeUndefined();
        });

        it('should interact with nearest object', () => {
            const playerPosition = new THREE.Vector3(8, 0, 8); // Close to initial chest
            
            const eventSpy = vi.fn();
            interactionSystem.on('chestOpened', eventSpy);
            
            const success = interactionSystem.interactWithNearest(playerPosition, gameState);
            
            expect(success).toBe(true);
            expect(eventSpy).toHaveBeenCalled();
        });

        it('should fail to interact when no objects in range', () => {
            const farPosition = new THREE.Vector3(1000, 0, 1000);
            
            const success = interactionSystem.interactWithNearest(farPosition, gameState);
            
            expect(success).toBe(false);
        });
    });

    describe('Object Management', () => {
        beforeEach(() => {
            interactionSystem.initialize(mockScene);
        });

        it('should remove interactable objects', () => {
            const allInteractables = interactionSystem.getAllInteractables();
            const objectToRemove = allInteractables[0];
            const initialChildCount = mockScene.children.length;
            
            const eventSpy = vi.fn();
            interactionSystem.on('objectRemoved', eventSpy);
            
            interactionSystem.removeInteractable(objectToRemove.id);
            
            const remainingInteractables = interactionSystem.getAllInteractables();
            expect(remainingInteractables.find(obj => obj.id === objectToRemove.id)).toBeUndefined();
            expect(mockScene.children.length).toBe(initialChildCount - 1);
            expect(eventSpy).toHaveBeenCalledWith(objectToRemove.id);
        });

        it('should get specific interactable by id', () => {
            const allInteractables = interactionSystem.getAllInteractables();
            const firstObject = allInteractables[0];
            
            const retrieved = interactionSystem.getInteractable(firstObject.id);
            
            expect(retrieved).toBe(firstObject);
        });

        it('should return undefined for non-existent interactable', () => {
            const retrieved = interactionSystem.getInteractable('non-existent-id');
            
            expect(retrieved).toBeUndefined();
        });
    });

    describe('Event System', () => {
        beforeEach(() => {
            interactionSystem.initialize(mockScene);
        });

        it('should emit object interaction events', () => {
            const eventSpy = vi.fn();
            interactionSystem.on('objectInteracted', eventSpy);
            
            const allInteractables = interactionSystem.getAllInteractables();
            const chest = allInteractables.find(obj => obj.type === 'chest');
            
            if (chest) {
                interactionSystem.interact(chest.id, gameState);
                
                expect(eventSpy).toHaveBeenCalledWith({
                    objectId: chest.id,
                    object: chest
                });
            }
        });

        it('should handle event listener removal', () => {
            const eventSpy = vi.fn();
            
            interactionSystem.on('chestOpened', eventSpy);
            interactionSystem.off('chestOpened', eventSpy);
            
            const allInteractables = interactionSystem.getAllInteractables();
            const chest = allInteractables.find(obj => obj.type === 'chest');
            
            if (chest) {
                interactionSystem.interact(chest.id, gameState);
                expect(eventSpy).not.toHaveBeenCalled();
            }
        });
    });

    describe('System Updates', () => {
        beforeEach(() => {
            interactionSystem.initialize(mockScene);
        });

        it('should update without errors', () => {
            expect(() => {
                interactionSystem.update(0.016);
            }).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        beforeEach(() => {
            interactionSystem.initialize(mockScene);
        });

        it('should handle interaction with non-existent object', () => {
            const success = interactionSystem.interact('non-existent-id', gameState);
            
            expect(success).toBe(false);
        });

        it('should handle interaction with object that has no onInteract function', () => {
            const position = new THREE.Vector3(25, 0, 25);
            const objectWithoutInteraction: InteractableObject = {
                id: 'test-object',
                type: 'chest',
                name: 'Test Object',
                position: position.clone(),
                mesh: new THREE.Group(),
                interactionRange: 2,
                isInteractable: true
                // No onInteract function
            };
            
            // Manually add to the system (using reflection)
            const interactables = (interactionSystem as any).interactables;
            interactables.set(objectWithoutInteraction.id, objectWithoutInteraction);
            
            const success = interactionSystem.interact(objectWithoutInteraction.id, gameState);
            
            expect(success).toBe(false);
        });
    });

    describe('Cleanup', () => {
        it('should cleanup all resources', () => {
            interactionSystem.initialize(mockScene);
            
            const initialInteractableCount = interactionSystem.getAllInteractables().length;
            expect(initialInteractableCount).toBeGreaterThan(0);
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            interactionSystem.cleanup();
            
            expect(consoleSpy).toHaveBeenCalledWith('🎯 Interaction system cleaned up');
            
            // All objects should be removed from scene
            expect(mockScene.children.length).toBe(0);
            
            consoleSpy.mockRestore();
        });
    });
});