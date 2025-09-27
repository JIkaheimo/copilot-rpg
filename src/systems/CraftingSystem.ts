import * as THREE from 'three';
import { GameState, InventoryItem } from '@core/GameState';
import { EventBus } from '@core/EventBus';

export type ItemType = string;
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface CraftingMaterial {
    id: string;
    name: string;
    description: string;
    type: 'resource' | 'component' | 'essence';
    rarity: ItemRarity;
    stackSize: number;
    value: number;
}

export interface CraftingRecipe {
    id: string;
    name: string;
    description: string;
    category: CraftingCategory;
    requiredMaterials: { materialId: string; quantity: number }[];
    resultItem: {
        id: string;
        name: string;
        type: ItemType;
        rarity: ItemRarity;
        quantity: number;
        stats?: { [key: string]: number };
    };
    craftingTime: number; // in seconds
    requiredSkillLevel: number;
    experienceGained: number;
    requiresStation?: CraftingStationType;
}

export type CraftingCategory = 'weapon' | 'armor' | 'potion' | 'tool' | 'misc';
export type CraftingStationType = 'forge' | 'alchemy_table' | 'enchanting_table' | 'workbench';
export type CraftingSkill = 'blacksmithing' | 'alchemy' | 'enchanting' | 'carpentry';

export interface CraftingStation {
    id: string;
    type: CraftingStationType;
    position: THREE.Vector3;
    level: number;
    inUse: boolean;
    mesh?: THREE.Mesh;
}

export interface CraftingProgress {
    recipeId: string;
    startTime: number;
    duration: number;
    stationId?: string;
}

export class CraftingSystem {
    private gameState: GameState | null = null;
    private scene: THREE.Scene | null = null;
    private eventBus: EventBus;
    private initialized: boolean = false;
    
    // Crafting data
    private recipes: Map<string, CraftingRecipe> = new Map();
    private materials: Map<string, CraftingMaterial> = new Map();
    private craftingStations: Map<string, CraftingStation> = new Map();
    private activeCrafting: Map<string, CraftingProgress> = new Map(); // playerId -> progress
    
    // Skill levels (could be moved to GameState in future)
    private skillLevels: Map<CraftingSkill, number> = new Map([
        ['blacksmithing', 1],
        ['alchemy', 1],
        ['enchanting', 1],
        ['carpentry', 1]
    ]);

    constructor() {
        this.eventBus = EventBus.getInstance();
        this.initializeRecipesAndMaterials();
    }

    initialize(scene: THREE.Scene, gameState: GameState): void {
        this.scene = scene;
        this.gameState = gameState;
        this.initialized = true;
        
        // Add some crafting stations to the world
        this.createDefaultCraftingStations();
        
        console.log('🔨 Crafting System initialized');
    }

