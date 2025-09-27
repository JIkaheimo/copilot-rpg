import * as THREE from 'three';

/**
 * Base animation interface for all animation types
 */
export interface Animation {
    id: string;
    target: THREE.Object3D;
    duration: number;
    loop: boolean;
    startTime: number;
    isActive: boolean;
    priority: number;
    
    update(deltaTime: number, currentTime: number): boolean; // Returns true if animation is complete
    reset(): void;
    cleanup(): void;
}

/**
 * Animation state for smooth transitions
 */
export type AnimationState = 'idle' | 'walking' | 'running' | 'jumping' | 'attacking' | 'hit' | 'death' | 'custom';

/**
 * Animation blend configuration
 */
export interface AnimationBlend {
    fromState: AnimationState;
    toState: AnimationState;
    duration: number;
    currentTime: number;
}

/**
 * Keyframe animation configuration
 */
export interface KeyframeConfig {
    property: string; // e.g., 'position.y', 'rotation.x', 'scale.x'
    keyframes: { time: number; value: number; easing?: string }[];
}

/**
 * Property tween animation for simple property changes
 */
export class PropertyAnimation implements Animation {
    id: string;
    target: THREE.Object3D;
    duration: number;
    loop: boolean;
    startTime: number;
    isActive: boolean = false;
    priority: number;
    
    private property: string;
    private startValue: number;
    private endValue: number;
    private easingFunction: (t: number) => number;
    
    constructor(
        id: string,
        target: THREE.Object3D,
        property: string,
        startValue: number,
        endValue: number,
        duration: number,
        loop: boolean = false,
        priority: number = 0,
        easing: string = 'linear'
    ) {
        this.id = id;
        this.target = target;
        this.property = property;
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;
        this.loop = loop;
        this.priority = priority;
        this.startTime = 0;
        this.easingFunction = this.getEasingFunction(easing);
    }
    
    update(_deltaTime: number, currentTime: number): boolean {
        if (!this.isActive) return true;
        
        const elapsed = currentTime - this.startTime;
        let progress = Math.min(elapsed / this.duration, 1);
        
        if (this.loop && progress >= 1) {
            progress = progress % 1;
        }
        
        const easedProgress = this.easingFunction(progress);
        const currentValue = this.startValue + (this.endValue - this.startValue) * easedProgress;
        
        // Set the property value on the target object
        this.setNestedProperty(this.target, this.property, currentValue);
        
        const isComplete = progress >= 1 && !this.loop;
        if (isComplete) {
            this.isActive = false;
        }
        
        return isComplete;
    }
    
    reset(): void {
        this.startTime = 0;
        this.isActive = false;
        this.setNestedProperty(this.target, this.property, this.startValue);
    }
    
    cleanup(): void {
        this.isActive = false;
    }
    
    private setNestedProperty(obj: any, path: string, value: number): void {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (current[keys[i]] === undefined) return;
            current = current[keys[i]];
        }
        
        const finalKey = keys[keys.length - 1];
        if (current[finalKey] !== undefined) {
            current[finalKey] = value;
        }
    }
    
    private getEasingFunction(easing: string): (t: number) => number {
        switch (easing) {
            case 'easeInOut':
                return (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            case 'easeIn':
                return (t: number) => t * t * t;
            case 'easeOut':
                return (t: number) => 1 - Math.pow(1 - t, 3);
            case 'bounce':
                return (t: number) => {
                    if (t < 1 / 2.75) {
                        return 7.5625 * t * t;
                    } else if (t < 2 / 2.75) {
                        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                    } else if (t < 2.5 / 2.75) {
                        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                    } else {
                        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
                    }
                };
            default:
                return (t: number) => t; // linear
        }
    }
}

/**
 * Keyframe animation for complex multi-property animations
 */
export class KeyframeAnimation implements Animation {
    id: string;
    target: THREE.Object3D;
    duration: number;
    loop: boolean;
    startTime: number;
    isActive: boolean = false;
    priority: number;
    
    private keyframes: KeyframeConfig[];
    
    constructor(
        id: string,
        target: THREE.Object3D,
        keyframes: KeyframeConfig[],
        duration: number,
        loop: boolean = false,
        priority: number = 0
    ) {
        this.id = id;
        this.target = target;
        this.keyframes = keyframes;
        this.duration = duration;
        this.loop = loop;
        this.priority = priority;
        this.startTime = 0;
    }
    
    update(_deltaTime: number, currentTime: number): boolean {
        if (!this.isActive) return true;
        
        const elapsed = currentTime - this.startTime;
        let progress = Math.min(elapsed / this.duration, 1);
        
        if (this.loop && progress >= 1) {
            progress = progress % 1;
        }
        
        // Update each keyframe property
        for (const keyframe of this.keyframes) {
            const value = this.interpolateKeyframes(keyframe, progress);
            this.setNestedProperty(this.target, keyframe.property, value);
        }
        
        const isComplete = progress >= 1 && !this.loop;
        if (isComplete) {
            this.isActive = false;
        }
        
        return isComplete;
    }
    
