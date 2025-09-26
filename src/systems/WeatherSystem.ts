import * as THREE from 'three';

export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'storm';

export class WeatherSystem {
    private scene: THREE.Scene | null = null;
    private currentWeather: WeatherType = 'clear';
    private weatherIntensity: number = 0;
    private transitionDuration: number = 10; // seconds
    private transitionTime: number = 0;
    private targetWeather: WeatherType = 'clear';
    
    // Weather effects
    private rainParticles: THREE.Points | null = null;
    private snowParticles: THREE.Points | null = null;
    private fogEffect: THREE.Fog | null = null;
    
    initialize(scene: THREE.Scene): void {
        this.scene = scene;
        this.createWeatherEffects();
        console.log('🌤️ Weather system initialized');
    }
    
    private createWeatherEffects(): void {
        if (!this.scene) return;
        
        // Create rain particles
        this.createRainEffect();
        
        // Create snow particles
        this.createSnowEffect();
    }
    
    private createRainEffect(): void {
        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = Math.random() * 50 + 25;
            positions[i3 + 2] = (Math.random() - 0.5) * 100;
            
            velocities[i3] = (Math.random() - 0.5) * 2;
            velocities[i3 + 1] = -10 - Math.random() * 10;
            velocities[i3 + 2] = (Math.random() - 0.5) * 2;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x99ccff,
            size: 0.1,
            transparent: true,
            opacity: 0.7
        });
        
        this.rainParticles = new THREE.Points(particles, material);
        this.rainParticles.visible = false;
        this.scene?.add(this.rainParticles);
    }
    
    private createSnowEffect(): void {
        const particleCount = 500;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = Math.random() * 50 + 25;
            positions[i3 + 2] = (Math.random() - 0.5) * 100;
            
            velocities[i3] = (Math.random() - 0.5) * 1;
            velocities[i3 + 1] = -1 - Math.random() * 2;
            velocities[i3 + 2] = (Math.random() - 0.5) * 1;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,
            transparent: true,
            opacity: 0.8
        });
        
        this.snowParticles = new THREE.Points(particles, material);
        this.snowParticles.visible = false;
        this.scene?.add(this.snowParticles);
    }
    
    update(deltaTime: number): void {
        this.updateWeatherTransition(deltaTime);
        this.updateWeatherEffects(deltaTime);
        
        // Random weather changes (very slow)
        if (Math.random() < 0.0001) { // 0.01% chance per frame
            this.changeWeather();
        }
    }
    
    private updateWeatherTransition(deltaTime: number): void {
        if (this.currentWeather !== this.targetWeather) {
            this.transitionTime += deltaTime;
            const progress = Math.min(this.transitionTime / this.transitionDuration, 1);
            
            if (progress >= 1) {
                this.currentWeather = this.targetWeather;
                this.transitionTime = 0;
            }
            
            this.updateWeatherVisuals(progress);
        }
    }
    
    private updateWeatherEffects(deltaTime: number): void {
        // Update rain particles
        if (this.rainParticles && this.rainParticles.visible) {
            this.updateParticles(this.rainParticles, deltaTime);
        }
        
        // Update snow particles
        if (this.snowParticles && this.snowParticles.visible) {
            this.updateParticles(this.snowParticles, deltaTime);
        }
    }
    
    private updateParticles(particles: THREE.Points, deltaTime: number): void {
        const positions = particles.geometry.attributes.position.array as Float32Array;
        const velocities = particles.geometry.attributes.velocity.array as Float32Array;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Update position based on velocity
            positions[i] += velocities[i] * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += velocities[i + 2] * deltaTime;
            
            // Reset particles that fall below ground
            if (positions[i + 1] < 0) {
                positions[i] = (Math.random() - 0.5) * 100;
                positions[i + 1] = Math.random() * 20 + 30;
                positions[i + 2] = (Math.random() - 0.5) * 100;
            }
            
            // Reset particles that move too far horizontally
            if (Math.abs(positions[i]) > 50 || Math.abs(positions[i + 2]) > 50) {
                positions[i] = (Math.random() - 0.5) * 100;
                positions[i + 1] = Math.random() * 20 + 30;
                positions[i + 2] = (Math.random() - 0.5) * 100;
            }
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
    }
    
    private updateWeatherVisuals(transitionProgress: number): void {
        if (!this.scene) return;
        
        // Hide all weather effects first
        if (this.rainParticles) this.rainParticles.visible = false;
        if (this.snowParticles) this.snowParticles.visible = false;
        
        // Show effects for target weather
        switch (this.targetWeather) {
            case 'rain':
            case 'storm':
                if (this.rainParticles && this.rainParticles.material) {
                    this.rainParticles.visible = true;
                    const material = this.rainParticles.material as THREE.PointsMaterial;
                    if (material && typeof material.opacity !== 'undefined') {
                        material.opacity = 0.7 * transitionProgress * this.weatherIntensity;
                    }
                }
                break;
                
            case 'snow':
                if (this.snowParticles && this.snowParticles.material) {
                    this.snowParticles.visible = true;
                    const material = this.snowParticles.material as THREE.PointsMaterial;
                    if (material && typeof material.opacity !== 'undefined') {
                        material.opacity = 0.8 * transitionProgress * this.weatherIntensity;
                    }
                }
                break;
                
            case 'fog':
                if (!this.fogEffect) {
                    this.fogEffect = new THREE.Fog(0xcccccc, 5, 30);
                }
                this.scene.fog = this.fogEffect;
                break;
                
            case 'clear':
            case 'cloudy':
                this.scene.fog = new THREE.Fog(0xcccccc, 50, 200);
                break;
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
}