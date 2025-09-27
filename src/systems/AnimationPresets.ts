import * as THREE from 'three';
import { KeyframeConfig, AnimationSystem } from './AnimationSystem';

/**
 * Predefined animation configurations for common game objects
 */
export class AnimationPresets {
    private static animationSystem: AnimationSystem | null = null;
    
    static setAnimationSystem(system: AnimationSystem): void {
        this.animationSystem = system;
    }
    
    /**
     * Tree swaying animation affected by wind
     */
    static createTreeSwayAnimation(
        objectId: string,
        target: THREE.Object3D,
        windStrength: number = 0.5,
        windSpeed: number = 1.0
    ): string | null {
        if (!this.animationSystem) return null;
        
        const keyframes: KeyframeConfig[] = [
            {
                property: 'rotation.z',
                keyframes: [
                    { time: 0, value: -0.1 * windStrength, easing: 'easeInOut' },
                    { time: 0.25, value: 0, easing: 'easeInOut' },
                    { time: 0.5, value: 0.1 * windStrength, easing: 'easeInOut' },
                    { time: 0.75, value: 0, easing: 'easeInOut' },
                    { time: 1, value: -0.1 * windStrength, easing: 'easeInOut' }
                ]
            },
            {
                property: 'rotation.x',
                keyframes: [
                    { time: 0, value: 0, easing: 'easeInOut' },
                    { time: 0.3, value: 0.05 * windStrength, easing: 'easeInOut' },
                    { time: 0.7, value: -0.05 * windStrength, easing: 'easeInOut' },
                    { time: 1, value: 0, easing: 'easeInOut' }
                ]
            }
        ];
        
        const animationId = this.animationSystem.addKeyframeAnimation(
            objectId,
            target,
            keyframes,
            3.0 / windSpeed, // Duration inversely related to wind speed
            true, // Loop
            1 // Priority
        );
        
        this.animationSystem.startAnimation(objectId, animationId);
        return animationId;
    }
    
    /**
     * Floating animation for magical objects or pickups
     */
    static createFloatingAnimation(
        objectId: string,
        target: THREE.Object3D,
        amplitude: number = 0.3,
        speed: number = 2.0
    ): string | null {
        if (!this.animationSystem) return null;
        
        const keyframes: KeyframeConfig[] = [
            {
                property: 'position.y',
                keyframes: [
                    { time: 0, value: target.position.y, easing: 'easeInOut' },
                    { time: 0.5, value: target.position.y + amplitude, easing: 'easeInOut' },
                    { time: 1, value: target.position.y, easing: 'easeInOut' }
                ]
            },
            {
                property: 'rotation.y',
                keyframes: [
                    { time: 0, value: 0, easing: 'linear' },
                    { time: 1, value: Math.PI * 2, easing: 'linear' }
                ]
            }
        ];
        
        const animationId = this.animationSystem.addKeyframeAnimation(
            objectId,
            target,
            keyframes,
            2.0 / speed,
            true, // Loop
            2 // Priority
        );
        
        this.animationSystem.startAnimation(objectId, animationId);
        return animationId;
    }
    
    /**
     * Breathing/idle animation for characters
     */
    static createBreathingAnimation(
        objectId: string,
        target: THREE.Object3D,
        intensity: number = 0.02
    ): string | null {
        if (!this.animationSystem) return null;
        
        const keyframes: KeyframeConfig[] = [
            {
                property: 'scale.y',
                keyframes: [
                    { time: 0, value: 1, easing: 'easeInOut' },
                    { time: 0.5, value: 1 + intensity, easing: 'easeInOut' },
                    { time: 1, value: 1, easing: 'easeInOut' }
                ]
            },
            {
                property: 'position.y',
                keyframes: [
                    { time: 0, value: target.position.y, easing: 'easeInOut' },
                    { time: 0.5, value: target.position.y + intensity * 0.5, easing: 'easeInOut' },
                    { time: 1, value: target.position.y, easing: 'easeInOut' }
                ]
            }
        ];
        
        const animationId = this.animationSystem.addKeyframeAnimation(
            objectId,
            target,
            keyframes,
            3.0, // 3 second breathing cycle
            true, // Loop
            0 // Low priority
        );
        
        this.animationSystem.startAnimation(objectId, animationId);
        return animationId;
    }
    
