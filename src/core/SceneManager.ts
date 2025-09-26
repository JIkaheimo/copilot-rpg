import * as THREE from 'three';

export class SceneManager {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private ambientLight: THREE.AmbientLight;
    private directionalLight: THREE.DirectionalLight;
    
    constructor(renderer: THREE.WebGLRenderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        
        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        
        // Initialize lights
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.directionalLight.position.set(10, 10, 5);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        
        this.scene.add(this.ambientLight);
        this.scene.add(this.directionalLight);
    }
    
    async initialize(): Promise<void> {
        // Create a basic ground plane
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x00aa00 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add some basic scenery
        this.createBasicTerrain();
        
        // Set up fog
        this.scene.fog = new THREE.Fog(0xcccccc, 10, 100);
        
        console.log('🌍 Scene initialized');
    }
    
    private createBasicTerrain(): void {
        // Add some trees
        for (let i = 0; i < 20; i++) {
            const tree = this.createTree();
            tree.position.set(
                (Math.random() - 0.5) * 80,
                0,
                (Math.random() - 0.5) * 80
            );
            this.scene.add(tree);
        }
        
        // Add some rocks
        for (let i = 0; i < 10; i++) {
            const rock = this.createRock();
            rock.position.set(
                (Math.random() - 0.5) * 80,
                0,
                (Math.random() - 0.5) * 80
            );
            this.scene.add(rock);
        }
    }
    
    private createTree(): THREE.Group {
        const tree = new THREE.Group();
        
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 3);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        tree.add(trunk);
        
        // Leaves
        const leavesGeometry = new THREE.SphereGeometry(2);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 4;
        leaves.castShadow = true;
        tree.add(leaves);
        
        return tree;
    }
    
    private createRock(): THREE.Mesh {
        const rockGeometry = new THREE.SphereGeometry(
            0.5 + Math.random() * 0.5,
            8,
            6
        );
        const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.scale.y = 0.7;
        rock.castShadow = true;
        rock.receiveShadow = true;
        return rock;
    }
    
    update(deltaTime: number): void {
        // Update any animated scene elements
        // For now, just a simple rotation example
        this.scene.traverse((object) => {
            if (object.userData.rotate) {
                object.rotation.y += deltaTime * 0.5;
            }
        });
    }
    
    render(): void {
        this.renderer.render(this.scene, this.camera);
    }
    
    onResize(width: number, height: number): void {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }
    
    addToScene(object: THREE.Object3D): void {
        this.scene.add(object);
    }
    
    removeFromScene(object: THREE.Object3D): void {
        this.scene.remove(object);
    }
    
    getScene(): THREE.Scene {
        return this.scene;
    }
    
    getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }
    
    getDirectionalLight(): THREE.DirectionalLight {
        return this.directionalLight;
    }
    
    getAmbientLight(): THREE.AmbientLight {
        return this.ambientLight;
    }
}