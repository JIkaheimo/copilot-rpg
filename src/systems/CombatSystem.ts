import * as THREE from 'three';
import { GameState } from '../core/GameState';

export interface DamageData {
    amount: number;
    type: 'physical' | 'magical' | 'elemental';
    source: string;
    critical: boolean;
}

export interface CombatEntity {
    id: string;
    position: THREE.Vector3;
    health: number;
    maxHealth: number;
    attackPower: number;
    defense: number;
    attackRange: number;
    attackCooldown: number;
    lastAttackTime: number;
    isPlayer: boolean;
}

export class CombatSystem {
    private initialized: boolean = false;
    private entities: Map<string, CombatEntity> = new Map();
    private eventListeners: { [event: string]: Function[] } = {};
    private gameState: GameState | null = null;
    
    initialize(_scene: THREE.Scene, gameState: GameState): void {
        this.gameState = gameState;
        this.initialized = true;
        
        // Register player as combat entity
        this.registerPlayer();
        
        console.log('⚔️ Combat system initialized');
    }
    
    private registerPlayer(): void {
        if (!this.gameState) return;
        
        const playerEntity: CombatEntity = {
            id: 'player',
            position: new THREE.Vector3(0, 0, 0),
            health: this.gameState.player.health,
            maxHealth: this.gameState.player.maxHealth,
            attackPower: this.calculatePlayerAttackPower(),
            defense: this.calculatePlayerDefense(),
            attackRange: 3.0,
            attackCooldown: 1.0, // 1 second between attacks
            lastAttackTime: 0,
            isPlayer: true
        };
        
        this.entities.set('player', playerEntity);
    }
    
    private calculatePlayerAttackPower(): number {
        if (!this.gameState) return 10;
        
        const baseAttack = 10;
        const strBonus = this.gameState.player.strength * 0.5;
        const weaponBonus = 0; // TODO: Add weapon damage calculation
        
        return Math.floor(baseAttack + strBonus + weaponBonus);
    }
    
    private calculatePlayerDefense(): number {
        if (!this.gameState) return 5;
        
        const baseDefense = 5;
        const vitBonus = this.gameState.player.vitality * 0.3;
        const armorBonus = 0; // TODO: Add armor defense calculation
        
        return Math.floor(baseDefense + vitBonus + armorBonus);
    }
    
    update(deltaTime: number): void {
        if (!this.initialized) return;
        
        // Update all combat entities
        for (const [, entity] of this.entities) {
            if (entity.isPlayer) {
                this.updatePlayerEntity(entity, deltaTime);
            } else {
                this.updateEnemyEntity(entity, deltaTime);
            }
        }
        
        // Check for combat interactions
        this.processCombatInteractions(deltaTime);
    }
    
    private updatePlayerEntity(entity: CombatEntity, deltaTime: number): void {
        if (!this.gameState) return;
        
        // Sync player stats
        entity.health = this.gameState.player.health;
        entity.maxHealth = this.gameState.player.maxHealth;
        entity.attackPower = this.calculatePlayerAttackPower();
        entity.defense = this.calculatePlayerDefense();
        
        // Update attack cooldown
        if (entity.lastAttackTime > 0) {
            entity.lastAttackTime -= deltaTime;
            if (entity.lastAttackTime <= 0) {
                entity.lastAttackTime = 0;
            }
        }
    }
    
    private updateEnemyEntity(entity: CombatEntity, deltaTime: number): void {
        // Update enemy attack cooldown
        if (entity.lastAttackTime > 0) {
            entity.lastAttackTime -= deltaTime;
            if (entity.lastAttackTime <= 0) {
                entity.lastAttackTime = 0;
            }
        }
        
        // Simple AI: Attack player if in range
        const playerEntity = this.entities.get('player');
        if (playerEntity && entity.lastAttackTime <= 0) {
            const distance = entity.position.distanceTo(playerEntity.position);
            if (distance <= entity.attackRange) {
                this.attemptAttack(entity.id, 'player');
            }
        }
    }
    
    private processCombatInteractions(_deltaTime: number): void {
        // This method can be expanded for area damage, spell effects, etc.
        // Currently handled through direct attack methods
        void _deltaTime;
    }
    
    // Public combat methods
    
    addEnemy(id: string, position: THREE.Vector3, stats: Partial<CombatEntity> = {}): void {
        const enemy: CombatEntity = {
            id,
            position: position.clone(),
            health: stats.health || 50,
            maxHealth: stats.maxHealth || 50,
            attackPower: stats.attackPower || 8,
            defense: stats.defense || 3,
            attackRange: stats.attackRange || 2.5,
            attackCooldown: stats.attackCooldown || 1.5,
            lastAttackTime: 0,
            isPlayer: false,
            ...stats
        };
        
        this.entities.set(id, enemy);
        this.emit('enemyAdded', enemy);
    }
    
    removeEnemy(id: string): void {
        if (this.entities.has(id)) {
            this.entities.delete(id);
            this.emit('enemyRemoved', id);
        }
    }
    
