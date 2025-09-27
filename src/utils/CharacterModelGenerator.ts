import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';

export interface CharacterModelConfig {
    height: number;
    bodyColor: number;
    clothingColor: number;
    hairColor: number;
    eyeColor: number;
    skinTone: number;
    equipmentConfig?: EquipmentConfig;
    isPlayer?: boolean;
}

export interface EquipmentConfig {
    helmet?: HelmetType;
    chestplate?: ChestplateType;
    weapon?: WeaponType;
    shield?: boolean;
}

export type HelmetType = 'none' | 'leather' | 'iron' | 'gold' | 'diamond';
export type ChestplateType = 'none' | 'leather' | 'chainmail' | 'iron' | 'gold' | 'diamond';
export type WeaponType = 'none' | 'sword' | 'axe' | 'bow' | 'staff' | 'dagger';

export class CharacterModelGenerator {
    /**
     * Generate a detailed humanoid character model with equipment
     */
    static generateCharacterModel(config: CharacterModelConfig): THREE.Group {
        const character = new THREE.Group();
        character.name = config.isPlayer ? 'Player' : 'Character';

        // Create character body parts
        const torso = this.createTorso(config);
        const head = this.createHead(config);
        const leftArm = this.createArm(config, 'left');
        const rightArm = this.createArm(config, 'right');
        const leftLeg = this.createLeg(config, 'left');
        const rightLeg = this.createLeg(config, 'right');

        // Position body parts
        torso.position.set(0, 0.8, 0);
        head.position.set(0, 1.4, 0);
        leftArm.position.set(-0.4, 1.0, 0);
        rightArm.position.set(0.4, 1.0, 0);
        leftLeg.position.set(-0.15, 0.1, 0);
        rightLeg.position.set(0.15, 0.1, 0);

        // Add body parts to character
        character.add(torso);
        character.add(head);
        character.add(leftArm);
        character.add(rightArm);
        character.add(leftLeg);
        character.add(rightLeg);

        // Add equipment if specified
        if (config.equipmentConfig) {
            this.addEquipment(character, config);
        }

        // Scale character to desired height
        const baseHeight = 1.8; // Base height
        const scale = config.height / baseHeight;
        character.scale.setScalar(scale);

        // Enable shadows
        character.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return character;
    }

    private static createTorso(config: CharacterModelConfig): THREE.Group {
        const torso = new THREE.Group();

        // Main torso
        const torsoGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.2);
        const skinTexture = this.generateSkinTexture(config.skinTone);
        const torsoMaterial = new THREE.MeshStandardMaterial({
            map: skinTexture,
            color: config.skinTone,
            roughness: 0.7,
            metalness: 0.0
        });
        const torsoMesh = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.add(torsoMesh);

        // Chest detail (shirt/tunic)
        const chestGeometry = new THREE.BoxGeometry(0.42, 0.4, 0.22);
        const clothTexture = this.generateClothTexture(config.clothingColor);
        const chestMaterial = new THREE.MeshStandardMaterial({
            map: clothTexture,
            color: config.clothingColor,
            roughness: 0.8,
            metalness: 0.0
        });
        const chestMesh = new THREE.Mesh(chestGeometry, chestMaterial);
        chestMesh.position.y = 0.1;
        torso.add(chestMesh);

