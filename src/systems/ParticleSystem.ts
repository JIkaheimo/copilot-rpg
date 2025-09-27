import * as THREE from 'three';

export interface ParticleEffectConfig {
    particleCount: number;
    color: number;
    size: number;
    lifetime: number;
    spread: number;
    velocity: THREE.Vector3;
    gravity: THREE.Vector3;
    fadeOut: boolean;
    // Enhanced properties for better visuals
    texture?: string;
    blendMode?: THREE.Blending;
    sizeVariation?: number;
    colorVariation?: number;
    emissionRate?: number;
    spiral?: boolean;
    randomizeColors?: boolean;
}

export class ParticleEffect {
    private geometry: THREE.BufferGeometry;
    private material: THREE.PointsMaterial;
    private points: THREE.Points;
    private velocities: Float32Array;
    private lifetimes: Float32Array;
    private maxLifetimes: Float32Array;
    private config: ParticleEffectConfig;
    private particleCount: number;
    private isActive: boolean = false;

    constructor(config: ParticleEffectConfig) {
        this.config = config;
        this.particleCount = config.particleCount;
        
        // Initialize all properties in constructor
        this.geometry = new THREE.BufferGeometry();
        this.velocities = new Float32Array(0);
        this.lifetimes = new Float32Array(0);
        this.maxLifetimes = new Float32Array(0);
        this.material = new THREE.PointsMaterial();
        this.points = new THREE.Points();
        
        this.createParticles();
    }

    private createParticles(): void {
        this.geometry = new THREE.BufferGeometry();
        
        // Initialize arrays
        const positions = new Float32Array(this.particleCount * 3);
        this.velocities = new Float32Array(this.particleCount * 3);
        this.lifetimes = new Float32Array(this.particleCount);
        this.maxLifetimes = new Float32Array(this.particleCount);
        const colors = new Float32Array(this.particleCount * 3);
        const sizes = new Float32Array(this.particleCount);

        // Initialize particle data
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Random position within spread
            positions[i3] = (Math.random() - 0.5) * this.config.spread;
            positions[i3 + 1] = (Math.random() - 0.5) * this.config.spread;
            positions[i3 + 2] = (Math.random() - 0.5) * this.config.spread;

            // Random velocity based on config
            this.velocities[i3] = this.config.velocity.x + (Math.random() - 0.5) * 2;
            this.velocities[i3 + 1] = this.config.velocity.y + (Math.random() - 0.5) * 2;
            this.velocities[i3 + 2] = this.config.velocity.z + (Math.random() - 0.5) * 2;

            // Lifetime
            this.lifetimes[i] = 0;
            this.maxLifetimes[i] = this.config.lifetime + (Math.random() - 0.5) * this.config.lifetime * 0.5;

            // Color with variation
            const color = new THREE.Color(this.config.color);
            if (this.config.randomizeColors) {
                color.offsetHSL((Math.random() - 0.5) * 0.2, 0, (Math.random() - 0.5) * 0.3);
            }
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            // Size with variation
            const sizeVariation = this.config.sizeVariation || 0.3;
            sizes[i] = this.config.size + (Math.random() - 0.5) * this.config.size * sizeVariation;
        }

        // Set attributes
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Create enhanced material with better visual options
        this.material = new THREE.PointsMaterial({
            size: this.config.size,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            blending: this.config.blendMode || THREE.AdditiveBlending,
            depthWrite: false,
            fog: true
        });

