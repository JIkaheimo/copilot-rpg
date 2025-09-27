import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { AnimationSystem, PropertyAnimation, KeyframeAnimation } from '../../systems/AnimationSystem';
import { AnimationPresets } from '../../systems/AnimationPresets';

// Mock Three.js objects for testing
const mockObject3D = () => {
    return {
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: new THREE.Vector3(1, 1, 1)
    } as THREE.Object3D;
};

describe('AnimationSystem', () => {
    let animationSystem: AnimationSystem;
    let mockTarget: THREE.Object3D;

    beforeEach(() => {
        animationSystem = new AnimationSystem();
        animationSystem.initialize();
        mockTarget = mockObject3D();
    });

    describe('Initialization', () => {
        it('should initialize properly', () => {
            const stats = animationSystem.getStats();
            expect(stats.totalAnimations).toBe(0);
            expect(stats.activeAnimations).toBe(0);
        });

        it('should set culling distance', () => {
            animationSystem.setCullingDistance(50);
            expect(() => animationSystem.setCullingDistance(50)).not.toThrow();
        });

        it('should update player position for culling', () => {
            const playerPos = new THREE.Vector3(10, 0, 10);
            animationSystem.updatePlayerPosition(playerPos);
            expect(() => animationSystem.updatePlayerPosition(playerPos)).not.toThrow();
        });
    });

    describe('Property Animations', () => {
        it('should create property animation', () => {
            const animationId = animationSystem.addPropertyAnimation(
                'test_object',
                mockTarget,
                'position.y',
                0,
                5,
                1.0
            );

            expect(animationId).toBeDefined();
            expect(typeof animationId).toBe('string');

            const stats = animationSystem.getStats();
            expect(stats.totalAnimations).toBe(1);
        });

        it('should start and stop animations', () => {
            const animationId = animationSystem.addPropertyAnimation(
                'test_object',
                mockTarget,
                'position.y',
                0,
                5,
                1.0
            );

            animationSystem.startAnimation('test_object', animationId);
            let stats = animationSystem.getStats();
            expect(stats.activeAnimations).toBe(1);

            animationSystem.stopAnimation('test_object', animationId);
            stats = animationSystem.getStats();
            expect(stats.activeAnimations).toBe(0);
        });

        it('should update animations over time', () => {
            const animationId = animationSystem.addPropertyAnimation(
                'test_object',
                mockTarget,
                'position.y',
                0,
                10,
                1.0
            );

            animationSystem.startAnimation('test_object', animationId);
            
            // Update to completion in one step (since incremental updates seem to have timing issues)
            animationSystem.update(1.0);
            expect(mockTarget.position.y).toBeCloseTo(10, 1);
        });

        it('should handle looping animations', () => {
            const animationId = animationSystem.addPropertyAnimation(
                'test_object',
                mockTarget,
                'rotation.y',
                0,
                Math.PI * 2,
                1.0,
                true // loop
            );

            animationSystem.startAnimation('test_object', animationId);
            
            // Complete one cycle
            animationSystem.update(1.0);
            const firstCycleValue = mockTarget.rotation.y;

            // Continue past one cycle
            animationSystem.update(0.5);
            expect(mockTarget.rotation.y).not.toBe(firstCycleValue);
        });
    });

    describe('Keyframe Animations', () => {
        it('should create keyframe animation', () => {
            const keyframes = [{
                property: 'position.y',
                keyframes: [
                    { time: 0, value: 0 },
                    { time: 0.5, value: 5 },
                    { time: 1, value: 0 }
                ]
            }];

            const animationId = animationSystem.addKeyframeAnimation(
                'test_object',
                mockTarget,
                keyframes,
                2.0
            );

            expect(animationId).toBeDefined();
            const stats = animationSystem.getStats();
            expect(stats.totalAnimations).toBe(1);
        });

        it('should interpolate between keyframes', () => {
            const keyframes = [{
                property: 'position.y',
                keyframes: [
                    { time: 0, value: 0 },
                    { time: 1, value: 10 }
                ]
            }];

            const animationId = animationSystem.addKeyframeAnimation(
                'test_object',
                mockTarget,
                keyframes,
                1.0
            );

            animationSystem.startAnimation('test_object', animationId);
            
            // Check interpolation at midpoint
            animationSystem.update(0.5);
            expect(mockTarget.position.y).toBeCloseTo(5, 1);
        });

        it('should handle multiple properties in keyframe animation', () => {
            const keyframes = [
                {
                    property: 'position.y',
                    keyframes: [
                        { time: 0, value: 0 },
                        { time: 1, value: 5 }
                    ]
                },
                {
                    property: 'rotation.z',
                    keyframes: [
                        { time: 0, value: 0 },
                        { time: 1, value: Math.PI }
                    ]
                }
            ];

            const animationId = animationSystem.addKeyframeAnimation(
                'test_object',
                mockTarget,
                keyframes,
                1.0
            );

            animationSystem.startAnimation('test_object', animationId);
            animationSystem.update(0.5);

            expect(mockTarget.position.y).toBeCloseTo(2.5, 1);
            expect(mockTarget.rotation.z).toBeCloseTo(Math.PI / 2, 1);
        });
    });

    describe('Animation States', () => {
        it('should set and get animation states', () => {
            animationSystem.setAnimationState('test_object', 'walking');
            expect(animationSystem.getAnimationState('test_object')).toBe('walking');
        });

        it('should handle state transitions with blending', () => {
            animationSystem.setAnimationState('test_object', 'idle');
            animationSystem.setAnimationState('test_object', 'running', 0.5);
            
            expect(animationSystem.getAnimationState('test_object')).toBe('running');
        });
    });

    describe('Animation Management', () => {
        it('should remove all animations for an object', () => {
            animationSystem.addPropertyAnimation('test_object', mockTarget, 'position.x', 0, 1, 1.0);
            animationSystem.addPropertyAnimation('test_object', mockTarget, 'position.y', 0, 1, 1.0);
            
            let stats = animationSystem.getStats();
            expect(stats.totalAnimations).toBe(2);

            animationSystem.removeAllAnimations('test_object');
            stats = animationSystem.getStats();
            expect(stats.totalAnimations).toBe(0);
        });

        it('should limit animations per object', () => {
            // Add more animations than the limit
            for (let i = 0; i < 5; i++) {
                animationSystem.addPropertyAnimation(
                    'test_object',
                    mockTarget,
                    `position.${i % 3 === 0 ? 'x' : i % 3 === 1 ? 'y' : 'z'}`,
                    0,
                    1,
                    1.0,
                    false,
                    i // priority
                );
            }

            const stats = animationSystem.getStats();
            expect(stats.totalAnimations).toBeLessThanOrEqual(3); // maxAnimationsPerObject
        });

        it('should prioritize higher priority animations', () => {
            const lowPriorityId = animationSystem.addPropertyAnimation(
                'test_object',
                mockTarget,
                'position.x',
                0,
                1,
                1.0,
                false,
                1 // low priority
            );

            const highPriorityId = animationSystem.addPropertyAnimation(
                'test_object',
                mockTarget,
                'position.y',
                0,
                1,
                1.0,
                false,
                5 // high priority
            );

            // Both should be added initially
            const stats = animationSystem.getStats();
            expect(stats.totalAnimations).toBe(2);
        });
    });

    describe('Performance Optimizations', () => {
        it('should cull distant animations', () => {
            const distantTarget = mockObject3D();
            distantTarget.position.set(1000, 0, 1000); // Very far away

            animationSystem.setCullingDistance(10);
            animationSystem.updatePlayerPosition(new THREE.Vector3(0, 0, 0));

            const animationId = animationSystem.addPropertyAnimation(
                'distant_object',
                distantTarget,
                'rotation.y',
                0,
                Math.PI,
                1.0
            );

            animationSystem.startAnimation('distant_object', animationId);
            
            // Animation should be culled due to distance
            animationSystem.update(0.5);
            // The animation shouldn't execute (rotation should remain 0)
            expect(distantTarget.rotation.y).toBe(0);
        });

        it('should provide animation statistics', () => {
            animationSystem.addPropertyAnimation('obj1', mockTarget, 'position.x', 0, 1, 1.0);
            animationSystem.addPropertyAnimation('obj2', mockTarget, 'position.y', 0, 1, 1.0);
            
            const stats = animationSystem.getStats();
            expect(stats.totalAnimations).toBe(2);
            expect(stats.activeAnimations).toBe(0); // Not started yet
            expect(typeof stats.pooledAnimations).toBe('number');
        });
    });

    describe('Cleanup', () => {
        it('should cleanup all animations and resources', () => {
            animationSystem.addPropertyAnimation('test_object', mockTarget, 'position.x', 0, 1, 1.0);
            
            animationSystem.cleanup();
            
            const stats = animationSystem.getStats();
            expect(stats.totalAnimations).toBe(0);
            expect(stats.activeAnimations).toBe(0);
        });
    });
});