    attemptAttack(attackerId: string, targetId: string): boolean {
        const attacker = this.entities.get(attackerId);
        const target = this.entities.get(targetId);
        
        if (!attacker || !target) return false;
        
        // Check if attacker can attack (cooldown and range)
        if (attacker.lastAttackTime > 0) return false;
        
        const distance = attacker.position.distanceTo(target.position);
        if (distance > attacker.attackRange) return false;
        
        // Calculate damage
        const damage = this.calculateDamage(attacker, target);
        
        // Apply damage
        this.dealDamage(targetId, damage);
        
        // Set attack cooldown
        attacker.lastAttackTime = attacker.attackCooldown;
        
        // Emit combat events
        this.emit('attackPerformed', {
            attacker: attackerId,
            target: targetId,
            damage: damage.amount
        });
        
        return true;
    }
    
    private calculateDamage(attacker: CombatEntity, target: CombatEntity): DamageData {
        let baseDamage = attacker.attackPower;
        
        // Apply defense reduction
        const defense = target.defense;
        const damageReduction = Math.min(defense * 0.1, 0.5); // Max 50% reduction
        baseDamage *= (1 - damageReduction);
        
        // Calculate critical hit
        const critChance = 0.1; // 10% base crit chance
        const isCritical = Math.random() < critChance;
        if (isCritical) {
            baseDamage *= 1.5;
        }
        
        // Add some randomness
        const variance = 0.2; // ±20% damage variance
        const randomMultiplier = 1 + (Math.random() - 0.5) * variance;
        baseDamage *= randomMultiplier;
        
        return {
            amount: Math.max(1, Math.floor(baseDamage)), // Minimum 1 damage
            type: 'physical',
            source: attacker.id,
            critical: isCritical
        };
    }
    
    dealDamage(targetId: string, damage: DamageData): boolean {
        const target = this.entities.get(targetId);
        if (!target) return false;
        
        // Apply damage
        target.health = Math.max(0, target.health - damage.amount);
        
        // If target is player, update game state
        if (target.isPlayer && this.gameState) {
            this.gameState.takeDamage(damage.amount);
        }
        
        // Emit damage event
        this.emit('damageDealt', {
            target: targetId,
            damage
        });
        
        // Check if target died
        if (target.health <= 0) {
            this.handleEntityDeath(targetId);
            return true; // Target died
        }
        
        return false; // Target survived
    }
    
    private handleEntityDeath(entityId: string): void {
        const entity = this.entities.get(entityId);
        if (!entity) return;
        
        if (entity.isPlayer) {
            this.emit('playerDied');
        } else {
            // Award experience for killing enemy
            if (this.gameState) {
                const expReward = Math.floor(entity.maxHealth * 0.5 + entity.attackPower * 0.3);
                this.gameState.addExperience(expReward);
            }
            
            this.emit('enemyDefeated', {
                id: entityId,
                entity
            });
            
            // Remove enemy from tracking
            this.removeEnemy(entityId);
        }
    }
    
    // Player combat actions
    
    playerAttack(): boolean {
        const player = this.entities.get('player');
        if (!player || player.lastAttackTime > 0) return false;
        
        // Find nearest enemy within attack range
        let nearestEnemy: CombatEntity | null = null;
        let nearestDistance = Infinity;
        
        for (const [, entity] of this.entities) {
            if (!entity.isPlayer) {
                const distance = player.position.distanceTo(entity.position);
                if (distance <= player.attackRange && distance < nearestDistance) {
                    nearestEnemy = entity;
                    nearestDistance = distance;
                }
            }
        }
        
        if (nearestEnemy) {
            return this.attemptAttack('player', nearestEnemy.id);
        }
        
        return false;
    }
    
    updatePlayerPosition(position: THREE.Vector3): void {
        const player = this.entities.get('player');
        if (player) {
            player.position.copy(position);
        }
    }
    
    // Utility methods
    
    getPlayerCombatStats(): CombatEntity | null {
        return this.entities.get('player') || null;
    }
    
    getEnemiesInRange(position: THREE.Vector3, range: number): CombatEntity[] {
        const enemies: CombatEntity[] = [];
        
        for (const [, entity] of this.entities) {
            if (!entity.isPlayer) {
                const distance = position.distanceTo(entity.position);
                if (distance <= range) {
                    enemies.push(entity);
                }
            }
        }
        
        return enemies;
    }
    
    canPlayerAttack(): boolean {
        const player = this.entities.get('player');
        return player ? player.lastAttackTime <= 0 : false;
    }
    
    getPlayerAttackCooldown(): number {
        const player = this.entities.get('player');
        return player ? Math.max(0, player.lastAttackTime) : 0;
    }
    
    // Event system
    on(event: string, callback: Function): void {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    off(event: string, callback: Function): void {
        if (!this.eventListeners[event]) return;
        
        const index = this.eventListeners[event].indexOf(callback);
        if (index > -1) {
            this.eventListeners[event].splice(index, 1);
        }
    }
    
    private emit(event: string, data?: any): void {
        if (!this.eventListeners[event]) return;
        
        this.eventListeners[event].forEach(callback => {
            callback(data);
        });
    }
    
    cleanup(): void {
        this.entities.clear();
        this.eventListeners = {};
        this.initialized = false;
        console.log('⚔️ Combat system cleaned up');
    }
}