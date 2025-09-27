import * as THREE from 'three';
import { GameState } from '../core/GameState';
import { ParticleSystem } from './ParticleSystem';

export interface Spell {
    id: string;
    name: string;
    description: string;
    manaCost: number;
    cooldown: number;
    castTime: number;
    range: number;
    damage?: number;
    healing?: number;
    duration?: number;
    area?: number;
    school: 'fire' | 'ice' | 'lightning' | 'holy' | 'shadow' | 'nature';
    level: number;
    effects: SpellEffect[];
}

export interface SpellEffect {
    type: 'damage' | 'heal' | 'shield' | 'buff' | 'debuff' | 'teleport';
    value: number;
    duration?: number;
    tickRate?: number;
}

export interface ActiveSpell {
    spell: Spell;
    castStartTime: number;
    cooldownEndTime: number;
    target?: THREE.Vector3;
    caster: 'player' | string;
}

export interface StatusEffect {
    id: string;
    name: string;
    type: 'buff' | 'debuff';
    duration: number;
    tickRate: number;
    lastTick: number;
    effect: (target: any) => void;
    visual?: {
        color: number;
        particles: boolean;
    };
}

export class MagicSystem {
    private initialized: boolean = false;
    private gameState: GameState | null = null;
    private particleSystem: ParticleSystem | null = null;
    
    private spells: Map<string, Spell> = new Map();
    private playerStatusEffects: Map<string, StatusEffect> = new Map();
    private enemyStatusEffects: Map<string, Map<string, StatusEffect>> = new Map();
    private eventListeners: { [event: string]: Function[] } = {};
    
    // Spell cooldowns and cast states
    private playerCooldowns: Map<string, number> = new Map();
    private currentCastSpell: ActiveSpell | null = null;

    constructor() {
        this.initializeSpells();
    }

    initialize(_scene: THREE.Scene, gameState: GameState, particleSystem: ParticleSystem): void {
        this.gameState = gameState;
        this.particleSystem = particleSystem;
        this.initialized = true;
        
        console.log('🔮 Magic system initialized');
    }