        return torso;
    }

    private static createHead(config: CharacterModelConfig): THREE.Group {
        const head = new THREE.Group();

        // Main head
        const headGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
        const skinTexture = this.generateSkinTexture(config.skinTone);
        const headMaterial = new THREE.MeshStandardMaterial({
            map: skinTexture,
            color: config.skinTone,
            roughness: 0.6,
            metalness: 0.0
        });
        const headMesh = new THREE.Mesh(headGeometry, headMaterial);
        head.add(headMesh);

        // Hair
        const hairGeometry = new THREE.BoxGeometry(0.27, 0.15, 0.27);
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: config.hairColor,
            roughness: 0.9,
            metalness: 0.0
        });
        const hairMesh = new THREE.Mesh(hairGeometry, hairMaterial);
        hairMesh.position.y = 0.15;
        head.add(hairMesh);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.03, 6, 4);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: config.eyeColor,
            emissive: config.eyeColor,
            emissiveIntensity: 0.1,
            roughness: 0.2,
            metalness: 0.0
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.06, 0.03, 0.12);
        head.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.06, 0.03, 0.12);
        head.add(rightEye);

        // Nose (small detail)
        const noseGeometry = new THREE.BoxGeometry(0.02, 0.03, 0.02);
        const noseMaterial = new THREE.MeshStandardMaterial({
            color: config.skinTone,
            roughness: 0.6,
            metalness: 0.0
        });
        const noseMesh = new THREE.Mesh(noseGeometry, noseMaterial);
        noseMesh.position.set(0, -0.02, 0.12);
        head.add(noseMesh);

        return head;
    }

    private static createArm(config: CharacterModelConfig, _side: 'left' | 'right'): THREE.Group {
        const arm = new THREE.Group();

        // Upper arm
        const upperArmGeometry = new THREE.BoxGeometry(0.12, 0.4, 0.12);
        const skinTexture = this.generateSkinTexture(config.skinTone);
        const upperArmMaterial = new THREE.MeshStandardMaterial({
            map: skinTexture,
            color: config.skinTone,
            roughness: 0.7,
            metalness: 0.0
        });
        const upperArmMesh = new THREE.Mesh(upperArmGeometry, upperArmMaterial);
        upperArmMesh.position.y = -0.2;
        arm.add(upperArmMesh);

        // Lower arm (sleeve)
        const lowerArmGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
        const clothTexture = this.generateClothTexture(config.clothingColor);
        const lowerArmMaterial = new THREE.MeshStandardMaterial({
            map: clothTexture,
            color: config.clothingColor,
            roughness: 0.8,
            metalness: 0.0
        });
        const lowerArmMesh = new THREE.Mesh(lowerArmGeometry, lowerArmMaterial);
        lowerArmMesh.position.y = -0.5;
        arm.add(lowerArmMesh);

        // Hand
        const handGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        const handMaterial = new THREE.MeshStandardMaterial({
            map: skinTexture,
            color: config.skinTone,
            roughness: 0.7,
            metalness: 0.0
        });
        const handMesh = new THREE.Mesh(handGeometry, handMaterial);
        handMesh.position.y = -0.7;
        arm.add(handMesh);

        return arm;
    }

    private static createLeg(config: CharacterModelConfig, _side: 'left' | 'right'): THREE.Group {
        const leg = new THREE.Group();

        // Upper leg
        const upperLegGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.15);
        const clothTexture = this.generateClothTexture(config.clothingColor);
        const upperLegMaterial = new THREE.MeshStandardMaterial({
            map: clothTexture,
            color: config.clothingColor,
            roughness: 0.8,
            metalness: 0.0
        });
        const upperLegMesh = new THREE.Mesh(upperLegGeometry, upperLegMaterial);
        upperLegMesh.position.y = -0.2;
        leg.add(upperLegMesh);

        // Lower leg
        const lowerLegGeometry = new THREE.BoxGeometry(0.12, 0.35, 0.12);
        const lowerLegMaterial = new THREE.MeshStandardMaterial({
            map: clothTexture,
            color: config.clothingColor,
            roughness: 0.8,
            metalness: 0.0
        });
        const lowerLegMesh = new THREE.Mesh(lowerLegGeometry, lowerLegMaterial);
        lowerLegMesh.position.y = -0.475;
        leg.add(lowerLegMesh);

        // Foot (boot)
        const footGeometry = new THREE.BoxGeometry(0.1, 0.08, 0.2);
        const bootMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3728, // Brown boot color
            roughness: 0.9,
            metalness: 0.0
        });
        const footMesh = new THREE.Mesh(footGeometry, bootMaterial);
        footMesh.position.set(0, -0.68, 0.05);
        leg.add(footMesh);

        return leg;
    }

    private static addEquipment(character: THREE.Group, config: CharacterModelConfig): void {
        if (!config.equipmentConfig) return;

        const equipment = config.equipmentConfig;

        // Add helmet
        if (equipment.helmet && equipment.helmet !== 'none') {
            const helmet = this.createHelmet(equipment.helmet);
            const head = character.children[1]; // Head is the second child (index 1)
            if (head) {
                helmet.position.set(0, 0.05, 0);
                head.add(helmet);
            }
        }

        // Add chestplate
        if (equipment.chestplate && equipment.chestplate !== 'none') {
            const chestplate = this.createChestplate(equipment.chestplate);
            const torso = character.children[0]; // Torso is the first child (index 0)
            if (torso) {
                torso.add(chestplate);
            }
        }

        // Add weapon to right hand
        if (equipment.weapon && equipment.weapon !== 'none') {
            const weapon = this.createWeapon(equipment.weapon);
            const rightArm = character.children[3]; // Right arm is the fourth child (index 3)
            if (rightArm && rightArm.children.length > 0) {
                const hand = rightArm.children[rightArm.children.length - 1];
                if (hand) {
                    weapon.position.set(0, -0.15, 0);
                    weapon.rotation.x = Math.PI / 2;
                    hand.add(weapon);
                }
            }
        }

        // Add shield to left hand
        if (equipment.shield) {
            const shield = this.createShield();
            const leftArm = character.children[2]; // Left arm is the third child (index 2)
            if (leftArm && leftArm.children.length > 0) {
                const hand = leftArm.children[leftArm.children.length - 1];
                if (hand) {
                    shield.position.set(0, -0.1, 0);
                    hand.add(shield);
                }
            }
        }
    }

    private static createHelmet(type: HelmetType): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(0.3, 0.2, 0.3);
        let material: THREE.MeshStandardMaterial;

        switch (type) {
            case 'leather':
                material = new THREE.MeshStandardMaterial({
                    color: 0x8B4513,
                    roughness: 0.9,
                    metalness: 0.0
                });
                break;
            case 'iron':
                material = new THREE.MeshStandardMaterial({
                    color: 0x888888,
                    roughness: 0.3,
                    metalness: 0.8
                });
                break;
            case 'gold':
                material = new THREE.MeshStandardMaterial({
                    color: 0xFFD700,
                    roughness: 0.2,
                    metalness: 0.9
                });
                break;
            case 'diamond':
                material = new THREE.MeshStandardMaterial({
                    color: 0x87CEEB,
                    roughness: 0.1,
                    metalness: 0.9,
                    emissive: 0x004466,
                    emissiveIntensity: 0.2
                });
                break;
            default:
                material = new THREE.MeshStandardMaterial({ color: 0x666666 });
        }

        return new THREE.Mesh(geometry, material);
    }

    private static createChestplate(type: ChestplateType): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(0.45, 0.65, 0.25);
        let material: THREE.MeshStandardMaterial;

        switch (type) {
            case 'leather':
                material = new THREE.MeshStandardMaterial({
                    color: 0x8B4513,
                    roughness: 0.9,
                    metalness: 0.0
                });
                break;
            case 'chainmail':
                material = new THREE.MeshStandardMaterial({
                    color: 0x666666,
                    roughness: 0.6,
                    metalness: 0.5
                });
                break;
            case 'iron':
                material = new THREE.MeshStandardMaterial({
                    color: 0x888888,
                    roughness: 0.3,
                    metalness: 0.8
                });
                break;
            case 'gold':
                material = new THREE.MeshStandardMaterial({
                    color: 0xFFD700,
                    roughness: 0.2,
                    metalness: 0.9
                });
                break;
            case 'diamond':
                material = new THREE.MeshStandardMaterial({
                    color: 0x87CEEB,
                    roughness: 0.1,
                    metalness: 0.9,
                    emissive: 0x004466,
                    emissiveIntensity: 0.2
                });
                break;
            default:
                material = new THREE.MeshStandardMaterial({ color: 0x666666 });
        }

        return new THREE.Mesh(geometry, material);
    }

    private static createWeapon(type: WeaponType): THREE.Group {
        const weapon = new THREE.Group();

        switch (type) {
            case 'sword':
                weapon.add(this.createSword());
                break;
            case 'axe':
                weapon.add(this.createAxe());
                break;
            case 'bow':
                weapon.add(this.createBow());
                break;
            case 'staff':
                weapon.add(this.createStaff());
                break;
            case 'dagger':
                weapon.add(this.createDagger());
                break;
        }

        return weapon;
    }

    private static createSword(): THREE.Group {
        const sword = new THREE.Group();

        // Blade
        const bladeGeometry = new THREE.BoxGeometry(0.03, 0.5, 0.01);
        const bladeMaterial = new THREE.MeshStandardMaterial({
            color: 0xCCCCCC,
            roughness: 0.1,
            metalness: 0.9
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 0.3;
        sword.add(blade);

        // Hilt
        const hiltGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.02);
        const hiltMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.0
        });
        const hilt = new THREE.Mesh(hiltGeometry, hiltMaterial);
        sword.add(hilt);

        // Handle
        const handleGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.15);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.9,
            metalness: 0.0
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.075;
        sword.add(handle);

        return sword;
    }

    private static createAxe(): THREE.Group {
        const axe = new THREE.Group();

        // Handle
        const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.0
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        axe.add(handle);

        // Axe head
        const headGeometry = new THREE.BoxGeometry(0.2, 0.08, 0.03);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.3,
            metalness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.15;
        axe.add(head);

        return axe;
    }

    private static createBow(): THREE.Group {
        const bow = new THREE.Group();

        // Main arc using a curved cylinder geometry instead of TorusGeometry
        const arcGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.4, 8);
        const arcMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.0
        });
        
        // Create a curved bow shape using multiple segments
        const leftArc = new THREE.Mesh(arcGeometry, arcMaterial);
        leftArc.position.x = -0.15;
        leftArc.rotation.z = Math.PI / 6;
        bow.add(leftArc);
        
        const rightArc = new THREE.Mesh(arcGeometry, arcMaterial);
        rightArc.position.x = 0.15;
        rightArc.rotation.z = -Math.PI / 6;
        bow.add(rightArc);

        // Bow string
        const stringGeometry = new THREE.CylinderGeometry(0.002, 0.002, 0.35);
        const stringMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.8,
            metalness: 0.0
        });
        const bowString = new THREE.Mesh(stringGeometry, stringMaterial);
        bowString.position.set(0, 0, -0.05);
        bow.add(bowString);

        return bow;
    }

    private static createStaff(): THREE.Group {
        const staff = new THREE.Group();

        // Staff shaft
        const shaftGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.6);
        const shaftMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.0
        });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        staff.add(shaft);

        // Crystal orb at top
        const orbGeometry = new THREE.SphereGeometry(0.04, 8, 6);
        const orbMaterial = new THREE.MeshStandardMaterial({
            color: 0x9932CC,
            roughness: 0.1,
            metalness: 0.0,
            emissive: 0x4B0082,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.y = 0.35;
        staff.add(orb);

        return staff;
    }

    private static createDagger(): THREE.Group {
        const dagger = new THREE.Group();

        // Blade
        const bladeGeometry = new THREE.BoxGeometry(0.02, 0.25, 0.005);
        const bladeMaterial = new THREE.MeshStandardMaterial({
            color: 0xCCCCCC,
            roughness: 0.1,
            metalness: 0.9
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 0.15;
        dagger.add(blade);

        // Handle
        const handleGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.1);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.9,
            metalness: 0.0
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.05;
        dagger.add(handle);

        return dagger;
    }

    private static createShield(): THREE.Mesh {
        const geometry = new THREE.CylinderGeometry(0.15, 0.15, 0.02, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8,
            metalness: 0.1
        });
        return new THREE.Mesh(geometry, material);
    }

    private static generateSkinTexture(skinTone: number): THREE.Texture {
        return TextureGenerator.generateMetalTexture(64, skinTone);
    }

    private static generateClothTexture(_clothColor: number): THREE.Texture {
        return TextureGenerator.generateWoodTexture(64);
    }

    /**
     * Create enemy-specific character variations
     */
    static generateEnemyModel(enemyType: string, level: number): THREE.Group {
        const config = this.getEnemyConfig(enemyType, level);
        return this.generateCharacterModel(config);
    }

    private static getEnemyConfig(enemyType: string, level: number): CharacterModelConfig {
        const baseHeight = 1.5 + (level - 1) * 0.1;
        
        switch (enemyType.toLowerCase()) {
            case 'goblin':
                return {
                    height: baseHeight * 0.8, // Smaller than humans
                    bodyColor: 0x2d5016,
                    clothingColor: 0x8B4513,
                    hairColor: 0x228B22,
                    eyeColor: 0xff0000,
                    skinTone: 0x2d5016,
                    equipmentConfig: {
                        weapon: level > 2 ? 'sword' : 'dagger',
                        helmet: level > 3 ? 'leather' : 'none'
                    }
                };
            case 'orc':
                return {
                    height: baseHeight * 1.3, // Larger than humans (increased from 1.2)
                    bodyColor: 0x4a5d23,
                    clothingColor: 0x654321,
                    hairColor: 0x2F4F2F,
                    eyeColor: 0xff4500,
                    skinTone: 0x4a5d23,
                    equipmentConfig: {
                        weapon: level > 1 ? 'axe' : 'sword',
                        chestplate: level > 2 ? 'leather' : 'none',
                        helmet: level > 4 ? 'iron' : 'none'
                    }
                };
            case 'skeleton':
                return {
                    height: baseHeight,
                    bodyColor: 0xF5F5DC,
                    clothingColor: 0x696969,
                    hairColor: 0x2F4F4F,
                    eyeColor: 0x00ff00,
                    skinTone: 0xF5F5DC,
                    equipmentConfig: {
                        weapon: level > 1 ? 'sword' : 'dagger',
                        shield: level > 3
                    }
                };
            case 'wolf':
                // Special case - wolves need different model
                return {
                    height: baseHeight * 0.6,
                    bodyColor: 0x654321,
                    clothingColor: 0x8B4513,
                    hairColor: 0x654321,
                    eyeColor: 0xffff00,
                    skinTone: 0x654321
                };
            default:
                return {
                    height: baseHeight,
                    bodyColor: 0x8B4513,
                    clothingColor: 0x4169E1,
                    hairColor: 0x654321,
                    eyeColor: 0x0000ff,
                    skinTone: 0xF5DEB3
                };
        }
    }

    /**
     * Create player character with customization options
     */
    static generatePlayerModel(customization?: Partial<CharacterModelConfig>): THREE.Group {
        const defaultConfig: CharacterModelConfig = {
            height: 1.8,
            bodyColor: 0x4169E1,
            clothingColor: 0x4169E1,
            hairColor: 0x8B4513,
            eyeColor: 0x0080ff,
            skinTone: 0xF5DEB3,
            equipmentConfig: {
                weapon: 'sword',
                chestplate: 'leather',
                helmet: 'none'
            },
            isPlayer: true
        };

        const config = { ...defaultConfig, ...customization };
        return this.generateCharacterModel(config);
    }
}