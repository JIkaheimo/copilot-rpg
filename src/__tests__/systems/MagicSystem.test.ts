import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { MagicSystem } from '../../systems/MagicSystem';
import { GameState } from '../../core/GameState';
import { ParticleSystem } from '../../systems/ParticleSystem';

// Mock Three.js
vi.mock('three', () => ({
    Scene: vi.fn(() => ({
        add: vi.fn(),
        remove: vi.fn()
    })),
    Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
        x, y, z,
        clone: vi.fn().mockReturnThis(),
        add: vi.fn().mockReturnThis(),
        multiplyScalar: vi.fn().mockReturnThis()
    }))
}));

describe('MagicSystem', () => {
    let magicSystem: MagicSystem;
    let mockScene: THREE.Scene;
    let mockGameState: GameState;
    let mockParticleSystem: ParticleSystem;

    beforeEach(() => {
        magicSystem = new MagicSystem();
        mockScene = new THREE.Scene();
        mockGameState = {
            player: {
                level: 1,
                experience: 0,
                experienceToNext: 100,
                health: 100,
                maxHealth: 100,
                mana: 100,
                maxMana: 100,
                stamina: 100,
                maxStamina: 100,
                strength: 10,
                dexterity: 10,
                intelligence: 10,
                vitality: 10,
                luck: 10,
                skills: {},
                skillPoints: 0,
                attributePoints: 0
            }
        } as GameState;

        mockParticleSystem = {
            playEffect: vi.fn()
        } as any;
    });

    describe('Initialization', () => {
        it('should initialize with default spells', () => {
            expect(magicSystem.getSpell('fireball')).toBeDefined();
            expect(magicSystem.getSpell('heal')).toBeDefined();
            expect(magicSystem.getSpell('lightning_bolt')).toBeDefined();
            expect(magicSystem.getSpell('ice_shard')).toBeDefined();
            expect(magicSystem.getSpell('shield')).toBeDefined();
        });

        it('should initialize properly with scene and game state', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            magicSystem.initialize(mockScene, mockGameState, mockParticleSystem);
            
            expect(consoleSpy).toHaveBeenCalledWith('🔮 Magic system initialized');
            consoleSpy.mockRestore();
        });

        it('should provide available spells', () => {
            const availableSpells = magicSystem.getAvailableSpells();
            expect(availableSpells.length).toBeGreaterThan(0);
            expect(availableSpells.some(spell => spell.id === 'fireball')).toBe(true);
        });
    });

    describe('Spell Information', () => {
        it('should return correct spell data', () => {
            const fireball = magicSystem.getSpell('fireball');
            expect(fireball).toBeDefined();
            expect(fireball!.name).toBe('Fireball');
            expect(fireball!.manaCost).toBe(25);
            expect(fireball!.school).toBe('fire');
        });

        it('should return undefined for non-existent spells', () => {
            const spell = magicSystem.getSpell('nonexistent');
            expect(spell).toBeUndefined();
        });

        it('should track cooldowns correctly', () => {
            expect(magicSystem.isSpellOnCooldown('fireball')).toBe(false);
            expect(magicSystem.getSpellCooldown('fireball')).toBe(0);
        });
    });

    describe('Spell Casting', () => {
        beforeEach(() => {
            magicSystem.initialize(mockScene, mockGameState, mockParticleSystem);
        });

        it('should cast spells with sufficient mana', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            const result = magicSystem.castSpell('fireball', new THREE.Vector3(10, 0, 10));
            
            expect(result).toBe(true);
            expect(mockGameState.player.mana).toBe(75); // 100 - 25 mana cost
            expect(consoleSpy).toHaveBeenCalledWith('🔮 Casting Fireball (25 mana)');
            
            consoleSpy.mockRestore();
        });

        it('should not cast spells with insufficient mana', () => {
            mockGameState.player.mana = 10; // Less than fireball cost (25)
            
            const result = magicSystem.castSpell('fireball');
            
            expect(result).toBe(false);
            expect(mockGameState.player.mana).toBe(10); // Unchanged
        });

        it('should not cast spells when already casting', () => {
            magicSystem.castSpell('fireball');
            const result = magicSystem.castSpell('heal');
            
            expect(result).toBe(false);
            expect(magicSystem.isCasting()).toBe(true);
        });

        it('should handle spell cooldowns', () => {
            magicSystem.castSpell('fireball');
            
            expect(magicSystem.isSpellOnCooldown('fireball')).toBe(true);
            expect(magicSystem.getSpellCooldown('fireball')).toBeGreaterThan(0);
        });

        it('should allow casting different spells if not on cooldown', () => {
            vi.useFakeTimers();
            
            const result1 = magicSystem.castSpell('heal');
            
            // Complete the first spell
            vi.advanceTimersByTime(2100); // Heal cast time is 2.0 seconds
            magicSystem.update(2.1);
            
            const result2 = magicSystem.castSpell('ice_shard');
            
            expect(result1).toBe(true);
            expect(result2).toBe(true);
            
            vi.useRealTimers();
        });
    });

    describe('Spell Effects', () => {
        beforeEach(() => {
            magicSystem.initialize(mockScene, mockGameState, mockParticleSystem);
        });

        it('should create particle effects when casting', () => {
            magicSystem.castSpell('fireball');
            
            expect(mockParticleSystem.playEffect).toHaveBeenCalled();
        });

        it('should heal player with heal spell', () => {
            vi.useFakeTimers();
            
            mockGameState.player.health = 50;
            
            // Cast heal spell
            magicSystem.castSpell('heal');
            
            // Complete the cast and trigger spell execution
            vi.advanceTimersByTime(2100); // Heal cast time is 2.0 seconds
            magicSystem.update(2.1);
            
            // The heal should have been executed
            expect(mockGameState.player.health).toBe(100); // 50 + 50 heal = 100 (capped at max)
            
            vi.useRealTimers();
        });
    });

    describe('Cast Management', () => {
        beforeEach(() => {
            magicSystem.initialize(mockScene, mockGameState, mockParticleSystem);
        });

        it('should track current cast state', () => {
            expect(magicSystem.isCasting()).toBe(false);
            expect(magicSystem.getCurrentCast()).toBeNull();
            
            magicSystem.castSpell('fireball');
            
            expect(magicSystem.isCasting()).toBe(true);
            expect(magicSystem.getCurrentCast()).not.toBeNull();
        });

        it('should cancel current cast', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            magicSystem.castSpell('fireball');
            expect(magicSystem.isCasting()).toBe(true);
            
            magicSystem.cancelCurrentCast();
            
            expect(magicSystem.isCasting()).toBe(false);
            expect(consoleSpy).toHaveBeenCalledWith('🔮 Spell cast cancelled');
            
            consoleSpy.mockRestore();
        });

        it('should handle cancelling when not casting', () => {
            expect(magicSystem.isCasting()).toBe(false);
            
            // Should not throw error
            magicSystem.cancelCurrentCast();
            
            expect(magicSystem.isCasting()).toBe(false);
        });
    });

    describe('Event System', () => {
        beforeEach(() => {
            magicSystem.initialize(mockScene, mockGameState, mockParticleSystem);
        });

        it('should emit events for spell casting', () => {
            const castStartSpy = vi.fn();
            magicSystem.on('spellCastStart', castStartSpy);
            
            magicSystem.castSpell('fireball');
            
            expect(castStartSpy).toHaveBeenCalled();
        });

        it('should emit events for spell completion', () => {
            vi.useFakeTimers();
            
            const castCompleteSpy = vi.fn();
            magicSystem.on('spellCastComplete', castCompleteSpy);
            
            magicSystem.castSpell('lightning_bolt'); // Quick cast (0.5s)
            
            vi.advanceTimersByTime(600);
            magicSystem.update(0.6);
            
            expect(castCompleteSpy).toHaveBeenCalled();
            
            vi.useRealTimers();
        });

        it('should emit events for spell cancellation', () => {
            const castCancelSpy = vi.fn();
            magicSystem.on('spellCastCancelled', castCancelSpy);
            
            magicSystem.castSpell('fireball');
            magicSystem.cancelCurrentCast();
            
            expect(castCancelSpy).toHaveBeenCalled();
        });

        it('should allow removing event listeners', () => {
            const castStartSpy = vi.fn();
            magicSystem.on('spellCastStart', castStartSpy);
            magicSystem.off('spellCastStart', castStartSpy);
            
            magicSystem.castSpell('fireball');
            
            expect(castStartSpy).not.toHaveBeenCalled();
        });
    });

    describe('Status Effects', () => {
        beforeEach(() => {
            magicSystem.initialize(mockScene, mockGameState, mockParticleSystem);
        });

        it('should track player status effects', () => {
            const initialEffects = magicSystem.getPlayerStatusEffects();
            expect(initialEffects).toHaveLength(0);
        });

        it('should handle shield spell status effects', () => {
            magicSystem.castSpell('shield');
            
            // Shield creates casting effect
            expect(mockParticleSystem.playEffect).toHaveBeenCalled();
        });
    });

    describe('Update Loop', () => {
        beforeEach(() => {
            magicSystem.initialize(mockScene, mockGameState, mockParticleSystem);
        });

        it('should update without errors when not initialized', () => {
            const uninitializedSystem = new MagicSystem();
            
            expect(() => {
                uninitializedSystem.update(0.16);
            }).not.toThrow();
        });

        it('should update casting progress', () => {
            vi.useFakeTimers();
            
            const progressSpy = vi.fn();
            magicSystem.on('spellCastProgress', progressSpy);
            
            magicSystem.castSpell('fireball'); // 1.5s cast time
            
            vi.advanceTimersByTime(750); // Half way through
            magicSystem.update(0.75);
            
            expect(progressSpy).toHaveBeenCalled();
            
            vi.useRealTimers();
        });

        it('should complete spells after cast time', () => {
            vi.useFakeTimers();
            
            const completeSpy = vi.fn();
            magicSystem.on('spellCastComplete', completeSpy);
            
            magicSystem.castSpell('lightning_bolt'); // 0.5s cast time
            
            vi.advanceTimersByTime(600);
            magicSystem.update(0.6);
            
            expect(completeSpy).toHaveBeenCalled();
            expect(magicSystem.isCasting()).toBe(false);
            
            vi.useRealTimers();
        });
    });

    describe('Cleanup', () => {
        beforeEach(() => {
            magicSystem.initialize(mockScene, mockGameState, mockParticleSystem);
        });

        it('should cleanup resources properly', () => {
            magicSystem.castSpell('fireball');
            expect(magicSystem.isCasting()).toBe(true);
            
            magicSystem.cleanup();
            
            expect(magicSystem.isCasting()).toBe(false);
            expect(magicSystem.getPlayerStatusEffects()).toHaveLength(0);
        });
    });

    describe('Edge Cases', () => {
        beforeEach(() => {
            magicSystem.initialize(mockScene, mockGameState, mockParticleSystem);
        });

        it('should handle casting non-existent spells', () => {
            const result = magicSystem.castSpell('nonexistent');
            expect(result).toBe(false);
        });

        it('should handle null game state gracefully', () => {
            const uninitializedSystem = new MagicSystem();
            const result = uninitializedSystem.castSpell('fireball');
            expect(result).toBe(false);
        });

        it('should handle spells with zero mana cost', () => {
            // Modify a spell to have zero cost
            const heal = magicSystem.getSpell('heal');
            if (heal) {
                heal.manaCost = 0;
                const result = magicSystem.castSpell('heal');
                expect(result).toBe(true);
                expect(mockGameState.player.mana).toBe(100); // No mana consumed
            }
        });
    });
});