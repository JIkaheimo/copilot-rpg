import * as THREE from 'three';

export interface LightConfig {
    color: number;
    intensity: number;
    position: THREE.Vector3;
    range?: number;
    castShadow?: boolean;
}

export interface DynamicLightConfig extends LightConfig {
    flickerSpeed?: number;
    flickerIntensity?: number;
    pulseSpeed?: number;
    pulseIntensity?: number;
}

export class DynamicLight {
    private light: THREE.PointLight | THREE.SpotLight;
    private config: DynamicLightConfig;
    private baseIntensity: number;
    private time: number = 0;

    constructor(config: DynamicLightConfig, type: 'point' | 'spot' = 'point') {
        this.config = config;
        this.baseIntensity = config.intensity;

        if (type === 'spot') {
            this.light = new THREE.SpotLight(
                config.color,
                config.intensity,
                config.range || 50,
                Math.PI / 4,
                0.5,
                2
            );
        } else {
            this.light = new THREE.PointLight(
                config.color,
                config.intensity,
                config.range || 50,
                2
            );
        }

        this.light.position.copy(config.position);
        this.light.castShadow = config.castShadow || false;

        if (this.light.castShadow) {
            this.light.shadow.mapSize.width = 1024;
            this.light.shadow.mapSize.height = 1024;
            this.light.shadow.camera.near = 0.1;
            this.light.shadow.camera.far = config.range || 50;
        }
    }

    update(deltaTime: number): void {
        this.time += deltaTime;

        let intensity = this.baseIntensity;

        // Apply flickering effect
        if (this.config.flickerSpeed && this.config.flickerIntensity) {
            const flicker = Math.sin(this.time * this.config.flickerSpeed * 10) * 
                           Math.sin(this.time * this.config.flickerSpeed * 3.7) *
                           this.config.flickerIntensity;
            intensity += flicker;
        }

        // Apply pulsing effect
        if (this.config.pulseSpeed && this.config.pulseIntensity) {
            const pulse = Math.sin(this.time * this.config.pulseSpeed) * this.config.pulseIntensity;
            intensity += pulse;
        }

        // Clamp intensity to positive values
        this.light.intensity = Math.max(0, intensity);
    }

    getLight(): THREE.Light {
        return this.light;
    }

    setPosition(position: THREE.Vector3): void {
        this.light.position.copy(position);
        this.config.position = position;
    }

    setIntensity(intensity: number): void {
        this.baseIntensity = intensity;
        this.config.intensity = intensity;
    }

    setColor(color: number): void {
        this.light.color.setHex(color);
        this.config.color = color;
    }

    dispose(): void {
        if (this.light.shadow?.map) {
            this.light.shadow.map.dispose();
        }
    }
}

export class LightingSystem {
    private scene: THREE.Scene | null = null;
    private lights: Map<string, DynamicLight> = new Map();
    private ambientLight: THREE.AmbientLight | null = null;
    private directionalLight: THREE.DirectionalLight | null = null;
    
    // Environmental lighting
    private timeOfDay: number = 0.5; // 0 = midnight, 0.5 = noon, 1 = midnight
    private weatherInfluence: number = 1; // 0 = stormy/dark, 1 = clear
    
    initialize(scene: THREE.Scene): void {
        this.scene = scene;
        this.setupMainLighting();
        this.createPresetLights();
        console.log('💡 Lighting System initialized');
    }

    private setupMainLighting(): void {
        if (!this.scene) return;

        // Enhanced ambient light based on time of day
        const ambientIntensity = this.calculateAmbientIntensity();
        const ambientColor = this.calculateAmbientColor();
        
        this.ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
        this.scene.add(this.ambientLight);

        // Enhanced directional light (sun/moon)
        const directionalIntensity = this.calculateDirectionalIntensity();
        const directionalColor = this.calculateDirectionalColor();
        
        this.directionalLight = new THREE.DirectionalLight(directionalColor, directionalIntensity);
        this.updateDirectionalLightPosition();
        
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 4096;
        this.directionalLight.shadow.mapSize.height = 4096;
        this.directionalLight.shadow.camera.near = 0.1;
        this.directionalLight.shadow.camera.far = 200;
        this.directionalLight.shadow.camera.left = -50;
        this.directionalLight.shadow.camera.right = 50;
        this.directionalLight.shadow.camera.top = 50;
        this.directionalLight.shadow.camera.bottom = -50;
        
        this.scene.add(this.directionalLight);
    }

