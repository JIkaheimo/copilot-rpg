import * as THREE from 'three';
import { EventEmitter } from '@core/EventEmitter';
import { CharacterModelGenerator } from '@utils/CharacterModelGenerator';
import { AnimationSystem } from './AnimationSystem';
import { AnimationPresets } from './AnimationPresets';

export interface EnemyData {
    id: string;
    type: string;
    name: string;
    level: number;
    health: number;
    maxHealth: number;
    attackPower: number;
    defense: number;
    experienceReward: number;
    position: THREE.Vector3;
    mesh?: THREE.Object3D;
    patrolRadius: number;
    detectionRange: number;
    attackRange: number;
    moveSpeed: number;
    isHostile: boolean;
    lastAttackTime: number;
    state: 'idle' | 'patrolling' | 'chasing' | 'attacking' | 'dead';
    target?: string;
    homePosition: THREE.Vector3;
}

export class EnemySystem extends EventEmitter {
    private initialized: boolean = false;
    private scene: THREE.Scene | null = null;
    private enemies: Map<string, EnemyData> = new Map();
    private nextEnemyId: number = 1;
    private animationSystem: AnimationSystem | null = null;

    constructor() {
        super('enemy');
    }
    
    setAnimationSystem(animationSystem: AnimationSystem): void {
        this.animationSystem = animationSystem;
    }
    
    // Enemy type definitions
    private enemyTypes = {
        goblin: {
            name: 'Goblin',
            health: 30,
            attackPower: 8,
            defense: 2,
            experienceReward: 15,
            moveSpeed: 2.0,
            detectionRange: 8.0,
            attackRange: 1.5,
            patrolRadius: 5.0,
            color: 0x4a7c2a
        },
        wolf: {
            name: 'Wolf',
            health: 45,
            attackPower: 12,
            defense: 3,
            experienceReward: 25,
            moveSpeed: 3.5,
            detectionRange: 10.0,
            attackRange: 2.0,
            patrolRadius: 8.0,
            color: 0x8b4513
        },
        orc: {
            name: 'Orc',
            health: 80,
            attackPower: 18,
            defense: 6,
            experienceReward: 40,
            moveSpeed: 1.8,
            detectionRange: 6.0,
            attackRange: 2.5,
            patrolRadius: 4.0,
            color: 0x556b2f
        },
        skeleton: {
            name: 'Skeleton',
            health: 25,
            attackPower: 10,
            defense: 1,
            experienceReward: 20,
            moveSpeed: 2.2,
            detectionRange: 12.0,
            attackRange: 2.0,
            patrolRadius: 6.0,
            color: 0xdcdcdc
        }
    };
    
    initialize(scene: THREE.Scene): void {
        this.scene = scene;
        this.initialized = true;
        
        // Spawn some initial enemies for testing
        this.spawnInitialEnemies();
        
        console.log('👹 Enemy system initialized');
    }
    
    private spawnInitialEnemies(): void {
        // Spawn a few enemies around the world for testing
        this.spawnEnemy('goblin', new THREE.Vector3(10, 0, 10));
        this.spawnEnemy('wolf', new THREE.Vector3(-15, 0, 5));
        this.spawnEnemy('goblin', new THREE.Vector3(5, 0, -12));
        this.spawnEnemy('skeleton', new THREE.Vector3(-8, 0, -8));
    }
    
    spawnEnemy(type: keyof typeof this.enemyTypes, position: THREE.Vector3, level: number = 1): string {
        if (!this.initialized || !this.scene) return '';
        
        const enemyType = this.enemyTypes[type];
        if (!enemyType) {
            console.warn(`Unknown enemy type: ${type}`);
            return '';
        }
        
        const enemyId = `enemy_${this.nextEnemyId++}`;
        
        // Scale stats by level
        const levelMultiplier = 1 + (level - 1) * 0.2;
        
        const enemy: EnemyData = {
            id: enemyId,
            type,
            name: enemyType.name,
            level,
            health: Math.floor(enemyType.health * levelMultiplier),
            maxHealth: Math.floor(enemyType.health * levelMultiplier),
            attackPower: Math.floor(enemyType.attackPower * levelMultiplier),
            defense: Math.floor(enemyType.defense * levelMultiplier),
            experienceReward: Math.floor(enemyType.experienceReward * levelMultiplier),
            position: position.clone(),
            homePosition: position.clone(),
            patrolRadius: enemyType.patrolRadius,
            detectionRange: enemyType.detectionRange,
            attackRange: enemyType.attackRange,
            moveSpeed: enemyType.moveSpeed,
            isHostile: true,
            lastAttackTime: 0,
            state: 'idle'
        };
        
        // Create visual representation
        enemy.mesh = this.createEnemyMesh(enemyType, level);
        enemy.mesh.position.copy(position);
        this.scene.add(enemy.mesh);
        
        // Start idle breathing animation
        if (this.animationSystem && enemy.mesh) {
            AnimationPresets.createBreathingAnimation(`enemy_${enemyId}_idle`, enemy.mesh, 0.01);
        }
        
        this.enemies.set(enemyId, enemy);
        
        this.emit('enemySpawned', enemy);
        
        console.log(`👹 Spawned ${enemy.name} (Level ${level}) at position`, position);
        
        return enemyId;
    }
    
