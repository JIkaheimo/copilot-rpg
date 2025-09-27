import * as THREE from 'three';

export type WeaponType = 'sword' | 'dagger' | 'bow' | 'staff' | 'axe' | 'mace' | 'spear';
export type WeaponRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type DamageType = 'physical' | 'magical' | 'elemental';

export interface WeaponStats {
    damage: number;
    critChance: number;
    critMultiplier: number;
    speed: number; // Attack speed modifier
    range: number;
    damageType: DamageType;
}

export interface WeaponData {
    id: string;
    name: string;
    type: WeaponType;
    rarity: WeaponRarity;
    stats: WeaponStats;
    description: string;
    visualConfig: WeaponVisualConfig;
    requirements?: {
        level?: number;
        strength?: number;
        dexterity?: number;
        intelligence?: number;
    };
}

export interface WeaponVisualConfig {
    color: number;
    emissiveColor?: number;
    metalness: number;
    roughness: number;
    glowIntensity?: number;
    particleEffect?: string;
    scale: number;
}

export class WeaponInstance {
    private weaponData: WeaponData;
    private mesh: THREE.Group;
    private glowEffect: THREE.PointLight | null = null;
    private enchantmentLevel: number = 0;
    private durability: number = 100;
    private maxDurability: number = 100;

    constructor(weaponData: WeaponData) {
        this.weaponData = weaponData;
        this.mesh = this.createWeaponMesh();
        this.setupVisualEffects();
    }

    private createWeaponMesh(): THREE.Group {
        const weaponGroup = new THREE.Group();
        
        // Create weapon geometry based on type
        const geometry = this.createWeaponGeometry();
        
        // Create material based on rarity and visual config
        const material = this.createWeaponMaterial();
        
        const weaponMesh = new THREE.Mesh(geometry, material);
        weaponMesh.scale.setScalar(this.weaponData.visualConfig.scale);
        weaponMesh.castShadow = true;
        weaponMesh.receiveShadow = true;
        
        weaponGroup.add(weaponMesh);
        
        return weaponGroup;
    }

    private createWeaponGeometry(): THREE.BufferGeometry {
        switch (this.weaponData.type) {
            case 'sword':
                return this.createSwordGeometry();
            case 'dagger':
                return this.createDaggerGeometry();
            case 'bow':
                return this.createBowGeometry();
            case 'staff':
                return this.createStaffGeometry();
            case 'axe':
                return this.createAxeGeometry();
            case 'mace':
                return this.createMaceGeometry();
            case 'spear':
                return this.createSpearGeometry();
            default:
                return new THREE.BoxGeometry(0.1, 1, 0.1);
        }
    }

    private createSwordGeometry(): THREE.BufferGeometry {
        const geometry = new THREE.BufferGeometry();
        
        // Create a simple sword shape using vertices
        const vertices = new Float32Array([
            // Blade
            0, 0, 0,     // tip
            -0.02, -0.8, 0,  // left edge
            0.02, -0.8, 0,   // right edge
            
            // Cross guard
            -0.1, -0.8, 0,
            0.1, -0.8, 0,
            -0.1, -0.85, 0,
            0.1, -0.85, 0,
            
            // Handle
            -0.02, -0.85, 0,
            0.02, -0.85, 0,
            -0.02, -1.1, 0,
            0.02, -1.1, 0,
        ]);
        
        const indices = new Uint16Array([
            // Blade triangle
            0, 1, 2,
            // Cross guard quad
            3, 4, 5, 4, 6, 5,
            // Handle quad  
            7, 8, 9, 8, 10, 9
        ]);
        
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();
        
        return geometry;
    }