    /**
     * Walking animation for characters
     */
    static createWalkingAnimation(
        objectId: string,
        target: THREE.Object3D,
        walkSpeed: number = 1.0
    ): string | null {
        if (!this.animationSystem) return null;
        
        const keyframes: KeyframeConfig[] = [
            {
                property: 'position.y',
                keyframes: [
                    { time: 0, value: target.position.y, easing: 'easeInOut' },
                    { time: 0.25, value: target.position.y + 0.1, easing: 'easeInOut' },
                    { time: 0.5, value: target.position.y, easing: 'easeInOut' },
                    { time: 0.75, value: target.position.y + 0.1, easing: 'easeInOut' },
                    { time: 1, value: target.position.y, easing: 'easeInOut' }
                ]
            },
            {
                property: 'rotation.z',
                keyframes: [
                    { time: 0, value: 0, easing: 'easeInOut' },
                    { time: 0.25, value: 0.05, easing: 'easeInOut' },
                    { time: 0.5, value: 0, easing: 'easeInOut' },
                    { time: 0.75, value: -0.05, easing: 'easeInOut' },
                    { time: 1, value: 0, easing: 'easeInOut' }
                ]
            }
        ];
        
        const animationId = this.animationSystem.addKeyframeAnimation(
            objectId,
            target,
            keyframes,
            1.0 / walkSpeed, // Duration inversely related to walk speed
            true, // Loop
            3 // High priority
        );
        
        this.animationSystem.startAnimation(objectId, animationId);
        return animationId;
    }
    
    /**
     * Attack animation for characters
     */
    static createAttackAnimation(
        objectId: string,
        target: THREE.Object3D,
        attackType: 'swing' | 'thrust' | 'spell' = 'swing'
    ): string | null {
        if (!this.animationSystem) return null;
        
        let keyframes: KeyframeConfig[] = [];
        
        switch (attackType) {
            case 'swing':
                keyframes = [
                    {
                        property: 'rotation.y',
                        keyframes: [
                            { time: 0, value: 0, easing: 'easeIn' },
                            { time: 0.3, value: -0.5, easing: 'easeOut' },
                            { time: 0.6, value: 0.8, easing: 'easeInOut' },
                            { time: 1, value: 0, easing: 'easeOut' }
                        ]
                    },
                    {
                        property: 'scale.x',
                        keyframes: [
                            { time: 0, value: 1, easing: 'easeIn' },
                            { time: 0.4, value: 1.1, easing: 'easeOut' },
                            { time: 1, value: 1, easing: 'easeOut' }
                        ]
                    }
                ];
                break;
                
            case 'thrust':
                keyframes = [
                    {
                        property: 'position.z',
                        keyframes: [
                            { time: 0, value: target.position.z, easing: 'easeIn' },
                            { time: 0.2, value: target.position.z - 0.3, easing: 'easeOut' },
                            { time: 0.5, value: target.position.z + 0.5, easing: 'easeInOut' },
                            { time: 1, value: target.position.z, easing: 'easeOut' }
                        ]
                    }
                ];
                break;
                
            case 'spell':
                keyframes = [
                    {
                        property: 'position.y',
                        keyframes: [
                            { time: 0, value: target.position.y, easing: 'easeIn' },
                            { time: 0.3, value: target.position.y + 0.2, easing: 'easeOut' },
                            { time: 1, value: target.position.y, easing: 'easeOut' }
                        ]
                    },
                    {
                        property: 'rotation.x',
                        keyframes: [
                            { time: 0, value: 0, easing: 'easeIn' },
                            { time: 0.5, value: -0.3, easing: 'easeOut' },
                            { time: 1, value: 0, easing: 'easeOut' }
                        ]
                    }
                ];
                break;
        }
        
        const animationId = this.animationSystem.addKeyframeAnimation(
            objectId,
            target,
            keyframes,
            1.2, // Attack duration
            false, // Don't loop
            5 // Highest priority
        );
        
        this.animationSystem.startAnimation(objectId, animationId);
        return animationId;
    }
    
    /**
     * Hit reaction animation
     */
    static createHitReactionAnimation(
        objectId: string,
        target: THREE.Object3D,
        direction: THREE.Vector3 = new THREE.Vector3(1, 0, 0)
    ): string | null {
        if (!this.animationSystem) return null;
        
        const knockbackStrength = 0.2;
        const keyframes: KeyframeConfig[] = [
            {
                property: 'position.x',
                keyframes: [
                    { time: 0, value: target.position.x, easing: 'easeOut' },
                    { time: 0.3, value: target.position.x + direction.x * knockbackStrength, easing: 'easeInOut' },
                    { time: 1, value: target.position.x, easing: 'easeOut' }
                ]
            },
            {
                property: 'position.z',
                keyframes: [
                    { time: 0, value: target.position.z, easing: 'easeOut' },
                    { time: 0.3, value: target.position.z + direction.z * knockbackStrength, easing: 'easeInOut' },
                    { time: 1, value: target.position.z, easing: 'easeOut' }
                ]
            },
            {
                property: 'rotation.z',
                keyframes: [
                    { time: 0, value: 0, easing: 'easeOut' },
                    { time: 0.2, value: 0.2, easing: 'easeInOut' },
                    { time: 1, value: 0, easing: 'easeOut' }
                ]
            }
        ];
        
        const animationId = this.animationSystem.addKeyframeAnimation(
            objectId,
            target,
            keyframes,
            0.8, // Hit reaction duration
            false, // Don't loop
            4 // High priority
        );
        
        this.animationSystem.startAnimation(objectId, animationId);
        return animationId;
    }
    