    reset(): void {
        this.startTime = 0;
        this.isActive = false;
        
        // Reset to first keyframe values
        for (const keyframe of this.keyframes) {
            if (keyframe.keyframes.length > 0) {
                this.setNestedProperty(this.target, keyframe.property, keyframe.keyframes[0].value);
            }
        }
    }
    
    cleanup(): void {
        this.isActive = false;
    }
    
    private interpolateKeyframes(keyframe: KeyframeConfig, progress: number): number {
        const frames = keyframe.keyframes;
        if (frames.length === 0) return 0;
        if (frames.length === 1) return frames[0].value;
        
        // Find the two keyframes to interpolate between
        let startFrame = frames[0];
        let endFrame = frames[frames.length - 1];
        
        for (let i = 0; i < frames.length - 1; i++) {
            if (progress >= frames[i].time && progress <= frames[i + 1].time) {
                startFrame = frames[i];
                endFrame = frames[i + 1];
                break;
            }
        }
        
        if (startFrame === endFrame) {
            return startFrame.value;
        }
        
        const localProgress = (progress - startFrame.time) / (endFrame.time - startFrame.time);
        const easingFunction = this.getEasingFunction(endFrame.easing || 'linear');
        const easedProgress = easingFunction(localProgress);
        
        return startFrame.value + (endFrame.value - startFrame.value) * easedProgress;
    }
    
    private setNestedProperty(obj: any, path: string, value: number): void {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (current[keys[i]] === undefined) return;
            current = current[keys[i]];
        }
        
        const finalKey = keys[keys.length - 1];
        if (current[finalKey] !== undefined) {
            current[finalKey] = value;
        }
    }
    
    private getEasingFunction(easing: string): (t: number) => number {
        switch (easing) {
            case 'easeInOut':
                return (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            case 'easeIn':
                return (t: number) => t * t * t;
            case 'easeOut':
                return (t: number) => 1 - Math.pow(1 - t, 3);
            case 'bounce':
                return (t: number) => {
                    if (t < 1 / 2.75) {
                        return 7.5625 * t * t;
                    } else if (t < 2 / 2.75) {
                        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                    } else if (t < 2.5 / 2.75) {
                        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                    } else {
                        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
                    }
                };
            default:
                return (t: number) => t; // linear
        }
    }
}

/**
 * Main animation system managing all game object animations
 */
export class AnimationSystem {
    private initialized: boolean = false;
    private animations: Map<string, Animation[]> = new Map();
    private objectAnimationStates: Map<string, AnimationState> = new Map();
    private activeBlends: Map<string, AnimationBlend> = new Map();
    private animationPool: Animation[] = [];
    private currentTime: number = 0;
    
    // Performance optimization settings
    private maxAnimationsPerObject: number = 3;
    private cullingDistance: number = 100;
    private playerPosition: THREE.Vector3 = new THREE.Vector3();
    
    initialize(): void {
        this.initialized = true;
        console.log('🎬 Animation System initialized');
    }
    
    /**
     * Update all active animations
     */
    update(deltaTime: number): void {
        if (!this.initialized) return;
        
        this.currentTime += deltaTime;
        const completedAnimations: { objectId: string; animationIndex: number }[] = [];
        
        // Update all animations
        for (const [objectId, objectAnimations] of this.animations) {
            for (let i = objectAnimations.length - 1; i >= 0; i--) {
                const animation = objectAnimations[i];
                
                if (!animation.isActive) continue;
                
                // Check if object is within culling distance for performance
                if (this.shouldCullAnimation(animation.target)) {
                    continue;
                }
                
                const isComplete = animation.update(deltaTime, this.currentTime);
                
                if (isComplete) {
                    completedAnimations.push({ objectId, animationIndex: i });
                }
            }
        }
        
        // Remove completed animations
        for (const { objectId, animationIndex } of completedAnimations) {
            this.removeAnimationByIndex(objectId, animationIndex);
        }
        
        // Update animation blends
        this.updateAnimationBlends(deltaTime);
    }
    
    /**
     * Add a property animation to an object
     */
    addPropertyAnimation(
        objectId: string,
        target: THREE.Object3D,
        property: string,
        startValue: number,
        endValue: number,
        duration: number,
        loop: boolean = false,
        priority: number = 0,
        easing: string = 'linear'
    ): string {
        const animationId = `${objectId}_${property}_${Date.now()}`;
        const animation = new PropertyAnimation(
            animationId,
            target,
            property,
            startValue,
            endValue,
            duration,
            loop,
            priority,
            easing
        );
        
        this.addAnimation(objectId, animation);
        return animationId;
    }
    
    /**
     * Add a keyframe animation to an object
     */
    addKeyframeAnimation(
        objectId: string,
        target: THREE.Object3D,
        keyframes: KeyframeConfig[],
        duration: number,
        loop: boolean = false,
        priority: number = 0
    ): string {
        const animationId = `${objectId}_keyframe_${Date.now()}`;
        const animation = new KeyframeAnimation(
            animationId,
            target,
            keyframes,
            duration,
            loop,
            priority
        );
        
        this.addAnimation(objectId, animation);
        return animationId;
    }
    