    private initializeRecipesAndMaterials(): void {
        // Define crafting materials
        const materials: CraftingMaterial[] = [
            {
                id: 'iron_ore',
                name: 'Iron Ore',
                description: 'Raw iron ore that can be smelted into ingots',
                type: 'resource',
                rarity: 'common',
                stackSize: 50,
                value: 5
            },
            {
                id: 'iron_ingot',
                name: 'Iron Ingot',
                description: 'Refined iron ready for crafting',
                type: 'component',
                rarity: 'common',
                stackSize: 20,
                value: 15
            },
            {
                id: 'leather',
                name: 'Leather',
                description: 'Tanned animal hide',
                type: 'resource',
                rarity: 'common',
                stackSize: 30,
                value: 8
            },
            {
                id: 'wood',
                name: 'Wood',
                description: 'Sturdy wood for crafting',
                type: 'resource',
                rarity: 'common',
                stackSize: 40,
                value: 3
            },
            {
                id: 'crystal_essence',
                name: 'Crystal Essence',
                description: 'Magical essence extracted from crystals',
                type: 'essence',
                rarity: 'rare',
                stackSize: 10,
                value: 50
            },
            {
                id: 'healing_herb',
                name: 'Healing Herb',
                description: 'Natural herb with healing properties',
                type: 'resource',
                rarity: 'common',
                stackSize: 25,
                value: 12
            }
        ];

        materials.forEach(material => {
            this.materials.set(material.id, material);
        });

        // Define crafting recipes
        const recipes: CraftingRecipe[] = [
            {
                id: 'iron_sword',
                name: 'Iron Sword',
                description: 'A reliable sword made from iron',
                category: 'weapon',
                requiredMaterials: [
                    { materialId: 'iron_ingot', quantity: 3 },
                    { materialId: 'wood', quantity: 1 }
                ],
                resultItem: {
                    id: 'iron_sword',
                    name: 'Iron Sword',
                    type: 'weapon',
                    rarity: 'common',
                    quantity: 1,
                    stats: { damage: 25, durability: 100 }
                },
                craftingTime: 10,
                requiredSkillLevel: 1,
                experienceGained: 15,
                requiresStation: 'forge'
            },
            {
                id: 'leather_armor',
                name: 'Leather Armor',
                description: 'Basic protection made from leather',
                category: 'armor',
                requiredMaterials: [
                    { materialId: 'leather', quantity: 5 },
                    { materialId: 'iron_ingot', quantity: 1 }
                ],
                resultItem: {
                    id: 'leather_armor',
                    name: 'Leather Armor',
                    type: 'armor',
                    rarity: 'common',
                    quantity: 1,
                    stats: { defense: 15, durability: 80 }
                },
                craftingTime: 8,
                requiredSkillLevel: 1,
                experienceGained: 12,
                requiresStation: 'workbench'
            },
            {
                id: 'healing_potion',
                name: 'Healing Potion',
                description: 'Restores health when consumed',
                category: 'potion',
                requiredMaterials: [
                    { materialId: 'healing_herb', quantity: 2 },
                    { materialId: 'crystal_essence', quantity: 1 }
                ],
                resultItem: {
                    id: 'healing_potion',
                    name: 'Healing Potion',
                    type: 'consumable',
                    rarity: 'common',
                    quantity: 3,
                    stats: { healAmount: 50 }
                },
                craftingTime: 5,
                requiredSkillLevel: 1,
                experienceGained: 10,
                requiresStation: 'alchemy_table'
            },
            {
                id: 'steel_sword',
                name: 'Steel Sword',
                description: 'A superior sword crafted from refined steel',
                category: 'weapon',
                requiredMaterials: [
                    { materialId: 'iron_ingot', quantity: 5 },
                    { materialId: 'crystal_essence', quantity: 2 },
                    { materialId: 'wood', quantity: 1 }
                ],
                resultItem: {
                    id: 'steel_sword',
                    name: 'Steel Sword',
                    type: 'weapon',
                    rarity: 'uncommon',
                    quantity: 1,
                    stats: { damage: 40, durability: 150, critChance: 5 }
                },
                craftingTime: 20,
                requiredSkillLevel: 3,
                experienceGained: 30,
                requiresStation: 'forge'
            },
            {
                id: 'wooden_shield',
                name: 'Wooden Shield',
                description: 'A basic shield for protection',
                category: 'armor',
                requiredMaterials: [
                    { materialId: 'wood', quantity: 4 },
                    { materialId: 'iron_ingot', quantity: 1 }
                ],
                resultItem: {
                    id: 'wooden_shield',
                    name: 'Wooden Shield',
                    type: 'shield',
                    rarity: 'common',
                    quantity: 1,
                    stats: { blockChance: 15, durability: 60 }
                },
                craftingTime: 6,
                requiredSkillLevel: 1,
                experienceGained: 8,
                requiresStation: 'workbench'
            }
        ];

        recipes.forEach(recipe => {
            this.recipes.set(recipe.id, recipe);
        });

        console.log(`🔨 Loaded ${materials.length} crafting materials and ${recipes.length} recipes`);
    }

