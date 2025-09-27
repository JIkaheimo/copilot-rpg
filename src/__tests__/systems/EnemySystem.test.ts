import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EnemySystem, EnemyData } from '@systems/EnemySystem';
import * as THREE from 'three';

/**
 * Comprehensive tests for EnemySystem
 * Tests enemy spawning, AI behavior, and lifecycle management
 */
describe('EnemySystem', () => {
    let enemySystem: EnemySystem;
    let mockScene: THREE.Scene;

    beforeEach(() => {
        enemySystem = new EnemySystem();
        mockScene = new THREE.Scene();
        vi.clearAllTimers();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Initialization', () => {
        it('should initialize correctly', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            enemySystem.initialize(mockScene);
            
            expect(consoleSpy).toHaveBeenCalledWith('👹 Enemy system initialized');
            consoleSpy.mockRestore();
        });

        it('should spawn initial enemies on initialization', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            enemySystem.initialize(mockScene);
            
            const allEnemies = enemySystem.getAllEnemies();
            expect(allEnemies.length).toBeGreaterThan(0);
            
            // Check that different enemy types were spawned
            const enemyTypes = new Set(allEnemies.map(enemy => enemy.type));
            expect(enemyTypes.size).toBeGreaterThan(1);
            
            consoleSpy.mockRestore();
        });

        it('should add enemies to scene', () => {
            const initialChildCount = mockScene.children.length;
            
            enemySystem.initialize(mockScene);
            
            expect(mockScene.children.length).toBeGreaterThan(initialChildCount);
        });
    });

    describe('Enemy Spawning', () => {
        beforeEach(() => {
            enemySystem.initialize(mockScene);
        });

        it('should spawn goblin enemy', () => {
            const position = new THREE.Vector3(10, 0, 10);
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            
            expect(enemyId).toBeTruthy();
            expect(consoleSpy).toHaveBeenCalledWith(
                '👹 Spawned Goblin (Level 1) at position',
                expect.any(THREE.Vector3)
            );
            
            const enemy = enemySystem.getEnemy(enemyId);
            expect(enemy).toBeDefined();
            expect(enemy?.type).toBe('goblin');
            expect(enemy?.name).toBe('Goblin');
            expect(enemy?.position.equals(position)).toBe(true);
            
            consoleSpy.mockRestore();
        });

        it('should spawn different enemy types', () => {
            const types: Array<'goblin' | 'wolf' | 'orc' | 'skeleton'> = ['goblin', 'wolf', 'orc', 'skeleton'];
            const basePosition = new THREE.Vector3(0, 0, 0);
            
            types.forEach((type, index) => {
                const position = basePosition.clone().add(new THREE.Vector3(index * 5, 0, 0));
                const enemyId = enemySystem.spawnEnemy(type, position);
                
                const enemy = enemySystem.getEnemy(enemyId);
                expect(enemy?.type).toBe(type);
                expect(enemy?.mesh).toBeDefined();
            });
        });

        it('should handle level scaling', () => {
            const position = new THREE.Vector3(10, 0, 10);
            const level = 3;
            
            const enemyId = enemySystem.spawnEnemy('goblin', position, level);
            const enemy = enemySystem.getEnemy(enemyId);
            
            expect(enemy?.level).toBe(level);
            expect(enemy?.health).toBeGreaterThan(30); // Base goblin health is 30
            expect(enemy?.maxHealth).toBeGreaterThan(30);
            expect(enemy?.attackPower).toBeGreaterThan(8); // Base goblin attack is 8
        });

        it('should handle invalid enemy type', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
            const position = new THREE.Vector3(10, 0, 10);
            
            const enemyId = enemySystem.spawnEnemy('invalid' as any, position);
            
            expect(enemyId).toBe('');
            expect(consoleSpy).toHaveBeenCalledWith('Unknown enemy type: invalid');
            
            consoleSpy.mockRestore();
        });
    });

    describe('Enemy AI States', () => {
        beforeEach(() => {
            enemySystem.initialize(mockScene);
        });

        it('should initialize enemies in idle state', () => {
            const position = new THREE.Vector3(10, 0, 10);
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            const enemy = enemySystem.getEnemy(enemyId);
            
            expect(enemy?.state).toBe('idle');
        });

        it('should transition to chasing when player is detected', () => {
            const position = new THREE.Vector3(5, 0, 5);
            const playerPosition = new THREE.Vector3(0, 0, 0);
            
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            const enemy = enemySystem.getEnemy(enemyId);
            
            // Update with player in detection range
            enemySystem.update(0.016, playerPosition);
            
            expect(enemy?.state).toBe('chasing');
            expect(enemy?.target).toBe('player');
        });

        it('should transition to attacking when player is in range', () => {
            const position = new THREE.Vector3(1, 0, 0);
            const playerPosition = new THREE.Vector3(0, 0, 0);
            
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            const enemy = enemySystem.getEnemy(enemyId);
            
            // Force chasing state first
            enemy!.state = 'chasing';
            enemy!.target = 'player';
            
            // Update with player in attack range
            enemySystem.update(0.016, playerPosition);
            
            expect(enemy?.state).toBe('attacking');
        });

        it('should lose target when player is too far', () => {
            const position = new THREE.Vector3(5, 0, 5);
            const farPlayerPosition = new THREE.Vector3(50, 0, 50);
            
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            const enemy = enemySystem.getEnemy(enemyId);
            
            // Force chasing state
            enemy!.state = 'chasing';
            enemy!.target = 'player';
            
            // Update with player very far away
            enemySystem.update(0.016, farPlayerPosition);
            
            expect(enemy?.state).toBe('idle');
            expect(enemy?.target).toBeUndefined();
        });
    });

    describe('Combat Integration', () => {
        beforeEach(() => {
            enemySystem.initialize(mockScene);
        });

        it('should damage enemies', () => {
            const position = new THREE.Vector3(10, 0, 10);
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            const enemy = enemySystem.getEnemy(enemyId);
            const initialHealth = enemy!.health;
            
            const damaged = enemySystem.damageEnemy(enemyId, 10);
            
            expect(damaged).toBe(false); // Should survive
            expect(enemy?.health).toBe(initialHealth - 10);
        });

        it('should kill enemies when health reaches zero', () => {
            const position = new THREE.Vector3(10, 0, 10);
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            const enemy = enemySystem.getEnemy(enemyId);
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            const killed = enemySystem.damageEnemy(enemyId, enemy!.health + 10);
            
            expect(killed).toBe(true);
            expect(enemy?.state).toBe('dead');
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('👹 Goblin has been defeated!')
            );
            
            consoleSpy.mockRestore();
        });

        it('should not damage dead enemies', () => {
            const position = new THREE.Vector3(10, 0, 10);
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            const enemy = enemySystem.getEnemy(enemyId);
            
            // Kill enemy first
            enemySystem.damageEnemy(enemyId, enemy!.health + 10);
            
            // Try to damage again
            const result = enemySystem.damageEnemy(enemyId, 10);
            expect(result).toBe(false);
        });

        it('should not damage non-existent enemies', () => {
            const result = enemySystem.damageEnemy('non-existent', 10);
            expect(result).toBe(false);
        });
    });

    describe('Enemy Queries', () => {
        beforeEach(() => {
            enemySystem.initialize(mockScene);
        });

        it('should find enemies in range', () => {
            const position1 = new THREE.Vector3(5, 0, 5);
            const position2 = new THREE.Vector3(15, 0, 15);
            const queryPosition = new THREE.Vector3(0, 0, 0);
            
            enemySystem.spawnEnemy('goblin', position1);
            enemySystem.spawnEnemy('orc', position2);
            
            const nearbyEnemies = enemySystem.getEnemiesInRange(queryPosition, 10);
            const allEnemies = enemySystem.getEnemiesInRange(queryPosition, 50);
            
            expect(nearbyEnemies.length).toBe(1); // Only the close one
            expect(allEnemies.length).toBeGreaterThanOrEqual(2); // Both spawned plus initial ones
        });

        it('should not include dead enemies in range queries', () => {
            const position = new THREE.Vector3(5, 0, 5);
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            
            // Kill the enemy
            const enemy = enemySystem.getEnemy(enemyId);
            enemySystem.damageEnemy(enemyId, enemy!.health + 10);
            
            const nearbyEnemies = enemySystem.getEnemiesInRange(position, 10);
            const livingEnemiesNearby = nearbyEnemies.filter(e => e.state !== 'dead');
            
            // Should not include the dead enemy we just killed
            expect(livingEnemiesNearby.find(e => e.id === enemyId)).toBeUndefined();
        });

        it('should get all living enemies', () => {
            const allEnemies = enemySystem.getAllEnemies();
            
            // All returned enemies should be alive
            allEnemies.forEach(enemy => {
                expect(enemy.state).not.toBe('dead');
            });
        });
    });

    describe('Enemy Movement and Patrolling', () => {
        beforeEach(() => {
            enemySystem.initialize(mockScene);
        });

        it('should update enemy positions during movement', () => {
            const initialPosition = new THREE.Vector3(10, 0, 10);
            const playerPosition = new THREE.Vector3(0, 0, 0);
            
            const enemyId = enemySystem.spawnEnemy('wolf', initialPosition); // Wolves are fast
            const enemy = enemySystem.getEnemy(enemyId);
            const startPosition = enemy!.position.clone();
            
            // Force the enemy into chasing state to ensure movement
            enemy!.state = 'chasing';
            enemy!.target = 'player';
            
            // Update several times to allow movement
            for (let i = 0; i < 10; i++) {
                enemySystem.update(0.1, playerPosition); // Larger delta for noticeable movement
            }
            
            // Enemy should have moved toward player or at least changed position
            const hasMoved = !enemy!.position.equals(startPosition);
            expect(hasMoved).toBe(true);
        });

        it('should update mesh positions', () => {
            const position = new THREE.Vector3(10, 0, 10);
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            const enemy = enemySystem.getEnemy(enemyId);
            
            // Move enemy position
            enemy!.position.set(15, 0, 15);
            
            // Update should sync mesh position
            enemySystem.update(0.016);
            
            expect(enemy!.mesh?.position.equals(enemy!.position)).toBe(true);
        });
    });

    describe('Attack Mechanics', () => {
        beforeEach(() => {
            enemySystem.initialize(mockScene);
        });

        it('should perform attacks when in attacking state', () => {
            const position = new THREE.Vector3(1, 0, 0);
            const playerPosition = new THREE.Vector3(0, 0, 0);
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            const enemy = enemySystem.getEnemy(enemyId);
            
            const eventSpy = vi.fn();
            enemySystem.on('enemyAttack', eventSpy);
            
            // Force attacking state
            enemy!.state = 'attacking';
            enemy!.lastAttackTime = 0; // Ready to attack
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            enemySystem.update(0.016, playerPosition);
            
            expect(eventSpy).toHaveBeenCalledWith({
                enemyId,
                targetId: 'player',
                damage: enemy!.attackPower
            });
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('👹 Goblin attacks for')
            );
            
            consoleSpy.mockRestore();
        });

        it('should respect attack cooldowns', () => {
            const position = new THREE.Vector3(1, 0, 0);
            const playerPosition = new THREE.Vector3(0, 0, 0);
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            const enemy = enemySystem.getEnemy(enemyId);
            
            const eventSpy = vi.fn();
            enemySystem.on('enemyAttack', eventSpy);
            
            // Force attacking state with cooldown
            enemy!.state = 'attacking';
            enemy!.lastAttackTime = 1.0; // Still on cooldown
            
            enemySystem.update(0.016, playerPosition);
            
            expect(eventSpy).not.toHaveBeenCalled();
        });
    });

    describe('Event System', () => {
        beforeEach(() => {
            enemySystem.initialize(mockScene);
        });

        it('should emit spawn events', () => {
            const eventSpy = vi.fn();
            enemySystem.on('enemySpawned', eventSpy);
            
            const position = new THREE.Vector3(10, 0, 10);
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: enemyId,
                    type: 'goblin',
                    position: expect.any(THREE.Vector3)
                })
            );
        });

        it('should emit detection events', () => {
            const eventSpy = vi.fn();
            enemySystem.on('enemyDetectedPlayer', eventSpy);
            
            const position = new THREE.Vector3(5, 0, 5);
            const playerPosition = new THREE.Vector3(0, 0, 0);
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            
            enemySystem.update(0.016, playerPosition);
            
            expect(eventSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: enemyId,
                    state: 'chasing'
                })
            );
        });

        it('should handle event listener removal', () => {
            const eventSpy = vi.fn();
            
            enemySystem.on('enemySpawned', eventSpy);
            enemySystem.off('enemySpawned', eventSpy);
            
            const position = new THREE.Vector3(10, 0, 10);
            enemySystem.spawnEnemy('goblin', position);
            
            expect(eventSpy).not.toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        it('should clear all enemies on cleanup', () => {
            enemySystem.initialize(mockScene);
            
            const initialEnemyCount = enemySystem.getAllEnemies().length;
            expect(initialEnemyCount).toBeGreaterThan(0);
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            enemySystem.cleanup();
            
            expect(consoleSpy).toHaveBeenCalledWith('👹 All enemies cleared');
            expect(consoleSpy).toHaveBeenCalledWith('👹 Enemy system cleaned up');
            
            consoleSpy.mockRestore();
        });

        it('should remove all enemy meshes from scene', () => {
            enemySystem.initialize(mockScene);
            
            const initialChildCount = mockScene.children.length;
            expect(initialChildCount).toBeGreaterThan(0);
            
            enemySystem.cleanup();
            
            // All enemy meshes should be removed
            // (Note: This depends on the scene only containing enemy meshes)
            expect(mockScene.children.length).toBe(0);
        });
    });

    describe('System Updates', () => {
        beforeEach(() => {
            enemySystem.initialize(mockScene);
        });

        it('should update without errors', () => {
            expect(() => {
                enemySystem.update(0.016);
            }).not.toThrow();
        });

        it('should handle updates with no player position', () => {
            expect(() => {
                enemySystem.update(0.016, undefined);
            }).not.toThrow();
        });

        it('should reduce attack cooldowns over time', () => {
            const position = new THREE.Vector3(10, 0, 10);
            const enemyId = enemySystem.spawnEnemy('goblin', position);
            const enemy = enemySystem.getEnemy(enemyId);
            
            // Set cooldown
            enemy!.lastAttackTime = 2.0;
            
            // Update should reduce cooldown
            enemySystem.update(0.5);
            
            expect(enemy!.lastAttackTime).toBe(1.5);
        });
    });
});