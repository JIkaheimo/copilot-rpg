import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { LightingSystem, DynamicLight } from '@systems/LightingSystem';

// Mock Three.js
vi.mock('three', async () => {
    const actual = await vi.importActual('three');
    return {
        ...actual,
        Scene: vi.fn(() => ({
            add: vi.fn(),
            remove: vi.fn()
        })),
        AmbientLight: vi.fn(() => ({
            intensity: 0.1,
            color: { setHex: vi.fn() },
            dispose: vi.fn()
        })),
        DirectionalLight: vi.fn(() => ({
            intensity: 1,
            color: { setHex: vi.fn() },
            position: { set: vi.fn() },
            target: { position: { set: vi.fn() } },
            castShadow: true,
            shadow: {
                mapSize: { width: 2048, height: 2048 },
                camera: { near: 0.1, far: 200, left: -50, right: 50, top: 50, bottom: -50 },
                map: { dispose: vi.fn() }
            },
            dispose: vi.fn()
        })),
        PointLight: vi.fn(() => ({
            intensity: 1,
            color: { setHex: vi.fn(), getHex: vi.fn(() => 0xffffff) },
            position: { copy: vi.fn() },
            distance: 50,
            castShadow: false,
            shadow: {
                mapSize: { width: 1024, height: 1024 },
                camera: { near: 0.1, far: 50 },
                map: { dispose: vi.fn() }
            },
            dispose: vi.fn()
        })),
        SpotLight: vi.fn(() => ({
            intensity: 1,
            color: { setHex: vi.fn(), getHex: vi.fn(() => 0xffffff) },
            position: { copy: vi.fn() },
            distance: 50,
            castShadow: false,
            shadow: {
                mapSize: { width: 1024, height: 1024 },
                camera: { near: 0.1, far: 50 },
                map: { dispose: vi.fn() }
            },
            dispose: vi.fn()
        })),
        Vector3: vi.fn((x = 0, y = 0, z = 0) => ({
            x, y, z,
            copy: vi.fn(),
            clone: vi.fn(() => ({ x, y, z }))
        }))
    };
});