    private createPresetLights(): void {
        // Torch light preset
        this.createLightPreset('torch', {
            color: 0xff6600,
            intensity: 2,
            position: new THREE.Vector3(0, 3, 0),
            range: 15,
            castShadow: true,
            flickerSpeed: 8,
            flickerIntensity: 0.3
        });

        // Magic orb light preset
        this.createLightPreset('magic_orb', {
            color: 0x4466ff,
            intensity: 1.5,
            position: new THREE.Vector3(0, 2, 0),
            range: 12,
            castShadow: true,
            pulseSpeed: 2,
            pulseIntensity: 0.5
        });

        // Campfire light preset
        this.createLightPreset('campfire', {
            color: 0xff4400,
            intensity: 3,
            position: new THREE.Vector3(0, 1, 0),
            range: 20,
            castShadow: true,
            flickerSpeed: 12,
            flickerIntensity: 0.8
        });

        // Crystal light preset
        this.createLightPreset('crystal', {
            color: 0x44ffff,
            intensity: 1,
            position: new THREE.Vector3(0, 1.5, 0),
            range: 10,
            castShadow: false,
            pulseSpeed: 1,
            pulseIntensity: 0.3
        });
    }

    private createLightPreset(name: string, config: DynamicLightConfig): void {
        // Store preset but don't add to scene yet
        this.lights.set(`preset_${name}`, new DynamicLight(config));
    }

    addLight(id: string, config: DynamicLightConfig, type: 'point' | 'spot' = 'point'): void {
        if (!this.scene) return;

        const light = new DynamicLight(config, type);
        this.lights.set(id, light);
        this.scene.add(light.getLight());
    }

    addLightFromPreset(id: string, presetName: string, position: THREE.Vector3): void {
        const preset = this.lights.get(`preset_${presetName}`);
        if (!preset || !this.scene) {
            console.warn(`Light preset '${presetName}' not found`);
            return;
        }

        // Create new light based on preset
        const presetLight = preset.getLight() as THREE.PointLight;
        const config: DynamicLightConfig = {
            color: presetLight.color.getHex(),
            intensity: presetLight.intensity,
            position: position.clone(),
            range: presetLight.distance,
            castShadow: presetLight.castShadow,
            // Copy dynamic properties if available
            ...(preset as any).config
        };

        this.addLight(id, config);
    }

    removeLight(id: string): void {
        const light = this.lights.get(id);
        if (light && this.scene) {
            this.scene.remove(light.getLight());
            light.dispose();
            this.lights.delete(id);
        }
    }

    updateTimeOfDay(timeOfDay: number): void {
        this.timeOfDay = Math.max(0, Math.min(1, timeOfDay));
        this.updateEnvironmentalLighting();
    }

    updateWeatherInfluence(influence: number): void {
        this.weatherInfluence = Math.max(0, Math.min(1, influence));
        this.updateEnvironmentalLighting();
    }

    private updateEnvironmentalLighting(): void {
        if (!this.ambientLight || !this.directionalLight) return;

        // Update ambient light
        const ambientIntensity = this.calculateAmbientIntensity();
        const ambientColor = this.calculateAmbientColor();
        this.ambientLight.intensity = ambientIntensity;
        this.ambientLight.color.setHex(ambientColor);

        // Update directional light
        const directionalIntensity = this.calculateDirectionalIntensity();
        const directionalColor = this.calculateDirectionalColor();
        this.directionalLight.intensity = directionalIntensity;
        this.directionalLight.color.setHex(directionalColor);
        
        this.updateDirectionalLightPosition();
    }

    private calculateAmbientIntensity(): number {
        // Base intensity varies with time of day
        let intensity = 0.1 + Math.sin(this.timeOfDay * Math.PI) * 0.2;
        
        // Weather influence
        intensity *= this.weatherInfluence;
        
        // Night minimum
        intensity = Math.max(0.05, intensity);
        
        return intensity;
    }