    private createDaggerGeometry(): THREE.BufferGeometry {
        const geometry = new THREE.BufferGeometry();
        
        const vertices = new Float32Array([
            // Smaller blade
            0, 0, 0,
            -0.015, -0.4, 0,
            0.015, -0.4, 0,
            
            // Small cross guard
            -0.05, -0.4, 0,
            0.05, -0.4, 0,
            -0.05, -0.42, 0,
            0.05, -0.42, 0,
            
            // Handle
            -0.015, -0.42, 0,
            0.015, -0.42, 0,
            -0.015, -0.6, 0,
            0.015, -0.6, 0,
        ]);
        
        const indices = new Uint16Array([
            0, 1, 2,
            3, 4, 5, 4, 6, 5,
            7, 8, 9, 8, 10, 9
        ]);
        
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();
        
        return geometry;
    }

    private createBowGeometry(): THREE.BufferGeometry {
        // Create a simple bow using a curve
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0, -0.6, 0),
            new THREE.Vector3(0.2, 0, 0),
            new THREE.Vector3(0, 0.6, 0)
        );
        
        return new THREE.TubeGeometry(curve, 20, 0.01, 8, false);
    }

    private createStaffGeometry(): THREE.BufferGeometry {
        // Simple staff - cylinder for handle
        return new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
    }

    private createAxeGeometry(): THREE.BufferGeometry {
        // Simple axe handle
        return new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    }

    private createMaceGeometry(): THREE.BufferGeometry {
        // Simple mace handle
        return new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8);
    }

    private createSpearGeometry(): THREE.BufferGeometry {
        // Simple spear handle
        return new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8);
    }

    private createWeaponMaterial(): THREE.Material {
        const config = this.weaponData.visualConfig;
        const rarityModifier = this.getRarityModifier();
        
        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            metalness: config.metalness,
            roughness: config.roughness,
            emissive: config.emissiveColor ? new THREE.Color(config.emissiveColor) : new THREE.Color(0x000000),
            emissiveIntensity: (config.glowIntensity || 0) * rarityModifier
        });

        return material;
    }

    private getRarityModifier(): number {
        const rarityMultipliers = {
            'common': 1,
            'uncommon': 1.2,
            'rare': 1.5,
            'epic': 2,
            'legendary': 3
        };
        
        return rarityMultipliers[this.weaponData.rarity];
    }

    private setupVisualEffects(): void {
        // Add glow effect for higher rarity weapons
        if (this.weaponData.visualConfig.glowIntensity && this.weaponData.visualConfig.glowIntensity > 0) {
            this.glowEffect = new THREE.PointLight(
                this.weaponData.visualConfig.emissiveColor || 0xffffff,
                this.weaponData.visualConfig.glowIntensity * this.getRarityModifier(),
                2,
                2
            );
            this.mesh.add(this.glowEffect);
        }
    }

    enchant(level: number): void {
        this.enchantmentLevel = level;
        
        // Enhance visual effects based on enchantment
        const meshChild = this.mesh.children[0] as THREE.Mesh;
        const material = meshChild.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = (this.weaponData.visualConfig.glowIntensity || 0) * 
                                    this.getRarityModifier() * (1 + level * 0.2);
        
        if (this.glowEffect) {
            this.glowEffect.intensity = this.weaponData.visualConfig.glowIntensity! * 
                                       this.getRarityModifier() * (1 + level * 0.3);
        }
    }

    repair(amount: number = 100): void {
        this.durability = Math.min(this.maxDurability, this.durability + amount);
    }

    damage(amount: number): void {
        this.durability = Math.max(0, this.durability - amount);
        
        // Visual degradation based on durability
        const meshChild = this.mesh.children[0] as THREE.Mesh;
        const material = meshChild.material as THREE.MeshStandardMaterial;
        const degradation = 1 - (this.durability / this.maxDurability);
        material.roughness = this.weaponData.visualConfig.roughness + degradation * 0.3;
    }

    getStats(): WeaponStats {
        // Apply durability and enchantment modifiers
        const durabilityModifier = this.durability / this.maxDurability;
        const enchantmentModifier = 1 + (this.enchantmentLevel * 0.1);
        
        return {
            damage: this.weaponData.stats.damage * durabilityModifier * enchantmentModifier,
            critChance: this.weaponData.stats.critChance,
            critMultiplier: this.weaponData.stats.critMultiplier + (this.enchantmentLevel * 0.05),
            speed: this.weaponData.stats.speed,
            range: this.weaponData.stats.range,
            damageType: this.weaponData.stats.damageType
        };
    }

    getData(): WeaponData {
        return this.weaponData;
    }

    getMesh(): THREE.Group {
        return this.mesh;
    }

    getDurability(): number {
        return this.durability;
    }

    getMaxDurability(): number {
        return this.maxDurability;
    }

    getEnchantmentLevel(): number {
        return this.enchantmentLevel;
    }

    dispose(): void {
        this.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
}

