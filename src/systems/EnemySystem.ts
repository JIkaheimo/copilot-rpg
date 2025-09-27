import * as THREE from 'three';

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

export class EnemySystem {
    private initialized: boolean = false;
    private scene: THREE.Scene | null = null;
    private enemies: Map<string, EnemyData> = new Map();
    private eventListeners: { [event: string]: Function[] } = {};
    private nextEnemyId: number = 1;
    
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
        
        this.enemies.set(enemyId, enemy);
        
        this.emit('enemySpawned', enemy);
        
        console.log(`👹 Spawned ${enemy.name} (Level ${level}) at position`, position);
        
        return enemyId;
    }
    
    private createEnemyMesh(enemyType: any, level: number): THREE.Object3D {
        const group = new THREE.Group();
        
        // Generate a skin texture based on enemy type
        const skinTexture = this.generateEnemySkinTexture(enemyType.color);
        
        // Main body
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            map: skinTexture,
            color: enemyType.color,
            roughness: 0.6,
            metalness: 0.0
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Level indicator (small sphere on top)
        if (level > 1) {
            const levelGeometry = new THREE.SphereGeometry(0.1, 6, 6);
            const levelMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.3,
                metalness: 0.0,
                roughness: 0.5
            });
            const levelIndicator = new THREE.Mesh(levelGeometry, levelMaterial);
            levelIndicator.position.y = 1.5;
            group.add(levelIndicator);
        }
        
        // Glowing eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const eyeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.8,
            metalness: 0.0,
            roughness: 0.1
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.1, 1.0, 0.25);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.1, 1.0, 0.25);
        group.add(rightEye);
        
        return group;
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
        
        // Remove visual representation
        if (enemy.mesh && this.scene) {
            this.scene.remove(enemy.mesh);
        }
        
        this.emit('enemyKilled', {
            enemyId,
            enemy,
            experienceReward: enemy.experienceReward
        });
        
        console.log(`👹 ${enemy.name} has been defeated! (+${enemy.experienceReward} XP)`);
        
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
    
    // Event system
    on(event: string, callback: Function): void {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    off(event: string, callback: Function): void {
        if (!this.eventListeners[event]) return;
        
        const index = this.eventListeners[event].indexOf(callback);
        if (index > -1) {
            this.eventListeners[event].splice(index, 1);
        }
    }
    
    private emit(event: string, data?: any): void {
        if (!this.eventListeners[event]) return;
        
        this.eventListeners[event].forEach(callback => {
            callback(data);
        });
    }
    
    cleanup(): void {
        this.clearAllEnemies();
        this.eventListeners = {};
        this.initialized = false;
        console.log('👹 Enemy system cleaned up');
    }
}