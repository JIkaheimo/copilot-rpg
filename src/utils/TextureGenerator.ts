import * as THREE from 'three';

export class TextureGenerator {
    private static canvas: HTMLCanvasElement;
    private static ctx: CanvasRenderingContext2D;
    
    static {
        // Initialize canvas for procedural texture generation
        if (typeof document !== 'undefined') {
            try {
                this.canvas = document.createElement('canvas');
                const ctx = this.canvas.getContext('2d');
                if (ctx) {
                    this.ctx = ctx;
                }
            } catch (e) {
                // Canvas not available
            }
        }
    }
    
    /**
     * Generate a grass texture with subtle variations
     */
    static generateGrassTexture(size: number = 512): THREE.Texture {
        // Fallback for test environment
        if (!this.canvas || !this.ctx) {
            return this.createFallbackTexture(0x228B22);
        }
        
        this.canvas.width = size;
        this.canvas.height = size;
        
        const ctx = this.ctx;
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Base grass colors with variation
                const noise = (Math.random() - 0.5) * 0.3;
                const grassGreen = 0x228B22;
                
                // Extract RGB components
                const r = ((grassGreen >> 16) & 0xFF) / 255;
                const g = ((grassGreen >> 8) & 0xFF) / 255;
                const b = (grassGreen & 0xFF) / 255;
                
                // Add subtle noise and variation
                data[i] = Math.max(0, Math.min(255, (r + noise * 0.1) * 255));
                data[i + 1] = Math.max(0, Math.min(255, (g + noise * 0.2) * 255));
                data[i + 2] = Math.max(0, Math.min(255, (b + noise * 0.1) * 255));
                data[i + 3] = 255; // Alpha
                
                // Add some darker patches for depth
                if (Math.random() < 0.1) {
                    data[i] *= 0.7;
                    data[i + 1] *= 0.8;
                    data[i + 2] *= 0.7;
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(20, 20); // Tile the texture
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Generate a bark texture for trees
     */
    static generateBarkTexture(size: number = 256): THREE.Texture {
        // Fallback for test environment
        if (!this.canvas || !this.ctx) {
            return this.createFallbackTexture(0x8B4513);
        }
        
        this.canvas.width = size;
        this.canvas.height = size;
        
        const ctx = this.ctx;
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, size, size);
        
        // Add vertical bark lines
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const x = (i / 8) * size + Math.random() * 20;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + Math.random() * 10 - 5, size);
            ctx.stroke();
        }
        
        // Add horizontal cracks
        ctx.strokeStyle = '#4A3728';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = Math.random() * size;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(size, y + Math.random() * 10 - 5);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Generate a stone/rock texture
     */
    static generateStoneTexture(size: number = 256): THREE.Texture {
        // Fallback for test environment
        if (!this.canvas || !this.ctx) {
            return this.createFallbackTexture(0x696969);
        }
        
        this.canvas.width = size;
        this.canvas.height = size;
        
        const ctx = this.ctx;
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Base stone color with noise
                const noise = Math.random() * 0.4;
                const baseColor = 0.4 + noise * 0.3;
                
                data[i] = baseColor * 255;     // R
                data[i + 1] = baseColor * 255; // G  
                data[i + 2] = baseColor * 255; // B
                data[i + 3] = 255;             // A
                
                // Add some darker cracks
                if (Math.random() < 0.05) {
                    data[i] *= 0.3;
                    data[i + 1] *= 0.3;
                    data[i + 2] *= 0.3;
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Generate a metal texture for weapons
     */
    static generateMetalTexture(size: number = 256, baseColor: number = 0x888888): THREE.Texture {
        // Fallback for test environment
        if (!this.canvas || !this.ctx) {
            return this.createFallbackTexture(baseColor);
        }
        
        this.canvas.width = size;
        this.canvas.height = size;
        
        const ctx = this.ctx;
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        // Extract RGB from base color
        const r = ((baseColor >> 16) & 0xFF) / 255;
        const g = ((baseColor >> 8) & 0xFF) / 255;
        const b = (baseColor & 0xFF) / 255;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Add subtle noise and brushed metal effect
                const noise = (Math.random() - 0.5) * 0.2;
                const brushEffect = Math.sin(x * 0.1) * 0.1;
                
                data[i] = Math.max(0, Math.min(255, (r + noise + brushEffect) * 255));
                data[i + 1] = Math.max(0, Math.min(255, (g + noise + brushEffect) * 255));
                data[i + 2] = Math.max(0, Math.min(255, (b + noise + brushEffect) * 255));
                data[i + 3] = 255;
                
                // Add some scratches
                if (Math.random() < 0.01) {
                    data[i] = Math.min(255, data[i] * 1.5);
                    data[i + 1] = Math.min(255, data[i + 1] * 1.5);
                    data[i + 2] = Math.min(255, data[i + 2] * 1.5);
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Generate a wood texture for chests and other objects
     */
    static generateWoodTexture(size: number = 256): THREE.Texture {
        // Fallback for test environment
        if (!this.canvas || !this.ctx) {
            return this.createFallbackTexture(0x8B4513);
        }
        
        this.canvas.width = size;
        this.canvas.height = size;
        
        const ctx = this.ctx;
        
        // Create gradient base
        const gradient = ctx.createLinearGradient(0, 0, size, 0);
        gradient.addColorStop(0, '#D2B48C');
        gradient.addColorStop(0.5, '#8B4513');
        gradient.addColorStop(1, '#A0522D');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Add wood grain lines
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
            const y = (i / 12) * size + Math.random() * 20;
            ctx.globalAlpha = 0.3 + Math.random() * 0.4;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(size, y + Math.random() * 6 - 3);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Generate a normal map from height data
     */
    static generateNormalMap(_heightTexture: THREE.Texture, strength: number = 1): THREE.Texture {
        // Fallback for test environment
        if (!this.canvas || !this.ctx) {
            return this.createFallbackTexture(0x8080FF); // Normal map blue
        }
        
        // This is a simplified normal map generation
        // In a real implementation, you'd want to use a proper height-to-normal conversion
        const size = 256;
        this.canvas.width = size;
        this.canvas.height = size;
        
        const ctx = this.ctx;
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                
                // Simple normal map (pointing mostly up with slight variations)
                const noise = (Math.random() - 0.5) * strength;
                
                data[i] = 128 + noise * 50;     // X normal
                data[i + 1] = 128 + noise * 50; // Y normal  
                data[i + 2] = 255;              // Z normal (pointing up)
                data[i + 3] = 255;              // Alpha
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(this.canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        
        return texture;
    }
    
    /**
     * Create a fallback texture for test environments
     */
    private static createFallbackTexture(color: number): THREE.Texture {
        // For test environments where canvas isn't available, create a simple data texture
        const data = new Uint8Array(4); // 1x1 RGBA
        
        // Convert color to RGB
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;  
        const b = color & 0xFF;
        
        data[0] = r; // R
        data[1] = g; // G
        data[2] = b; // B
        data[3] = 255; // A
        
        const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        
        return texture;
    }
}