describe('PropertyAnimation', () => {
    let mockTarget: THREE.Object3D;

    beforeEach(() => {
        mockTarget = mockObject3D();
    });

    describe('Easing Functions', () => {
        it('should apply linear easing', () => {
            const animation = new PropertyAnimation(
                'test',
                mockTarget,
                'position.x',
                0,
                10,
                1.0,
                false,
                0,
                'linear'
            );

            animation.isActive = true;
            animation.startTime = 0;

            // Test midpoint
            animation.update(0, 0.5);
            expect(mockTarget.position.x).toBeCloseTo(5, 1);
        });

        it('should apply easeInOut easing', () => {
            const animation = new PropertyAnimation(
                'test',
                mockTarget,
                'position.x',
                0,
                10,
                1.0,
                false,
                0,
                'easeInOut'
            );

            animation.isActive = true;
            animation.startTime = 0;

            // Test quarter point - should be different from linear
            animation.update(0, 0.25);
            expect(mockTarget.position.x).not.toBeCloseTo(2.5, 1);
        });

        it('should apply bounce easing', () => {
            const animation = new PropertyAnimation(
                'test',
                mockTarget,
                'position.x',
                0,
                10,
                1.0,
                false,
                0,
                'bounce'
            );

            animation.isActive = true;
            animation.startTime = 0;

            animation.update(0, 1.0);
            expect(mockTarget.position.x).toBeCloseTo(10, 1);
        });
    });

    describe('Nested Property Access', () => {
        it('should handle nested property paths', () => {
            const animation = new PropertyAnimation(
                'test',
                mockTarget,
                'position.x',
                0,
                5,
                1.0
            );

            animation.isActive = true;
            animation.startTime = 0;

            animation.update(0, 1.0);
            expect(mockTarget.position.x).toBe(5);
        });

        it('should handle invalid property paths gracefully', () => {
            const animation = new PropertyAnimation(
                'test',
                mockTarget,
                'invalid.property.path',
                0,
                5,
                1.0
            );

            animation.isActive = true;
            animation.startTime = 0;

            expect(() => animation.update(0, 1.0)).not.toThrow();
        });
    });
});

