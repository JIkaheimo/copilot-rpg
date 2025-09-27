import * as THREE from 'three';

export class DayNightCycle {
    private scene: THREE.Scene | null = null;
    private directionalLight: THREE.DirectionalLight | null = null;
    private ambientLight: THREE.AmbientLight | null = null;
    
    private timeOfDay: number = 12; // Hours (0-24)
    private timeScale: number = 1; // How fast time passes (1 = real-time, 60 = 1 minute = 1 hour)
    
    // Lighting configurations for different times
    private lightingConfigs = {
        night: {
            directionalColor: 0x1a1a2e,
            directionalIntensity: 0.1,
            ambientColor: 0x1a1a2e,
            ambientIntensity: 0.2,
            skyColor: 0x0f0f23
        },
        dawn: {
            directionalColor: 0xff6b35,
            directionalIntensity: 0.5,
            ambientColor: 0xff8c42,
            ambientIntensity: 0.3,
            skyColor: 0xff6b35
        },
        day: {
            directionalColor: 0xffffff,
            directionalIntensity: 1.0,
            ambientColor: 0x404040,
            ambientIntensity: 0.4,
            skyColor: 0x87ceeb
        },
        dusk: {
            directionalColor: 0xff4757,
            directionalIntensity: 0.6,
            ambientColor: 0xff6b7a,
            ambientIntensity: 0.3,
            skyColor: 0xff4757
        }
    };
    
    initialize(scene: THREE.Scene): void {
        this.scene = scene;
        
        // Find existing lights in the scene
        scene.traverse((object) => {
            if (object instanceof THREE.DirectionalLight) {
                this.directionalLight = object;
            } else if (object instanceof THREE.AmbientLight) {
                this.ambientLight = object;
            }
        });
        
        // If lights don't exist, create them
        if (!this.directionalLight) {
            this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            this.directionalLight.position.set(10, 10, 5);
            this.directionalLight.castShadow = true;
            scene.add(this.directionalLight);
        }
        
        if (!this.ambientLight) {
            this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
            scene.add(this.ambientLight);
        }
        
        // Set initial lighting
        this.updateLighting();
        this.updateSunPosition();
        
        console.log('☀️ Day/Night cycle initialized');
    }
    
    update(deltaTime: number): void {
        // Advance time
        this.timeOfDay += (deltaTime * this.timeScale) / 3600; // Convert seconds to hours
        
        // Wrap time around 24 hours
        if (this.timeOfDay >= 24) {
            this.timeOfDay -= 24;
        }
        
        this.updateLighting();
        this.updateSunPosition();
    }
    
    private updateLighting(): void {
        if (!this.directionalLight || !this.ambientLight) return;
        
        const config = this.getCurrentLightingConfig();
        
        // Smooth color transitions
        this.directionalLight.color.setHex(config.directionalColor);
        this.directionalLight.intensity = config.directionalIntensity;
        
        this.ambientLight.color.setHex(config.ambientColor);
        this.ambientLight.intensity = config.ambientIntensity;
        
        // Update scene background/fog color
        if (this.scene) {
            if (this.scene.fog && this.scene.fog instanceof THREE.Fog) {
                this.scene.fog.color.setHex(config.skyColor);
            }
        }
    }
    
    private updateSunPosition(): void {
        if (!this.directionalLight) return;
        
        // Calculate sun angle based on time of day
        // Sun is at zenith at 12:00, sets at 18:00, rises at 6:00
        const sunAngle = ((this.timeOfDay - 6) / 12) * Math.PI; // 0 to PI over day
        
        // Calculate sun position
        const sunDistance = 50;
        const sunX = Math.cos(sunAngle) * sunDistance;
        const sunY = Math.sin(sunAngle) * sunDistance;
        const sunZ = 5;
        
        this.directionalLight.position.set(sunX, sunY, sunZ);
        
        // Update shadow camera to follow sun
        if (this.directionalLight.shadow && this.directionalLight.shadow.camera) {
            this.directionalLight.shadow.camera.updateProjectionMatrix();
        }
    }
    