        // Create points object
        this.points = new THREE.Points(this.geometry, this.material);
    }

    start(position: THREE.Vector3): void {
        this.isActive = true;
        this.points.position.copy(position);
        
        // Reset particles
        const positions = this.geometry.attributes.position.array as Float32Array;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Reset position
            positions[i3] = (Math.random() - 0.5) * this.config.spread;
            positions[i3 + 1] = (Math.random() - 0.5) * this.config.spread;
            positions[i3 + 2] = (Math.random() - 0.5) * this.config.spread;

            // Reset lifetime
            this.lifetimes[i] = 0;
        }

        this.geometry.attributes.position.needsUpdate = true;
    }

    stop(): void {
        this.isActive = false;
    }

    update(deltaTime: number): void {
        if (!this.isActive) return;

        const positions = this.geometry.attributes.position.array as Float32Array;
        const colors = this.geometry.attributes.color.array as Float32Array;
        let allParticlesDead = true;

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Update lifetime
            this.lifetimes[i] += deltaTime;
            
            if (this.lifetimes[i] < this.maxLifetimes[i]) {
                allParticlesDead = false;
                
                // Update position with velocity and gravity
                positions[i3] += this.velocities[i3] * deltaTime;
                positions[i3 + 1] += this.velocities[i3 + 1] * deltaTime;
                positions[i3 + 2] += this.velocities[i3 + 2] * deltaTime;

                // Apply gravity
                this.velocities[i3] += this.config.gravity.x * deltaTime;
                this.velocities[i3 + 1] += this.config.gravity.y * deltaTime;
                this.velocities[i3 + 2] += this.config.gravity.z * deltaTime;

                // Fade out if enabled
                if (this.config.fadeOut) {
                    const lifeRatio = this.lifetimes[i] / this.maxLifetimes[i];
                    const alpha = 1 - lifeRatio;
                    colors[i3 + 3] = alpha; // Alpha channel if available
                }
            } else {
                // Respawn particle if effect is still active
                if (this.isActive) {
                    positions[i3] = (Math.random() - 0.5) * this.config.spread;
                    positions[i3 + 1] = (Math.random() - 0.5) * this.config.spread;
                    positions[i3 + 2] = (Math.random() - 0.5) * this.config.spread;

                    this.velocities[i3] = this.config.velocity.x + (Math.random() - 0.5) * 2;
                    this.velocities[i3 + 1] = this.config.velocity.y + (Math.random() - 0.5) * 2;
                    this.velocities[i3 + 2] = this.config.velocity.z + (Math.random() - 0.5) * 2;

                    this.lifetimes[i] = 0;
                    allParticlesDead = false;
                }
            }
        }

        // Stop effect if all particles are dead and not respawning
        if (allParticlesDead && !this.isActive) {
            this.stop();
        }

        // Update geometry
        this.geometry.attributes.position.needsUpdate = true;
        if (this.config.fadeOut) {
            this.geometry.attributes.color.needsUpdate = true;
        }
    }

    getObject3D(): THREE.Points {
        return this.points;
    }

    dispose(): void {
        this.geometry.dispose();
        this.material.dispose();
    }

    isEffectActive(): boolean {
        return this.isActive;
    }
}

export class ParticleSystem {
    private scene: THREE.Scene | null = null;
    private activeEffects: Map<string, ParticleEffect> = new Map();
    private effectTemplates: Map<string, ParticleEffectConfig> = new Map();

    initialize(scene: THREE.Scene): void {
        this.scene = scene;
        this.createEffectTemplates();
        console.log('✨ Particle System initialized');
    }