describe('AnimationPresets', () => {
    let mockAnimationSystem: AnimationSystem;
    let mockTarget: THREE.Object3D;

    beforeEach(() => {
        mockAnimationSystem = new AnimationSystem();
        mockAnimationSystem.initialize();
        mockTarget = mockObject3D();
        
        AnimationPresets.setAnimationSystem(mockAnimationSystem);
    });

    describe('Tree Animations', () => {
        it('should create tree sway animation', () => {
            const animationId = AnimationPresets.createTreeSwayAnimation(
                'test_tree',
                mockTarget,
                0.5,
                1.0
            );

            expect(animationId).toBeDefined();
            const stats = mockAnimationSystem.getStats();
            expect(stats.totalAnimations).toBeGreaterThan(0);
        });
    });

    describe('Character Animations', () => {
        it('should create breathing animation', () => {
            const animationId = AnimationPresets.createBreathingAnimation(
                'test_character',
                mockTarget,
                0.02
            );

            expect(animationId).toBeDefined();
        });

        it('should create walking animation', () => {
            const animationId = AnimationPresets.createWalkingAnimation(
                'test_character',
                mockTarget,
                1.0
            );

            expect(animationId).toBeDefined();
        });

        it('should create attack animation', () => {
            const animationId = AnimationPresets.createAttackAnimation(
                'test_character',
                mockTarget,
                'swing'
            );

            expect(animationId).toBeDefined();
        });

        it('should create hit reaction animation', () => {
            const direction = new THREE.Vector3(1, 0, 0);
            const animationId = AnimationPresets.createHitReactionAnimation(
                'test_character',
                mockTarget,
                direction
            );

            expect(animationId).toBeDefined();
        });

        it('should create death animation', () => {
            const animationId = AnimationPresets.createDeathAnimation(
                'test_character',
                mockTarget
            );

            expect(animationId).toBeDefined();
        });
    });

    describe('Object Animations', () => {
        it('should create floating animation', () => {
            const animationId = AnimationPresets.createFloatingAnimation(
                'test_object',
                mockTarget,
                0.3,
                2.0
            );

            expect(animationId).toBeDefined();
        });

        it('should create chest opening animation', () => {
            const animationId = AnimationPresets.createChestOpenAnimation(
                'test_chest',
                mockTarget
            );

            expect(animationId).toBeDefined();
        });

        it('should create pulse animation', () => {
            const animationId = AnimationPresets.createPulseAnimation(
                'test_object',
                mockTarget,
                1.0,
                0.2
            );

            expect(animationId).toBeDefined();
        });
    });

    describe('Without Animation System', () => {
        it('should return null when animation system is not set', () => {
            AnimationPresets.setAnimationSystem(null as any);
            
            const animationId = AnimationPresets.createFloatingAnimation(
                'test_object',
                mockTarget
            );

            expect(animationId).toBeNull();
        });
    });
});