    private getCurrentLightingConfig(): any {
        const configs = this.lightingConfigs;
        
        if (this.timeOfDay >= 6 && this.timeOfDay < 8) {
            // Dawn (6-8 AM)
            const t = (this.timeOfDay - 6) / 2;
            return this.interpolateConfigs(configs.night, configs.dawn, t);
        } else if (this.timeOfDay >= 8 && this.timeOfDay < 10) {
            // Dawn to Day transition (8-10 AM)
            const t = (this.timeOfDay - 8) / 2;
            return this.interpolateConfigs(configs.dawn, configs.day, t);
        } else if (this.timeOfDay >= 10 && this.timeOfDay < 16) {
            // Day (10 AM - 4 PM)
            return configs.day;
        } else if (this.timeOfDay >= 16 && this.timeOfDay < 18) {
            // Day to Dusk transition (4-6 PM)
            const t = (this.timeOfDay - 16) / 2;
            return this.interpolateConfigs(configs.day, configs.dusk, t);
        } else if (this.timeOfDay >= 18 && this.timeOfDay < 20) {
            // Dusk (6-8 PM)
            const t = (this.timeOfDay - 18) / 2;
            return this.interpolateConfigs(configs.dusk, configs.night, t);
        } else {
            // Night (8 PM - 6 AM)
            return configs.night;
        }
    }
    
    private interpolateConfigs(config1: any, config2: any, t: number): any {
        const lerpColor = (color1: number, color2: number, t: number): number => {
            const r1 = (color1 >> 16) & 0xff;
            const g1 = (color1 >> 8) & 0xff;
            const b1 = color1 & 0xff;
            
            const r2 = (color2 >> 16) & 0xff;
            const g2 = (color2 >> 8) & 0xff;
            const b2 = color2 & 0xff;
            
            const r = Math.floor(r1 + (r2 - r1) * t);
            const g = Math.floor(g1 + (g2 - g1) * t);
            const b = Math.floor(b1 + (b2 - b1) * t);
            
            return (r << 16) | (g << 8) | b;
        };
        
        return {
            directionalColor: lerpColor(config1.directionalColor, config2.directionalColor, t),
            directionalIntensity: config1.directionalIntensity + (config2.directionalIntensity - config1.directionalIntensity) * t,
            ambientColor: lerpColor(config1.ambientColor, config2.ambientColor, t),
            ambientIntensity: config1.ambientIntensity + (config2.ambientIntensity - config1.ambientIntensity) * t,
            skyColor: lerpColor(config1.skyColor, config2.skyColor, t)
        };
    }
    
    // Public methods
    setTimeOfDay(hours: number): void {
        this.timeOfDay = Math.max(0, Math.min(24, hours));
        this.updateLighting();
        this.updateSunPosition();
    }
    
    getTimeOfDay(): number {
        return this.timeOfDay;
    }
    
    getCurrentTime(): number {
        // Return normalized time (0-1) for lighting system
        return this.timeOfDay / 24;
    }
    
    getTimeScale(): number {
        return this.timeScale;
    }
    
    setTimeScale(scale: number): void {
        this.timeScale = Math.max(0.1, scale);
    }
    
    getTimeString(): string {
        const hours = Math.floor(this.timeOfDay);
        const minutes = Math.floor((this.timeOfDay - hours) * 60);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    isDay(): boolean {
        return this.timeOfDay >= 6 && this.timeOfDay < 18;
    }
    
    isNight(): boolean {
        return !this.isDay();
    }
    
    isDawn(): boolean {
        return this.timeOfDay >= 6 && this.timeOfDay < 8;
    }
    
    isDusk(): boolean {
        return this.timeOfDay >= 18 && this.timeOfDay < 20;
    }
}