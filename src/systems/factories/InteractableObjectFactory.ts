import * as THREE from 'three';
import { GameState, InventoryItem } from '@core/GameState';
import { TextureGenerator } from '../../utils/TextureGenerator';
import { AnimationSystem } from '../AnimationSystem';
import { AnimationPresets } from '../AnimationPresets';

/**
 * Interface defining the contract for interactable objects
 * Following Interface Segregation Principle
 */
export interface IInteractable {
    id: string;
    type: 'chest' | 'door' | 'switch' | 'npc' | 'resource';
    name: string;
    position: THREE.Vector3;
    mesh: THREE.Object3D;
    interactionRange: number;
    isInteractable: boolean;
    requiresKey?: string;
    onInteract?: (gameState: GameState) => void;
    data?: any;
}

/**
 * Interface for object creation strategies
 * Following Strategy Pattern and Open/Closed Principle
 */
export interface IInteractableCreator {
    create(position: THREE.Vector3, config: any): IInteractable;
    getType(): string;
}

/**
 * Factory for creating interactable objects
 * Following Factory Pattern and Single Responsibility Principle
 * Open for extension (new object types) but closed for modification
 */
export class InteractableObjectFactory {
    private creators: Map<string, IInteractableCreator> = new Map();
    private nextObjectId: number = 1;
    private animationSystem: AnimationSystem | null = null;

    constructor() {
        this.registerDefaultCreators();
    }

    setAnimationSystem(animationSystem: AnimationSystem): void {
        this.animationSystem = animationSystem;
    }

    /**
     * Register default object creators
     * Following Open/Closed Principle - can be extended without modification
     */
    private registerDefaultCreators(): void {
        this.registerCreator(new ChestCreator());
        this.registerCreator(new TreeCreator());
        this.registerCreator(new RockCreator());
    }

    /**
     * Register a new object creator
     * Following Open/Closed Principle
     */
    registerCreator(creator: IInteractableCreator): void {
        this.creators.set(creator.getType(), creator);
    }

    /**
     * Create an interactable object
     * Following Factory Pattern
     */
    createInteractable(type: string, position: THREE.Vector3, config: any = {}): IInteractable {
        const creator = this.creators.get(type);
        if (!creator) {
            throw new Error(`Unknown interactable type: ${type}`);
        }

        const obj = creator.create(position, {
            ...config,
            id: `${type}_${this.nextObjectId++}`,
            animationSystem: this.animationSystem
        });

        return obj;
    }

    /**
     * Get all registered object types
     */
    getRegisteredTypes(): string[] {
        return Array.from(this.creators.keys());
    }
}

/**
 * Creator for treasure chests
 * Following Single Responsibility Principle
 */
export class ChestCreator implements IInteractableCreator {
    getType(): string {
        return 'chest';
    }

    create(position: THREE.Vector3, config: any): IInteractable {
        const { id, items = [], animationSystem } = config;
        
        // Create chest geometry
        const chestGroup = new THREE.Group();
        
        // Base of chest
        const baseGeometry = new THREE.BoxGeometry(1, 0.6, 0.8);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.3;
        base.castShadow = true;
        base.receiveShadow = true;
        chestGroup.add(base);
        
        // Lid of chest
        const lidGeometry = new THREE.BoxGeometry(1, 0.4, 0.8);
        const lidMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });
        const lid = new THREE.Mesh(lidGeometry, lidMaterial);
        lid.position.y = 0.8;
        lid.castShadow = true;
        lid.receiveShadow = true;
        chestGroup.add(lid);
        
        chestGroup.position.copy(position);

        const chest: IInteractable = {
            id,
            type: 'chest',
            name: 'Treasure Chest',
            position: position.clone(),
            mesh: chestGroup,
            interactionRange: 2.0,
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
                items.forEach((item: InventoryItem) => {
                    gameState.addItem(item);
                    console.log(`📦 Found: ${item.name}`);
                });
                
                // Animate chest opening
                if (animationSystem) {
                    AnimationPresets.createChestOpenAnimation(`${id}_open`, chestGroup.children[1] as THREE.Object3D);
                } else {
                    // Fallback: instant opening
                    const chestLid = chestGroup.children[1];
                    chestLid.rotation.x = -Math.PI / 3; // Open lid
                }
                
                // Change chest color to indicate it's been opened
                const chestBaseMaterial = (chestGroup.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
                chestBaseMaterial.color.setHex(0x654321);
            }
        };

        return chest;
    }
}

/**
 * Creator for tree resource nodes
 * Following Single Responsibility Principle
 */
