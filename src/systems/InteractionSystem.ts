import * as THREE from 'three';
import { GameState } from '@core/GameState';
import { EventEmitter } from '@core/EventEmitter';
import { AnimationSystem } from './AnimationSystem';
import { InteractableObjectFactory, IInteractable } from './factories/InteractableObjectFactory';

// Keep the original interface for backward compatibility
export interface InteractableObject extends IInteractable {}

/**
 * Interaction system following Single Responsibility Principle
 * Only responsible for managing interactions, delegates object creation to factory
 */
export class InteractionSystem extends EventEmitter {
    private initialized: boolean = false;
    private scene: THREE.Scene | null = null;
    private interactables: Map<string, InteractableObject> = new Map();
    private factory: InteractableObjectFactory;

    constructor() {
        super('interaction');
        this.factory = new InteractableObjectFactory();
    }
    
    setAnimationSystem(animationSystem: AnimationSystem): void {
        this.factory.setAnimationSystem(animationSystem);
    }
    
    initialize(scene: THREE.Scene): void {
        this.scene = scene;
        this.initialized = true;
        
        // Spawn some initial interactive objects
        this.spawnInitialObjects();
        
        console.log('🎯 Interaction system initialized');
    }
    
    private spawnInitialObjects(): void {
        // Create treasure chests using factory
        const chest1 = this.factory.createInteractable('chest', new THREE.Vector3(8, 0, 8), {
            items: [
                { id: 'health_potion', name: 'Health Potion', type: 'consumable', quantity: 1, rarity: 'common', properties: { healing: 50 } }
            ]
        });
        this.addInteractable(chest1);
        
        const chest2 = this.factory.createInteractable('chest', new THREE.Vector3(-10, 0, -5), {
            items: [
                { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', quantity: 1, rarity: 'uncommon', properties: { damage: 15 } }
            ]
        });
        this.addInteractable(chest2);
        
        // Create resource nodes using factory
        const tree = this.factory.createInteractable('tree', new THREE.Vector3(15, 0, -10), {
            resourceType: 'wood'
        });
        this.addInteractable(tree);
        
        const rock = this.factory.createInteractable('rock', new THREE.Vector3(-8, 0, 12), {
            resourceType: 'stone'
        });
        this.addInteractable(rock);
    }
    
    /**
     * Add an interactable object to the system and scene
     * Following Single Responsibility Principle - just manages the interaction
     */
    private addInteractable(interactable: InteractableObject): void {
        if (!this.scene) {
            console.warn('🎯 Cannot add interactable: scene not initialized');
            return;
        }
        
        this.scene.add(interactable.mesh);
        this.interactables.set(interactable.id, interactable);
        
        console.log(`🎯 Added ${interactable.type}: ${interactable.name} at position`, interactable.position);
    }
    
    /**
     * Public method to create and add interactables using the factory
     * Following Open/Closed Principle - extensible without modification
     */
    createInteractable(type: string, position: THREE.Vector3, config: any = {}): string {
        const interactable = this.factory.createInteractable(type, position, config);
        this.addInteractable(interactable);
        return interactable.id;
    }
    
    update(_deltaTime: number): void {
        if (!this.initialized) return;
        
        // Update interactive object states (animations, etc.)
        // This can be expanded for more complex behaviors
        void _deltaTime;
    }
    
    getInteractablesInRange(position: THREE.Vector3, range: number): InteractableObject[] {
        const nearby: InteractableObject[] = [];
        
        for (const [, interactable] of this.interactables) {
            if (interactable.isInteractable) {
                const distance = position.distanceTo(interactable.position);
                if (distance <= Math.max(range, interactable.interactionRange)) {
                    nearby.push(interactable);
                }
            }
        }
        
        // Sort by distance
        nearby.sort((a, b) => {
            const distA = position.distanceTo(a.position);
            const distB = position.distanceTo(b.position);
            return distA - distB;
        });
        
        return nearby;
    }
    
    interact(objectId: string, gameState: GameState): boolean {
        const interactable = this.interactables.get(objectId);
        if (!interactable || !interactable.isInteractable) return false;
        
        if (interactable.onInteract) {
            interactable.onInteract(gameState);
            this.emit('objectInteracted', { objectId, object: interactable });
            
            // Emit specific events for different object types
            if (interactable.type === 'chest') {
                this.emit('chestOpened', { chestId: objectId, items: interactable.data?.items || [] });
            } else if (interactable.type === 'resource') {
                this.emit('resourceHarvested', { 
                    nodeId: objectId, 
                    resourceType: interactable.data?.resourceType || 'unknown',
                    remaining: (interactable.data?.maxHarvest || 0) - (interactable.data?.harvestCount || 0)
                });
            }
            
            return true;
        }
        
        return false;
    }
    
    interactWithNearest(playerPosition: THREE.Vector3, gameState: GameState): boolean {
        const nearby = this.getInteractablesInRange(playerPosition, 0);
        if (nearby.length > 0) {
            return this.interact(nearby[0].id, gameState);
        }
        return false;
    }
    
    removeInteractable(objectId: string): void {
        const interactable = this.interactables.get(objectId);
        if (interactable) {
            if (this.scene) {
                this.scene.remove(interactable.mesh);
            }
            this.interactables.delete(objectId);
            this.emit('objectRemoved', objectId); // Emit just the objectId for backward compatibility
        }
    }
    
    getAllInteractables(): InteractableObject[] {
        return Array.from(this.interactables.values());
    }
    
    getInteractable(objectId: string): InteractableObject | undefined {
        return this.interactables.get(objectId);
    }
    
    cleanup(): void {
        for (const [id] of this.interactables) {
            this.removeInteractable(id);
        }
        this.interactables.clear();
        console.log('🎯 Interaction system cleaned up');
    }
}