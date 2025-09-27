import * as THREE from 'three';

export interface AudioConfig {
    volume: number;
    loop: boolean;
    autoplay?: boolean;
    fadeIn?: number;
    fadeOut?: number;
}

export interface SpatialAudioConfig extends AudioConfig {
    position: THREE.Vector3;
    maxDistance: number;
    rolloffFactor?: number;
    coneInnerAngle?: number;
    coneOuterAngle?: number;
    coneOuterGain?: number;
}

export interface SoundEffect {
    id: string;
    audio: HTMLAudioElement;
    positionalAudio?: THREE.PositionalAudio;
    config: AudioConfig | SpatialAudioConfig;
    isPlaying: boolean;
    fadeTimeout?: number;
}

export class AudioSystem {
    private listener: THREE.AudioListener | null = null;
    private camera: THREE.Camera | null = null;
    private scene: THREE.Scene | null = null;
    private initialized: boolean = false;
    
    // Audio collections
    private backgroundMusic: Map<string, SoundEffect> = new Map();
    private soundEffects: Map<string, SoundEffect> = new Map();
    private ambientSounds: Map<string, SoundEffect> = new Map();
    
    // Current state
    private currentMusicTrack: string | null = null;
    private masterVolume: number = 1.0;
    private musicVolume: number = 0.7;
    private sfxVolume: number = 0.8;
    private ambientVolume: number = 0.5;
    private muted: boolean = false;
    
    // Audio categories for different game situations
    private readonly audioLibrary = {
        music: {
            exploration: '/assets/audio/music/exploration.ogg',
            combat: '/assets/audio/music/combat.ogg',
            victory: '/assets/audio/music/victory.ogg',
            menu: '/assets/audio/music/menu.ogg'
        },
        sfx: {
            // Combat sounds
            sword_swing: '/assets/audio/sfx/sword_swing.ogg',
            sword_hit: '/assets/audio/sfx/sword_hit.ogg',
            bow_shoot: '/assets/audio/sfx/bow_shoot.ogg',
            magic_cast: '/assets/audio/sfx/magic_cast.ogg',
            enemy_death: '/assets/audio/sfx/enemy_death.ogg',
            player_hurt: '/assets/audio/sfx/player_hurt.ogg',
            
            // Interaction sounds
            chest_open: '/assets/audio/sfx/chest_open.ogg',
            item_pickup: '/assets/audio/sfx/item_pickup.ogg',
            door_open: '/assets/audio/sfx/door_open.ogg',
            button_click: '/assets/audio/sfx/button_click.ogg',
            
            // Environment sounds
            footsteps_grass: '/assets/audio/sfx/footsteps_grass.ogg',
            footsteps_stone: '/assets/audio/sfx/footsteps_stone.ogg',
            water_splash: '/assets/audio/sfx/water_splash.ogg'
        },
        ambient: {
            forest: '/assets/audio/ambient/forest.ogg',
            water: '/assets/audio/ambient/water.ogg',
            wind: '/assets/audio/ambient/wind.ogg',
            fire: '/assets/audio/ambient/fire.ogg',
            dungeon: '/assets/audio/ambient/dungeon.ogg'
        }
    };

