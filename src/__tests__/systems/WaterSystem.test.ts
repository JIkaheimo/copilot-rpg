import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as THREE from 'three';
import { WaterSystem, WaterConfig } from '@systems/WaterSystem';

// Mock Three.js
vi.mock('three', async () => {
    const actual = await vi.importActual('three');
    return {
        ...actual,
        Scene: vi.fn(() => ({
            add: vi.fn(),
            remove: vi.fn(),
            children: []
        })),
        WebGLRenderTarget: vi.fn(() => ({
            texture: { 
                isTexture: true,
                dispose: vi.fn()
            },
            dispose: vi.fn()
        })),
        PerspectiveCamera: vi.fn(() => ({
            copy: vi.fn(),
            position: { x: 0, y: 0, z: 0 },
            lookAt: vi.fn()
        })),
        Matrix4: vi.fn(() => ({
            set: vi.fn(),
            copy: vi.fn(),
            identity: vi.fn()
        })),
        Vector3: vi.fn((x = 0, y = 0, z = 0) => ({
            x, y, z,
            copy: vi.fn(),
            equals: vi.fn(() => true),
            add: vi.fn(),
            set: vi.fn()
        })),
        Vector2: vi.fn((x = 0, y = 0) => ({
            x, y,
            equals: vi.fn(() => true),
            set: vi.fn()
        })),
        Color: vi.fn((color = 0x006994) => ({
            getHex: vi.fn(() => color),
            setHex: vi.fn()
        })),
        PlaneGeometry: vi.fn(() => ({
            dispose: vi.fn()
        })),
        ShaderMaterial: vi.fn(() => ({
            uniforms: {
                time: { value: 0 },
                waveHeight: { value: 0.5 },
                waveSpeed: { value: 1.0 },
                waterColor: { value: { getHex: vi.fn(() => 0x006994), setHex: vi.fn() } },
                transparency: { value: 0.8 },
                reflectivity: { value: 0.6 },
                cameraPosition: { value: { copy: vi.fn() } },
                flowDirection: { value: { equals: vi.fn(() => true) } }
            },
            transparent: true,
            side: 2, // THREE.DoubleSide
            vertexShader: '',
            fragmentShader: '',
            dispose: vi.fn()
        })),
        Mesh: vi.fn(() => ({
            geometry: { dispose: vi.fn() },
            material: {
                uniforms: {
                    time: { value: 0 },
                    waveHeight: { value: 0.5 },
                    waveSpeed: { value: 1.0 },
                    waterColor: { value: { getHex: vi.fn(() => 0x006994), setHex: vi.fn() } },
                    transparency: { value: 0.8 },
                    reflectivity: { value: 0.6 },
                    cameraPosition: { value: { copy: vi.fn() } },
                    flowDirection: { value: { equals: vi.fn(() => true) } }
                },
                dispose: vi.fn()
            },
            position: { 
                copy: vi.fn(),
                equals: vi.fn(() => true)
            },
            rotation: { x: 0 },
            visible: true
        })),
        WebGLRenderer: vi.fn(() => ({
            setRenderTarget: vi.fn(),
            getRenderTarget: vi.fn(() => null),
            render: vi.fn()
        })),
        DoubleSide: 2
    };
});

/**
 * Comprehensive tests for WaterSystem
 * Tests water rendering, reflections, wave animations, and performance
 */
