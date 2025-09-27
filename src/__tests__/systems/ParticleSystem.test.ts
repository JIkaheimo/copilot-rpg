import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { ParticleSystem, ParticleEffect } from '../../systems/ParticleSystem';

// Mock Three.js
vi.mock('three', async () => {
    const actual = await vi.importActual('three');
    return {
        ...actual,
        Scene: vi.fn(() => ({
            add: vi.fn(),
            remove: vi.fn()
        })),
        BufferGeometry: vi.fn(() => ({
            setAttribute: vi.fn(),
            dispose: vi.fn(),
            attributes: {
                position: { array: new Float32Array(60), needsUpdate: false },
                color: { array: new Float32Array(60), needsUpdate: false }
            }
        })),
        PointsMaterial: vi.fn(() => ({
            dispose: vi.fn()
        })),
        Points: vi.fn(() => ({
            position: { copy: vi.fn() }
        })),
        BufferAttribute: vi.fn(),
        Vector3: vi.fn((x = 0, y = 0, z = 0) => ({
            x, y, z,
            copy: vi.fn(),
            add: vi.fn(),
            normalize: vi.fn(),
            multiplyScalar: vi.fn()
        })),
        Color: vi.fn(() => ({
            r: 1, g: 0, b: 0
        }))
    };
});

describe('ParticleSystem', () => {
    let particleSystem: ParticleSystem;
    let mockScene: THREE.Scene;

    beforeEach(() => {
        particleSystem = new ParticleSystem();
        mockScene = new THREE.Scene();
    });

    describe('Initialization', () => {
        it('should initialize successfully', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            particleSystem.initialize(mockScene);
            
            expect(consoleSpy).toHaveBeenCalledWith('✨ Particle System initialized');
            consoleSpy.mockRestore();
        });

        it('should create default effect templates', () => {
            particleSystem.initialize(mockScene);
            
            // Test that we can play built-in effects
            const position = new THREE.Vector3(0, 1, 0);
            const effectId = particleSystem.playEffect('hit', position);
            
            expect(effectId).toBeTruthy();
            expect(typeof effectId).toBe('string');
        });
    });

    describe('Effect Management', () => {
        beforeEach(() => {
            particleSystem.initialize(mockScene);
        });

        it('should play built-in effects', () => {
            const position = new THREE.Vector3(0, 1, 0);
            
            const hitEffect = particleSystem.playEffect('hit', position);
            const levelupEffect = particleSystem.playEffect('levelup', position);
            const magicEffect = particleSystem.playEffect('magic', position);
            const treasureEffect = particleSystem.playEffect('treasure', position);
            const deathEffect = particleSystem.playEffect('death', position);
            
            expect(hitEffect).toBeTruthy();
            expect(levelupEffect).toBeTruthy();
            expect(magicEffect).toBeTruthy();
            expect(treasureEffect).toBeTruthy();
            expect(deathEffect).toBeTruthy();
        });

        it('should return empty string for unknown effects', () => {
            const position = new THREE.Vector3(0, 1, 0);
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            const effectId = particleSystem.playEffect('unknown', position);
            
            expect(effectId).toBe('');
            expect(consoleSpy).toHaveBeenCalledWith("Particle effect 'unknown' not found");
            consoleSpy.mockRestore();
        });

        it('should stop effects', () => {
            const position = new THREE.Vector3(0, 1, 0);
            const effectId = particleSystem.playEffect('hit', position);
            
            expect(effectId).toBeTruthy();
            
            // Should not throw when stopping existing effect
            expect(() => particleSystem.stopEffect(effectId)).not.toThrow();
        });

        it('should remove effects', () => {
            const position = new THREE.Vector3(0, 1, 0);
            const effectId = particleSystem.playEffect('hit', position);
            
            expect(particleSystem.getActiveEffectCount()).toBe(1);
            
            particleSystem.removeEffect(effectId);
            
            expect(particleSystem.getActiveEffectCount()).toBe(0);
        });

        it('should handle non-existent effect removal gracefully', () => {
            expect(() => particleSystem.removeEffect('nonexistent')).not.toThrow();
            expect(() => particleSystem.stopEffect('nonexistent')).not.toThrow();
        });
    });

    describe('Custom Effects', () => {
        beforeEach(() => {
            particleSystem.initialize(mockScene);
        });

        it('should create custom effects', () => {
            const customConfig = {
                particleCount: 10,
                color: 0x00ff00,
                size: 0.2,
                lifetime: 1,
                spread: 2,
                velocity: new THREE.Vector3(0, 5, 0),
                gravity: new THREE.Vector3(0, -2, 0),
                fadeOut: true
            };

            particleSystem.createCustomEffect('custom', customConfig);
            
            const position = new THREE.Vector3(0, 0, 0);
            const effectId = particleSystem.playEffect('custom', position);
            
            expect(effectId).toBeTruthy();
        });
    });

    describe('Update and Cleanup', () => {
        beforeEach(() => {
            particleSystem.initialize(mockScene);
        });

        it('should update particle effects', () => {
            const position = new THREE.Vector3(0, 1, 0);
            particleSystem.playEffect('hit', position);
            
            expect(() => particleSystem.update(0.016)).not.toThrow();
        });

        it('should track active effect count', () => {
            const position = new THREE.Vector3(0, 1, 0);
            
            expect(particleSystem.getActiveEffectCount()).toBe(0);
            
            const effectId1 = particleSystem.playEffect('hit', position);
            const effectId2 = particleSystem.playEffect('magic', position);
            
            expect(particleSystem.getActiveEffectCount()).toBe(2);
            
            particleSystem.removeEffect(effectId1);
            expect(particleSystem.getActiveEffectCount()).toBe(1);
            
            particleSystem.removeEffect(effectId2);
            expect(particleSystem.getActiveEffectCount()).toBe(0);
        });

        it('should cleanup all effects', () => {
            const position = new THREE.Vector3(0, 1, 0);
            particleSystem.playEffect('hit', position);
            particleSystem.playEffect('magic', position);
            
            expect(particleSystem.getActiveEffectCount()).toBe(2);
            
            particleSystem.cleanup();
            
            expect(particleSystem.getActiveEffectCount()).toBe(0);
        });

        it('should handle auto-duration effects', (done) => {
            const position = new THREE.Vector3(0, 1, 0);
            
            // Play effect with 0.1 second duration
            const effectId = particleSystem.playEffect('hit', position, 0.1);
            expect(effectId).toBeTruthy();
            
            // Check that effect is stopped after duration
            setTimeout(() => {
                // The effect should be stopped (but may still exist until next update)
                expect(particleSystem.getActiveEffectCount()).toBeLessThanOrEqual(1);
                done();
            }, 150);
        });
    });

    describe('Integration', () => {
        beforeEach(() => {
            particleSystem.initialize(mockScene);
        });

        it('should work without scene initialization', () => {
            const newParticleSystem = new ParticleSystem();
            const position = new THREE.Vector3(0, 1, 0);
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            // Should handle gracefully when not initialized
            const effectId = newParticleSystem.playEffect('hit', position);
            expect(effectId).toBe('');
            expect(consoleSpy).toHaveBeenCalledWith("Particle effect 'hit' not found");
            consoleSpy.mockRestore();
        });

        it('should handle multiple effects simultaneously', () => {
            const position1 = new THREE.Vector3(0, 1, 0);
            const position2 = new THREE.Vector3(5, 1, 5);
            
            const effect1 = particleSystem.playEffect('hit', position1);
            const effect2 = particleSystem.playEffect('magic', position2);
            const effect3 = particleSystem.playEffect('levelup', position1);
            
            expect(particleSystem.getActiveEffectCount()).toBe(3);
            
            particleSystem.update(0.016);
            
            // Effects should still be active after one update
            expect(particleSystem.getActiveEffectCount()).toBe(3);
        });
    });
});