    constructor() {
        // Initialize audio context (for future Web Audio API features)
        try {
            new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (_error) {
            console.warn('🔊 AudioContext not available, audio features disabled');
        }
    }

    initialize(scene: THREE.Scene, camera: THREE.Camera): void {
        this.scene = scene;
        this.camera = camera;
        
        // Create audio listener and attach to camera
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        
        this.initialized = true;
        console.log('🔊 Audio System initialized');
        
        // Preload essential audio files
        this.preloadEssentialAudio();
    }

    private async preloadEssentialAudio(): Promise<void> {
        try {
            // Preload key sound effects
            const essentialSfx = ['sword_swing', 'sword_hit', 'item_pickup', 'chest_open'];
            const loadPromises: Promise<void>[] = [];
            
            for (const sfxName of essentialSfx) {
                if (this.audioLibrary.sfx[sfxName as keyof typeof this.audioLibrary.sfx]) {
                    loadPromises.push(this.loadSoundEffect(sfxName, {
                        volume: 0.8,
                        loop: false
                    }));
                }
            }
            
            // Preload exploration music
            loadPromises.push(this.loadBackgroundMusic('exploration', {
                volume: 0.7,
                loop: true
            }));
            
            await Promise.all(loadPromises);
            console.log('🔊 Essential audio preloaded');
        } catch (error) {
            console.warn('🔊 Failed to preload some audio files:', error);
        }
    }

    async loadBackgroundMusic(name: string, config: AudioConfig): Promise<void> {
        const audioPath = this.audioLibrary.music[name as keyof typeof this.audioLibrary.music];
        if (!audioPath) {
            console.warn(`🔊 Music track '${name}' not found in library`);
            return;
        }

        try {
            const audio = new Audio(audioPath);
            audio.volume = config.volume * this.musicVolume * this.masterVolume;
            audio.loop = config.loop;
            audio.preload = 'auto';
            
            // Wait for audio to be ready
            await new Promise((resolve, reject) => {
                audio.addEventListener('canplaythrough', resolve);
                audio.addEventListener('error', reject);
            });

            const soundEffect: SoundEffect = {
                id: name,
                audio,
                config,
                isPlaying: false
            };

            this.backgroundMusic.set(name, soundEffect);
            console.log(`🔊 Background music '${name}' loaded`);
        } catch (error) {
            console.warn(`🔊 Failed to load background music '${name}':`, error);
        }
    }

    async loadSoundEffect(name: string, config: AudioConfig): Promise<void> {
        const audioPath = this.audioLibrary.sfx[name as keyof typeof this.audioLibrary.sfx];
        if (!audioPath) {
            console.warn(`🔊 Sound effect '${name}' not found in library`);
            return;
        }

        try {
            const audio = new Audio(audioPath);
            audio.volume = config.volume * this.sfxVolume * this.masterVolume;
            audio.loop = config.loop;
            audio.preload = 'auto';
            
            // Wait for audio to be ready
            await new Promise((resolve, reject) => {
                audio.addEventListener('canplaythrough', resolve);
                audio.addEventListener('error', reject);
            });

            const soundEffect: SoundEffect = {
                id: name,
                audio,
                config,
                isPlaying: false
            };

            this.soundEffects.set(name, soundEffect);
            console.log(`🔊 Sound effect '${name}' loaded`);
        } catch (error) {
            console.warn(`🔊 Failed to load sound effect '${name}':`, error);
        }
    }

    async loadSpatialAudio(name: string, config: SpatialAudioConfig): Promise<void> {
        if (!this.listener || !this.scene) {
            console.warn('🔊 AudioSystem not properly initialized for spatial audio');
            return;
        }

        const audioPath = this.audioLibrary.ambient[name as keyof typeof this.audioLibrary.ambient] ||
                          this.audioLibrary.sfx[name as keyof typeof this.audioLibrary.sfx];
        
        if (!audioPath) {
            console.warn(`🔊 Spatial audio '${name}' not found in library`);
            return;
        }

        try {
            const audioLoader = new THREE.AudioLoader();
            const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
                audioLoader.load(audioPath, resolve, undefined, reject);
            });

            const positionalAudio = new THREE.PositionalAudio(this.listener);
            positionalAudio.setBuffer(audioBuffer);
            positionalAudio.setVolume(config.volume * this.ambientVolume * this.masterVolume);
            positionalAudio.setLoop(config.loop);
            positionalAudio.setMaxDistance(config.maxDistance);
            positionalAudio.setRolloffFactor(config.rolloffFactor || 1);

            // Set cone properties if specified
            if (config.coneInnerAngle !== undefined) {
                positionalAudio.panner.coneInnerAngle = config.coneInnerAngle;
                positionalAudio.panner.coneOuterAngle = config.coneOuterAngle || 360;
                positionalAudio.panner.coneOuterGain = config.coneOuterGain || 0;
            }

            // Create a dummy audio element for consistency
            const audio = new Audio();
            audio.volume = config.volume;
            audio.loop = config.loop;

            // Create spatial audio object
            const spatialAudioObject = new THREE.Object3D();
            spatialAudioObject.position.copy(config.position);
            spatialAudioObject.add(positionalAudio);
            this.scene.add(spatialAudioObject);

            const soundEffect: SoundEffect = {
                id: name,
                audio,
                positionalAudio,
                config,
                isPlaying: false
            };

            this.ambientSounds.set(name, soundEffect);
            console.log(`🔊 Spatial audio '${name}' loaded at position:`, config.position);
        } catch (error) {
            console.warn(`🔊 Failed to load spatial audio '${name}':`, error);
        }
    }

    playBackgroundMusic(name: string, fadeInTime: number = 1000): void {
        if (!this.initialized) return;

        const soundEffect = this.backgroundMusic.get(name);
        if (!soundEffect) {
            console.warn(`🔊 Background music '${name}' not loaded`);
            return;
        }

        // Stop current music with fade out
        if (this.currentMusicTrack && this.currentMusicTrack !== name) {
            this.stopBackgroundMusic(1000);
        }

        if (soundEffect.isPlaying) return;

        try {
            // Fade in effect
            if (fadeInTime > 0) {
                soundEffect.audio.volume = 0;
                soundEffect.audio.play();
                this.fadeAudio(soundEffect.audio, 
                    soundEffect.config.volume * this.musicVolume * this.masterVolume, 
                    fadeInTime);
            } else {
                soundEffect.audio.volume = soundEffect.config.volume * this.musicVolume * this.masterVolume;
                soundEffect.audio.play();
            }

            soundEffect.isPlaying = true;
            this.currentMusicTrack = name;
            console.log(`🔊 Playing background music: ${name}`);
        } catch (error) {
            console.warn(`🔊 Failed to play background music '${name}':`, error);
        }
    }

    stopBackgroundMusic(fadeOutTime: number = 1000): void {
        if (!this.currentMusicTrack) return;

        const soundEffect = this.backgroundMusic.get(this.currentMusicTrack);
        if (!soundEffect || !soundEffect.isPlaying) return;

        if (fadeOutTime > 0) {
            this.fadeAudio(soundEffect.audio, 0, fadeOutTime, () => {
                soundEffect.audio.pause();
                soundEffect.audio.currentTime = 0;
                soundEffect.isPlaying = false;
            });
        } else {
            soundEffect.audio.pause();
            soundEffect.audio.currentTime = 0;
            soundEffect.isPlaying = false;
        }

        this.currentMusicTrack = null;
        console.log('🔊 Background music stopped');
    }

    playSoundEffect(name: string, volume?: number): void {
        if (!this.initialized || this.muted) return;

        const soundEffect = this.soundEffects.get(name);
        if (!soundEffect) {
            console.warn(`🔊 Sound effect '${name}' not loaded`);
            return;
        }

        try {
            // Reset audio if it's already playing
            if (soundEffect.isPlaying) {
                soundEffect.audio.currentTime = 0;
            }

            const finalVolume = (volume || soundEffect.config.volume) * this.sfxVolume * this.masterVolume;
            soundEffect.audio.volume = Math.min(1.0, Math.max(0.0, finalVolume));
            soundEffect.audio.play();
            
            soundEffect.isPlaying = true;
            
            // Reset playing state when audio ends
            soundEffect.audio.addEventListener('ended', () => {
                soundEffect.isPlaying = false;
            }, { once: true });

        } catch (error) {
            console.warn(`🔊 Failed to play sound effect '${name}':`, error);
        }
    }

    playSpatialSound(name: string, position?: THREE.Vector3): void {
        if (!this.initialized || this.muted) return;

        const soundEffect = this.ambientSounds.get(name);
        if (!soundEffect || !soundEffect.positionalAudio) {
            console.warn(`🔊 Spatial sound '${name}' not loaded`);
            return;
        }

        try {
            // Update position if provided
            if (position && soundEffect.positionalAudio.parent) {
                soundEffect.positionalAudio.parent.position.copy(position);
            }

            if (soundEffect.positionalAudio.isPlaying) {
                soundEffect.positionalAudio.stop();
            }

            soundEffect.positionalAudio.play();
            soundEffect.isPlaying = true;
            
            console.log(`🔊 Playing spatial sound: ${name}`);
        } catch (error) {
            console.warn(`🔊 Failed to play spatial sound '${name}':`, error);
        }
    }

    stopSpatialSound(name: string, fadeOutTime: number = 0): void {
        const soundEffect = this.ambientSounds.get(name);
        if (!soundEffect || !soundEffect.positionalAudio || !soundEffect.isPlaying) return;

        if (fadeOutTime > 0) {
            // Implement fade out for positional audio
            const startVolume = soundEffect.positionalAudio.getVolume();
            const fadeSteps = 20;
            const stepTime = fadeOutTime / fadeSteps;
            const stepVolume = startVolume / fadeSteps;

            let currentStep = 0;
            const fadeInterval = setInterval(() => {
                currentStep++;
                const newVolume = startVolume - (stepVolume * currentStep);
                
                if (currentStep >= fadeSteps || newVolume <= 0) {
                    soundEffect.positionalAudio!.stop();
                    soundEffect.positionalAudio!.setVolume(startVolume);
                    soundEffect.isPlaying = false;
                    clearInterval(fadeInterval);
                } else {
                    soundEffect.positionalAudio!.setVolume(newVolume);
                }
            }, stepTime);
        } else {
            soundEffect.positionalAudio.stop();
            soundEffect.isPlaying = false;
        }
    }

    private fadeAudio(audio: HTMLAudioElement, targetVolume: number, duration: number, callback?: () => void): void {
        const startVolume = audio.volume;
        const volumeDiff = targetVolume - startVolume;
        const steps = 20;
        const stepTime = duration / steps;
        const stepVolume = volumeDiff / steps;

        let currentStep = 0;
        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVolume = startVolume + (stepVolume * currentStep);
            
            if (currentStep >= steps) {
                audio.volume = targetVolume;
                clearInterval(fadeInterval);
                if (callback) callback();
            } else {
                audio.volume = Math.min(1.0, Math.max(0.0, newVolume));
            }
        }, stepTime);
    }

    // Volume controls
    setMasterVolume(volume: number): void {
        this.masterVolume = Math.min(1.0, Math.max(0.0, volume));
        this.updateAllVolumes();
    }

    setMusicVolume(volume: number): void {
        this.musicVolume = Math.min(1.0, Math.max(0.0, volume));
        this.updateMusicVolumes();
    }

    setSfxVolume(volume: number): void {
        this.sfxVolume = Math.min(1.0, Math.max(0.0, volume));
        this.updateSfxVolumes();
    }

    setAmbientVolume(volume: number): void {
        this.ambientVolume = Math.min(1.0, Math.max(0.0, volume));
        this.updateAmbientVolumes();
    }

    mute(): void {
        this.muted = true;
        this.updateAllVolumes();
    }

    unmute(): void {
        this.muted = false;
        this.updateAllVolumes();
    }

    toggleMute(): void {
        this.muted ? this.unmute() : this.mute();
    }

    private updateAllVolumes(): void {
        this.updateMusicVolumes();
        this.updateSfxVolumes();
        this.updateAmbientVolumes();
    }

    private updateMusicVolumes(): void {
        this.backgroundMusic.forEach(soundEffect => {
            const volume = this.muted ? 0 : soundEffect.config.volume * this.musicVolume * this.masterVolume;
            soundEffect.audio.volume = Math.min(1.0, Math.max(0.0, volume));
        });
    }

    private updateSfxVolumes(): void {
        this.soundEffects.forEach(soundEffect => {
            const volume = this.muted ? 0 : soundEffect.config.volume * this.sfxVolume * this.masterVolume;
            soundEffect.audio.volume = Math.min(1.0, Math.max(0.0, volume));
        });
    }

    private updateAmbientVolumes(): void {
        this.ambientSounds.forEach(soundEffect => {
            if (soundEffect.positionalAudio) {
                const volume = this.muted ? 0 : soundEffect.config.volume * this.ambientVolume * this.masterVolume;
                soundEffect.positionalAudio.setVolume(Math.min(1.0, Math.max(0.0, volume)));
            }
        });
    }

    // Game event handlers
    onCombatStart(): void {
        this.playBackgroundMusic('combat', 1500);
    }

    onCombatEnd(): void {
        this.playBackgroundMusic('exploration', 2000);
    }

    onVictory(): void {
        this.playBackgroundMusic('victory', 500);
        // Return to exploration music after victory music ends
        setTimeout(() => {
            this.playBackgroundMusic('exploration', 1000);
        }, 10000);
    }

    onPlayerHurt(damage: number): void {
        const volume = Math.min(1.0, 0.5 + (damage / 100) * 0.5);
        this.playSoundEffect('player_hurt', volume);
    }

    onEnemyDeath(): void {
        this.playSoundEffect('enemy_death');
    }

    onItemPickup(): void {
        this.playSoundEffect('item_pickup');
    }

    onChestOpen(): void {
        this.playSoundEffect('chest_open');
    }

    onFootstep(surfaceType: string = 'grass'): void {
        const footstepSound = `footsteps_${surfaceType}`;
        if (this.soundEffects.has(footstepSound)) {
            this.playSoundEffect(footstepSound, 0.3);
        } else {
            this.playSoundEffect('footsteps_grass', 0.3);
        }
    }

    // Update method for dynamic audio
    update(deltaTime: number): void {
        if (!this.initialized) return;

        // Update listener position and orientation based on camera
        if (this.listener && this.camera) {
            // The listener automatically updates with the camera since it's attached
            // We could add additional audio processing here if needed
        }

        // Update any time-based audio effects
        this.updateDynamicAudio(deltaTime);
    }

    private updateDynamicAudio(_deltaTime: number): void {
        // Handle dynamic volume changes, audio ducking, etc.
        // This can be expanded for more complex audio behaviors
    }

    // Cleanup
    cleanup(): void {
        // Stop all playing audio
        this.backgroundMusic.forEach(soundEffect => {
            if (soundEffect.isPlaying) {
                soundEffect.audio.pause();
            }
        });

        this.soundEffects.forEach(soundEffect => {
            if (soundEffect.isPlaying) {
                soundEffect.audio.pause();
            }
        });

        this.ambientSounds.forEach(soundEffect => {
            if (soundEffect.positionalAudio && soundEffect.isPlaying) {
                soundEffect.positionalAudio.stop();
            }
        });

        // Clear collections
        this.backgroundMusic.clear();
        this.soundEffects.clear();
        this.ambientSounds.clear();

        // Remove listener from camera
        if (this.listener && this.camera) {
            this.camera.remove(this.listener);
        }

        this.initialized = false;
        console.log('🔊 Audio System cleaned up');
    }

    // Getters for UI and debugging
    getCurrentMusicTrack(): string | null {
        return this.currentMusicTrack;
    }

    getMasterVolume(): number {
        return this.masterVolume;
    }

    getMusicVolume(): number {
        return this.musicVolume;
    }

    getSfxVolume(): number {
        return this.sfxVolume;
    }

    getAmbientVolume(): number {
        return this.ambientVolume;
    }

    isMuted(): boolean {
        return this.muted;
    }

    getLoadedSounds(): {
        music: string[];
        sfx: string[];
        ambient: string[];
    } {
        return {
            music: Array.from(this.backgroundMusic.keys()),
            sfx: Array.from(this.soundEffects.keys()),
            ambient: Array.from(this.ambientSounds.keys())
        };
    }
}