    private createDefaultCraftingStations(): void {
        if (!this.scene) return;

        const stations: Omit<CraftingStation, 'id'>[] = [
            {
                type: 'forge',
                position: new THREE.Vector3(15, 0, 15),
                level: 1,
                inUse: false
            },
            {
                type: 'workbench',
                position: new THREE.Vector3(-12, 0, 18),
                level: 1,
                inUse: false
            },
            {
                type: 'alchemy_table',
                position: new THREE.Vector3(8, 0, -20),
                level: 1,
                inUse: false
            },
            {
                type: 'enchanting_table',
                position: new THREE.Vector3(-18, 0, -15),
                level: 1,
                inUse: false
            }
        ];

        stations.forEach((stationData, index) => {
            const stationId = `station_${stationData.type}_${index}`;
            const station: CraftingStation = {
                id: stationId,
                ...stationData
            };

            // Create visual representation
            station.mesh = this.createStationMesh(station.type);
            station.mesh.position.copy(station.position);
            this.scene!.add(station.mesh);

            this.craftingStations.set(stationId, station);
        });

        console.log(`🔨 Created ${stations.length} crafting stations`);
    }

    private createStationMesh(type: CraftingStationType): THREE.Mesh {
        let geometry: THREE.BufferGeometry;
        let material: THREE.Material;

        switch (type) {
            case 'forge':
                geometry = new THREE.BoxGeometry(2, 1.5, 1.5);
                material = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown
                break;
            case 'workbench':
                geometry = new THREE.BoxGeometry(2.5, 1, 1.5);
                material = new THREE.MeshPhongMaterial({ color: 0xDAA520 }); // Goldenrod
                break;
            case 'alchemy_table':
                geometry = new THREE.CylinderGeometry(1, 1.2, 1.2, 8);
                material = new THREE.MeshPhongMaterial({ color: 0x4B0082 }); // Indigo
                break;
            case 'enchanting_table':
                geometry = new THREE.BoxGeometry(1.8, 1.2, 1.8);
                material = new THREE.MeshPhongMaterial({ 
                    color: 0x483D8B,
                    emissive: 0x191970,
                    emissiveIntensity: 0.3
                }); // Dark slate blue with glow
                break;
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshPhongMaterial({ color: 0x808080 });
        }

        return new THREE.Mesh(geometry, material);
    }

    // Recipe management
    getAvailableRecipes(category?: CraftingCategory): CraftingRecipe[] {
        const recipes = Array.from(this.recipes.values());
        
        if (category) {
            return recipes.filter(recipe => recipe.category === category);
        }
        
        return recipes;
    }

    getCraftableRecipes(category?: CraftingCategory): CraftingRecipe[] {
        if (!this.gameState) return [];

        return this.getAvailableRecipes(category).filter(recipe => {
            return this.canCraftRecipe(recipe.id);
        });
    }

    getRecipe(recipeId: string): CraftingRecipe | undefined {
        return this.recipes.get(recipeId);
    }

    // Crafting validation
    canCraftRecipe(recipeId: string): boolean {
        const recipe = this.recipes.get(recipeId);
        if (!recipe || !this.gameState) return false;

        // Check skill level
        const requiredSkill = this.getRequiredSkillForRecipe(recipe);
        const currentSkillLevel = this.skillLevels.get(requiredSkill) || 0;
        if (currentSkillLevel < recipe.requiredSkillLevel) {
            return false;
        }

        // Check materials
        for (const requirement of recipe.requiredMaterials) {
            const available = this.getMaterialQuantity(requirement.materialId);
            if (available < requirement.quantity) {
                return false;
            }
        }

        // Check crafting station availability (if required)
        if (recipe.requiresStation) {
            const availableStation = this.findAvailableStation(recipe.requiresStation);
            if (!availableStation) {
                return false;
            }
        }

        return true;
    }

    private getRequiredSkillForRecipe(recipe: CraftingRecipe): CraftingSkill {
        // Map recipe categories to skills
        switch (recipe.category) {
            case 'weapon':
            case 'armor':
                return 'blacksmithing';
            case 'potion':
                return 'alchemy';
            case 'tool':
                return 'carpentry';
            default:
                return 'blacksmithing';
        }
    }

    private getMaterialQuantity(materialId: string): number {
        if (!this.gameState) return 0;
        
        // Check in inventory for materials
        const inventoryItem = this.gameState.inventory.find(item => item.id === materialId);
        return inventoryItem?.quantity || 0;
    }

    private findAvailableStation(stationType: CraftingStationType): CraftingStation | null {
        for (const station of this.craftingStations.values()) {
            if (station.type === stationType && !station.inUse) {
                return station;
            }
        }
        return null;
    }