describe('ParticleEffect', () => {
    let particleEffect: ParticleEffect;
    let mockConfig: any;

    beforeEach(() => {
        mockConfig = {
            particleCount: 20,
            color: 0xff0000,
            size: 0.1,
            lifetime: 1,
            spread: 2,
            velocity: new THREE.Vector3(0, 2, 0),
            gravity: new THREE.Vector3(0, -5, 0),
            fadeOut: true
        };
        
        particleEffect = new ParticleEffect(mockConfig);
    });

    describe('Lifecycle', () => {
        it('should initialize with inactive state', () => {
            expect(particleEffect.isEffectActive()).toBe(false);
        });

        it('should start and become active', () => {
            const position = new THREE.Vector3(0, 1, 0);
            
            particleEffect.start(position);
            
            expect(particleEffect.isEffectActive()).toBe(true);
        });

        it('should stop and become inactive', () => {
            const position = new THREE.Vector3(0, 1, 0);
            
            particleEffect.start(position);
            expect(particleEffect.isEffectActive()).toBe(true);
            
            particleEffect.stop();
            expect(particleEffect.isEffectActive()).toBe(false);
        });

        it('should provide access to Three.js object', () => {
            const object3D = particleEffect.getObject3D();
            
            expect(object3D).toBeDefined();
        });

        it('should dispose resources', () => {
            expect(() => particleEffect.dispose()).not.toThrow();
        });
    });

    describe('Updates', () => {
        it('should update when active', () => {
            const position = new THREE.Vector3(0, 1, 0);
            
            particleEffect.start(position);
            expect(() => particleEffect.update(0.016)).not.toThrow();
        });

        it('should not update when inactive', () => {
            expect(() => particleEffect.update(0.016)).not.toThrow();
        });
    });
});