    private calculateAmbientColor(): number {
        const t = this.timeOfDay;
        
        if (t < 0.2) { // Night
            return 0x1a1a2e;
        } else if (t < 0.3) { // Dawn
            return 0xff6b4a;
        } else if (t < 0.7) { // Day
            return 0x87ceeb;
        } else if (t < 0.8) { // Dusk
            return 0xff4500;
        } else { // Night
            return 0x1a1a2e;
        }
    }

    private calculateDirectionalIntensity(): number {
        // Sun/moon intensity based on time of day
        let intensity = Math.sin(this.timeOfDay * Math.PI);
        
        // Apply weather influence
        intensity *= this.weatherInfluence;
        
        // Minimum for moon
        intensity = Math.max(0.1, intensity);
        
        return intensity;
    }

    private calculateDirectionalColor(): number {
        const t = this.timeOfDay;
        
        if (t < 0.2) { // Night - moonlight
            return 0x9999ff;
        } else if (t < 0.3) { // Dawn
            return 0xffa500;
        } else if (t < 0.7) { // Day - sunlight
            return 0xffffcc;
        } else if (t < 0.8) { // Dusk
            return 0xff6347;
        } else { // Night
            return 0x9999ff;
        }
    }

    private updateDirectionalLightPosition(): void {
        if (!this.directionalLight) return;

        // Calculate sun/moon position based on time of day
        const angle = (this.timeOfDay - 0.5) * Math.PI; // -π/2 to π/2
        const x = Math.sin(angle) * 50;
        const y = Math.cos(angle) * 50;
        const z = 25;

        this.directionalLight.position.set(x, y, z);
        if (this.directionalLight.target) {
            this.directionalLight.target.position.set(0, 0, 0);
        }
    }

    update(deltaTime: number): void {
        // Update all dynamic lights
        for (const [id, light] of this.lights) {
            if (!id.startsWith('preset_')) {
                light.update(deltaTime);
            }
        }
    }

    setLightPosition(id: string, position: THREE.Vector3): void {
        const light = this.lights.get(id);
        if (light) {
            light.setPosition(position);
        }
    }

    setLightIntensity(id: string, intensity: number): void {
        const light = this.lights.get(id);
        if (light) {
            light.setIntensity(intensity);
        }
    }

    setLightColor(id: string, color: number): void {
        const light = this.lights.get(id);
        if (light) {
            light.setColor(color);
        }
    }

    getLightCount(): number {
        return this.lights.size;
    }

    getActiveLightCount(): number {
        let count = 0;
        for (const [id] of this.lights) {
            if (!id.startsWith('preset_')) {
                count++;
            }
        }
        return count;
    }

    cleanup(): void {
        // Remove all lights
        for (const [id, light] of this.lights) {
            if (this.scene && !id.startsWith('preset_')) {
                this.scene.remove(light.getLight());
            }
            light.dispose();
        }
        this.lights.clear();

        // Clean up main lights
        if (this.scene && this.ambientLight) {
            this.scene.remove(this.ambientLight);
        }
        if (this.scene && this.directionalLight) {
            this.scene.remove(this.directionalLight);
        }
    }

    // Integration methods for other systems
    addTorchAt(position: THREE.Vector3): string {
        const id = `torch_${Date.now()}_${Math.random()}`;
        this.addLightFromPreset(id, 'torch', position);
        return id;
    }

    addCampfireAt(position: THREE.Vector3): string {
        const id = `campfire_${Date.now()}_${Math.random()}`;
        this.addLightFromPreset(id, 'campfire', position);
        return id;
    }

    addMagicOrbAt(position: THREE.Vector3): string {
        const id = `magic_orb_${Date.now()}_${Math.random()}`;
        this.addLightFromPreset(id, 'magic_orb', position);
        return id;
    }

    addCrystalAt(position: THREE.Vector3): string {
        const id = `crystal_${Date.now()}_${Math.random()}`;
        this.addLightFromPreset(id, 'crystal', position);
        return id;
    }
}