    /**
     * Start an animation
     */
    startAnimation(objectId: string, animationId: string): void {
        const objectAnimations = this.animations.get(objectId);
        if (!objectAnimations) return;
        
        const animation = objectAnimations.find(anim => anim.id === animationId);
        if (animation) {
            animation.startTime = this.currentTime;
            animation.isActive = true;
        }
    }
    
    /**
     * Stop an animation
     */
    stopAnimation(objectId: string, animationId: string): void {
        const objectAnimations = this.animations.get(objectId);
        if (!objectAnimations) return;
        
        const animation = objectAnimations.find(anim => anim.id === animationId);
        if (animation) {
            animation.isActive = false;
        }
    }
    
    /**
     * Remove all animations from an object
     */
    removeAllAnimations(objectId: string): void {
        const objectAnimations = this.animations.get(objectId);
        if (!objectAnimations) return;
        
        for (const animation of objectAnimations) {
            animation.cleanup();
            this.returnToPool(animation);
        }
        
        this.animations.delete(objectId);
        this.objectAnimationStates.delete(objectId);
        this.activeBlends.delete(objectId);
    }
    
    /**
     * Set animation state for smooth transitions
     */
    setAnimationState(objectId: string, state: AnimationState, blendDuration: number = 0.3): void {
        const currentState = this.objectAnimationStates.get(objectId) || 'idle';
        
        if (currentState === state) return;
        
        if (blendDuration > 0) {
            this.activeBlends.set(objectId, {
                fromState: currentState,
                toState: state,
                duration: blendDuration,
                currentTime: 0
            });
        }
        
        this.objectAnimationStates.set(objectId, state);
    }
    
    /**
     * Get current animation state
     */
    getAnimationState(objectId: string): AnimationState {
        return this.objectAnimationStates.get(objectId) || 'idle';
    }
    
    /**
     * Update player position for culling calculations
     */
    updatePlayerPosition(position: THREE.Vector3): void {
        this.playerPosition.copy(position);
    }
    
    /**
     * Set culling distance for performance optimization
     */
    setCullingDistance(distance: number): void {
        this.cullingDistance = distance;
    }
    
    /**
     * Get animation statistics for debugging
     */
    getStats(): { totalAnimations: number; activeAnimations: number; pooledAnimations: number } {
        let totalAnimations = 0;
        let activeAnimations = 0;
        
        for (const objectAnimations of this.animations.values()) {
            totalAnimations += objectAnimations.length;
            activeAnimations += objectAnimations.filter(anim => anim.isActive).length;
        }
        
        return {
            totalAnimations,
            activeAnimations,
            pooledAnimations: this.animationPool.length
        };
    }
    
    private addAnimation(objectId: string, animation: Animation): void {
        if (!this.animations.has(objectId)) {
            this.animations.set(objectId, []);
        }
        
        const objectAnimations = this.animations.get(objectId)!;
        
        // Limit animations per object for performance
        if (objectAnimations.length >= this.maxAnimationsPerObject) {
            const lowestPriority = Math.min(...objectAnimations.map(anim => anim.priority));
            const indexToRemove = objectAnimations.findIndex(anim => anim.priority === lowestPriority);
            if (indexToRemove !== -1) {
                const removedAnimation = objectAnimations.splice(indexToRemove, 1)[0];
                removedAnimation.cleanup();
                this.returnToPool(removedAnimation);
            }
        }
        
        objectAnimations.push(animation);
        
        // Sort by priority (higher priority first)
        objectAnimations.sort((a, b) => b.priority - a.priority);
    }
    
    private removeAnimationByIndex(objectId: string, index: number): void {
        const objectAnimations = this.animations.get(objectId);
        if (!objectAnimations || index < 0 || index >= objectAnimations.length) return;
        
        const animation = objectAnimations.splice(index, 1)[0];
        animation.cleanup();
        this.returnToPool(animation);
        
        if (objectAnimations.length === 0) {
            this.animations.delete(objectId);
        }
    }
    
    private shouldCullAnimation(target: THREE.Object3D): boolean {
        const distance = target.position.distanceTo(this.playerPosition);
        return distance > this.cullingDistance;
    }
    
    private updateAnimationBlends(deltaTime: number): void {
        const completedBlends: string[] = [];
        
        for (const [objectId, blend] of this.activeBlends) {
            blend.currentTime += deltaTime;
            
            if (blend.currentTime >= blend.duration) {
                completedBlends.push(objectId);
            }
        }
        
        // Remove completed blends
        for (const objectId of completedBlends) {
            this.activeBlends.delete(objectId);
        }
    }
    
    private returnToPool(animation: Animation): void {
        if (this.animationPool.length < 50) { // Limit pool size
            animation.reset();
            this.animationPool.push(animation);
        }
    }
    
    cleanup(): void {
        for (const objectAnimations of this.animations.values()) {
            for (const animation of objectAnimations) {
                animation.cleanup();
            }
        }
        
        this.animations.clear();
        this.objectAnimationStates.clear();
        this.activeBlends.clear();
        this.animationPool.length = 0;
        this.initialized = false;
    }
}