    private createEffectTemplates(): void {
        // Combat hit effect
        this.effectTemplates.set('hit', {
            particleCount: 20,
            color: 0xff4444,
            size: 0.1,
            lifetime: 0.5,
            spread: 1,
            velocity: new THREE.Vector3(0, 2, 0),
            gravity: new THREE.Vector3(0, -5, 0),
            fadeOut: true
        });

        // Level up effect
        this.effectTemplates.set('levelup', {
            particleCount: 50,
            color: 0xffdd44,
            size: 0.15,
            lifetime: 2,
            spread: 2,
            velocity: new THREE.Vector3(0, 3, 0),
            gravity: new THREE.Vector3(0, -2, 0),
            fadeOut: true
        });

        // Magic cast effect
        this.effectTemplates.set('magic', {
            particleCount: 30,
            color: 0x4444ff,
            size: 0.12,
            lifetime: 1,
            spread: 1.5,
            velocity: new THREE.Vector3(0, 1, 0),
            gravity: new THREE.Vector3(0, 0, 0),
            fadeOut: true
        });

        // Treasure opened effect
        this.effectTemplates.set('treasure', {
            particleCount: 40,
            color: 0xffaa22,
            size: 0.08,
            lifetime: 1.5,
            spread: 1,
            velocity: new THREE.Vector3(0, 4, 0),
            gravity: new THREE.Vector3(0, -3, 0),
            fadeOut: true
        });

        // Death effect
        this.effectTemplates.set('death', {
            particleCount: 60,
            color: 0x666666,
            size: 0.1,
            lifetime: 2,
            spread: 2,
            velocity: new THREE.Vector3(0, 1, 0),
            gravity: new THREE.Vector3(0, -1, 0),
            fadeOut: true
        });

        // Magic System Effects
        
        // Fireball effect
        this.effectTemplates.set('fireball', {
            particleCount: 100,
            color: 0xff4400,
            size: 0.2,
            lifetime: 1.5,
            spread: 0.8,
            velocity: new THREE.Vector3(0, 2, 0),
            gravity: new THREE.Vector3(0, -1, 0),
            fadeOut: true
        });

        // Fire explosion effect
        this.effectTemplates.set('explosion', {
            particleCount: 150,
            color: 0xff2200,
            size: 0.25,
            lifetime: 1.0,
            spread: 3,
            velocity: new THREE.Vector3(0, 3, 0),
            gravity: new THREE.Vector3(0, -2, 0),
            fadeOut: true
        });

        // Healing effect
        this.effectTemplates.set('heal', {
            particleCount: 80,
            color: 0x44ff44,
            size: 0.15,
            lifetime: 2.0,
            spread: 1.5,
            velocity: new THREE.Vector3(0, 1.5, 0),
            gravity: new THREE.Vector3(0, 0.5, 0),
            fadeOut: true
        });

        // Lightning effect
        this.effectTemplates.set('lightning', {
            particleCount: 60,
            color: 0xccccff,
            size: 0.12,
            lifetime: 0.3,
            spread: 2,
            velocity: new THREE.Vector3(0, 5, 0),
            gravity: new THREE.Vector3(0, -10, 0),
            fadeOut: true
        });

        // Ice effect
        this.effectTemplates.set('ice', {
            particleCount: 70,
            color: 0x88ddff,
            size: 0.18,
            lifetime: 1.2,
            spread: 1.2,
            velocity: new THREE.Vector3(0, 1, 0),
            gravity: new THREE.Vector3(0, -3, 0),
            fadeOut: true
        });

        // Shield effect
        this.effectTemplates.set('shield', {
            particleCount: 120,
            color: 0x4444ff,
            size: 0.1,
            lifetime: 1.5,
            spread: 2.5,
            velocity: new THREE.Vector3(0, 0.5, 0),
            gravity: new THREE.Vector3(0, 0, 0),
            fadeOut: true
        });

        // Casting effects for different schools
        this.effectTemplates.set('casting_fire', {
            particleCount: 40,
            color: 0xff6600,
            size: 0.08,
            lifetime: 0.8,
            spread: 0.5,
            velocity: new THREE.Vector3(0, 2, 0),
            gravity: new THREE.Vector3(0, 0, 0),
            fadeOut: true
        });

        this.effectTemplates.set('casting_ice', {
            particleCount: 40,
            color: 0x66ddff,
            size: 0.08,
            lifetime: 0.8,
            spread: 0.5,
            velocity: new THREE.Vector3(0, 1, 0),
            gravity: new THREE.Vector3(0, 0, 0),
            fadeOut: true
        });

        this.effectTemplates.set('casting_lightning', {
            particleCount: 50,
            color: 0xffffcc,
            size: 0.06,
            lifetime: 0.5,
            spread: 0.8,
            velocity: new THREE.Vector3(0, 4, 0),
            gravity: new THREE.Vector3(0, 0, 0),
            fadeOut: true
        });

        this.effectTemplates.set('casting_holy', {
            particleCount: 60,
            color: 0xffffdd,
            size: 0.1,
            lifetime: 1.0,
            spread: 1.0,
            velocity: new THREE.Vector3(0, 1.5, 0),
            gravity: new THREE.Vector3(0, 0.5, 0),
            fadeOut: true
        });

        this.effectTemplates.set('casting_shadow', {
            particleCount: 35,
            color: 0x440044,
            size: 0.12,
            lifetime: 1.2,
            spread: 0.7,
            velocity: new THREE.Vector3(0, 0.5, 0),
            gravity: new THREE.Vector3(0, -0.5, 0),
            fadeOut: true
        });

        this.effectTemplates.set('casting_nature', {
            particleCount: 45,
            color: 0x44aa44,
            size: 0.09,
            lifetime: 1.0,
            spread: 0.8,
            velocity: new THREE.Vector3(0, 1, 0),
            gravity: new THREE.Vector3(0, 0, 0),
            fadeOut: true
        });

        // Environmental Effects - New enhanced effects
        
        // Rain effect
        this.effectTemplates.set('rain', {
            particleCount: 200,
            color: 0x88ccff,
            size: 0.02,
            lifetime: 3,
            spread: 20,
            velocity: new THREE.Vector3(0, -15, 0),
            gravity: new THREE.Vector3(0, -5, 0),
            fadeOut: true,
            blendMode: THREE.NormalBlending,
            sizeVariation: 0.1
        });

        // Snow effect
        this.effectTemplates.set('snow', {
            particleCount: 150,
            color: 0xffffff,
            size: 0.05,
            lifetime: 8,
            spread: 25,
            velocity: new THREE.Vector3(0, -2, 0),
            gravity: new THREE.Vector3(0, -0.5, 0),
            fadeOut: true,
            blendMode: THREE.NormalBlending,
            sizeVariation: 0.4,
            randomizeColors: true
        });

        // Fog effect
        this.effectTemplates.set('fog', {
            particleCount: 80,
            color: 0xcccccc,
            size: 1.5,
            lifetime: 10,
            spread: 30,
            velocity: new THREE.Vector3(0.5, 0, 0.5),
            gravity: new THREE.Vector3(0, 0.1, 0),
            fadeOut: true,
            blendMode: THREE.NormalBlending,
            sizeVariation: 0.6,
            randomizeColors: true
        });

        // Leaves falling effect
        this.effectTemplates.set('leaves', {
            particleCount: 60,
            color: 0x44aa22,
            size: 0.15,
            lifetime: 6,
            spread: 15,
            velocity: new THREE.Vector3(0, -1, 0),
            gravity: new THREE.Vector3(0, -1, 0),
            fadeOut: true,
            blendMode: THREE.NormalBlending,
            sizeVariation: 0.5,
            randomizeColors: true
        });

        // Dust particles
        this.effectTemplates.set('dust', {
            particleCount: 40,
            color: 0xcc9966,
            size: 0.08,
            lifetime: 4,
            spread: 8,
            velocity: new THREE.Vector3(0, 0.5, 0),
            gravity: new THREE.Vector3(0, -0.2, 0),
            fadeOut: true,
            blendMode: THREE.NormalBlending,
            sizeVariation: 0.4,
            randomizeColors: true
        });

        // Sparkles effect
        this.effectTemplates.set('sparkles', {
            particleCount: 100,
            color: 0xffffcc,
            size: 0.06,
            lifetime: 2,
            spread: 3,
            velocity: new THREE.Vector3(0, 1, 0),
            gravity: new THREE.Vector3(0, 0, 0),
            fadeOut: true,
            blendMode: THREE.AdditiveBlending,
            sizeVariation: 0.6,
            randomizeColors: true
        });

        // Smoke effect
        this.effectTemplates.set('smoke', {
            particleCount: 80,
            color: 0x666666,
            size: 0.8,
            lifetime: 4,
            spread: 2,
            velocity: new THREE.Vector3(0, 2, 0),
            gravity: new THREE.Vector3(0, 0.5, 0),
            fadeOut: true,
            blendMode: THREE.NormalBlending,
            sizeVariation: 0.7,
            randomizeColors: true
        });
    }

