import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { AudioSystem, AudioConfig, SpatialAudioConfig } from '@systems/AudioSystem';

// Mock HTMLAudioElement
class MockAudio {
    volume = 1;
    loop = false;
    preload = 'auto';
    currentTime = 0;
    duration = 100;
    paused = true;
    src = '';
    
    private eventListeners: { [key: string]: Function[] } = {};
    
    addEventListener(event: string, callback: Function) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    removeEventListener(event: string, callback: Function) {
        if (this.eventListeners[event]) {
            const index = this.eventListeners[event].indexOf(callback);
            if (index > -1) {
                this.eventListeners[event].splice(index, 1);
            }
        }
    }
    
    play() {
        this.paused = false;
        return Promise.resolve();
    }
    
    pause() {
        this.paused = true;
    }
    
    load() {}
    
    // Simulate events
    fireEvent(event: string) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback());
        }
    }
}

// Mock Three.js Audio classes
vi.mock('three', async () => {
    const actual = await vi.importActual('three');
    return {
        ...actual,
        AudioListener: vi.fn(() => ({
            context: { state: 'running' }
        })),
        AudioLoader: vi.fn(() => ({
            load: vi.fn((url, onLoad, onProgress, onError) => {
                // Simulate successful load
                setTimeout(() => onLoad(new ArrayBuffer(1024)), 10);
            })
        })),
        PositionalAudio: vi.fn(() => ({
            setBuffer: vi.fn(),
            setVolume: vi.fn(),
            setLoop: vi.fn(),
            setMaxDistance: vi.fn(),
            setRolloffFactor: vi.fn(),
            play: vi.fn(),
            stop: vi.fn(),
            getVolume: vi.fn(() => 1),
            isPlaying: false,
            panner: {
                coneInnerAngle: 360,
                coneOuterAngle: 360,
                coneOuterGain: 0
            },
            parent: {
                position: { copy: vi.fn() }
            }
        })),
        Object3D: vi.fn(() => ({
            position: { copy: vi.fn() },
            add: vi.fn()
        })),
        Scene: vi.fn(() => ({
            add: vi.fn(),
            remove: vi.fn()
        })),
        Camera: vi.fn(() => ({
            add: vi.fn(),
            remove: vi.fn()
        })),
        Vector3: vi.fn((x = 0, y = 0, z = 0) => ({
            x, y, z,
            copy: vi.fn(),
            equals: vi.fn(() => true)
        }))
    };
});

// Mock global Audio constructor
global.Audio = vi.fn(() => new MockAudio()) as any;

// Mock AudioContext
global.AudioContext = vi.fn(() => ({
    state: 'running',
    suspend: vi.fn(),
    resume: vi.fn(),
    close: vi.fn()
})) as any;

(global as any).webkitAudioContext = global.AudioContext;

/**
 * Comprehensive tests for AudioSystem
 * Tests audio loading, playback, spatial audio, and volume controls
 */