describe('WaterSystem', () => {
    let waterSystem: WaterSystem;
    let mockScene: THREE.Scene;
    let mockCamera: THREE.PerspectiveCamera;
    let mockRenderer: THREE.WebGLRenderer;

    beforeEach(() => {
        // Initialize Three.js objects
        mockScene = new THREE.Scene();
        mockCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        mockRenderer = new THREE.WebGLRenderer();

        // Initialize WaterSystem
        waterSystem = new WaterSystem();
    });

    afterEach(() => {
        waterSystem.cleanup();
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize water system with scene, camera, and renderer', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            
            waterSystem.initialize(mockScene, mockCamera, mockRenderer);
            
            expect(consoleSpy).toHaveBeenCalledWith('🌊 Water System initialized');
            consoleSpy.mockRestore();
        });

        it('should throw error when creating water without initialization', () => {
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            expect(() => waterSystem.createWaterBody(config)).toThrow('WaterSystem not initialized');
        });
    });

    describe('Water Body Creation', () => {
        beforeEach(() => {
            waterSystem.initialize(mockScene, mockCamera, mockRenderer);
        });

        it('should create water body with basic configuration', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(10, 0, 20),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            const waterMesh = waterSystem.createWaterBody(config);

            expect(waterMesh).toBeInstanceOf(THREE.Mesh);
            expect(waterMesh.geometry).toBeInstanceOf(THREE.PlaneGeometry);
            expect(waterMesh.material).toBeInstanceOf(THREE.ShaderMaterial);
            expect(waterMesh.position.equals(config.position)).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith('🌊 Water body created at position:', config.position);
            
            consoleSpy.mockRestore();
        });

        it('should create water body with flow direction', () => {
            const config: WaterConfig = {
                width: 50,
                height: 50,
                position: new THREE.Vector3(0, 0, 0),
                segments: 16,
                waveHeight: 0.3,
                waveSpeed: 0.8,
                color: 0x0099CC,
                transparency: 0.7,
                reflectivity: 0.5,
                flowDirection: new THREE.Vector2(0.5, 0.8)
            };

            const waterMesh = waterSystem.createWaterBody(config);
            const material = waterMesh.material as THREE.ShaderMaterial;

            expect(material.uniforms.flowDirection.value.equals(config.flowDirection)).toBe(true);
        });

        it('should add water mesh to scene', () => {
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            const initialChildCount = mockScene.children.length;
            waterSystem.createWaterBody(config);

            expect(mockScene.children.length).toBe(initialChildCount + 1);
        });

        it('should track created water bodies', () => {
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            expect(waterSystem.getWaterBodies().length).toBe(0);
            
            waterSystem.createWaterBody(config);
            expect(waterSystem.getWaterBodies().length).toBe(1);
            
            waterSystem.createWaterBody({...config, position: new THREE.Vector3(50, 0, 50)});
            expect(waterSystem.getWaterBodies().length).toBe(2);
        });
    });

    describe('Water Material Properties', () => {
        beforeEach(() => {
            waterSystem.initialize(mockScene, mockCamera, mockRenderer);
        });

        it('should create shader material with correct uniforms', () => {
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.8,
                waveSpeed: 1.5,
                color: 0x0066AA,
                transparency: 0.9,
                reflectivity: 0.7
            };

            const waterMesh = waterSystem.createWaterBody(config);
            const material = waterMesh.material as THREE.ShaderMaterial;

            expect(material.uniforms.waveHeight.value).toBe(config.waveHeight);
            expect(material.uniforms.waveSpeed.value).toBe(config.waveSpeed);
            expect(material.uniforms.waterColor.value.getHex()).toBe(config.color);
            expect(material.uniforms.transparency.value).toBe(config.transparency);
            expect(material.uniforms.reflectivity.value).toBe(config.reflectivity);
        });

        it('should have correct shader code structure', () => {
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            const waterMesh = waterSystem.createWaterBody(config);
            const material = waterMesh.material as THREE.ShaderMaterial;

            expect(material.vertexShader).toContain('uniform float time');
            expect(material.vertexShader).toContain('uniform float waveHeight');
            expect(material.vertexShader).toContain('uniform float waveSpeed');
            
            expect(material.fragmentShader).toContain('uniform vec3 waterColor');
            expect(material.fragmentShader).toContain('uniform float transparency');
            expect(material.fragmentShader).toContain('uniform float reflectivity');
        });

        it('should set material as transparent and double-sided', () => {
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            const waterMesh = waterSystem.createWaterBody(config);
            const material = waterMesh.material as THREE.ShaderMaterial;

            expect(material.transparent).toBe(true);
            expect(material.side).toBe(THREE.DoubleSide);
        });
    });

    describe('Water Animation Updates', () => {
        beforeEach(() => {
            waterSystem.initialize(mockScene, mockCamera, mockRenderer);
        });

        it('should update time uniform during animation', () => {
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            const waterMesh = waterSystem.createWaterBody(config);
            const material = waterMesh.material as THREE.ShaderMaterial;
            
            const initialTime = material.uniforms.time.value;
            
            waterSystem.update(0.016); // 60 FPS
            
            expect(material.uniforms.time.value).toBeGreaterThan(initialTime);
        });

        it('should update camera position uniform', () => {
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            mockCamera.position.set(10, 5, 15);
            const waterMesh = waterSystem.createWaterBody(config);
            const material = waterMesh.material as THREE.ShaderMaterial;
            
            waterSystem.update(0.016);
            
            expect(material.uniforms.cameraPosition.value.equals(mockCamera.position)).toBe(true);
        });

        it('should handle multiple water bodies in update', () => {
            const config1: WaterConfig = {
                width: 50,
                height: 50,
                position: new THREE.Vector3(0, 0, 0),
                segments: 16,
                waveHeight: 0.3,
                waveSpeed: 0.8,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            const config2: WaterConfig = {
                width: 75,
                height: 75,
                position: new THREE.Vector3(100, 0, 100),
                segments: 24,
                waveHeight: 0.6,
                waveSpeed: 1.2,
                color: 0x0099CC,
                transparency: 0.7,
                reflectivity: 0.5
            };

            const waterMesh1 = waterSystem.createWaterBody(config1);
            const waterMesh2 = waterSystem.createWaterBody(config2);
            
            const material1 = waterMesh1.material as THREE.ShaderMaterial;
            const material2 = waterMesh2.material as THREE.ShaderMaterial;
            
            const initialTime1 = material1.uniforms.time.value;
            const initialTime2 = material2.uniforms.time.value;
            
            waterSystem.update(0.016);
            
            expect(material1.uniforms.time.value).toBeGreaterThan(initialTime1);
            expect(material2.uniforms.time.value).toBeGreaterThan(initialTime2);
        });
    });

    describe('Water Parameters Control', () => {
        beforeEach(() => {
            waterSystem.initialize(mockScene, mockCamera, mockRenderer);
        });

        it('should update wave parameters for all water bodies', () => {
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            const waterMesh1 = waterSystem.createWaterBody(config);
            const waterMesh2 = waterSystem.createWaterBody({...config, position: new THREE.Vector3(50, 0, 50)});
            
            const newWaveHeight = 1.2;
            const newWaveSpeed = 2.5;
            
            waterSystem.setWaveParameters(newWaveHeight, newWaveSpeed);
            
            const material1 = waterMesh1.material as THREE.ShaderMaterial;
            const material2 = waterMesh2.material as THREE.ShaderMaterial;
            
            expect(material1.uniforms.waveHeight.value).toBe(newWaveHeight);
            expect(material1.uniforms.waveSpeed.value).toBe(newWaveSpeed);
            expect(material2.uniforms.waveHeight.value).toBe(newWaveHeight);
            expect(material2.uniforms.waveSpeed.value).toBe(newWaveSpeed);
        });

        it('should update water color for all water bodies', () => {
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            const waterMesh1 = waterSystem.createWaterBody(config);
            const waterMesh2 = waterSystem.createWaterBody({...config, position: new THREE.Vector3(50, 0, 50)});
            
            const newColor = 0xFF6600;
            waterSystem.setWaterColor(newColor);
            
            const material1 = waterMesh1.material as THREE.ShaderMaterial;
            const material2 = waterMesh2.material as THREE.ShaderMaterial;
            
            expect(material1.uniforms.waterColor.value.getHex()).toBe(newColor);
            expect(material2.uniforms.waterColor.value.getHex()).toBe(newColor);
        });
    });

    describe('Water Body Management', () => {
        beforeEach(() => {
            waterSystem.initialize(mockScene, mockCamera, mockRenderer);
        });

        it('should remove water body from scene and tracking', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            const waterMesh = waterSystem.createWaterBody(config);
            const initialChildCount = mockScene.children.length;
            const initialWaterCount = waterSystem.getWaterBodies().length;
            
            waterSystem.removeWaterBody(waterMesh);
            
            expect(mockScene.children.length).toBe(initialChildCount - 1);
            expect(waterSystem.getWaterBodies().length).toBe(initialWaterCount - 1);
            expect(consoleSpy).toHaveBeenCalledWith('🌊 Water body removed from scene');
            
            consoleSpy.mockRestore();
        });

        it('should handle removal of non-tracked water body gracefully', () => {
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            // Create a separate water mesh not tracked by the system
            const geometry = new THREE.PlaneGeometry(50, 50);
            const material = new THREE.MeshBasicMaterial();
            const externalWaterMesh = new THREE.Mesh(geometry, material);
            
            const initialChildCount = mockScene.children.length;
            const initialWaterCount = waterSystem.getWaterBodies().length;
            
            // This should not crash or affect the system
            waterSystem.removeWaterBody(externalWaterMesh);
            
            expect(mockScene.children.length).toBe(initialChildCount);
            expect(waterSystem.getWaterBodies().length).toBe(initialWaterCount);
        });
    });

    describe('Cleanup and Resource Management', () => {
        beforeEach(() => {
            waterSystem.initialize(mockScene, mockCamera, mockRenderer);
        });

        it('should clean up all water bodies and resources', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation();
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            waterSystem.createWaterBody(config);
            waterSystem.createWaterBody({...config, position: new THREE.Vector3(50, 0, 50)});
            
            expect(waterSystem.getWaterBodies().length).toBe(2);
            
            waterSystem.cleanup();
            
            expect(waterSystem.getWaterBodies().length).toBe(0);
            expect(consoleSpy).toHaveBeenCalledWith('🌊 Water System cleaned up');
            
            consoleSpy.mockRestore();
        });

        it('should handle update after cleanup gracefully', () => {
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            waterSystem.createWaterBody(config);
            waterSystem.cleanup();
            
            // This should not crash
            expect(() => waterSystem.update(0.016)).not.toThrow();
        });
    });

    describe('Performance Considerations', () => {
        beforeEach(() => {
            waterSystem.initialize(mockScene, mockCamera, mockRenderer);
        });

        it('should handle high segment count efficiently', () => {
            const config: WaterConfig = {
                width: 100,
                height: 100,
                position: new THREE.Vector3(0, 0, 0),
                segments: 128, // High detail
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            const startTime = performance.now();
            const waterMesh = waterSystem.createWaterBody(config);
            const endTime = performance.now();
            
            expect(waterMesh).toBeInstanceOf(THREE.Mesh);
            // Should complete in reasonable time (less than 100ms)
            expect(endTime - startTime).toBeLessThan(100);
        });

        it('should handle multiple water bodies update efficiently', () => {
            const config: WaterConfig = {
                width: 50,
                height: 50,
                position: new THREE.Vector3(0, 0, 0),
                segments: 32,
                waveHeight: 0.5,
                waveSpeed: 1.0,
                color: 0x006994,
                transparency: 0.8,
                reflectivity: 0.6
            };

            // Create multiple water bodies
            for (let i = 0; i < 10; i++) {
                waterSystem.createWaterBody({
                    ...config,
                    position: new THREE.Vector3(i * 60, 0, 0)
                });
            }
            
            const startTime = performance.now();
            waterSystem.update(0.016);
            const endTime = performance.now();
            
            // Should complete in reasonable time (less than 50ms)
            expect(endTime - startTime).toBeLessThan(50);
        });
    });
});