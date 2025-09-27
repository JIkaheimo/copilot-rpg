import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'storm';

export class WeatherSystem {
    private scene: THREE.Scene | null = null;
    private particleSystem: ParticleSystem | null = null;
    private currentWeather: WeatherType = 'clear';
    private weatherIntensity: number = 0;
    private transitionDuration: number = 10; // seconds
    private transitionTime: number = 0;
    private targetWeather: WeatherType = 'clear';
    
    // Active environmental effects
    private activeWeatherEffects: Set<string> = new Set();
    
    initialize(scene: THREE.Scene, particleSystem: ParticleSystem): void {
        this.scene = scene;
        this.particleSystem = particleSystem;
        console.log('🌤️ Weather system initialized with enhanced particle effects');
    }
    
    private startWeatherEffect(weatherType: WeatherType): void {
        if (!this.particleSystem || !this.scene) return;

        // Clear existing weather effects
        this.clearWeatherEffects();

        const playerPosition = new THREE.Vector3(0, 10, 0); // Assume player at origin
        const effectArea = 50; // Large area for environmental effects

        switch (weatherType) {
            case 'rain':
                const rainId = this.particleSystem.createEnvironmentalEffect('rain', playerPosition, effectArea);
                this.activeWeatherEffects.add(rainId);
                break;
                
            case 'snow':
                const snowId = this.particleSystem.createEnvironmentalEffect('snow', playerPosition, effectArea);
                this.activeWeatherEffects.add(snowId);
                
                // Add some fog for atmosphere
                const fogId = this.particleSystem.createEnvironmentalEffect('fog', playerPosition, effectArea * 0.5);
                this.activeWeatherEffects.add(fogId);
                break;
                
            case 'fog':
                const fogOnlyId = this.particleSystem.createEnvironmentalEffect('fog', playerPosition, effectArea);
                this.activeWeatherEffects.add(fogOnlyId);
                break;
                
            case 'storm':
                const stormRainId = this.particleSystem.createEnvironmentalEffect('rain', playerPosition, effectArea);
                const dustId = this.particleSystem.createEnvironmentalEffect('dust', playerPosition, effectArea * 0.3);
                this.activeWeatherEffects.add(stormRainId);
                this.activeWeatherEffects.add(dustId);
                
                // Add some fog for dramatic effect
                if (this.scene.fog && this.scene.fog instanceof THREE.Fog) {
                    const originalFog = this.scene.fog as THREE.Fog;
                    this.scene.fog = new THREE.Fog(0x666666, originalFog.near, originalFog.far * 0.5);
                } else {
                    this.scene.fog = new THREE.Fog(0x666666, 10, 60);
                }
                break;
                
            case 'clear':
                // Maybe add some light dust particles for atmosphere
                if (Math.random() > 0.7) {
                    const dustId2 = this.particleSystem.createEnvironmentalEffect('dust', playerPosition, effectArea * 0.2);
                    this.activeWeatherEffects.add(dustId2);
                }
                break;
        }
    }

    private clearWeatherEffects(): void {
        if (!this.particleSystem) return;

        // Stop all active weather effects
        this.activeWeatherEffects.forEach(effectId => {
            this.particleSystem!.stopEffect(effectId);
        });
        this.activeWeatherEffects.clear();
    }
    
    update(deltaTime: number): void {
        if (this.currentWeather === this.targetWeather) return;
        
        this.transitionTime += deltaTime;
        const transitionProgress = Math.min(this.transitionTime / this.transitionDuration, 1);
        
        if (transitionProgress >= 1) {
            // Transition complete
            this.currentWeather = this.targetWeather;
            this.startWeatherEffect(this.currentWeather);
            console.log(`🌤️ Weather transition to ${this.currentWeather} complete`);
        }

        // Random weather changes (very slow)
        if (Math.random() < 0.0001) { // 0.01% chance per frame
            this.changeWeather();
        }
    }

    private changeWeather(): void {
        const weatherTypes: WeatherType[] = ['clear', 'cloudy', 'rain', 'snow', 'fog'];
        const newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        
        if (newWeather !== this.currentWeather) {
            this.setWeather(newWeather, Math.random() * 0.5 + 0.5);
        }
    }
    
    setWeather(weather: WeatherType, intensity: number = 1): void {
        this.targetWeather = weather;
        this.weatherIntensity = Math.max(0, Math.min(1, intensity));
        this.transitionTime = 0;
        
        console.log(`🌦️ Weather changing to ${weather} (intensity: ${intensity.toFixed(2)})`);
    }
    
    getCurrentWeather(): WeatherType {
        return this.currentWeather;
    }
    
    getWeatherIntensity(): number {
        return this.weatherIntensity;
    }
    
    isTransitioning(): boolean {
        return this.currentWeather !== this.targetWeather;
    }

    cleanup(): void {
        this.clearWeatherEffects();
    }
}