    // Crafting execution
    startCrafting(recipeId: string, playerPosition: THREE.Vector3): boolean {
        if (!this.canCraftRecipe(recipeId)) {
            return false;
        }

        const recipe = this.recipes.get(recipeId);
        if (!recipe) return false;

        // Find and reserve crafting station if needed
        let stationId: string | undefined;
        if (recipe.requiresStation) {
            const station = this.findAvailableStation(recipe.requiresStation);
            if (!station) {
                console.warn(`🔨 No available ${recipe.requiresStation} found`);
                return false;
            }

            // Check if player is close enough to station
            const distance = playerPosition.distanceTo(station.position);
            if (distance > 5) {
                console.warn(`🔨 Player too far from crafting station (${distance.toFixed(1)}m)`);
                return false;
            }

            station.inUse = true;
            stationId = station.id;
        }

        // Consume materials
        for (const requirement of recipe.requiredMaterials) {
            this.consumeMaterial(requirement.materialId, requirement.quantity);
        }

        // Start crafting progress
        const progress: CraftingProgress = {
            recipeId,
            startTime: Date.now(),
            duration: recipe.craftingTime * 1000, // Convert to milliseconds
            stationId
        };

        this.activeCrafting.set('player', progress); // Using 'player' as key for single-player

        console.log(`🔨 Started crafting ${recipe.name} (${recipe.craftingTime}s)`);
        
        // Emit event
        this.eventBus.emit('crafting:started', {
            recipeId,
            recipeName: recipe.name,
            duration: recipe.craftingTime
        });

        return true;
    }

    private consumeMaterial(materialId: string, quantity: number): void {
        if (!this.gameState) return;

        const itemIndex = this.gameState.inventory.findIndex(item => item.id === materialId);
        if (itemIndex !== -1) {
            const item = this.gameState.inventory[itemIndex];
            item.quantity -= quantity;
            
            if (item.quantity <= 0) {
                this.gameState.inventory.splice(itemIndex, 1);
            }
        }
    }

    // Update crafting progress
    update(_deltaTime: number): void {
        if (!this.initialized) return;

        // Update active crafting
        for (const [playerId, progress] of this.activeCrafting.entries()) {
            const elapsed = Date.now() - progress.startTime;
            
            if (elapsed >= progress.duration) {
                // Crafting completed
                this.completeCrafting(playerId);
            }
        }
    }

    private completeCrafting(playerId: string): void {
        const progress = this.activeCrafting.get(playerId);
        if (!progress || !this.gameState) return;

        const recipe = this.recipes.get(progress.recipeId);
        if (!recipe) return;

        // Release crafting station
        if (progress.stationId) {
            const station = this.craftingStations.get(progress.stationId);
            if (station) {
                station.inUse = false;
            }
        }

        // Create result item
        const resultItem: InventoryItem = {
            id: recipe.resultItem.id,
            name: recipe.resultItem.name,
            type: recipe.resultItem.type,
            rarity: recipe.resultItem.rarity,
            quantity: recipe.resultItem.quantity,
            properties: {
                description: recipe.description,
                value: this.calculateItemValue(recipe.resultItem),
                ...recipe.resultItem.stats
            }
        };

        // Add to inventory
        this.gameState.addItem(resultItem);

        // Award experience
        const skill = this.getRequiredSkillForRecipe(recipe);
        this.gainSkillExperience(skill, recipe.experienceGained);

        // Clean up
        this.activeCrafting.delete(playerId);

        console.log(`🔨 Completed crafting ${recipe.name}`);
        
        // Emit events
        this.eventBus.emit('crafting:completed', {
            recipeId: recipe.id,
            recipeName: recipe.name,
            resultItem,
            experienceGained: recipe.experienceGained,
            skill
        });

        this.eventBus.emit('interaction:itemPickedUp'); // For audio system
    }

    private calculateItemValue(item: { rarity: ItemRarity; stats?: { [key: string]: number } }): number {
        let baseValue = 10;
        
        // Rarity multiplier
        switch (item.rarity) {
            case 'common': baseValue *= 1; break;
            case 'uncommon': baseValue *= 2; break;
            case 'rare': baseValue *= 5; break;
            case 'epic': baseValue *= 10; break;
            case 'legendary': baseValue *= 25; break;
        }

        // Add value based on stats
        if (item.stats) {
            const statTotal = Object.values(item.stats).reduce((sum, value) => sum + value, 0);
            baseValue += statTotal * 2;
        }

        return baseValue;
    }

