import * as THREE from 'three';
import { InputManager } from '../core/InputManager';

export class PlayerController {
    private inputManager: InputManager;
    private camera: THREE.PerspectiveCamera;
    private player!: THREE.Group;
    private playerMesh!: THREE.Mesh;
    private velocity: THREE.Vector3;
    private isGrounded: boolean = true;
    
    // Movement settings
    private moveSpeed: number = 5;
    private runSpeed: number = 8;
    private jumpSpeed: number = 10;
    private mouseSensitivity: number = 0.002;
    
    // Camera settings
    private cameraOffset: THREE.Vector3;
    private cameraRotation: THREE.Euler;
    
    constructor(inputManager: InputManager, camera: THREE.PerspectiveCamera) {
        this.inputManager = inputManager;
        this.camera = camera;
        
        this.velocity = new THREE.Vector3();
        this.cameraOffset = new THREE.Vector3(0, 2, 5);
        this.cameraRotation = new THREE.Euler(0, 0, 0, 'YXZ');
        
        this.createPlayer();
        this.setupCamera();
    }
    
    private createPlayer(): void {
        this.player = new THREE.Group();
        
        // Create a simple player representation (capsule-like shape)
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x0066cc });
        this.playerMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.playerMesh.position.y = 1;
        this.playerMesh.castShadow = true;
        
        // Add a simple face indicator
        const faceGeometry = new THREE.SphereGeometry(0.1);
        const faceMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.position.set(0, 1.2, 0.4);
        
        this.player.add(this.playerMesh);
        this.player.add(face);
        
        // Set initial position
        this.player.position.set(0, 0, 0);
    }
    
    private setupCamera(): void {
        // Position camera behind and above player
        this.updateCameraPosition();
    }
    
    update(deltaTime: number): void {
        this.handleInput(deltaTime);
        this.updatePhysics(deltaTime);
        this.updateCameraPosition();
    }
    
    private handleInput(deltaTime: number): void {
        const input = this.inputManager;
        
        // Mouse look (only when pointer is locked)
        if (input.isPointerLocked()) {
            const mouseDelta = input.getMouseDelta();
            this.cameraRotation.y -= mouseDelta.x * this.mouseSensitivity;
            this.cameraRotation.x -= mouseDelta.y * this.mouseSensitivity;
            
            // Clamp vertical rotation
            this.cameraRotation.x = Math.max(
                -Math.PI / 2 + 0.1,
                Math.min(Math.PI / 2 - 0.1, this.cameraRotation.x)
            );
        }
        
        // Movement input
        const moveVector = new THREE.Vector3();
        let isRunning = false;
        
        if (input.isKeyPressed('KeyW')) moveVector.z -= 1;
        if (input.isKeyPressed('KeyS')) moveVector.z += 1;
        if (input.isKeyPressed('KeyA')) moveVector.x -= 1;
        if (input.isKeyPressed('KeyD')) moveVector.x += 1;
        
        if (input.isKeyPressed('ShiftLeft') || input.isKeyPressed('ShiftRight')) {
            isRunning = true;
        }
        
        // Normalize movement vector
        if (moveVector.length() > 0) {
            moveVector.normalize();
            
            // Apply camera rotation to movement
            const cameraDirection = new THREE.Vector3();
            this.camera.getWorldDirection(cameraDirection);
            cameraDirection.y = 0; // Remove vertical component
            cameraDirection.normalize();
            
            const cameraRight = new THREE.Vector3();
            cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
            
            const worldMoveVector = new THREE.Vector3();
            worldMoveVector.addScaledVector(cameraDirection, -moveVector.z);
            worldMoveVector.addScaledVector(cameraRight, moveVector.x);
            
            // Apply movement speed
            const speed = isRunning ? this.runSpeed : this.moveSpeed;
            this.velocity.x = worldMoveVector.x * speed;
            this.velocity.z = worldMoveVector.z * speed;
            
            // Rotate player to face movement direction
            if (worldMoveVector.length() > 0) {
                const angle = Math.atan2(worldMoveVector.x, worldMoveVector.z);
                this.player.rotation.y = angle;
            }
        } else {
            // Apply friction when not moving
            this.velocity.x *= 0.8;
            this.velocity.z *= 0.8;
        }
        
        // Jumping
        if (input.isKeyPressed('Space') && this.isGrounded) {
            this.velocity.y = this.jumpSpeed;
            this.isGrounded = false;
        }
        
        // Handle gamepad input
        const gamepad = input.getGamepad();
        if (gamepad) {
            this.handleGamepadInput(gamepad, deltaTime, isRunning);
        }
    }
    
    private handleGamepadInput(gamepad: Gamepad, _deltaTime: number, isRunning: boolean): void {
        // Left stick for movement
        const leftStickX = gamepad.axes[0];
        const leftStickY = gamepad.axes[1];
        
        if (Math.abs(leftStickX) > 0.1 || Math.abs(leftStickY) > 0.1) {
            const moveVector = new THREE.Vector3(leftStickX, 0, leftStickY);
            moveVector.normalize();
            
            const speed = isRunning ? this.runSpeed : this.moveSpeed;
            this.velocity.x = moveVector.x * speed;
            this.velocity.z = moveVector.z * speed;
        }
        
        // Right stick for camera
        const rightStickX = gamepad.axes[2];
        const rightStickY = gamepad.axes[3];
        
        if (Math.abs(rightStickX) > 0.1 || Math.abs(rightStickY) > 0.1) {
            this.cameraRotation.y -= rightStickX * this.mouseSensitivity * 10;
            this.cameraRotation.x -= rightStickY * this.mouseSensitivity * 10;
            
            this.cameraRotation.x = Math.max(
                -Math.PI / 2 + 0.1,
                Math.min(Math.PI / 2 - 0.1, this.cameraRotation.x)
            );
        }
        
        // Jump button (A button is typically index 0)
        if (gamepad.buttons[0]?.pressed && this.isGrounded) {
            this.velocity.y = this.jumpSpeed;
            this.isGrounded = false;
        }
    }
    
    private updatePhysics(deltaTime: number): void {
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y -= 20 * deltaTime; // Gravity
        }
        
        // Update position
        this.player.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Simple ground collision
        if (this.player.position.y <= 0) {
            this.player.position.y = 0;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
        
        // Keep player within world bounds (simple boundary check)
        const worldSize = 50;
        this.player.position.x = Math.max(-worldSize, Math.min(worldSize, this.player.position.x));
        this.player.position.z = Math.max(-worldSize, Math.min(worldSize, this.player.position.z));
    }
    
    private updateCameraPosition(): void {
        // Third-person camera
        const idealOffset = this.cameraOffset.clone();
        idealOffset.applyEuler(this.cameraRotation);
        
        const idealPosition = this.player.position.clone().add(idealOffset);
        
        this.camera.position.copy(idealPosition);
        this.camera.rotation.copy(this.cameraRotation);
        
        // Look at player
        const lookAtTarget = this.player.position.clone();
        lookAtTarget.y += 1; // Look at player's chest level
        this.camera.lookAt(lookAtTarget);
    }
    
    getPlayer(): THREE.Group {
        return this.player;
    }
    
    getPosition(): THREE.Vector3 {
        return this.player.position.clone();
    }
    
    setPosition(position: THREE.Vector3): void {
        this.player.position.copy(position);
    }
    
    getVelocity(): THREE.Vector3 {
        return this.velocity.clone();
    }
    
    isMoving(): boolean {
        return this.velocity.length() > 0.1;
    }
    
    isRunning(): boolean {
        return this.velocity.length() > this.moveSpeed + 1;
    }
}