import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { TextureGenerator } from '../../utils/TextureGenerator';

describe('TextureGenerator', () => {
    describe('Texture Generation', () => {
        it('should generate grass texture', () => {
            const texture = TextureGenerator.generateGrassTexture(64);
            
            expect(texture).toBeInstanceOf(THREE.Texture);
            expect(texture.wrapS).toBe(THREE.RepeatWrapping);
            expect(texture.wrapT).toBe(THREE.RepeatWrapping);
        });
        
        it('should generate bark texture', () => {
            const texture = TextureGenerator.generateBarkTexture(64);
            
            expect(texture).toBeInstanceOf(THREE.Texture);
            expect(texture.wrapS).toBe(THREE.RepeatWrapping);
            expect(texture.wrapT).toBe(THREE.RepeatWrapping);
        });
        
        it('should generate stone texture', () => {
            const texture = TextureGenerator.generateStoneTexture(64);
            
            expect(texture).toBeInstanceOf(THREE.Texture);
            expect(texture.wrapS).toBe(THREE.RepeatWrapping);
            expect(texture.wrapT).toBe(THREE.RepeatWrapping);
        });
        
        it('should generate metal texture', () => {
            const texture = TextureGenerator.generateMetalTexture(64, 0xff0000);
            
            expect(texture).toBeInstanceOf(THREE.Texture);
            expect(texture.wrapS).toBe(THREE.RepeatWrapping);
            expect(texture.wrapT).toBe(THREE.RepeatWrapping);
        });
        
        it('should generate wood texture', () => {
            const texture = TextureGenerator.generateWoodTexture(64);
            
            expect(texture).toBeInstanceOf(THREE.Texture);
            expect(texture.wrapS).toBe(THREE.RepeatWrapping);
            expect(texture.wrapT).toBe(THREE.RepeatWrapping);
        });
        
        it('should generate normal map', () => {
            const baseTexture = TextureGenerator.generateGrassTexture(32);
            const normalMap = TextureGenerator.generateNormalMap(baseTexture, 0.5);
            
            expect(normalMap).toBeInstanceOf(THREE.Texture);
            expect(normalMap.wrapS).toBe(THREE.RepeatWrapping);
            expect(normalMap.wrapT).toBe(THREE.RepeatWrapping);
        });
    });
    
    describe('Test Environment Handling', () => {
        it('should handle missing canvas context gracefully', () => {
            // All methods should return valid textures even in test environment
            expect(() => TextureGenerator.generateGrassTexture(32)).not.toThrow();
            expect(() => TextureGenerator.generateBarkTexture(32)).not.toThrow();
            expect(() => TextureGenerator.generateStoneTexture(32)).not.toThrow();
            expect(() => TextureGenerator.generateMetalTexture(32, 0x888888)).not.toThrow();
            expect(() => TextureGenerator.generateWoodTexture(32)).not.toThrow();
        });
        
        it('should return data textures in fallback mode', () => {
            const texture = TextureGenerator.generateGrassTexture(32);
            
            // Should be either CanvasTexture or DataTexture
            expect(texture).toBeInstanceOf(THREE.Texture);
            expect(texture.needsUpdate).toBe(true);
        });
    });
    
    describe('Texture Properties', () => {
        it('should have correct repeat settings for grass texture', () => {
            const texture = TextureGenerator.generateGrassTexture(64);
            
            expect(texture.repeat.x).toBe(20);
            expect(texture.repeat.y).toBe(20);
        });
        
        it('should accept different sizes', () => {
            const small = TextureGenerator.generateStoneTexture(32);
            const large = TextureGenerator.generateStoneTexture(512);
            
            expect(small).toBeInstanceOf(THREE.Texture);
            expect(large).toBeInstanceOf(THREE.Texture);
        });
        
        it('should handle different metal colors', () => {
            const redMetal = TextureGenerator.generateMetalTexture(64, 0xff0000);
            const blueMetal = TextureGenerator.generateMetalTexture(64, 0x0000ff);
            
            expect(redMetal).toBeInstanceOf(THREE.Texture);
            expect(blueMetal).toBeInstanceOf(THREE.Texture);
        });
    });
});