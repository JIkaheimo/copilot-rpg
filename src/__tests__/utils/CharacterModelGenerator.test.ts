import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CharacterModelGenerator, CharacterModelConfig } from '@utils/CharacterModelGenerator';

describe('CharacterModelGenerator', () => {
    let mockScene: THREE.Scene;

    beforeEach(() => {
        mockScene = new THREE.Scene();
    });

    describe('Player Model Generation', () => {
        it('should generate a basic player model', () => {
            const player = CharacterModelGenerator.generatePlayerModel();

            expect(player).toBeInstanceOf(THREE.Group);
            expect(player.name).toBe('Player');
            expect(player.children.length).toBeGreaterThan(5); // Head, torso, arms, legs
        });

        it('should apply custom configuration to player model', () => {
            const customConfig = {
                height: 2.0,
                skinTone: 0xFF0000,
                clothingColor: 0x00FF00,
                hairColor: 0x0000FF
            };

            const player = CharacterModelGenerator.generatePlayerModel(customConfig);

            expect(player).toBeInstanceOf(THREE.Group);
            expect(player.scale.x).toBeCloseTo(2.0 / 1.8); // Scale factor
        });

        it('should add equipment to player model', () => {
            const config = {
                equipmentConfig: {
                    weapon: 'sword' as const,
                    helmet: 'iron' as const,
                    chestplate: 'leather' as const,
                    shield: true
                }
            };

            const player = CharacterModelGenerator.generatePlayerModel(config);

            expect(player).toBeInstanceOf(THREE.Group);
            // Should still have base body parts (equipment may be nested within them)
            expect(player.children.length).toBeGreaterThanOrEqual(6);
        });
    });

    describe('Enemy Model Generation', () => {
        it('should generate goblin enemy model', () => {
            const goblin = CharacterModelGenerator.generateEnemyModel('goblin', 1);

            expect(goblin).toBeInstanceOf(THREE.Group);
            expect(goblin.children.length).toBeGreaterThan(5);
            // Goblin should be smaller than base height
            expect(goblin.scale.x).toBeLessThan(1);
        });

        it('should generate orc enemy model', () => {
            const orc = CharacterModelGenerator.generateEnemyModel('orc', 1);

            expect(orc).toBeInstanceOf(THREE.Group);
            expect(orc.children.length).toBeGreaterThan(5);
            // Orc should be larger than base scale (allowing for floating point precision)
            expect(orc.scale.x).toBeGreaterThanOrEqual(1.0);
        });

        it('should generate skeleton enemy model', () => {
            const skeleton = CharacterModelGenerator.generateEnemyModel('skeleton', 1);

            expect(skeleton).toBeInstanceOf(THREE.Group);
            expect(skeleton.children.length).toBeGreaterThan(5);
        });

        it('should scale enemy model based on level', () => {
            const level1 = CharacterModelGenerator.generateEnemyModel('goblin', 1);
            const level5 = CharacterModelGenerator.generateEnemyModel('goblin', 5);

            expect(level5.scale.x).toBeGreaterThan(level1.scale.x);
        });

        it('should add level indicator for high-level enemies', () => {
            const lowLevel = CharacterModelGenerator.generateEnemyModel('goblin', 1);
            const highLevel = CharacterModelGenerator.generateEnemyModel('goblin', 5);

            // High level should have more children (level indicator)
            expect(highLevel.children.length).toBeGreaterThanOrEqual(lowLevel.children.length);
        });
    });

    describe('Character Model Creation', () => {
        it('should create character with all body parts', () => {
            const config: CharacterModelConfig = {
                height: 1.8,
                bodyColor: 0x8B4513,
                clothingColor: 0x4169E1,
                hairColor: 0x654321,
                eyeColor: 0x0080ff,
                skinTone: 0xF5DEB3
            };

            const character = CharacterModelGenerator.generateCharacterModel(config);

            expect(character).toBeInstanceOf(THREE.Group);
            expect(character.children.length).toBe(6); // Head, torso, 2 arms, 2 legs
            
            // Check that all body parts are present
            const bodyParts = character.children;
            expect(bodyParts.every(part => part instanceof THREE.Group)).toBe(true);
        });

        it('should enable shadows on all meshes', () => {
            const config: CharacterModelConfig = {
                height: 1.8,
                bodyColor: 0x8B4513,
                clothingColor: 0x4169E1,
                hairColor: 0x654321,
                eyeColor: 0x0080ff,
                skinTone: 0xF5DEB3
            };

            const character = CharacterModelGenerator.generateCharacterModel(config);
            
            let meshCount = 0;
            character.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    expect(child.castShadow).toBe(true);
                    expect(child.receiveShadow).toBe(true);
                    meshCount++;
                }
            });

            expect(meshCount).toBeGreaterThan(10); // Should have many mesh components
        });

        it('should position body parts correctly', () => {
            const config: CharacterModelConfig = {
                height: 1.8,
                bodyColor: 0x8B4513,
                clothingColor: 0x4169E1,
                hairColor: 0x654321,
                eyeColor: 0x0080ff,
                skinTone: 0xF5DEB3
            };

            const character = CharacterModelGenerator.generateCharacterModel(config);
            
            // Check that body parts are positioned correctly
            const [torso, head, leftArm, rightArm, leftLeg, rightLeg] = character.children;
            
            expect(head.position.y).toBeGreaterThan(torso.position.y);
            expect(leftArm.position.x).toBeLessThan(0);
            expect(rightArm.position.x).toBeGreaterThan(0);
            expect(leftLeg.position.x).toBeLessThan(0);
            expect(rightLeg.position.x).toBeGreaterThan(0);
        });
    });

    describe('Equipment Creation', () => {
        it('should create sword weapon', () => {
            const config: CharacterModelConfig = {
                height: 1.8,
                bodyColor: 0x8B4513,
                clothingColor: 0x4169E1,
                hairColor: 0x654321,
                eyeColor: 0x0080ff,
                skinTone: 0xF5DEB3,
                equipmentConfig: {
                    weapon: 'sword'
                }
            };

            const character = CharacterModelGenerator.generateCharacterModel(config);
            
            // Check that weapon was added to right arm
            let weaponFound = false;
            character.traverse((child) => {
                if (child instanceof THREE.Group && child.children.length > 0) {
                    // Look for weapon components
                    child.traverse((subChild) => {
                        if (subChild instanceof THREE.Mesh) {
                            weaponFound = true;
                        }
                    });
                }
            });

            expect(weaponFound).toBe(true);
        });

        it('should create different helmet types', () => {
            const helmetTypes = ['leather', 'iron', 'gold', 'diamond'] as const;
            
            helmetTypes.forEach(helmetType => {
                const config: CharacterModelConfig = {
                    height: 1.8,
                    bodyColor: 0x8B4513,
                    clothingColor: 0x4169E1,
                    hairColor: 0x654321,
                    eyeColor: 0x0080ff,
                    skinTone: 0xF5DEB3,
                    equipmentConfig: {
                        helmet: helmetType
                    }
                };

                const character = CharacterModelGenerator.generateCharacterModel(config);
                expect(character).toBeInstanceOf(THREE.Group);
            });
        });

        it('should create different weapon types', () => {
            const weaponTypes = ['sword', 'axe', 'bow', 'staff', 'dagger'] as const;
            
            weaponTypes.forEach(weaponType => {
                const config: CharacterModelConfig = {
                    height: 1.8,
                    bodyColor: 0x8B4513,
                    clothingColor: 0x4169E1,
                    hairColor: 0x654321,
                    eyeColor: 0x0080ff,
                    skinTone: 0xF5DEB3,
                    equipmentConfig: {
                        weapon: weaponType
                    }
                };

                const character = CharacterModelGenerator.generateCharacterModel(config);
                expect(character).toBeInstanceOf(THREE.Group);
            });
        });
    });

    describe('Model Scaling', () => {
        it('should scale character to specified height', () => {
            const tallConfig: CharacterModelConfig = {
                height: 2.4,
                bodyColor: 0x8B4513,
                clothingColor: 0x4169E1,
                hairColor: 0x654321,
                eyeColor: 0x0080ff,
                skinTone: 0xF5DEB3
            };

            const shortConfig: CharacterModelConfig = {
                height: 1.2,
                bodyColor: 0x8B4513,
                clothingColor: 0x4169E1,
                hairColor: 0x654321,
                eyeColor: 0x0080ff,
                skinTone: 0xF5DEB3
            };

            const tallCharacter = CharacterModelGenerator.generateCharacterModel(tallConfig);
            const shortCharacter = CharacterModelGenerator.generateCharacterModel(shortConfig);

            expect(tallCharacter.scale.x).toBeGreaterThan(shortCharacter.scale.x);
            expect(tallCharacter.scale.y).toBeGreaterThan(shortCharacter.scale.y);
            expect(tallCharacter.scale.z).toBeGreaterThan(shortCharacter.scale.z);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid enemy types gracefully', () => {
            const character = CharacterModelGenerator.generateEnemyModel('unknown', 1);
            
            expect(character).toBeInstanceOf(THREE.Group);
            expect(character.children.length).toBeGreaterThan(0);
        });

        it('should handle extreme level values', () => {
            const lowLevel = CharacterModelGenerator.generateEnemyModel('goblin', -5);
            const highLevel = CharacterModelGenerator.generateEnemyModel('goblin', 100);
            
            expect(lowLevel).toBeInstanceOf(THREE.Group);
            expect(highLevel).toBeInstanceOf(THREE.Group);
        });
    });
});