    private gainSkillExperience(skill: CraftingSkill, experience: number): void {
        const currentLevel = this.skillLevels.get(skill) || 1;
        // Simplified skill progression - in a full game this would be more complex
        // const experienceForNextLevel = currentLevel * 100;
        
        // For now, just track that experience was gained
        console.log(`🔨 Gained ${experience} ${skill} experience`);
        
        // Could implement actual skill leveling here
        this.eventBus.emit('crafting:skillExperienceGained', {
            skill,
            experience,
            currentLevel
        });
    }

    // Utility methods
    getCraftingProgress(playerId: string = 'player'): { progress: number; recipe: CraftingRecipe | null } {
        const progress = this.activeCrafting.get(playerId);
        if (!progress) {
            return { progress: 0, recipe: null };
        }

        const elapsed = Date.now() - progress.startTime;
        const progressPercent = Math.min(100, (elapsed / progress.duration) * 100);
        const recipe = this.recipes.get(progress.recipeId) || null;

        return { progress: progressPercent, recipe };
    }

    isCrafting(playerId: string = 'player'): boolean {
        return this.activeCrafting.has(playerId);
    }

    cancelCrafting(playerId: string = 'player'): boolean {
        const progress = this.activeCrafting.get(playerId);
        if (!progress) return false;

        // Release station
        if (progress.stationId) {
            const station = this.craftingStations.get(progress.stationId);
            if (station) {
                station.inUse = false;
            }
        }

        // Return materials (with some loss)
        const recipe = this.recipes.get(progress.recipeId);
        if (recipe && this.gameState) {
            const returnRate = 0.5; // Return 50% of materials
            for (const requirement of recipe.requiredMaterials) {
                const returnQuantity = Math.floor(requirement.quantity * returnRate);
                if (returnQuantity > 0) {
                    const material = this.materials.get(requirement.materialId);
                    if (material) {
                        this.gameState.addItem({
                            id: material.id,
                            name: material.name,
                            type: 'resource',
                            rarity: material.rarity,
                            quantity: returnQuantity,
                            properties: {
                                description: material.description,
                                value: material.value
                            }
                        });
                    }
                }
            }
        }

        this.activeCrafting.delete(playerId);
        
        this.eventBus.emit('crafting:cancelled', {
            recipeId: progress.recipeId
        });

        console.log('🔨 Crafting cancelled');
        return true;
    }

    // Station management
    getCraftingStations(): CraftingStation[] {
        return Array.from(this.craftingStations.values());
    }

    getStationsInRange(position: THREE.Vector3, range: number): CraftingStation[] {
        return this.getCraftingStations().filter(station => {
            return position.distanceTo(station.position) <= range;
        });
    }

    getStationById(stationId: string): CraftingStation | undefined {
        return this.craftingStations.get(stationId);
    }

    // Material and recipe information
    getMaterial(materialId: string): CraftingMaterial | undefined {
        return this.materials.get(materialId);
    }

    getAllMaterials(): CraftingMaterial[] {
        return Array.from(this.materials.values());
    }

    getSkillLevel(skill: CraftingSkill): number {
        return this.skillLevels.get(skill) || 1;
    }

    getSkillLevels(): Map<CraftingSkill, number> {
        return new Map(this.skillLevels);
    }

    // Cleanup
    cleanup(): void {
        // Cancel all active crafting
        for (const playerId of this.activeCrafting.keys()) {
            this.cancelCrafting(playerId);
        }

        // Remove station meshes from scene
        if (this.scene) {
            this.craftingStations.forEach(station => {
                if (station.mesh) {
                    this.scene!.remove(station.mesh);
                    station.mesh.geometry.dispose();
                    if (Array.isArray(station.mesh.material)) {
                        station.mesh.material.forEach(mat => mat.dispose());
                    } else {
                        station.mesh.material.dispose();
                    }
                }
            });
        }

        // Clear collections
        this.craftingStations.clear();
        this.activeCrafting.clear();

        this.initialized = false;
        console.log('🔨 Crafting System cleaned up');
    }
}