    private createEnemyMesh(enemyType: any, level: number): THREE.Object3D {
        // Handle special case for wolves - they need a different model type
        if (enemyType.name && enemyType.name.toLowerCase().includes('wolf')) {
            return this.createWolfModel(enemyType, level);
        }
        
        // Use the character model generator for humanoid enemies
        const characterModel = CharacterModelGenerator.generateEnemyModel(enemyType.name || 'default', level);
        
        // Add level indicator if above level 1
        if (level > 1) {
            const levelGeometry = new THREE.SphereGeometry(0.08, 6, 6);
            const levelMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.4,
                metalness: 0.0,
                roughness: 0.3
            });
            const levelIndicator = new THREE.Mesh(levelGeometry, levelMaterial);
            levelIndicator.position.y = 2.2; // Above character head
            characterModel.add(levelIndicator);
        }
        
        console.log(`👹 Created enhanced ${enemyType.name} character model (Level ${level})`);
        return characterModel;
    }
    
    /**
     * Create a wolf model - different from humanoid characters
     */
    private createWolfModel(_enemyType: any, level: number): THREE.Group {
        const wolf = new THREE.Group();
        
        // Wolf body (elongated)
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.3, 1.2);
        const furTexture = this.generateEnemySkinTexture(0x8B4513); // Brown fur
        const bodyMaterial = new THREE.MeshStandardMaterial({
            map: furTexture,
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.0
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0, 0.4, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        wolf.add(body);
        
        // Wolf head
        const headGeometry = new THREE.BoxGeometry(0.3, 0.25, 0.4);
        const headMaterial = new THREE.MeshStandardMaterial({
            map: furTexture,
            color: 0x654321, // Darker brown for head
            roughness: 0.9,
            metalness: 0.0
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.5, 0.6);
        wolf.add(head);
        
        // Wolf snout
        const snoutGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.2);
        const snoutMaterial = new THREE.MeshStandardMaterial({
            color: 0x2F4F4F,
            roughness: 0.8,
            metalness: 0.0
        });
        const snout = new THREE.Mesh(snoutGeometry, snoutMaterial);
        snout.position.set(0, 0.45, 0.8);
        wolf.add(snout);
        
        // Wolf ears
        const earGeometry = new THREE.ConeGeometry(0.08, 0.15, 6);
        const earMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.0
        });
        
        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.1, 0.65, 0.6);
        wolf.add(leftEar);
        
        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.1, 0.65, 0.6);
        wolf.add(rightEar);
        
        // Glowing wolf eyes
        const eyeGeometry = new THREE.SphereGeometry(0.04, 6, 4);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00, // Yellow eyes for wolves
            emissive: 0xffff00,
            emissiveIntensity: 0.6,
            metalness: 0.0,
            roughness: 0.1
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.08, 0.55, 0.75);
        wolf.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.08, 0.55, 0.75);
        wolf.add(rightEye);
        
        // Wolf legs
        const legGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.4);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.8,
            metalness: 0.0
        });
        
        // Front legs
        const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        frontLeftLeg.position.set(-0.2, 0.2, 0.3);
        wolf.add(frontLeftLeg);
        
        const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        frontRightLeg.position.set(0.2, 0.2, 0.3);
        wolf.add(frontRightLeg);
        
        // Back legs
        const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        backLeftLeg.position.set(-0.2, 0.2, -0.3);
        wolf.add(backLeftLeg);
        
        const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        backRightLeg.position.set(0.2, 0.2, -0.3);
        wolf.add(backRightLeg);
        
        // Wolf tail
        const tailGeometry = new THREE.CylinderGeometry(0.03, 0.06, 0.3);
        const tailMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.0
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, 0.5, -0.6);
        tail.rotation.x = Math.PI / 6; // Slight upward angle
        wolf.add(tail);
        
        // Level indicator for wolves
        if (level > 1) {
            const levelGeometry = new THREE.SphereGeometry(0.06, 6, 6);
            const levelMaterial = new THREE.MeshStandardMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.4,
                metalness: 0.0,
                roughness: 0.3
            });
            const levelIndicator = new THREE.Mesh(levelGeometry, levelMaterial);
            levelIndicator.position.y = 0.9;
            wolf.add(levelIndicator);
        }
        
        // Scale based on level
        const scale = 0.8 + (level - 1) * 0.1;
        wolf.scale.setScalar(scale);
        
        console.log(`🐺 Created enhanced wolf model (Level ${level})`);
        return wolf;
    }
    
    private generateEnemySkinTexture(baseColor: number): THREE.Texture {
        // Fallback for test environment
        if (typeof document === 'undefined') {
            // Create a simple data texture for testing
            const data = new Uint8Array(4); // 1x1 RGBA
            const r = (baseColor >> 16) & 0xFF;
            const g = (baseColor >> 8) & 0xFF;  
            const b = baseColor & 0xFF;
            
            data[0] = r; data[1] = g; data[2] = b; data[3] = 255;
            
            const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
            return texture;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Additional fallback if canvas context is not available
        if (!ctx || typeof ctx.createImageData !== 'function') {
            // Use basic texture as final fallback
            const texture = new THREE.Texture();
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.needsUpdate = true;
            (texture as any).fallbackColor = baseColor;
            return texture;
        }
        
        const imageData = ctx.createImageData(128, 128);
        const data = imageData.data;
        
        // Extract RGB from base color
        const r = ((baseColor >> 16) & 0xFF) / 255;
        const g = ((baseColor >> 8) & 0xFF) / 255;
        const b = (baseColor & 0xFF) / 255;
        
        for (let y = 0; y < 128; y++) {
            for (let x = 0; x < 128; x++) {
                const i = (y * 128 + x) * 4;
                
                // Add skin-like texture variation
                const noise = (Math.random() - 0.5) * 0.3;
                const scalePattern = Math.sin(x * 0.2) * Math.sin(y * 0.2) * 0.1;
                
                data[i] = Math.max(0, Math.min(255, (r + noise + scalePattern) * 255));
                data[i + 1] = Math.max(0, Math.min(255, (g + noise + scalePattern) * 255));
                data[i + 2] = Math.max(0, Math.min(255, (b + noise + scalePattern) * 255));
                data[i + 3] = 255;
                
                // Add some darker spots for detail
                if (Math.random() < 0.05) {
                    data[i] *= 0.7;
                    data[i + 1] *= 0.7;
                    data[i + 2] *= 0.7;
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.needsUpdate = true;
        
        return texture;
    }
    
    update(deltaTime: number, playerPosition?: THREE.Vector3): void {
        if (!this.initialized) return;
        
        for (const [, enemy] of this.enemies) {
            this.updateEnemy(enemy, deltaTime, playerPosition);
        }
    }
    
    private updateEnemy(enemy: EnemyData, deltaTime: number, playerPosition?: THREE.Vector3): void {
        if (enemy.state === 'dead') return;
        
        // Store previous state for animation transitions
        const previousState = enemy.state;
        
        // Update attack cooldown
        if (enemy.lastAttackTime > 0) {
            enemy.lastAttackTime -= deltaTime;
        }
        
        // AI State Machine
        switch (enemy.state) {
            case 'idle':
                this.updateIdleState(enemy, deltaTime, playerPosition);
                break;
            case 'patrolling':
                this.updatePatrollingState(enemy, deltaTime, playerPosition);
                break;
            case 'chasing':
                this.updateChasingState(enemy, deltaTime, playerPosition);
                break;
            case 'attacking':
                this.updateAttackingState(enemy, deltaTime, playerPosition);
                break;
        }
        
        // Update animations if state changed
        if (previousState !== enemy.state && this.animationSystem && enemy.mesh) {
            this.updateEnemyAnimation(enemy, previousState);
        }
        
        // Update visual position
        if (enemy.mesh) {
            enemy.mesh.position.copy(enemy.position);
            
            // Face movement direction or player
            if (playerPosition && enemy.state === 'chasing') {
                const direction = new THREE.Vector3()
                    .subVectors(playerPosition, enemy.position)
                    .normalize();
                enemy.mesh.lookAt(enemy.position.clone().add(direction));
            }
        }
    }
    
    private updateEnemyAnimation(enemy: EnemyData, previousState: string): void {
        if (!this.animationSystem || !enemy.mesh) return;
        
        const animationId = `enemy_${enemy.id}`;
        
        // Remove previous state animation
        if (previousState !== 'idle') {
            this.animationSystem.removeAllAnimations(`${animationId}_${previousState}`);
        }
        
        // Start new animation based on current state
        switch (enemy.state) {
            case 'idle':
                AnimationPresets.createBreathingAnimation(`${animationId}_idle`, enemy.mesh, 0.01);
                break;
            case 'patrolling':
                AnimationPresets.createWalkingAnimation(`${animationId}_patrolling`, enemy.mesh, 0.8);
                break;
            case 'chasing':
                AnimationPresets.createWalkingAnimation(`${animationId}_chasing`, enemy.mesh, 1.5);
                break;
            case 'attacking': {
                const attackType = enemy.type === 'wolf' ? 'thrust' : 'swing';
                AnimationPresets.createAttackAnimation(`${animationId}_attacking`, enemy.mesh, attackType);
                break;
            }
        }
        
        // Update animation system state
        this.animationSystem.setAnimationState(animationId, enemy.state as any, 0.3);
    }
    
    private updateIdleState(enemy: EnemyData, deltaTime: number, playerPosition?: THREE.Vector3): void {
        // Check if player is in detection range
        if (playerPosition && enemy.isHostile) {
            const distanceToPlayer = enemy.position.distanceTo(playerPosition);
            if (distanceToPlayer <= enemy.detectionRange) {
                enemy.state = 'chasing';
                enemy.target = 'player';
                this.emit('enemyDetectedPlayer', enemy);
                return;
            }
        }
        
        // Randomly start patrolling
        if (Math.random() < 0.3 * deltaTime) { // 30% chance per second
            enemy.state = 'patrolling';
        }
    }
    
    private updatePatrollingState(enemy: EnemyData, deltaTime: number, playerPosition?: THREE.Vector3): void {
        // Check if player is in detection range
        if (playerPosition && enemy.isHostile) {
            const distanceToPlayer = enemy.position.distanceTo(playerPosition);
            if (distanceToPlayer <= enemy.detectionRange) {
                enemy.state = 'chasing';
                enemy.target = 'player';
                this.emit('enemyDetectedPlayer', enemy);
                return;
            }
        }
        
        // Move towards a random point within patrol radius
        if (!enemy.target || Math.random() < 0.1 * deltaTime) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * enemy.patrolRadius;
            const targetX = enemy.homePosition.x + Math.cos(angle) * distance;
            const targetZ = enemy.homePosition.z + Math.sin(angle) * distance;
            
            const direction = new THREE.Vector3(targetX, 0, targetZ)
                .sub(enemy.position)
                .normalize();
            
            enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * deltaTime));
        }
        
        // Stop patrolling randomly
        if (Math.random() < 0.2 * deltaTime) { // 20% chance per second
            enemy.state = 'idle';
        }
    }
    
    private updateChasingState(enemy: EnemyData, deltaTime: number, playerPosition?: THREE.Vector3): void {
        if (!playerPosition) {
            enemy.state = 'idle';
            enemy.target = undefined;
            return;
        }
        
        const distanceToPlayer = enemy.position.distanceTo(playerPosition);
        
        // If player is too far, stop chasing
        if (distanceToPlayer > enemy.detectionRange * 1.5) {
            enemy.state = 'idle';
            enemy.target = undefined;
            this.emit('enemyLostPlayer', enemy);
            return;
        }
        
        // If close enough to attack
        if (distanceToPlayer <= enemy.attackRange) {
            enemy.state = 'attacking';
            return;
        }
        
        // Move towards player
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, enemy.position)
            .normalize();
        
        enemy.position.add(direction.multiplyScalar(enemy.moveSpeed * deltaTime));
    }
    
    private updateAttackingState(enemy: EnemyData, _deltaTime: number, playerPosition?: THREE.Vector3): void {
        if (!playerPosition) {
            enemy.state = 'idle';
            enemy.target = undefined;
            return;
        }
        
        const distanceToPlayer = enemy.position.distanceTo(playerPosition);
        
        // If player moved out of attack range, chase again
        if (distanceToPlayer > enemy.attackRange) {
            enemy.state = 'chasing';
            return;
        }
        
        // Attack if cooldown is ready
        if (enemy.lastAttackTime <= 0) {
            this.performAttack(enemy);
            enemy.lastAttackTime = 1.5; // 1.5 second cooldown
        }
    }
    
    private performAttack(enemy: EnemyData): void {
        this.emit('enemyAttack', {
            enemyId: enemy.id,
            targetId: 'player',
            damage: enemy.attackPower
        });
        
        console.log(`👹 ${enemy.name} attacks for ${enemy.attackPower} damage!`);
    }
    
    // Public methods
    
    damageEnemy(enemyId: string, damage: number): boolean {
        const enemy = this.enemies.get(enemyId);
        if (!enemy || enemy.state === 'dead') return false;
        
        enemy.health = Math.max(0, enemy.health - damage);
        
        // Play hit reaction animation
        if (this.animationSystem && enemy.mesh && enemy.health > 0) {
            const knockbackDirection = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                0,
                (Math.random() - 0.5) * 2
            ).normalize();
            AnimationPresets.createHitReactionAnimation(
                `enemy_${enemyId}_hit`, 
                enemy.mesh, 
                knockbackDirection
            );
        }
        
        this.emit('enemyDamaged', {
            enemyId,
            damage,
            remainingHealth: enemy.health
        });
        
        if (enemy.health <= 0) {
            this.killEnemy(enemyId);
            return true; // Enemy died
        }
        
        return false; // Enemy survived
    }
    
    private killEnemy(enemyId: string): void {
        const enemy = this.enemies.get(enemyId);
        if (!enemy) return;
        
        enemy.state = 'dead';
        
        // Play death animation
        if (this.animationSystem && enemy.mesh) {
            // Remove all existing animations
            this.animationSystem.removeAllAnimations(`enemy_${enemyId}_idle`);
            this.animationSystem.removeAllAnimations(`enemy_${enemyId}_patrolling`);
            this.animationSystem.removeAllAnimations(`enemy_${enemyId}_chasing`);
            this.animationSystem.removeAllAnimations(`enemy_${enemyId}_attacking`);
            
            // Play death animation
            AnimationPresets.createDeathAnimation(`enemy_${enemyId}_death`, enemy.mesh);
        }
        
        this.emit('enemyKilled', {
            enemyId,
            enemy,
            experienceReward: enemy.experienceReward
        });
        
        console.log(`👹 ${enemy.name} has been defeated! (+${enemy.experienceReward} XP)`);
        
        // Remove visual representation after death animation completes
        setTimeout(() => {
            if (enemy.mesh && this.scene) {
                this.scene.remove(enemy.mesh);
            }
        }, 2500); // Death animation duration + small buffer
        
        // Remove from tracking after a delay (for any cleanup)
        setTimeout(() => {
            this.enemies.delete(enemyId);
        }, 1000);
    }
    
    getEnemy(enemyId: string): EnemyData | undefined {
        return this.enemies.get(enemyId);
    }
    
    getEnemiesInRange(position: THREE.Vector3, range: number): EnemyData[] {
        const nearbyEnemies: EnemyData[] = [];
        
        for (const [, enemy] of this.enemies) {
            if (enemy.state !== 'dead') {
                const distance = position.distanceTo(enemy.position);
                if (distance <= range) {
                    nearbyEnemies.push(enemy);
                }
            }
        }
        
        return nearbyEnemies;
    }
    
    getAllEnemies(): EnemyData[] {
        return Array.from(this.enemies.values()).filter(enemy => enemy.state !== 'dead');
    }
    
    clearAllEnemies(): void {
        for (const [, enemy] of this.enemies) {
            if (enemy.mesh && this.scene) {
                this.scene.remove(enemy.mesh);
            }
        }
        this.enemies.clear();
        console.log('👹 All enemies cleared');
    }
    
    
    cleanup(): void {
        this.clearAllEnemies();
        super.cleanup(); // Clear EventBus subscriptions
        this.initialized = false;
        console.log('👹 Enemy system cleaned up');
    }
}