describe('LightingSystem', () => {
    let lightingSystem: LightingSystem;
    let mockScene: THREE.Scene;

    beforeEach(() => {
        lightingSystem = new LightingSystem();
        mockScene = new THREE.Scene();
    });

    describe('Initialization', () => {
        it('should initialize successfully', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            lightingSystem.initialize(mockScene);
            
            expect(consoleSpy).toHaveBeenCalledWith('💡 Lighting System initialized');
            consoleSpy.mockRestore();
        });

        it('should create preset lights during initialization', () => {
            lightingSystem.initialize(mockScene);
            
            // Test that presets are available
            const position = new THREE.Vector3(0, 1, 0);
            const torchId = lightingSystem.addTorchAt(position);
            const orbId = lightingSystem.addMagicOrbAt(position);
            const campfireId = lightingSystem.addCampfireAt(position);
            const crystalId = lightingSystem.addCrystalAt(position);
            
            expect(torchId).toBeTruthy();
            expect(orbId).toBeTruthy();
            expect(campfireId).toBeTruthy();
            expect(crystalId).toBeTruthy();
        });
    });

    describe('Light Management', () => {
        beforeEach(() => {
            lightingSystem.initialize(mockScene);
        });

        it('should add custom lights', () => {
            const config = {
                color: 0xff0000,
                intensity: 2,
                position: new THREE.Vector3(5, 2, 5),
                range: 10,
                castShadow: true
            };

            lightingSystem.addLight('test_light', config);
            
            expect(lightingSystem.getActiveLightCount()).toBe(1);
        });

        it('should remove lights', () => {
            const config = {
                color: 0xff0000,
                intensity: 2,
                position: new THREE.Vector3(5, 2, 5),
                range: 10
            };

            lightingSystem.addLight('test_light', config);
            expect(lightingSystem.getActiveLightCount()).toBe(1);
            
            lightingSystem.removeLight('test_light');
            expect(lightingSystem.getActiveLightCount()).toBe(0);
        });

        it('should handle non-existent light removal gracefully', () => {
            expect(() => lightingSystem.removeLight('nonexistent')).not.toThrow();
        });

        it('should add lights from presets', () => {
            const position = new THREE.Vector3(10, 2, 10);
            
            lightingSystem.addLightFromPreset('my_torch', 'torch', position);
            
            expect(lightingSystem.getActiveLightCount()).toBe(1);
        });

        it('should handle unknown preset gracefully', () => {
            const position = new THREE.Vector3(10, 2, 10);
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            lightingSystem.addLightFromPreset('test', 'unknown_preset', position);
            
            expect(consoleSpy).toHaveBeenCalledWith("Light preset 'unknown_preset' not found");
            expect(lightingSystem.getActiveLightCount()).toBe(0);
            consoleSpy.mockRestore();
        });
    });

    describe('Environmental Lighting', () => {
        beforeEach(() => {
            lightingSystem.initialize(mockScene);
        });

        it('should update time of day', () => {
            expect(() => lightingSystem.updateTimeOfDay(0.5)).not.toThrow();
        });

        it('should clamp time of day values', () => {
            expect(() => lightingSystem.updateTimeOfDay(-0.5)).not.toThrow();
            expect(() => lightingSystem.updateTimeOfDay(1.5)).not.toThrow();
        });

        it('should update weather influence', () => {
            expect(() => lightingSystem.updateWeatherInfluence(0.5)).not.toThrow();
        });

        it('should clamp weather influence values', () => {
            expect(() => lightingSystem.updateWeatherInfluence(-0.5)).not.toThrow();
            expect(() => lightingSystem.updateWeatherInfluence(1.5)).not.toThrow();
        });
    });

    describe('Light Property Updates', () => {
        beforeEach(() => {
            lightingSystem.initialize(mockScene);
        });

        it('should update light position', () => {
            const position1 = new THREE.Vector3(0, 1, 0);
            const position2 = new THREE.Vector3(5, 2, 5);
            
            lightingSystem.addTorchAt(position1);
            const lightId = lightingSystem.addTorchAt(position1);
            
            expect(() => lightingSystem.setLightPosition(lightId, position2)).not.toThrow();
        });

        it('should update light intensity', () => {
            const position = new THREE.Vector3(0, 1, 0);
            const lightId = lightingSystem.addTorchAt(position);
            
            expect(() => lightingSystem.setLightIntensity(lightId, 3.0)).not.toThrow();
        });

        it('should update light color', () => {
            const position = new THREE.Vector3(0, 1, 0);
            const lightId = lightingSystem.addTorchAt(position);
            
            expect(() => lightingSystem.setLightColor(lightId, 0x00ff00)).not.toThrow();
        });

        it('should handle updates to non-existent lights gracefully', () => {
            const position = new THREE.Vector3(5, 2, 5);
            
            expect(() => lightingSystem.setLightPosition('nonexistent', position)).not.toThrow();
            expect(() => lightingSystem.setLightIntensity('nonexistent', 2.0)).not.toThrow();
            expect(() => lightingSystem.setLightColor('nonexistent', 0xff0000)).not.toThrow();
        });
    });

    describe('Preset Light Methods', () => {
        beforeEach(() => {
            lightingSystem.initialize(mockScene);
        });

        it('should add torch lights', () => {
            const position = new THREE.Vector3(10, 2, 10);
            const lightId = lightingSystem.addTorchAt(position);
            
            expect(lightId).toBeTruthy();
            expect(lightId).toContain('torch_');
            expect(lightingSystem.getActiveLightCount()).toBe(1);
        });

        it('should add campfire lights', () => {
            const position = new THREE.Vector3(0, 0.5, 0);
            const lightId = lightingSystem.addCampfireAt(position);
            
            expect(lightId).toBeTruthy();
            expect(lightId).toContain('campfire_');
            expect(lightingSystem.getActiveLightCount()).toBe(1);
        });

        it('should add magic orb lights', () => {
            const position = new THREE.Vector3(5, 3, 5);
            const lightId = lightingSystem.addMagicOrbAt(position);
            
            expect(lightId).toBeTruthy();
            expect(lightId).toContain('magic_orb_');
            expect(lightingSystem.getActiveLightCount()).toBe(1);
        });

        it('should add crystal lights', () => {
            const position = new THREE.Vector3(15, 1, 15);
            const lightId = lightingSystem.addCrystalAt(position);
            
            expect(lightId).toBeTruthy();
            expect(lightId).toContain('crystal_');
            expect(lightingSystem.getActiveLightCount()).toBe(1);
        });
    });

    describe('System Updates', () => {
        beforeEach(() => {
            lightingSystem.initialize(mockScene);
        });

        it('should update all lights', () => {
            const position = new THREE.Vector3(0, 1, 0);
            lightingSystem.addTorchAt(position);
            lightingSystem.addMagicOrbAt(position);
            
            expect(() => lightingSystem.update(0.016)).not.toThrow();
        });

        it('should handle empty light list gracefully', () => {
            expect(() => lightingSystem.update(0.016)).not.toThrow();
        });
    });

    describe('Cleanup', () => {
        beforeEach(() => {
            lightingSystem.initialize(mockScene);
        });

        it('should cleanup all resources', () => {
            const position = new THREE.Vector3(0, 1, 0);
            lightingSystem.addTorchAt(position);
            lightingSystem.addMagicOrbAt(position);
            
            expect(lightingSystem.getActiveLightCount()).toBe(2);
            
            lightingSystem.cleanup();
            
            expect(lightingSystem.getActiveLightCount()).toBe(0);
        });

        it('should handle cleanup when no lights exist', () => {
            expect(() => lightingSystem.cleanup()).not.toThrow();
        });
    });

    describe('Light Counting', () => {
        beforeEach(() => {
            lightingSystem.initialize(mockScene);
        });

        it('should count active lights correctly', () => {
            expect(lightingSystem.getActiveLightCount()).toBe(0);
            
            const position = new THREE.Vector3(0, 1, 0);
            lightingSystem.addTorchAt(position);
            expect(lightingSystem.getActiveLightCount()).toBe(1);
            
            lightingSystem.addMagicOrbAt(position);
            expect(lightingSystem.getActiveLightCount()).toBe(2);
            
            lightingSystem.addCampfireAt(position);
            expect(lightingSystem.getActiveLightCount()).toBe(3);
        });

        it('should not count presets in active lights', () => {
            // The system creates presets but they shouldn't count as active
            expect(lightingSystem.getActiveLightCount()).toBe(0);
        });
    });
});

