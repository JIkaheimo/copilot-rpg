import * as THREE from 'three';

export interface LODConfig {
    highDetail: number; // Distance for high detail
    mediumDetail: number; // Distance for medium detail
    lowDetail: number; // Distance for low detail
    cullDistance: number; // Distance to cull objects completely
}

export interface LODObject {
    object: THREE.Object3D;
    highDetailMesh?: THREE.Mesh;
    mediumDetailMesh?: THREE.Mesh;
    lowDetailMesh?: THREE.Mesh;
    originalMaterial?: THREE.Material;
    config: LODConfig;
}

export class LODSystem {
    private scene: THREE.Scene | null = null;
    private camera: THREE.Camera | null = null;
    private lodObjects: Map<string, LODObject> = new Map();
    private playerPosition: THREE.Vector3 = new THREE.Vector3();
    
    // Default LOD configuration
    private defaultConfig: LODConfig = {
        highDetail: 20, // 20 units for high detail
        mediumDetail: 50, // 50 units for medium detail
        lowDetail: 100, // 100 units for low detail
        cullDistance: 200 // 200 units to cull completely
    };
    
    initialize(scene: THREE.Scene, camera: THREE.Camera): void {
        this.scene = scene;
        this.camera = camera;
        console.log('🎯 LOD System initialized');
    }
    
    registerObject(
        id: string, 
        object: THREE.Object3D, 
        config?: Partial<LODConfig>
    ): void {
        const finalConfig: LODConfig = { ...this.defaultConfig, ...config };
        
        const lodObject: LODObject = {
            object,
            config: finalConfig
        };
        
        // Generate simplified meshes if the object is a mesh
        if (object instanceof THREE.Mesh) {
            this.generateLODMeshes(lodObject);
        }
        
        this.lodObjects.set(id, lodObject);
    }
    
    private generateLODMeshes(lodObject: LODObject): void {
        const originalMesh = lodObject.object as THREE.Mesh;
        if (!originalMesh.geometry) return;
        
        // Store original
        lodObject.highDetailMesh = originalMesh;
        lodObject.originalMaterial = originalMesh.material as THREE.Material;
        
        // Create medium detail mesh (simplified geometry)
        const mediumGeometry = this.simplifyGeometry(originalMesh.geometry, 0.6);
        lodObject.mediumDetailMesh = new THREE.Mesh(mediumGeometry, lodObject.originalMaterial);
        lodObject.mediumDetailMesh.position.copy(originalMesh.position);
        lodObject.mediumDetailMesh.rotation.copy(originalMesh.rotation);
        lodObject.mediumDetailMesh.scale.copy(originalMesh.scale);
        lodObject.mediumDetailMesh.visible = false;
        
        // Create low detail mesh (very simplified)
        const lowGeometry = this.simplifyGeometry(originalMesh.geometry, 0.3);
        const lowMaterial = this.createLowDetailMaterial(lodObject.originalMaterial);
        lodObject.lowDetailMesh = new THREE.Mesh(lowGeometry, lowMaterial);
        lodObject.lowDetailMesh.position.copy(originalMesh.position);
        lodObject.lowDetailMesh.rotation.copy(originalMesh.rotation);
        lodObject.lowDetailMesh.scale.copy(originalMesh.scale);
        lodObject.lowDetailMesh.visible = false;
        
        // Add all LOD meshes to scene
        if (this.scene) {
            this.scene.add(lodObject.mediumDetailMesh);
            this.scene.add(lodObject.lowDetailMesh);
        }
    }
    
    private simplifyGeometry(geometry: THREE.BufferGeometry, factor: number): THREE.BufferGeometry {
        // Simple geometry simplification - reduce vertex count
        const positions = geometry.getAttribute('position');
        if (!positions) return geometry.clone();
        
        const originalCount = positions.count;
        const targetCount = Math.max(3, Math.floor(originalCount * factor));
        
        // For simplicity, we'll create a new geometry with reduced vertices
        // In a real implementation, you'd use a proper mesh simplification algorithm
        const simplified = geometry.clone();
        
        // Simple decimation - keep every nth vertex
        const step = Math.floor(originalCount / targetCount);
        if (step > 1) {
            const newPositions = [];
            const newNormals = [];
            const newUvs = [];
            
            const normals = geometry.getAttribute('normal');
            const uvs = geometry.getAttribute('uv');
            
            for (let i = 0; i < originalCount; i += step) {
                // Position
                newPositions.push(
                    positions.getX(i),
                    positions.getY(i), 
                    positions.getZ(i)
                );
                
                // Normal
                if (normals) {
                    newNormals.push(
                        normals.getX(i),
                        normals.getY(i),
                        normals.getZ(i)
                    );
                }
                
                // UV
                if (uvs) {
                    newUvs.push(uvs.getX(i), uvs.getY(i));
                }
            }
            
            simplified.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
            if (newNormals.length > 0) {
                simplified.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
            }
            if (newUvs.length > 0) {
                simplified.setAttribute('uv', new THREE.Float32BufferAttribute(newUvs, 2));
            }
        }
        
        return simplified;
    }
    
