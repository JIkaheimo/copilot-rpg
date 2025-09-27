import * as THREE from 'three';
import { GameState } from '@core/GameState';
import { EventEmitter } from '@core/EventEmitter';
import { TextureGenerator } from '../utils/TextureGenerator';

export interface InteractableObject {
    id: string;
    type: 'chest' | 'door' | 'switch' | 'npc' | 'resource';
    name: string;
    position: THREE.Vector3;
    mesh: THREE.Object3D;
    interactionRange: number;
    isInteractable: boolean;
    requiresKey?: string;
    onInteract?: (gameState: GameState) => void;
    data?: any; // Additional object-specific data
}

export class InteractionSystem extends EventEmitter {
    private initialized: boolean = false;
    private scene: THREE.Scene | null = null;
    private interactables: Map<string, InteractableObject> = new Map();
    private nextObjectId: number = 1;

    constructor() {
        super('interaction');
    }
    
    initialize(scene: THREE.Scene): void {
        this.scene = scene;
        this.initialized = true;
        
        // Spawn some initial interactive objects
        this.spawnInitialObjects();
        
        console.log('🎯 Interaction system initialized');
    }
    
    private spawnInitialObjects(): void {
        // Spawn some treasure chests
        this.createChest(new THREE.Vector3(8, 0, 8), [
            { id: 'health_potion', name: 'Health Potion', type: 'consumable', quantity: 1, rarity: 'common', properties: { healing: 50 } }
        ]);
        
        this.createChest(new THREE.Vector3(-10, 0, -5), [
            { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', quantity: 1, rarity: 'uncommon', properties: { damage: 15 } }
        ]);
        
        // Spawn some resource nodes
        this.createResourceNode(new THREE.Vector3(15, 0, -10), 'tree', 'wood');
        this.createResourceNode(new THREE.Vector3(-8, 0, 12), 'rock', 'stone');
    }
    
    private createChest(position: THREE.Vector3, items: any[]): string {
        if (!this.scene) return '';
        
        const chestId = `chest_${this.nextObjectId++}`;
        
        // Create chest visual
        const chestGroup = new THREE.Group();
        
        // Generate wood texture for chest
        const woodTexture = TextureGenerator.generateWoodTexture(256);
        
        // Chest base
        const baseGeometry = new THREE.BoxGeometry(1, 0.8, 0.8);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            map: woodTexture,
            color: 0x8b4513,
            roughness: 0.8,
            metalness: 0.0
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.4;
        base.castShadow = true;
        base.receiveShadow = true;
        chestGroup.add(base);
        
        // Chest lid
        const lidGeometry = new THREE.BoxGeometry(1, 0.1, 0.8);
        const lidMaterial = new THREE.MeshStandardMaterial({ 
            map: woodTexture,
            color: 0xa0522d,
            roughness: 0.8,
            metalness: 0.0
        });
        const lid = new THREE.Mesh(lidGeometry, lidMaterial);
        lid.position.y = 0.85;
        lid.castShadow = true;
        lid.receiveShadow = true;
        chestGroup.add(lid);
        
        // Metal bindings with metal texture
        const metalTexture = TextureGenerator.generateMetalTexture(128, 0x444444);
        const bindingGeometry = new THREE.BoxGeometry(1.05, 0.05, 0.05);
        const bindingMaterial = new THREE.MeshStandardMaterial({ 
            map: metalTexture,
            color: 0x666666,
            metalness: 0.8,
            roughness: 0.3
        });
        const binding1 = new THREE.Mesh(bindingGeometry, bindingMaterial);
        binding1.position.set(0, 0.6, 0.35);
        binding1.castShadow = true;
        chestGroup.add(binding1);
        
        const binding2 = new THREE.Mesh(bindingGeometry, bindingMaterial);
        binding2.position.set(0, 0.6, -0.35);
        binding2.castShadow = true;
        chestGroup.add(binding2);
        
        chestGroup.position.copy(position);
        this.scene.add(chestGroup);
        
        const chest: InteractableObject = {
            id: chestId,
            type: 'chest',
            name: 'Treasure Chest',
            position: position.clone(),
            mesh: chestGroup,
            interactionRange: 2.5,
            isInteractable: true,
            data: { items, opened: false },
            onInteract: (gameState: GameState) => {
                if (chest.data.opened) {
                    console.log('📦 This chest is already empty.');
                    return;
                }
                
                chest.data.opened = true;
                chest.isInteractable = false;
                
                // Add items to inventory
                chest.data.items.forEach((item: any) => {
                    gameState.addItem(item);
                    console.log(`📦 Found: ${item.name} x${item.quantity}`);
                });
                
                // Animate chest opening
                const lid = chest.mesh.children[1];
                lid.rotation.x = -Math.PI / 3; // Open lid
                
                // Change chest color to indicate it's been opened
                const baseMaterial = (chest.mesh.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
                baseMaterial.color.setHex(0x654321);
                
                this.emit('chestOpened', { chestId, items: chest.data.items });
            }
        };
        
        this.interactables.set(chestId, chest);
        
        console.log(`📦 Spawned treasure chest at position`, position);
        return chestId;
    }
    
    private createResourceNode(position: THREE.Vector3, nodeType: 'tree' | 'rock', resourceType: string): string {
        if (!this.scene) return '';
        
        const nodeId = `resource_${this.nextObjectId++}`;
        
        let nodeMesh: THREE.Object3D;
        
        if (nodeType === 'tree') {
            // Create a tree with bark texture
            const treeGroup = new THREE.Group();
            
            // Trunk with bark texture
            const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2);
            const barkTexture = TextureGenerator.generateBarkTexture(256);
            const trunkMaterial = new THREE.MeshStandardMaterial({ 
                map: barkTexture,
                roughness: 0.9,
                metalness: 0.0
            });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 1;
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            treeGroup.add(trunk);
            
            // Leaves with better material
            const leavesGeometry = new THREE.SphereGeometry(1.2);
            const leavesMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x228b22,
                roughness: 0.7,
                metalness: 0.0,
                transparent: true,
                opacity: 0.9
            });
            const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
            leaves.position.y = 2.5;
            leaves.castShadow = true;
            leaves.receiveShadow = true;
            treeGroup.add(leaves);
            
            nodeMesh = treeGroup;
        } else {
            // Create a rock with stone texture
            const rockGeometry = new THREE.DodecahedronGeometry(0.8);
            const stoneTexture = TextureGenerator.generateStoneTexture(256);
            const rockMaterial = new THREE.MeshStandardMaterial({ 
                map: stoneTexture,
                roughness: 0.8,
                metalness: 0.0
            });
            nodeMesh = new THREE.Mesh(rockGeometry, rockMaterial);
            nodeMesh.position.y = 0.4;
            nodeMesh.castShadow = true;
            nodeMesh.receiveShadow = true;
        }
        