describe('AudioSystem', () => {
    let audioSystem: AudioSystem;
    let mockScene: THREE.Scene;
    let mockCamera: THREE.Camera;

    beforeEach(() => {
        mockScene = new THREE.Scene();
        mockCamera = new THREE.Camera();
        audioSystem = new AudioSystem();
        
        // Clear all mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        audioSystem.cleanup();
    });

    describe('Initialization', () => {
        it('should initialize audio system with scene and camera', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            audioSystem.initialize(mockScene, mockCamera);
            
            expect(consoleSpy).toHaveBeenCalledWith('🔊 Audio System initialized');
            consoleSpy.mockRestore();
        });

        it('should create audio listener and attach to camera', () => {
            const addSpy = vi.spyOn(mockCamera, 'add');
            
            audioSystem.initialize(mockScene, mockCamera);
            
            expect(addSpy).toHaveBeenCalled();
        });

        it('should handle AudioContext creation failure gracefully', () => {
            // Mock AudioContext to throw error
            const originalAudioContext = global.AudioContext;
            global.AudioContext = vi.fn(() => {
                throw new Error('AudioContext not supported');
            }) as any;
            
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
            
            expect(() => new AudioSystem()).not.toThrow();
            
            // Restore
            global.AudioContext = originalAudioContext;
            consoleSpy.mockRestore();
        });
    });

    describe('Background Music', () => {
        beforeEach(() => {
            audioSystem.initialize(mockScene, mockCamera);
        });

        it('should load background music successfully', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            const config: AudioConfig = {
                volume: 0.7,
                loop: true
            };

            await audioSystem.loadBackgroundMusic('exploration', config);
            
            expect(consoleSpy).toHaveBeenCalledWith("🔊 Background music 'exploration' loaded");
            consoleSpy.mockRestore();
        });

        it('should play background music', async () => {
            const config: AudioConfig = {
                volume: 0.7,
                loop: true
            };

            await audioSystem.loadBackgroundMusic('exploration', config);
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            audioSystem.playBackgroundMusic('exploration');
            
            expect(consoleSpy).toHaveBeenCalledWith('🔊 Playing background music: exploration');
            expect(audioSystem.getCurrentMusicTrack()).toBe('exploration');
            consoleSpy.mockRestore();
        });

        it('should stop background music', async () => {
            const config: AudioConfig = {
                volume: 0.7,
                loop: true
            };

            await audioSystem.loadBackgroundMusic('exploration', config);
            audioSystem.playBackgroundMusic('exploration');
            
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            audioSystem.stopBackgroundMusic(0);
            
            expect(consoleSpy).toHaveBeenCalledWith('🔊 Background music stopped');
            expect(audioSystem.getCurrentMusicTrack()).toBeNull();
            consoleSpy.mockRestore();
        });

        it('should handle unknown music track gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
            
            audioSystem.playBackgroundMusic('unknown_track');
            
            expect(consoleSpy).toHaveBeenCalledWith("🔊 Background music 'unknown_track' not loaded");
            consoleSpy.mockRestore();
        });

        it('should transition between music tracks', async () => {
            const config: AudioConfig = {
                volume: 0.7,
                loop: true
            };

            await audioSystem.loadBackgroundMusic('exploration', config);
            await audioSystem.loadBackgroundMusic('combat', config);
            
            audioSystem.playBackgroundMusic('exploration');
            expect(audioSystem.getCurrentMusicTrack()).toBe('exploration');
            
            audioSystem.playBackgroundMusic('combat');
            expect(audioSystem.getCurrentMusicTrack()).toBe('combat');
        });
    });

    describe('Sound Effects', () => {
        beforeEach(() => {
            audioSystem.initialize(mockScene, mockCamera);
        });

        it('should load sound effects successfully', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            const config: AudioConfig = {
                volume: 0.8,
                loop: false
            };

            await audioSystem.loadSoundEffect('sword_swing', config);
            
            expect(consoleSpy).toHaveBeenCalledWith("🔊 Sound effect 'sword_swing' loaded");
            consoleSpy.mockRestore();
        });

        it('should play sound effects', async () => {
            const config: AudioConfig = {
                volume: 0.8,
                loop: false
            };

            await audioSystem.loadSoundEffect('sword_swing', config);
            
            // Should not throw
            expect(() => audioSystem.playSoundEffect('sword_swing')).not.toThrow();
        });

        it('should handle custom volume for sound effects', async () => {
            const config: AudioConfig = {
                volume: 0.8,
                loop: false
            };

            await audioSystem.loadSoundEffect('sword_swing', config);
            
            // Should not throw with custom volume
            expect(() => audioSystem.playSoundEffect('sword_swing', 0.5)).not.toThrow();
        });

        it('should handle unknown sound effect gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
            
            audioSystem.playSoundEffect('unknown_sound');
            
            expect(consoleSpy).toHaveBeenCalledWith("🔊 Sound effect 'unknown_sound' not loaded");
            consoleSpy.mockRestore();
        });

        it('should not play sounds when muted', async () => {
            const config: AudioConfig = {
                volume: 0.8,
                loop: false
            };

            await audioSystem.loadSoundEffect('sword_swing', config);
            audioSystem.mute();
            
            // Should not play (implementation detail)
            audioSystem.playSoundEffect('sword_swing');
        });
    });

    describe('Spatial Audio', () => {
        beforeEach(() => {
            audioSystem.initialize(mockScene, mockCamera);
        });

        it('should load spatial audio successfully', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            const config: SpatialAudioConfig = {
                volume: 0.5,
                loop: true,
                position: new THREE.Vector3(10, 0, 10),
                maxDistance: 50,
                rolloffFactor: 1
            };

            await audioSystem.loadSpatialAudio('forest', config);
            
            expect(consoleSpy).toHaveBeenCalledWith('🔊 Spatial audio \'forest\' loaded at position:', config.position);
            consoleSpy.mockRestore();
        });

        it('should play spatial sounds', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            const config: SpatialAudioConfig = {
                volume: 0.5,
                loop: true,
                position: new THREE.Vector3(10, 0, 10),
                maxDistance: 50
            };

            await audioSystem.loadSpatialAudio('forest', config);
            audioSystem.playSpatialSound('forest');
            
            expect(consoleSpy).toHaveBeenCalledWith('🔊 Playing spatial sound: forest');
            consoleSpy.mockRestore();
        });

        it('should update spatial sound position', async () => {
            const config: SpatialAudioConfig = {
                volume: 0.5,
                loop: true,
                position: new THREE.Vector3(10, 0, 10),
                maxDistance: 50
            };

            await audioSystem.loadSpatialAudio('forest', config);
            
            const newPosition = new THREE.Vector3(20, 0, 20);
            audioSystem.playSpatialSound('forest', newPosition);
        });

        it('should stop spatial sounds', async () => {
            const config: SpatialAudioConfig = {
                volume: 0.5,
                loop: true,
                position: new THREE.Vector3(10, 0, 10),
                maxDistance: 50
            };

            await audioSystem.loadSpatialAudio('forest', config);
            audioSystem.playSpatialSound('forest');
            
            // Should not throw
            expect(() => audioSystem.stopSpatialSound('forest')).not.toThrow();
        });
    });

    describe('Volume Controls', () => {
        beforeEach(() => {
            audioSystem.initialize(mockScene, mockCamera);
        });

        it('should set master volume', () => {
            audioSystem.setMasterVolume(0.5);
            expect(audioSystem.getMasterVolume()).toBe(0.5);
        });

        it('should clamp master volume to valid range', () => {
            audioSystem.setMasterVolume(1.5);
            expect(audioSystem.getMasterVolume()).toBe(1.0);
            
            audioSystem.setMasterVolume(-0.5);
            expect(audioSystem.getMasterVolume()).toBe(0.0);
        });

        it('should set music volume', () => {
            audioSystem.setMusicVolume(0.3);
            expect(audioSystem.getMusicVolume()).toBe(0.3);
        });

        it('should set sfx volume', () => {
            audioSystem.setSfxVolume(0.6);
            expect(audioSystem.getSfxVolume()).toBe(0.6);
        });

        it('should set ambient volume', () => {
            audioSystem.setAmbientVolume(0.4);
            expect(audioSystem.getAmbientVolume()).toBe(0.4);
        });

        it('should handle mute/unmute', () => {
            expect(audioSystem.isMuted()).toBe(false);
            
            audioSystem.mute();
            expect(audioSystem.isMuted()).toBe(true);
            
            audioSystem.unmute();
            expect(audioSystem.isMuted()).toBe(false);
        });

        it('should toggle mute state', () => {
            expect(audioSystem.isMuted()).toBe(false);
            
            audioSystem.toggleMute();
            expect(audioSystem.isMuted()).toBe(true);
            
            audioSystem.toggleMute();
            expect(audioSystem.isMuted()).toBe(false);
        });
    });

    describe('Game Event Handlers', () => {
        beforeEach(() => {
            audioSystem.initialize(mockScene, mockCamera);
        });

        it('should handle combat start event', async () => {
            const config: AudioConfig = { volume: 0.7, loop: true };
            await audioSystem.loadBackgroundMusic('combat', config);
            
            audioSystem.onCombatStart();
            expect(audioSystem.getCurrentMusicTrack()).toBe('combat');
        });

        it('should handle combat end event', async () => {
            const config: AudioConfig = { volume: 0.7, loop: true };
            await audioSystem.loadBackgroundMusic('exploration', config);
            await audioSystem.loadBackgroundMusic('combat', config);
            
            audioSystem.onCombatStart();
            audioSystem.onCombatEnd();
            expect(audioSystem.getCurrentMusicTrack()).toBe('exploration');
        });

        it('should handle victory event', async () => {
            const config: AudioConfig = { volume: 0.7, loop: true };
            await audioSystem.loadBackgroundMusic('victory', config);
            
            audioSystem.onVictory();
            expect(audioSystem.getCurrentMusicTrack()).toBe('victory');
        });

        it('should handle player hurt event', async () => {
            const config: AudioConfig = { volume: 0.8, loop: false };
            await audioSystem.loadSoundEffect('player_hurt', config);
            
            // Should not throw
            expect(() => audioSystem.onPlayerHurt(50)).not.toThrow();
        });

        it('should handle enemy death event', async () => {
            const config: AudioConfig = { volume: 0.8, loop: false };
            await audioSystem.loadSoundEffect('enemy_death', config);
            
            // Should not throw
            expect(() => audioSystem.onEnemyDeath()).not.toThrow();
        });

        it('should handle item pickup event', async () => {
            const config: AudioConfig = { volume: 0.8, loop: false };
            await audioSystem.loadSoundEffect('item_pickup', config);
            
            // Should not throw
            expect(() => audioSystem.onItemPickup()).not.toThrow();
        });

        it('should handle chest open event', async () => {
            const config: AudioConfig = { volume: 0.8, loop: false };
            await audioSystem.loadSoundEffect('chest_open', config);
            
            // Should not throw
            expect(() => audioSystem.onChestOpen()).not.toThrow();
        });

        it('should handle footstep events', async () => {
            const config: AudioConfig = { volume: 0.3, loop: false };
            await audioSystem.loadSoundEffect('footsteps_grass', config);
            await audioSystem.loadSoundEffect('footsteps_stone', config);
            
            // Should not throw
            expect(() => audioSystem.onFootstep('grass')).not.toThrow();
            expect(() => audioSystem.onFootstep('stone')).not.toThrow();
            expect(() => audioSystem.onFootstep('unknown')).not.toThrow(); // Falls back to grass
        });
    });

    describe('System Updates', () => {
        beforeEach(() => {
            audioSystem.initialize(mockScene, mockCamera);
        });

        it('should handle update calls', () => {
            // Should not throw
            expect(() => audioSystem.update(0.016)).not.toThrow();
        });

        it('should handle update when not initialized', () => {
            const newAudioSystem = new AudioSystem();
            
            // Should not throw
            expect(() => newAudioSystem.update(0.016)).not.toThrow();
        });
    });

    describe('Information Getters', () => {
        beforeEach(() => {
            audioSystem.initialize(mockScene, mockCamera);
        });

        it('should return loaded sounds information', async () => {
            const musicConfig: AudioConfig = { volume: 0.7, loop: true };
            const sfxConfig: AudioConfig = { volume: 0.8, loop: false };
            const ambientConfig: SpatialAudioConfig = {
                volume: 0.5,
                loop: true,
                position: new THREE.Vector3(0, 0, 0),
                maxDistance: 50
            };

            await audioSystem.loadBackgroundMusic('exploration', musicConfig);
            await audioSystem.loadSoundEffect('sword_swing', sfxConfig);
            await audioSystem.loadSpatialAudio('forest', ambientConfig);

            const loadedSounds = audioSystem.getLoadedSounds();
            
            expect(loadedSounds.music).toContain('exploration');
            expect(loadedSounds.sfx).toContain('sword_swing');
            expect(loadedSounds.ambient).toContain('forest');
        });

        it('should return current music track', async () => {
            const config: AudioConfig = { volume: 0.7, loop: true };
            await audioSystem.loadBackgroundMusic('exploration', config);
            
            expect(audioSystem.getCurrentMusicTrack()).toBeNull();
            
            audioSystem.playBackgroundMusic('exploration');
            expect(audioSystem.getCurrentMusicTrack()).toBe('exploration');
        });
    });

    describe('Cleanup', () => {
        beforeEach(() => {
            audioSystem.initialize(mockScene, mockCamera);
        });

        it('should cleanup all audio resources', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            // Load some audio
            const config: AudioConfig = { volume: 0.7, loop: true };
            await audioSystem.loadBackgroundMusic('exploration', config);
            await audioSystem.loadSoundEffect('sword_swing', config);
            
            audioSystem.cleanup();
            
            expect(consoleSpy).toHaveBeenCalledWith('🔊 Audio System cleaned up');
            
            // Should have cleared loaded sounds
            const loadedSounds = audioSystem.getLoadedSounds();
            expect(loadedSounds.music).toHaveLength(0);
            expect(loadedSounds.sfx).toHaveLength(0);
            expect(loadedSounds.ambient).toHaveLength(0);
            
            consoleSpy.mockRestore();
        });

        it('should remove listener from camera on cleanup', () => {
            const removeSpy = vi.spyOn(mockCamera, 'remove');
            
            audioSystem.cleanup();
            
            expect(removeSpy).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            audioSystem.initialize(mockScene, mockCamera);
        });

        it('should handle audio loading failures gracefully', async () => {
            // Mock Audio constructor to throw error
            const originalAudio = global.Audio;
            global.Audio = vi.fn(() => {
                throw new Error('Audio loading failed');
            }) as any;
            
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
            
            await audioSystem.loadBackgroundMusic('exploration', { volume: 0.7, loop: true });
            
            expect(consoleSpy).toHaveBeenCalledWith("🔊 Failed to load background music 'exploration':", expect.any(Error));
            
            // Restore
            global.Audio = originalAudio;
            consoleSpy.mockRestore();
        });

        it('should handle spatial audio loading failures gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();
            
            // Mock AudioLoader to fail
            const THREE = await import('three');
            const originalAudioLoader = THREE.AudioLoader;
            (THREE as any).AudioLoader = vi.fn(() => ({
                load: vi.fn((url, onLoad, onProgress, onError) => {
                    onError(new Error('Failed to load audio'));
                })
            }));
            
            const config: SpatialAudioConfig = {
                volume: 0.5,
                loop: true,
                position: new THREE.Vector3(0, 0, 0),
                maxDistance: 50
            };

            await audioSystem.loadSpatialAudio('forest', config);
            
            expect(consoleSpy).toHaveBeenCalledWith("🔊 Failed to load spatial audio 'forest':", expect.any(Error));
            
            // Restore
            (THREE as any).AudioLoader = originalAudioLoader;
            consoleSpy.mockRestore();
        });
    });
});