    private createLowDetailMaterial(originalMaterial: THREE.Material): THREE.Material {
        // Create a simpler material for distant objects
        if (originalMaterial instanceof THREE.MeshStandardMaterial) {
            return new THREE.MeshBasicMaterial({
                color: originalMaterial.color,
                map: originalMaterial.map,
                transparent: originalMaterial.transparent,
                opacity: originalMaterial.opacity
            });
        } else if (originalMaterial instanceof THREE.MeshPhongMaterial) {
            return new THREE.MeshBasicMaterial({
                color: originalMaterial.color,
                map: originalMaterial.map,
                transparent: originalMaterial.transparent,
                opacity: originalMaterial.opacity
            });
        }
        
        // Return a basic material as fallback
        return new THREE.MeshBasicMaterial({ color: 0x888888 });
    }
    
    updatePlayerPosition(position: THREE.Vector3): void {
        this.playerPosition.copy(position);
    }
    
    update(): void {
        if (!this.camera) return;
        
        // Update LOD for all registered objects
        for (const lodObject of this.lodObjects.values()) {
            this.updateObjectLOD(lodObject);
        }
    }
    
    private updateObjectLOD(lodObject: LODObject): void {
        const distance = lodObject.object.position.distanceTo(this.playerPosition);
        const config = lodObject.config;
        
        // Determine which level of detail to show
        if (distance > config.cullDistance) {
            // Cull object completely
            this.setObjectVisibility(lodObject, 'none');
        } else if (distance > config.lowDetail) {
            // Show low detail
            this.setObjectVisibility(lodObject, 'low');
        } else if (distance > config.mediumDetail) {
            // Show medium detail
            this.setObjectVisibility(lodObject, 'medium');
        } else {
            // Show high detail
            this.setObjectVisibility(lodObject, 'high');
        }
    }
    
    private setObjectVisibility(lodObject: LODObject, level: 'none' | 'low' | 'medium' | 'high'): void {
        // Hide all first
        if (lodObject.highDetailMesh) lodObject.highDetailMesh.visible = false;
        if (lodObject.mediumDetailMesh) lodObject.mediumDetailMesh.visible = false;
        if (lodObject.lowDetailMesh) lodObject.lowDetailMesh.visible = false;
        
        // Show appropriate level
        switch (level) {
            case 'high':
                if (lodObject.highDetailMesh) lodObject.highDetailMesh.visible = true;
                break;
            case 'medium':
                if (lodObject.mediumDetailMesh) lodObject.mediumDetailMesh.visible = true;
                break;
            case 'low':
                if (lodObject.lowDetailMesh) lodObject.lowDetailMesh.visible = true;
                break;
            case 'none':
                // All already hidden
                break;
        }
    }
    
    unregisterObject(id: string): void {
        const lodObject = this.lodObjects.get(id);
        if (!lodObject || !this.scene) return;
        
        // Remove LOD meshes from scene
        if (lodObject.mediumDetailMesh) {
            this.scene.remove(lodObject.mediumDetailMesh);
            lodObject.mediumDetailMesh.geometry.dispose();
            if (lodObject.mediumDetailMesh.material instanceof THREE.Material) {
                lodObject.mediumDetailMesh.material.dispose();
            }
        }
        
        if (lodObject.lowDetailMesh) {
            this.scene.remove(lodObject.lowDetailMesh);
            lodObject.lowDetailMesh.geometry.dispose();
            if (lodObject.lowDetailMesh.material instanceof THREE.Material) {
                lodObject.lowDetailMesh.material.dispose();
            }
        }
        
        this.lodObjects.delete(id);
    }
    
    setDefaultConfig(config: Partial<LODConfig>): void {
        this.defaultConfig = { ...this.defaultConfig, ...config };
    }
    
    updateObjectConfig(id: string, config: Partial<LODConfig>): void {
        const lodObject = this.lodObjects.get(id);
        if (lodObject) {
            lodObject.config = { ...lodObject.config, ...config };
        }
    }
    
    getStats(): { totalObjects: number; visibleObjects: number; culledObjects: number } {
        let visibleObjects = 0;
        let culledObjects = 0;
        
        for (const lodObject of this.lodObjects.values()) {
            const distance = lodObject.object.position.distanceTo(this.playerPosition);
            if (distance > lodObject.config.cullDistance) {
                culledObjects++;
            } else {
                visibleObjects++;
            }
        }
        
        return {
            totalObjects: this.lodObjects.size,
            visibleObjects,
            culledObjects
        };
    }
    
    cleanup(): void {
        // Clean up all LOD objects
        for (const id of this.lodObjects.keys()) {
            this.unregisterObject(id);
        }
        this.lodObjects.clear();
    }
}