        nodeMesh.position.copy(position);
        this.scene.add(nodeMesh);
        
        const resourceNode: InteractableObject = {
            id: nodeId,
            type: 'resource',
            name: nodeType === 'tree' ? 'Tree' : 'Rock',
            position: position.clone(),
            mesh: nodeMesh,
            interactionRange: 2.0,
            isInteractable: true,
            data: { 
                resourceType, 
                harvestCount: 0, 
                maxHarvest: nodeType === 'tree' ? 3 : 5,
                respawnTime: 30000 // 30 seconds
            },
            onInteract: (gameState: GameState) => {
                if (resourceNode.data.harvestCount >= resourceNode.data.maxHarvest) {
                    console.log(`🌳 This ${nodeType} has been depleted.`);
                    return;
                }
                
                resourceNode.data.harvestCount++;
                
                // Give resource to player
                const resourceItem = {
                    id: resourceType,
                    name: resourceType.charAt(0).toUpperCase() + resourceType.slice(1),
                    type: 'material',
                    quantity: 1,
                    rarity: 'common' as const,
                    properties: {}
                };
                
                gameState.addItem(resourceItem);
                console.log(`🌳 Harvested: ${resourceItem.name}`);
                
                // Scale down the resource node
                const scaleReduction = 1 - (resourceNode.data.harvestCount / resourceNode.data.maxHarvest) * 0.5;
                resourceNode.mesh.scale.setScalar(scaleReduction);
                
                if (resourceNode.data.harvestCount >= resourceNode.data.maxHarvest) {
                    resourceNode.isInteractable = false;
                    
                    // Schedule respawn
                    setTimeout(() => {
                        resourceNode.data.harvestCount = 0;
                        resourceNode.isInteractable = true;
                        resourceNode.mesh.scale.setScalar(1);
                        console.log(`🌳 ${resourceNode.name} has respawned`);
                    }, resourceNode.data.respawnTime);
                }
                
                this.emit('resourceHarvested', { 
                    nodeId, 
                    resourceType, 
                    remaining: resourceNode.data.maxHarvest - resourceNode.data.harvestCount 
                });
            }
        };
        
        this.interactables.set(nodeId, resourceNode);
        
        console.log(`🌳 Spawned ${nodeType} resource node at position`, position);
        return nodeId;
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
        if (interactable && this.scene) {
            this.scene.remove(interactable.mesh);
            this.interactables.delete(objectId);
            this.emit('objectRemoved', objectId);
        }
    }
    
    getAllInteractables(): InteractableObject[] {
        return Array.from(this.interactables.values());
    }
    
    getInteractable(objectId: string): InteractableObject | undefined {
        return this.interactables.get(objectId);
    }
    
    cleanup(): void {
        // Remove all interactables from scene
        for (const [, interactable] of this.interactables) {
            if (this.scene) {
                this.scene.remove(interactable.mesh);
            }
        }
        
        this.interactables.clear();
        super.cleanup(); // Clear EventBus subscriptions
        this.initialized = false;
        console.log('🎯 Interaction system cleaned up');
    }
}