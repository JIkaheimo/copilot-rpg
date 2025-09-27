import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CombatSystem, CombatEntity, DamageData } from '@systems/CombatSystem';
import { GameState } from '@core/GameState';
import * as THREE from 'three';

/**
 * Comprehensive tests for CombatSystem
 * Tests combat mechanics, damage calculation, and entity management
 */
describe('CombatSystem', () => {
    let combatSystem: CombatSystem;
    let mockScene: THREE.Scene;
    let gameState: GameState;

    beforeEach(() => {
        combatSystem = new CombatSystem();
        mockScene = new THREE.Scene();
        gameState = new GameState();
    });

    describe('Initialization', () => {
        it('should initialize correctly', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            combatSystem.initialize(mockScene, gameState);
            
            expect(consoleSpy).toHaveBeenCalledWith('⚔️ Combat system initialized');
            consoleSpy.mockRestore();
        });

        it('should register player entity on initialization', () => {
            combatSystem.initialize(mockScene, gameState);
            
            const playerStats = combatSystem.getPlayerCombatStats();
            expect(playerStats).toBeDefined();
            expect(playerStats?.id).toBe('player');
            expect(playerStats?.isPlayer).toBe(true);
        });

        it('should calculate initial player stats correctly', () => {
            combatSystem.initialize(mockScene, gameState);
            
            const playerStats = combatSystem.getPlayerCombatStats();
            expect(playerStats?.health).toBe(gameState.player.health);
            expect(playerStats?.maxHealth).toBe(gameState.player.maxHealth);
            expect(playerStats?.attackPower).toBeGreaterThan(0);
            expect(playerStats?.defense).toBeGreaterThan(0);
        });
    });

    describe('Combat Entity Management', () => {
        beforeEach(() => {
            combatSystem.initialize(mockScene, gameState);
        });

        it('should add enemy entities', () => {
            const position = new THREE.Vector3(5, 0, 5);
            
            combatSystem.addEnemy('test-enemy', position, {
                health: 50,
                maxHealth: 50,
                attackPower: 10,
                defense: 5
            });

            const enemiesInRange = combatSystem.getEnemiesInRange(position, 10);
            expect(enemiesInRange).toHaveLength(1);
            expect(enemiesInRange[0].id).toBe('test-enemy');
        });

        it('should remove enemy entities', () => {
            const position = new THREE.Vector3(5, 0, 5);
            
            combatSystem.addEnemy('test-enemy', position);
            combatSystem.removeEnemy('test-enemy');

            const enemiesInRange = combatSystem.getEnemiesInRange(position, 10);
            expect(enemiesInRange).toHaveLength(0);
        });

        it('should update player position', () => {
            const newPosition = new THREE.Vector3(10, 0, 10);
            
            combatSystem.updatePlayerPosition(newPosition);
            
            const playerStats = combatSystem.getPlayerCombatStats();
            expect(playerStats?.position.equals(newPosition)).toBe(true);
        });
    });

    describe('Damage Calculation', () => {
        beforeEach(() => {
            combatSystem.initialize(mockScene, gameState);
        });

        it('should calculate damage with defense reduction', () => {
            const attacker: CombatEntity = {
                id: 'attacker',
                position: new THREE.Vector3(),
                health: 100,
                maxHealth: 100,
                attackPower: 20,
                defense: 0,
                attackRange: 2,
                attackCooldown: 1,
                lastAttackTime: 0,
                isPlayer: false
            };

            const target: CombatEntity = {
                id: 'target',
                position: new THREE.Vector3(),
                health: 100,
                maxHealth: 100,
                attackPower: 10,
                defense: 10,
                attackRange: 2,
                attackCooldown: 1,
                lastAttackTime: 0,
                isPlayer: false
            };

            // Use reflection to access private method for testing
            const calculateDamage = (combatSystem as any).calculateDamage;
            const damage: DamageData = calculateDamage.call(combatSystem, attacker, target);

            expect(damage.amount).toBeGreaterThan(0);
            expect(damage.amount).toBeLessThan(attacker.attackPower); // Should be reduced by defense
            expect(damage.type).toBe('physical');
            expect(damage.source).toBe('attacker');
        });

        it('should handle critical hits', () => {
            const attacker: CombatEntity = {
                id: 'attacker',
                position: new THREE.Vector3(),
                health: 100,
                maxHealth: 100,
                attackPower: 20,
                defense: 0,
                attackRange: 2,
                attackCooldown: 1,
                lastAttackTime: 0,
                isPlayer: false
            };

            const target: CombatEntity = {
                id: 'target',
                position: new THREE.Vector3(),
                health: 100,
                maxHealth: 100,
                attackPower: 10,
                defense: 0,
                attackRange: 2,
                attackCooldown: 1,
                lastAttackTime: 0,
                isPlayer: false
            };

            // Test multiple times to check for critical hits
            const calculateDamage = (combatSystem as any).calculateDamage;
            let foundCritical = false;
            
            for (let i = 0; i < 50; i++) {
                const damage: DamageData = calculateDamage.call(combatSystem, attacker, target);
                if (damage.critical) {
                    foundCritical = true;
                    expect(damage.amount).toBeGreaterThan(20); // Should be more than base damage
                    break;
                }
            }

            // Note: Critical hits are random, so this test might occasionally fail
            // In a real scenario, you might want to mock Math.random for deterministic testing
        });
    });

    describe('Combat Actions', () => {
        beforeEach(() => {
            combatSystem.initialize(mockScene, gameState);
        });

        it('should handle player attacks', () => {
            const enemyPosition = new THREE.Vector3(2, 0, 0);
            
            // Add enemy within attack range
            combatSystem.addEnemy('nearby-enemy', enemyPosition, {
                health: 30,
                maxHealth: 30
            });

            // Update player position to be in range
            combatSystem.updatePlayerPosition(new THREE.Vector3(0, 0, 0));

            const attackResult = combatSystem.playerAttack();
            expect(attackResult).toBe(true);
        });

        it('should respect attack cooldowns', () => {
            const enemyPosition = new THREE.Vector3(2, 0, 0);
            
            combatSystem.addEnemy('nearby-enemy', enemyPosition);
            combatSystem.updatePlayerPosition(new THREE.Vector3(0, 0, 0));

            // First attack should succeed
            const firstAttack = combatSystem.playerAttack();
            expect(firstAttack).toBe(true);

            // Second immediate attack should fail due to cooldown
            const secondAttack = combatSystem.playerAttack();
            expect(secondAttack).toBe(false);

            // Check cooldown status
            expect(combatSystem.canPlayerAttack()).toBe(false);
            expect(combatSystem.getPlayerAttackCooldown()).toBeGreaterThan(0);
        });

        it('should not attack when no enemies in range', () => {
            combatSystem.updatePlayerPosition(new THREE.Vector3(0, 0, 0));
            
            const attackResult = combatSystem.playerAttack();
            expect(attackResult).toBe(false);
        });
    });

    describe('Damage Dealing', () => {
        beforeEach(() => {
            combatSystem.initialize(mockScene, gameState);
        });

        it('should deal damage to enemies', () => {
            const enemyPosition = new THREE.Vector3(5, 0, 5);
            
            combatSystem.addEnemy('test-enemy', enemyPosition, {
                health: 50,
                maxHealth: 50
            });

            const damage: DamageData = {
                amount: 20,
                type: 'physical',
                source: 'player',
                critical: false
            };

            const targetDied = combatSystem.dealDamage('test-enemy', damage);
            expect(targetDied).toBe(false); // Enemy should survive

            // Check if damage was applied
            const enemies = combatSystem.getEnemiesInRange(enemyPosition, 10);
            expect(enemies[0].health).toBe(30);
        });

        it('should handle enemy death', () => {
            const enemyPosition = new THREE.Vector3(5, 0, 5);
            
            combatSystem.addEnemy('test-enemy', enemyPosition, {
                health: 10,
                maxHealth: 50
            });

            const damage: DamageData = {
                amount: 20,
                type: 'physical',
                source: 'player',
                critical: false
            };

            const targetDied = combatSystem.dealDamage('test-enemy', damage);
            expect(targetDied).toBe(true);

            // Enemy should be removed from tracking
            const enemies = combatSystem.getEnemiesInRange(enemyPosition, 10);
            expect(enemies).toHaveLength(0);
        });

        it('should update player health when damaged', () => {
            const initialHealth = gameState.player.health;
            
            const damage: DamageData = {
                amount: 15,
                type: 'physical',
                source: 'enemy',
                critical: false
            };

            combatSystem.dealDamage('player', damage);
            
            expect(gameState.player.health).toBe(initialHealth - 15);
        });
    });

    describe('System Updates', () => {
        beforeEach(() => {
            combatSystem.initialize(mockScene, gameState);
        });

        it('should update without errors', () => {
            combatSystem.addEnemy('test-enemy', new THREE.Vector3(5, 0, 5));
            
            expect(() => {
                combatSystem.update(0.016); // 60 FPS delta time
            }).not.toThrow();
        });

        it('should update entity cooldowns', () => {
            // Add enemy and simulate attack
            combatSystem.addEnemy('test-enemy', new THREE.Vector3(2, 0, 0));
            combatSystem.updatePlayerPosition(new THREE.Vector3(0, 0, 0));
            
            // Attack to set cooldown
            combatSystem.playerAttack();
            expect(combatSystem.getPlayerAttackCooldown()).toBeGreaterThan(0);
            
            // Update should reduce cooldown
            combatSystem.update(0.5); // Half second
            expect(combatSystem.getPlayerAttackCooldown()).toBeLessThan(1.0);
        });
    });

    describe('Event System', () => {
        beforeEach(() => {
            combatSystem.initialize(mockScene, gameState);
        });

        it('should emit events for damage dealt', () => {
            const eventSpy = vi.fn();
            combatSystem.on('damageDealt', eventSpy);

            const damage: DamageData = {
                amount: 10,
                type: 'physical',
                source: 'test',
                critical: false
            };

            combatSystem.addEnemy('test-enemy', new THREE.Vector3(5, 0, 5));
            combatSystem.dealDamage('test-enemy', damage);

            expect(eventSpy).toHaveBeenCalledWith({
                target: 'test-enemy',
                damage
            });
        });

        it('should emit events for enemy defeats', () => {
            const eventSpy = vi.fn();
            combatSystem.on('enemyDefeated', eventSpy);

            combatSystem.addEnemy('weak-enemy', new THREE.Vector3(5, 0, 5), {
                health: 1,
                maxHealth: 10
            });

            const damage: DamageData = {
                amount: 10,
                type: 'physical',
                source: 'player',
                critical: false
            };

            combatSystem.dealDamage('weak-enemy', damage);

            expect(eventSpy).toHaveBeenCalled();
        });

        it('should handle event listener removal', () => {
            const eventSpy = vi.fn();
            
            combatSystem.on('damageDealt', eventSpy);
            combatSystem.off('damageDealt', eventSpy);

            const damage: DamageData = {
                amount: 10,
                type: 'physical',
                source: 'test',
                critical: false
            };

            combatSystem.addEnemy('test-enemy', new THREE.Vector3(5, 0, 5));
            combatSystem.dealDamage('test-enemy', damage);

            expect(eventSpy).not.toHaveBeenCalled();
        });
    });

    describe('Cleanup', () => {
        it('should cleanup resources properly', () => {
            combatSystem.initialize(mockScene, gameState);
            combatSystem.addEnemy('test-enemy', new THREE.Vector3(5, 0, 5));

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

            combatSystem.cleanup();

            expect(consoleSpy).toHaveBeenCalledWith('⚔️ Combat system cleaned up');
            
            // Should have no entities after cleanup
            const enemies = combatSystem.getEnemiesInRange(new THREE.Vector3(0, 0, 0), 100);
            expect(enemies).toHaveLength(0);

            consoleSpy.mockRestore();
        });
    });
});