export class WeaponSystem {
    private weaponTemplates: Map<string, WeaponData> = new Map();
    private equippedWeapon: WeaponInstance | null = null;
    private weaponInventory: Map<string, WeaponInstance> = new Map();
    private listeners: { [event: string]: Function[] } = {};
    
    initialize(): void {
        this.createWeaponTemplates();
        console.log('⚔️ Weapon System initialized');
    }

    // Event handling
    on(event: string, callback: Function): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    private emit(event: string, data?: any): void {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => callback(data));
    }

    private createWeaponTemplates(): void {
        // Common weapons
        this.weaponTemplates.set('iron_sword', {
            id: 'iron_sword',
            name: 'Iron Sword',
            type: 'sword',
            rarity: 'common',
            stats: {
                damage: 15,
                critChance: 0.05,
                critMultiplier: 1.5,
                speed: 1.0,
                range: 1.2,
                damageType: 'physical'
            },
            description: 'A sturdy iron sword, reliable in combat.',
            visualConfig: {
                color: 0x707070,
                metalness: 0.8,
                roughness: 0.2,
                scale: 1.0
            }
        });

        this.weaponTemplates.set('steel_dagger', {
            id: 'steel_dagger',
            name: 'Steel Dagger',
            type: 'dagger',
            rarity: 'uncommon',
            stats: {
                damage: 10,
                critChance: 0.15,
                critMultiplier: 2.0,
                speed: 1.5,
                range: 0.8,
                damageType: 'physical'
            },
            description: 'A quick and deadly steel dagger.',
            visualConfig: {
                color: 0x909090,
                metalness: 0.9,
                roughness: 0.1,
                scale: 1.0
            }
        });

        this.weaponTemplates.set('magic_staff', {
            id: 'magic_staff',
            name: 'Apprentice Staff',
            type: 'staff',
            rarity: 'rare',
            stats: {
                damage: 12,
                critChance: 0.08,
                critMultiplier: 1.8,
                speed: 0.8,
                range: 2.0,
                damageType: 'magical'
            },
            description: 'A staff imbued with magical energy.',
            visualConfig: {
                color: 0x8B4513,
                emissiveColor: 0x4444ff,
                metalness: 0.2,
                roughness: 0.6,
                glowIntensity: 0.3,
                scale: 1.0
            }
        });

        this.weaponTemplates.set('flame_sword', {
            id: 'flame_sword',
            name: 'Flame Sword',
            type: 'sword',
            rarity: 'epic',
            stats: {
                damage: 25,
                critChance: 0.1,
                critMultiplier: 2.2,
                speed: 1.1,
                range: 1.3,
                damageType: 'elemental'
            },
            description: 'A sword wreathed in eternal flames.',
            visualConfig: {
                color: 0xff4400,
                emissiveColor: 0xff6600,
                metalness: 0.7,
                roughness: 0.3,
                glowIntensity: 0.8,
                particleEffect: 'magic',
                scale: 1.1
            },
            requirements: {
                level: 10,
                strength: 15
            }
        });

        this.weaponTemplates.set('legendary_bow', {
            id: 'legendary_bow',
            name: 'Windseeker Bow',
            type: 'bow',
            rarity: 'legendary',
            stats: {
                damage: 30,
                critChance: 0.2,
                critMultiplier: 2.5,
                speed: 1.3,
                range: 4.0,
                damageType: 'physical'
            },
            description: 'A legendary bow that never misses its mark.',
            visualConfig: {
                color: 0x00ff88,
                emissiveColor: 0x00ffaa,
                metalness: 0.4,
                roughness: 0.1,
                glowIntensity: 1.2,
                particleEffect: 'magic',
                scale: 1.2
            },
            requirements: {
                level: 20,
                dexterity: 25
            }
        });
    }

    createWeapon(templateId: string): WeaponInstance | null {
        const template = this.weaponTemplates.get(templateId);
        if (!template) {
            console.warn(`Weapon template '${templateId}' not found`);
            return null;
        }

        return new WeaponInstance(template);
    }

    equipWeapon(weapon: WeaponInstance): void {
        if (this.equippedWeapon) {
            this.unequipWeapon();
        }
        
        this.equippedWeapon = weapon;
    }

    unequipWeapon(): WeaponInstance | null {
        const previousWeapon = this.equippedWeapon;
        this.equippedWeapon = null;
        return previousWeapon;
    }

    getEquippedWeapon(): WeaponInstance | null {
        return this.equippedWeapon;
    }

    addToInventory(weapon: WeaponInstance): void {
        const id = `${weapon.getData().id}_${Date.now()}`;
        this.weaponInventory.set(id, weapon);
        
        // Emit weapon obtained event for achievements
        this.emit('weaponObtained', {
            weaponId: weapon.getData().id,
            rarity: weapon.getData().rarity,
            type: weapon.getData().type
        });
    }

    removeFromInventory(weaponId: string): WeaponInstance | null {
        const weapon = this.weaponInventory.get(weaponId);
        if (weapon) {
            this.weaponInventory.delete(weaponId);
            return weapon;
        }
        return null;
    }

    getInventoryWeapons(): WeaponInstance[] {
        return Array.from(this.weaponInventory.values());
    }

    getWeaponTemplates(): WeaponData[] {
        return Array.from(this.weaponTemplates.values());
    }

    getWeaponTemplate(templateId: string): WeaponData | undefined {
        return this.weaponTemplates.get(templateId);
    }

    // Integration methods
    calculateDamage(baseStats: WeaponStats, target?: any): number {
        let damage = baseStats.damage;
        
        // Apply critical hit
        if (Math.random() < baseStats.critChance) {
            damage *= baseStats.critMultiplier;
        }
        
        // Apply elemental modifiers (if target has resistances)
        if (target?.resistances?.[baseStats.damageType]) {
            damage *= (1 - target.resistances[baseStats.damageType]);
        }
        
        return Math.floor(damage);
    }

    getAttackRange(): number {
        return this.equippedWeapon?.getStats().range || 1.0;
    }

    getAttackSpeed(): number {
        return this.equippedWeapon?.getStats().speed || 1.0;
    }

    canEquipWeapon(weapon: WeaponInstance, playerStats: any): boolean {
        const requirements = weapon.getData().requirements;
        if (!requirements) return true;

        if (requirements.level && playerStats.level < requirements.level) return false;
        if (requirements.strength && playerStats.strength < requirements.strength) return false;
        if (requirements.dexterity && playerStats.dexterity < requirements.dexterity) return false;
        if (requirements.intelligence && playerStats.intelligence < requirements.intelligence) return false;

        return true;
    }

    cleanup(): void {
        // Dispose of all weapons
        this.weaponInventory.forEach(weapon => weapon.dispose());
        this.weaponInventory.clear();
        
        if (this.equippedWeapon) {
            this.equippedWeapon.dispose();
            this.equippedWeapon = null;
        }
    }
}