    playEffect(effectName: string, position: THREE.Vector3, duration: number = 0): string {
        if (!this.scene || !this.effectTemplates.has(effectName)) {
            console.warn(`Particle effect '${effectName}' not found`);
            return '';
        }

        const config = this.effectTemplates.get(effectName)!;
        const effect = new ParticleEffect(config);
        const effectId = `${effectName}_${Date.now()}_${Math.random()}`;

        // Add to scene
        this.scene.add(effect.getObject3D());
        
        // Start effect
        effect.start(position);
        
        // Store active effect
        this.activeEffects.set(effectId, effect);

        // Auto-stop after duration if specified
        if (duration > 0) {
            setTimeout(() => {
                this.stopEffect(effectId);
            }, duration * 1000);
        }

        return effectId;
    }

    stopEffect(effectId: string): void {
        const effect = this.activeEffects.get(effectId);
        if (effect) {
            effect.stop();
        }
    }

    removeEffect(effectId: string): void {
        const effect = this.activeEffects.get(effectId);
        if (effect && this.scene) {
            this.scene.remove(effect.getObject3D());
            effect.dispose();
            this.activeEffects.delete(effectId);
        }
    }

    update(deltaTime: number): void {
        // Update all active effects
        const effectsToRemove: string[] = [];
        
        for (const [effectId, effect] of this.activeEffects) {
            effect.update(deltaTime);
            
            // Remove inactive effects
            if (!effect.isEffectActive()) {
                effectsToRemove.push(effectId);
            }
        }

        // Clean up finished effects
        for (const effectId of effectsToRemove) {
            this.removeEffect(effectId);
        }
    }