export class TreeCreator implements IInteractableCreator {
    getType(): string {
        return 'tree';
    }

    create(position: THREE.Vector3, config: any): IInteractable {
        const { id, resourceType = 'wood' } = config;
        
        // Create tree geometry
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
        
        // Leaves
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
        
        treeGroup.position.copy(position);

        const tree: IInteractable = {
            id,
            type: 'resource',
            name: 'Tree',
            position: position.clone(),
            mesh: treeGroup,
            interactionRange: 2.0,
            isInteractable: true,
            data: { 
                resourceType, 
                harvestCount: 0, 
                maxHarvest: 3,
                respawnTime: 30000 // 30 seconds
            },
            onInteract: () => {} // Will be set below
        };

        // Create harvest interaction with proper closure
        tree.onInteract = (gameState: GameState) => {
            if (tree.data.harvestCount >= tree.data.maxHarvest) {
                console.log('🌳 This tree has been depleted.');
                return;
            }
            
            tree.data.harvestCount++;
            
            // Give resource to player
            const resourceItem = {
                id: resourceType,
                name: resourceType.charAt(0).toUpperCase() + resourceType.slice(1),
                type: 'material' as const,
                quantity: 1,
                rarity: 'common' as const,
                properties: {}
            };
            
            gameState.addItem(resourceItem);
            console.log(`🌳 Harvested: ${resourceItem.name}`);
            
            // Scale down the tree
            const scaleReduction = 1 - (tree.data.harvestCount / tree.data.maxHarvest) * 0.5;
            tree.mesh.scale.setScalar(scaleReduction);
            
            if (tree.data.harvestCount >= tree.data.maxHarvest) {
                tree.isInteractable = false;
                
                // Schedule respawn
                setTimeout(() => {
                    tree.data.harvestCount = 0;
                    tree.isInteractable = true;
                    tree.mesh.scale.setScalar(1);
                    console.log('🌳 Tree has respawned');
                }, tree.data.respawnTime);
            }
        };

        return tree;
    }
}

/**
 * Creator for rock resource nodes
 * Following Single Responsibility Principle
 */
export class RockCreator implements IInteractableCreator {
    getType(): string {
        return 'rock';
    }

    create(position: THREE.Vector3, config: any): IInteractable {
        const { id, resourceType = 'stone' } = config;
        
        // Create rock geometry
        const rockGeometry = new THREE.DodecahedronGeometry(0.8);
        const stoneTexture = TextureGenerator.generateStoneTexture(256);
        const rockMaterial = new THREE.MeshStandardMaterial({ 
            map: stoneTexture,
            roughness: 0.8,
            metalness: 0.0
        });
        const rockMesh = new THREE.Mesh(rockGeometry, rockMaterial);
        rockMesh.position.copy(position);
        rockMesh.position.y = 0.4;
        rockMesh.castShadow = true;
        rockMesh.receiveShadow = true;

        const rock: IInteractable = {
            id,
            type: 'resource',
            name: 'Rock',
            position: position.clone(),
            mesh: rockMesh,
            interactionRange: 2.0,
            isInteractable: true,
            data: { 
                resourceType, 
                harvestCount: 0, 
                maxHarvest: 5,
                respawnTime: 30000 // 30 seconds
            },
            onInteract: () => {} // Will be set below
        };

        // Create harvest interaction with proper closure
        rock.onInteract = (gameState: GameState) => {
            if (rock.data.harvestCount >= rock.data.maxHarvest) {
                console.log('🪨 This rock has been depleted.');
                return;
            }
            
            rock.data.harvestCount++;
            
            // Give resource to player
            const resourceItem = {
                id: resourceType,
                name: resourceType.charAt(0).toUpperCase() + resourceType.slice(1),
                type: 'material' as const,
                quantity: 1,
                rarity: 'common' as const,
                properties: {}
            };
            
            gameState.addItem(resourceItem);
            console.log(`🪨 Harvested: ${resourceItem.name}`);
            
            // Scale down the rock
            const scaleReduction = 1 - (rock.data.harvestCount / rock.data.maxHarvest) * 0.5;
            rock.mesh.scale.setScalar(scaleReduction);
            
            if (rock.data.harvestCount >= rock.data.maxHarvest) {
                rock.isInteractable = false;
                
                // Schedule respawn
                setTimeout(() => {
                    rock.data.harvestCount = 0;
                    rock.isInteractable = true;
                    rock.mesh.scale.setScalar(1);
                    console.log('🪨 Rock has respawned');
                }, rock.data.respawnTime);
            }
        };

        return rock;
    }
}