    private initializeSpells(): void {
        // Fire spells
        this.spells.set('fireball', {
            id: 'fireball',
            name: 'Fireball',
            description: 'Launch a fiery projectile that explodes on impact',
            manaCost: 25,
            cooldown: 3.0,
            castTime: 1.5,
            range: 20,
            damage: 40,
            area: 3,
            school: 'fire',
            level: 1,
            effects: [
                { type: 'damage', value: 40 },
                { type: 'debuff', value: 5, duration: 3 } // burn damage
            ]
        });

        this.spells.set('heal', {
            id: 'heal',
            name: 'Heal',
            description: 'Restore health to yourself or allies',
            manaCost: 20,
            cooldown: 2.0,
            castTime: 2.0,
            range: 10,
            healing: 50,
            school: 'holy',
            level: 1,
            effects: [
                { type: 'heal', value: 50 }
            ]
        });

        this.spells.set('lightning_bolt', {
            id: 'lightning_bolt',
            name: 'Lightning Bolt',
            description: 'Strike enemies with instant lightning',
            manaCost: 30,
            cooldown: 4.0,
            castTime: 0.5,
            range: 25,
            damage: 60,
            school: 'lightning',
            level: 2,
            effects: [
                { type: 'damage', value: 60 },
                { type: 'debuff', value: 2, duration: 1 } // stun
            ]
        });

        this.spells.set('ice_shard', {
            id: 'ice_shard',
            name: 'Ice Shard',
            description: 'Launch sharp ice that slows enemies',
            manaCost: 20,
            cooldown: 2.5,
            castTime: 1.0,
            range: 18,
            damage: 30,
            school: 'ice',
            level: 1,
            effects: [
                { type: 'damage', value: 30 },
                { type: 'debuff', value: 0.5, duration: 5 } // slow
            ]
        });

        this.spells.set('shield', {
            id: 'shield',
            name: 'Magic Shield',
            description: 'Create a protective barrier that absorbs damage',
            manaCost: 40,
            cooldown: 10.0,
            castTime: 2.0,
            range: 0,
            school: 'holy',
            level: 2,
            effects: [
                { type: 'shield', value: 100, duration: 30 }
            ]
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    update(_deltaTime: number): void {
        if (!this.initialized) return;

        this.updateActiveCasts();
        this.updateCooldowns();
        this.updateStatusEffects();
    }

    private updateActiveCasts(): void {
        if (!this.currentCastSpell) return;

        const currentTime = performance.now() / 1000;
        const castProgress = (currentTime - this.currentCastSpell.castStartTime) / this.currentCastSpell.spell.castTime;

        if (castProgress >= 1.0) {
            // Cast complete
            this.executeSpell(this.currentCastSpell);
            this.currentCastSpell = null;
            this.emit('spellCastComplete');
        } else {
            // Update casting progress
            this.emit('spellCastProgress', { progress: castProgress, spell: this.currentCastSpell.spell });
        }
    }

    private updateCooldowns(): void {
        const currentTime = performance.now() / 1000;
        
        for (const [spellId, endTime] of this.playerCooldowns.entries()) {
            if (currentTime >= endTime) {
                this.playerCooldowns.delete(spellId);
                this.emit('spellCooldownComplete', spellId);
            }
        }
    }

    private updateStatusEffects(): void {
        const currentTime = performance.now() / 1000;
        
        // Update player status effects
        for (const [effectId, effect] of this.playerStatusEffects.entries()) {
            if (currentTime >= effect.lastTick + effect.tickRate) {
                effect.effect('player');
                effect.lastTick = currentTime;
                effect.duration -= effect.tickRate;
                
                if (effect.duration <= 0) {
                    this.playerStatusEffects.delete(effectId);
                    this.emit('statusEffectExpired', { target: 'player', effectId });
                }
            }
        }
        
        // Update enemy status effects
        for (const [enemyId, effects] of this.enemyStatusEffects.entries()) {
            for (const [effectId, effect] of effects.entries()) {
                if (currentTime >= effect.lastTick + effect.tickRate) {
                    effect.effect(enemyId);
                    effect.lastTick = currentTime;
                    effect.duration -= effect.tickRate;
                    
                    if (effect.duration <= 0) {
                        effects.delete(effectId);
                        if (effects.size === 0) {
                            this.enemyStatusEffects.delete(enemyId);
                        }
                        this.emit('statusEffectExpired', { target: enemyId, effectId });
                    }
                }
            }
        }
    }

    // Public methods for casting spells
    castSpell(spellId: string, targetPosition?: THREE.Vector3): boolean {
        if (!this.gameState || !this.initialized) return false;

        const spell = this.spells.get(spellId);
        if (!spell) return false;

        // Check if already casting
        if (this.currentCastSpell) return false;

        // Check cooldown
        const currentTime = performance.now() / 1000;
        const cooldownEnd = this.playerCooldowns.get(spellId) || 0;
        if (currentTime < cooldownEnd) return false;

        // Check mana
        if (this.gameState.player.mana < spell.manaCost) return false;

        // Check if player knows this spell (for now, all spells are available)
        // TODO: Add spell learning system

        // Consume mana
        this.gameState.player.mana = Math.max(0, this.gameState.player.mana - spell.manaCost);

        // Start casting
        this.currentCastSpell = {
            spell,
            castStartTime: currentTime,
            cooldownEndTime: currentTime + spell.cooldown,
            target: targetPosition,
            caster: 'player'
        };

        // Set cooldown
        this.playerCooldowns.set(spellId, currentTime + spell.cooldown);

        // Visual feedback for casting
        this.createCastingEffect(spell);

        this.emit('spellCastStart', spell);
        console.log(`🔮 Casting ${spell.name} (${spell.manaCost} mana)`);
        
        return true;
    }

    private executeSpell(activeSpell: ActiveSpell): void {
        const { spell, target } = activeSpell;

        switch (spell.id) {
            case 'fireball':
                this.castFireball(target || new THREE.Vector3());
                break;
            case 'heal':
                this.castHeal();
                break;
            case 'lightning_bolt':
                this.castLightningBolt(target || new THREE.Vector3());
                break;
            case 'ice_shard':
                this.castIceShard(target || new THREE.Vector3());
                break;
            case 'shield':
                this.castShield();
                break;
        }
    }

    private castFireball(targetPosition: THREE.Vector3): void {
        if (!this.particleSystem) return;

        // Create fireball projectile effect
        this.particleSystem.playEffect('fireball', targetPosition, 2.0);
        
        // Create explosion at target
        setTimeout(() => {
            if (this.particleSystem) {
                this.particleSystem.playEffect('explosion', targetPosition, 1.5);
            }
            this.dealSpellDamage('fireball', targetPosition);
        }, 1000);
    }

    private castHeal(): void {
        if (!this.gameState || !this.particleSystem) return;

        const healAmount = 50;
        this.gameState.player.health = Math.min(
            this.gameState.player.maxHealth,
            this.gameState.player.health + healAmount
        );

        // Visual effect
        const playerPosition = new THREE.Vector3(0, 1, 0); // This should come from player controller
        this.particleSystem.playEffect('heal', playerPosition, 2.0);

        this.emit('playerHealed', healAmount);
        console.log(`💚 Healed for ${healAmount} health`);
    }

    private castLightningBolt(targetPosition: THREE.Vector3): void {
        if (!this.particleSystem) return;

        // Instant lightning effect
        this.particleSystem.playEffect('lightning', targetPosition, 0.5);
        this.dealSpellDamage('lightning_bolt', targetPosition);
    }

    private castIceShard(targetPosition: THREE.Vector3): void {
        if (!this.particleSystem) return;

        // Ice projectile effect
        this.particleSystem.playEffect('ice', targetPosition, 1.0);
        
        setTimeout(() => {
            this.dealSpellDamage('ice_shard', targetPosition);
        }, 800);
    }

    private castShield(): void {
        if (!this.particleSystem) return;

        // Create shield visual effect
        const playerPosition = new THREE.Vector3(0, 1, 0);
        this.particleSystem.playEffect('shield', playerPosition, 3.0);

        // Apply shield effect
        this.applyStatusEffect('player', {
            id: 'magic_shield',
            name: 'Magic Shield',
            type: 'buff',
            duration: 30,
            tickRate: 1,
            lastTick: performance.now() / 1000,
            effect: () => {}, // Shield is handled by damage calculation
            visual: { color: 0x4444ff, particles: true }
        });

        console.log('🛡️ Magic Shield activated');
    }

    private createCastingEffect(spell: Spell): void {
        if (!this.particleSystem) return;

        const playerPosition = new THREE.Vector3(0, 1, 0);
        const effectType = `casting_${spell.school}`;
        this.particleSystem.playEffect(effectType, playerPosition, spell.castTime);
    }

    private dealSpellDamage(spellId: string, position: THREE.Vector3): void {
        const spell = this.spells.get(spellId);
        if (!spell) return;

        // Emit damage event for other systems to handle
        this.emit('spellDamage', {
            spellId,
            position,
            damage: spell.damage || 0,
            area: spell.area || 0,
            effects: spell.effects
        });
    }

    private applyStatusEffect(target: string, effect: StatusEffect): void {
        if (target === 'player') {
            this.playerStatusEffects.set(effect.id, effect);
        } else {
            if (!this.enemyStatusEffects.has(target)) {
                this.enemyStatusEffects.set(target, new Map());
            }
            this.enemyStatusEffects.get(target)!.set(effect.id, effect);
        }

        this.emit('statusEffectApplied', { target, effect });
    }

    // Public getter methods
    getSpell(spellId: string): Spell | undefined {
        return this.spells.get(spellId);
    }

    getAvailableSpells(): Spell[] {
        return Array.from(this.spells.values()).filter(spell => spell.level <= 3); // Player level check would go here
    }

    isSpellOnCooldown(spellId: string): boolean {
        const currentTime = performance.now() / 1000;
        const cooldownEnd = this.playerCooldowns.get(spellId) || 0;
        return currentTime < cooldownEnd;
    }

    getSpellCooldown(spellId: string): number {
        const currentTime = performance.now() / 1000;
        const cooldownEnd = this.playerCooldowns.get(spellId) || 0;
        return Math.max(0, cooldownEnd - currentTime);
    }

    isCasting(): boolean {
        return this.currentCastSpell !== null;
    }

    getCurrentCast(): ActiveSpell | null {
        return this.currentCastSpell;
    }

    getPlayerStatusEffects(): StatusEffect[] {
        return Array.from(this.playerStatusEffects.values());
    }

    cancelCurrentCast(): void {
        if (this.currentCastSpell) {
            this.currentCastSpell = null;
            this.emit('spellCastCancelled');
            console.log('🔮 Spell cast cancelled');
        }
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
        this.eventListeners[event].forEach(callback => callback(data));
    }

    cleanup(): void {
        this.playerStatusEffects.clear();
        this.enemyStatusEffects.clear();
        this.playerCooldowns.clear();
        this.currentCastSpell = null;
        this.eventListeners = {};
    }
}