    createCustomEffect(name: string, config: ParticleEffectConfig): void {
        this.effectTemplates.set(name, config);
    }

    cleanup(): void {
        // Remove all active effects
        for (const [effectId] of this.activeEffects) {
            this.removeEffect(effectId);
        }
        this.activeEffects.clear();
        this.effectTemplates.clear();
    }

    getActiveEffectCount(): number {
        return this.activeEffects.size;
    }

    // New method for environmental effects that continuously spawn
    createEnvironmentalEffect(effectName: string, position: THREE.Vector3, area: number = 10): string {
        if (!this.scene || !this.effectTemplates.has(effectName)) {
            console.warn(`Environmental particle effect '${effectName}' not found`);
            return '';
        }

        const effectId = `env_${effectName}_${Date.now()}`;
        
        // Create multiple instances across the area for better coverage
        const instances = Math.ceil(area / 5); // One instance per 5 units
        
        for (let i = 0; i < instances; i++) {
            const offsetX = (Math.random() - 0.5) * area;
            const offsetZ = (Math.random() - 0.5) * area;
            const instancePosition = new THREE.Vector3(
                position.x + offsetX,
                position.y,
                position.z + offsetZ
            );
            
            this.playEffect(effectName, instancePosition);
        }

        return effectId;
    }

    // Method to trigger combat-related effects
    triggerCombatEffect(effectName: string, position: THREE.Vector3, intensity: number = 1): string {
        const config = this.effectTemplates.get(effectName);
        if (!config) {
            return this.playEffect(effectName, position);
        }

        // Create scaled version of effect based on intensity
        const scaledConfig: ParticleEffectConfig = {
            ...config,
            particleCount: Math.floor(config.particleCount * intensity),
            size: config.size * Math.min(intensity, 2),
            spread: config.spread * intensity
        };

        const effect = new ParticleEffect(scaledConfig);
        const effectId = `combat_${effectName}_${Date.now()}_${Math.random()}`;

        if (this.scene) {
            this.scene.add(effect.getObject3D());
            effect.start(position);
            this.activeEffects.set(effectId, effect);
        }

        return effectId;
    }
}