describe('DynamicLight', () => {
    let dynamicLight: DynamicLight;
    let mockConfig: any;

    beforeEach(() => {
        mockConfig = {
            color: 0xff6600,
            intensity: 2,
            position: new THREE.Vector3(0, 3, 0),
            range: 15,
            castShadow: true,
            flickerSpeed: 8,
            flickerIntensity: 0.3
        };
        
        dynamicLight = new DynamicLight(mockConfig);
    });

    describe('Creation', () => {
        it('should create point light by default', () => {
            const light = dynamicLight.getLight();
            expect(light).toBeDefined();
        });

        it('should create spot light when specified', () => {
            const spotLight = new DynamicLight(mockConfig, 'spot');
            const light = spotLight.getLight();
            expect(light).toBeDefined();
        });
    });

    describe('Updates', () => {
        it('should update light effects', () => {
            expect(() => dynamicLight.update(0.016)).not.toThrow();
        });

        it('should handle flickering effects', () => {
            const flickerConfig = {
                ...mockConfig,
                flickerSpeed: 10,
                flickerIntensity: 0.5
            };
            const flickerLight = new DynamicLight(flickerConfig);
            
            expect(() => flickerLight.update(0.016)).not.toThrow();
        });

        it('should handle pulsing effects', () => {
            const pulseConfig = {
                ...mockConfig,
                pulseSpeed: 2,
                pulseIntensity: 0.4
            };
            const pulseLight = new DynamicLight(pulseConfig);
            
            expect(() => pulseLight.update(0.016)).not.toThrow();
        });
    });

    describe('Property Updates', () => {
        it('should update position', () => {
            const newPosition = new THREE.Vector3(5, 2, 5);
            expect(() => dynamicLight.setPosition(newPosition)).not.toThrow();
        });

        it('should update intensity', () => {
            expect(() => dynamicLight.setIntensity(3.0)).not.toThrow();
        });

        it('should update color', () => {
            expect(() => dynamicLight.setColor(0x00ff00)).not.toThrow();
        });
    });

    describe('Resource Management', () => {
        it('should dispose resources', () => {
            expect(() => dynamicLight.dispose()).not.toThrow();
        });
    });
});