    /**
     * Death animation
     */
    static createDeathAnimation(
        objectId: string,
        target: THREE.Object3D
    ): string | null {
        if (!this.animationSystem) return null;
        
        const keyframes: KeyframeConfig[] = [
            {
                property: 'rotation.x',
                keyframes: [
                    { time: 0, value: 0, easing: 'easeIn' },
                    { time: 0.5, value: 0.2, easing: 'easeOut' },
                    { time: 1, value: Math.PI / 2, easing: 'easeInOut' }
                ]
            },
            {
                property: 'position.y',
                keyframes: [
                    { time: 0, value: target.position.y, easing: 'linear' },
                    { time: 0.7, value: target.position.y, easing: 'easeIn' },
                    { time: 1, value: target.position.y - 0.5, easing: 'easeOut' }
                ]
            },
            {
                property: 'scale.x',
                keyframes: [
                    { time: 0, value: 1, easing: 'linear' },
                    { time: 0.8, value: 1, easing: 'easeIn' },
                    { time: 1, value: 0.8, easing: 'easeOut' }
                ]
            },
            {
                property: 'scale.z',
                keyframes: [
                    { time: 0, value: 1, easing: 'linear' },
                    { time: 0.8, value: 1, easing: 'easeIn' },
                    { time: 1, value: 0.8, easing: 'easeOut' }
                ]
            }
        ];
        
        const animationId = this.animationSystem.addKeyframeAnimation(
            objectId,
            target,
            keyframes,
            2.0, // Death animation duration
            false, // Don't loop
            6 // Highest priority
        );
        
        this.animationSystem.startAnimation(objectId, animationId);
        return animationId;
    }
    
    /**
     * Chest opening animation
     */
    static createChestOpenAnimation(
        objectId: string,
        target: THREE.Object3D
    ): string | null {
        if (!this.animationSystem) return null;
        
        // Assume the chest has a lid that should rotate open
        const keyframes: KeyframeConfig[] = [
            {
                property: 'rotation.x',
                keyframes: [
                    { time: 0, value: 0, easing: 'easeOut' },
                    { time: 0.3, value: -0.2, easing: 'bounce' },
                    { time: 1, value: -Math.PI / 3, easing: 'easeOut' }
                ]
            }
        ];
        
        const animationId = this.animationSystem.addKeyframeAnimation(
            objectId,
            target,
            keyframes,
            1.5, // Chest opening duration
            false, // Don't loop
            3 // Medium priority
        );
        
        this.animationSystem.startAnimation(objectId, animationId);
        return animationId;
    }
    
    /**
     * Pulsing glow animation for magical objects
     */
    static createPulseAnimation(
        objectId: string,
        target: THREE.Object3D,
        pulseSpeed: number = 1.0,
        pulseIntensity: number = 0.2
    ): string | null {
        if (!this.animationSystem) return null;
        
        const keyframes: KeyframeConfig[] = [
            {
                property: 'scale.x',
                keyframes: [
                    { time: 0, value: 1, easing: 'easeInOut' },
                    { time: 0.5, value: 1 + pulseIntensity, easing: 'easeInOut' },
                    { time: 1, value: 1, easing: 'easeInOut' }
                ]
            },
            {
                property: 'scale.y',
                keyframes: [
                    { time: 0, value: 1, easing: 'easeInOut' },
                    { time: 0.5, value: 1 + pulseIntensity, easing: 'easeInOut' },
                    { time: 1, value: 1, easing: 'easeInOut' }
                ]
            },
            {
                property: 'scale.z',
                keyframes: [
                    { time: 0, value: 1, easing: 'easeInOut' },
                    { time: 0.5, value: 1 + pulseIntensity, easing: 'easeInOut' },
                    { time: 1, value: 1, easing: 'easeInOut' }
                ]
            }
        ];
        
        const animationId = this.animationSystem.addKeyframeAnimation(
            objectId,
            target,
            keyframes,
            2.0 / pulseSpeed,
            true, // Loop
            1 // Low priority
        );
        
        this.animationSystem.startAnimation(objectId, animationId);
        return animationId;
    }
}