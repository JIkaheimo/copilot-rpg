import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';

export interface AtmosphereConfig {
    fogColor: number;
    fogNear: number;
    fogFar: number;
    ambientParticles: boolean;
    dustIntensity: number;
    enableDepthFog: boolean;
}

export class AtmosphereSystem {
    private scene: THREE.Scene | null = null;
    private particleSystem: ParticleSystem | null = null;
    private currentConfig: AtmosphereConfig | null = null;
    private activeAtmosphereEffects: Set<string> = new Set();
    
    // Atmosphere presets
    private atmospherePresets: Map<string, AtmosphereConfig> = new Map();
    
    initialize(scene: THREE.Scene, particleSystem: ParticleSystem): void {
        this.scene = scene;
        this.particleSystem = particleSystem;
        this.createAtmospherePresets();
        console.log('🌫️ Atmosphere System initialized');
    }
    
    private createAtmospherePresets(): void {
        // Clear day atmosphere
        this.atmospherePresets.set('clear_day', {
            fogColor: 0x87CEEB,
            fogNear: 100,
            fogFar: 300,
            ambientParticles: true,
            dustIntensity: 0.2,
            enableDepthFog: true
        });
        
        // Clear night atmosphere
        this.atmospherePresets.set('clear_night', {
            fogColor: 0x191970,
            fogNear: 50,
            fogFar: 200,
            ambientParticles: true,
            dustIntensity: 0.1,
            enableDepthFog: true
        });
        
        // Foggy atmosphere
        this.atmospherePresets.set('foggy', {
            fogColor: 0xcccccc,
            fogNear: 10,
            fogFar: 80,
            ambientParticles: true,
            dustIntensity: 0.8,
            enableDepthFog: true
        });
        
        // Stormy atmosphere
        this.atmospherePresets.set('stormy', {
            fogColor: 0x666666,
            fogNear: 20,
            fogFar: 120,
            ambientParticles: true,
            dustIntensity: 1.0,
            enableDepthFog: true
        });
        
        // Underground/cave atmosphere
        this.atmospherePresets.set('underground', {
            fogColor: 0x222222,
            fogNear: 5,
            fogFar: 40,
            ambientParticles: true,
            dustIntensity: 0.6,
            enableDepthFog: true
        });
        
        // Mystical/magical atmosphere
        this.atmospherePresets.set('mystical', {
            fogColor: 0x9370DB,
            fogNear: 30,
            fogFar: 150,
            ambientParticles: true,
            dustIntensity: 0.4,
            enableDepthFog: true
        });
    }
    
    setAtmosphere(presetName: string, intensity: number = 1.0): void {
        const preset = this.atmospherePresets.get(presetName);
        if (!preset || !this.scene) {
            console.warn(`Atmosphere preset '${presetName}' not found`);
            return;
        }
        
        // Clear existing atmosphere effects
        this.clearAtmosphereEffects();
        
        // Apply fog
        if (preset.enableDepthFog) {
            const fog = new THREE.Fog(
                preset.fogColor,
                preset.fogNear * (2 - intensity), // Closer fog with higher intensity
                preset.fogFar * (2 - intensity)
            );
            this.scene.fog = fog;
        }
        
        // Add ambient particles if enabled
        if (preset.ambientParticles && this.particleSystem) {
            const playerPosition = new THREE.Vector3(0, 5, 0);
            const effectArea = 40;
            
            // Add dust particles for atmosphere
            if (preset.dustIntensity > 0) {
                const dustId = this.particleSystem.createEnvironmentalEffect(
                    'dust', 
                    playerPosition, 
                    effectArea * preset.dustIntensity * intensity
                );
                this.activeAtmosphereEffects.add(dustId);
            }
            
            // Add sparkles for mystical atmosphere
            if (presetName === 'mystical') {
                const sparkleId = this.particleSystem.createEnvironmentalEffect(
                    'sparkles',
                    playerPosition,
                    effectArea * 0.3 * intensity
                );
                this.activeAtmosphereEffects.add(sparkleId);
            }
            
            // Add fog particles for extra atmosphere
            if (presetName === 'foggy' || presetName === 'stormy') {
                const fogId = this.particleSystem.createEnvironmentalEffect(
                    'fog',
                    playerPosition,
                    effectArea * 0.8 * intensity
                );
                this.activeAtmosphereEffects.add(fogId);
            }
        }
        
        this.currentConfig = preset;
        console.log(`🌫️ Atmosphere set to '${presetName}' with intensity ${intensity}`);
    }
    
    createCustomAtmosphere(config: AtmosphereConfig, name?: string): void {
        if (name) {
            this.atmospherePresets.set(name, config);
        }
        
        if (!this.scene) return;
        
        // Clear existing effects
        this.clearAtmosphereEffects();
        
        // Apply fog
        if (config.enableDepthFog) {
            const fog = new THREE.Fog(config.fogColor, config.fogNear, config.fogFar);
            this.scene.fog = fog;
        }
        
        // Add ambient particles
        if (config.ambientParticles && this.particleSystem && config.dustIntensity > 0) {
            const playerPosition = new THREE.Vector3(0, 5, 0);
            const dustId = this.particleSystem.createEnvironmentalEffect(
                'dust',
                playerPosition,
                40 * config.dustIntensity
            );
            this.activeAtmosphereEffects.add(dustId);
        }
        
        this.currentConfig = config;
    }
    
    adjustFogDistance(near: number, far: number): void {
        if (this.scene?.fog && this.scene.fog instanceof THREE.Fog) {
            this.scene.fog.near = near;
            this.scene.fog.far = far;
        }
    }
    
    adjustFogColor(color: number): void {
        if (this.scene?.fog) {
            this.scene.fog.color.setHex(color);
        }
    }
    
    private clearAtmosphereEffects(): void {
        if (!this.particleSystem) return;
        
        // Stop all active atmosphere effects
        this.activeAtmosphereEffects.forEach(effectId => {
            this.particleSystem!.stopEffect(effectId);
        });
        this.activeAtmosphereEffects.clear();
    }
    
    clearAtmosphere(): void {
        this.clearAtmosphereEffects();
        if (this.scene) {
            this.scene.fog = null;
        }
        this.currentConfig = null;
        console.log('🌫️ Atmosphere cleared');
    }
    
    getCurrentConfig(): AtmosphereConfig | null {
        return this.currentConfig;
    }
    
    getAvailablePresets(): string[] {
        return Array.from(this.atmospherePresets.keys());
    }
    
    cleanup(): void {
        this.clearAtmosphereEffects();
        this.atmospherePresets.clear();
    }
}