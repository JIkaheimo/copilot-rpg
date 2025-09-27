import * as THREE from 'three';
import { SceneManager } from '@core/SceneManager';
import { InputManager } from '@core/InputManager';
import { UIManager } from '@ui/UIManager';
import { PlayerController } from '@systems/PlayerController';
import { GameState } from '@core/GameState';
import { WeatherSystem } from '@systems/WeatherSystem';
import { DayNightCycle } from '@systems/DayNightCycle';
import { SaveSystem } from '@systems/SaveSystem';
import { CombatSystem } from '@systems/CombatSystem';
import { EnemySystem } from '@systems/EnemySystem';
import { InteractionSystem } from '@systems/InteractionSystem';
import { ParticleSystem } from '@systems/ParticleSystem';
import { LightingSystem } from '@systems/LightingSystem';
import { WeaponSystem } from '@systems/WeaponSystem';
import { AchievementSystem } from '@systems/AchievementSystem';
import { MagicSystem } from '@systems/MagicSystem';
import { LODSystem } from '@systems/LODSystem';
import { WaterSystem } from '@systems/WaterSystem';
import { AudioSystem } from '@systems/AudioSystem';
import { CraftingSystem } from '@systems/CraftingSystem';
import { EventBus } from '@core/EventBus';

export class Game {
    private canvas: HTMLCanvasElement;
    private eventBus: EventBus;
    private renderer: THREE.WebGLRenderer;
    private sceneManager: SceneManager;
    private inputManager: InputManager;
    private uiManager: UIManager;
    private playerController: PlayerController;
    private gameState: GameState;
    private weatherSystem: WeatherSystem;
    private dayNightCycle: DayNightCycle;
    private saveSystem: SaveSystem;
    private combatSystem: CombatSystem;
    private enemySystem: EnemySystem;
    private interactionSystem: InteractionSystem;
    private particleSystem: ParticleSystem;
    private lightingSystem: LightingSystem;
    private weaponSystem: WeaponSystem;
    private achievementSystem: AchievementSystem;
    private magicSystem: MagicSystem;
    private lodSystem: LODSystem;
    private waterSystem: WaterSystem;
    private audioSystem: AudioSystem;
    private craftingSystem: CraftingSystem;
    
    private isRunning: boolean = false;
    private lastTime: number = 0;
    private animationFrameId: number | null = null;
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        
        // Initialize EventBus first
        this.eventBus = EventBus.getInstance();
        
        // Initialize Three.js renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Initialize core systems
        this.gameState = new GameState();
        this.sceneManager = new SceneManager(this.renderer);
        this.inputManager = new InputManager(this.canvas);
        this.uiManager = new UIManager();
        this.weatherSystem = new WeatherSystem();
        this.dayNightCycle = new DayNightCycle();
        this.saveSystem = new SaveSystem();
        this.combatSystem = new CombatSystem();
        this.enemySystem = new EnemySystem();
        this.interactionSystem = new InteractionSystem();
        this.particleSystem = new ParticleSystem();
        this.lightingSystem = new LightingSystem();
        this.weaponSystem = new WeaponSystem();
        this.achievementSystem = new AchievementSystem();
        this.magicSystem = new MagicSystem();
        this.lodSystem = new LODSystem();
        this.waterSystem = new WaterSystem();
        this.audioSystem = new AudioSystem();
        this.craftingSystem = new CraftingSystem();
        
        // Initialize player controller
        this.playerController = new PlayerController(
            this.inputManager,
            this.sceneManager.getCamera()
        );
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Handle page visibility
        document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
    }
    
    async initialize(): Promise<void> {
        console.log('🚀 Initializing Copilot RPG...');
        
        // Initialize all systems
        await this.sceneManager.initialize();
        this.inputManager.initialize();
        this.uiManager.initialize(this.gameState);
        
        // Set up animation system connections
        this.setupAnimationSystem();
        
        // Add player to scene
        const player = this.playerController.getPlayer();
        this.sceneManager.addToScene(player);
        
        // Initialize particle system first
        this.particleSystem.initialize(this.sceneManager.getScene());
        
        // Initialize weather and day/night cycle (weather now uses particle system)
        this.weatherSystem.initialize(this.sceneManager.getScene(), this.particleSystem);
        this.dayNightCycle.initialize(this.sceneManager.getScene());
        
        // Initialize lighting system (replaces basic SceneManager lighting)
        this.lightingSystem.initialize(this.sceneManager.getScene());
        
        // Initialize weapon system
        this.weaponSystem.initialize();
        
        // Initialize achievement system
        this.achievementSystem.initialize();
        
        // Initialize magic system
        this.magicSystem.initialize(this.sceneManager.getScene(), this.gameState, this.particleSystem);
        
        // Initialize combat system first
        this.combatSystem.initialize(this.sceneManager.getScene(), this.gameState);
        
        // Set up system integrations using EventBus BEFORE initializing enemy system
        // This ensures event listeners are ready when enemies spawn
        this.setupEventBusIntegrations();
        
        // Initialize enemy and interaction systems (after EventBus setup)
        this.enemySystem.initialize(this.sceneManager.getScene());
        this.interactionSystem.initialize(this.sceneManager.getScene());
        
        // Initialize LOD system and register character models for performance optimization
        this.lodSystem.initialize(this.sceneManager.getScene(), this.sceneManager.getCamera());
        this.registerCharacterModelsWithLOD();
        
        // Initialize water system for realistic water rendering
        this.waterSystem.initialize(this.sceneManager.getScene(), this.sceneManager.getCamera(), this.renderer);
        
        // Initialize audio system for 3D spatial audio
        this.audioSystem.initialize(this.sceneManager.getScene(), this.sceneManager.getCamera());
        
        // Initialize crafting system for item creation
        this.craftingSystem.initialize(this.sceneManager.getScene(), this.gameState);
        
        // Add some starting crafting materials to inventory
        this.addStartingCraftingMaterials();
        
        // Add initial water bodies to the world
        this.addWorldWater();
        
        // Set up atmospheric world lighting
        this.addWorldLighting();
        
        // Set up player combat input
        this.setupPlayerCombatInput();
        
        // Give the player a starting weapon
        this.setupStartingWeapon();
        
        // Load saved game if available
        await this.saveSystem.loadGame(this.gameState);
        
        // Start background music for exploration
        this.audioSystem.playBackgroundMusic('exploration', 2000);
        
        console.log('✅ Game systems initialized');
        
        // Start the game loop
        this.start();
    }
    
    private setupAnimationSystem(): void {
        // Get animation system from scene manager
        const animationSystem = this.sceneManager.getAnimationSystem();
        
        // Connect animation system to systems that need it
        this.playerController.setAnimationSystem(animationSystem);
        this.enemySystem.setAnimationSystem(animationSystem);
        this.interactionSystem.setAnimationSystem(animationSystem);
        
        console.log('🎬 Animation system connected to game systems');
    }
    
    private setupEventBusIntegrations(): void {
        // Combat System Integrations
        this.eventBus.on('enemy:enemySpawned', (enemy: any) => {
            this.combatSystem.addEnemy(enemy.id, enemy.position, {
                health: enemy.health,
                maxHealth: enemy.maxHealth,
                attackPower: enemy.attackPower,
                defense: enemy.defense,
                attackRange: enemy.attackRange
            });
        });

        this.eventBus.on('enemy:enemyKilled', (data: any) => {
            this.combatSystem.removeEnemy(data.enemyId);
        });

        this.eventBus.on('enemy:enemyAttack', (data: any) => {
            this.combatSystem.dealDamage('player', {
                amount: data.damage,
                type: 'physical',
                source: data.enemyId,
                critical: false
            });
        });

        this.eventBus.on('combat:damageDealt', (data: any) => {
            if (data.target !== 'player') {
                this.enemySystem.damageEnemy(data.target, data.damage.amount);
                
                // Play hit particle effect
                const enemy = this.enemySystem.getEnemy(data.target);
                if (enemy) {
                    this.particleSystem.playEffect('hit', enemy.position, 0.5);
                }
            }
        });

        this.eventBus.on('combat:enemyDefeated', (data: any) => {
            const enemy = this.enemySystem.getEnemy(data.enemyId);
            if (enemy) {
                this.gameState.addExperience(enemy.experienceReward);
                this.particleSystem.playEffect('enemyDeath', enemy.position, 1.5);
                
                // Brief magic orb effect when enemy is defeated
                const lightId = this.lightingSystem.addMagicOrbAt(enemy.position);
                setTimeout(() => {
                    this.lightingSystem.removeLight(lightId);
                }, 3000);
            }
        });

        this.eventBus.on('combat:playerAttack', () => {
            const equippedWeapon = this.weaponSystem.getEquippedWeapon();
            if (equippedWeapon) {
                // Update weapon stats for combat calculation
                const weaponStats = equippedWeapon.getStats();
                this.eventBus.emit('weapon:statsUpdate', {
                    baseDamage: weaponStats.damage,
                    critChance: weaponStats.critChance,
                    critMultiplier: weaponStats.critMultiplier,
                    damageType: weaponStats.damageType
                });
                
                // Play weapon-specific particle effects
                const weaponData = equippedWeapon.getData();
                if (weaponData.visualConfig.particleEffect) {
                    const playerPosition = this.playerController.getPosition();
                    this.particleSystem.playEffect(weaponData.visualConfig.particleEffect, playerPosition, 0.5);
                }
                
                // Damage weapon slightly on use
                equippedWeapon.damage(0.1);
            }
        });

        // Interaction System Integrations
        this.eventBus.on('interaction:chestOpened', (data: any) => {
            console.log(`🎯 Opened chest with ${data.items.length} items`);
            
            // Play treasure particle effect
            this.particleSystem.playEffect('treasure', data.position, 1.5);
            
            // Add a brief crystal light when chest is opened
            const lightId = this.lightingSystem.addCrystalAt(data.position);
            setTimeout(() => {
                this.lightingSystem.removeLight(lightId);
            }, 5000);
        });

        this.eventBus.on('interaction:resourceHarvested', (data: any) => {
            console.log(`🎯 Harvested ${data.resourceType}, ${data.remaining} remaining`);
            
            // Play hit effect for resource harvesting
            this.particleSystem.playEffect('hit', data.position, 0.3);
        });

        this.eventBus.on('interaction:chestOpened', () => {
            this.achievementSystem.trackChestOpened();
        });

        this.eventBus.on('interaction:resourceHarvested', (data: any) => {
            this.achievementSystem.trackResourceGathered(data.resourceType);
        });

        // Game State Integrations
        this.eventBus.on('gameState:levelUp', (data: any) => {
            console.log(`🎯 Level up! Now level ${data.newLevel || data}`);
            
            // Play level up particle effect at player position
            const playerPosition = this.playerController.getPosition();
            this.particleSystem.playEffect('levelup', playerPosition, 2);
            
            this.achievementSystem.trackLevelUp(data.newLevel || data);
        });

        // Magic System Integrations
        this.eventBus.on('magic:spellDamage', (data: any) => {
            // Find enemies in spell area and damage them
            const enemies = this.enemySystem.getEnemiesInRange(data.position, data.area);
            enemies.forEach(enemy => {
                this.combatSystem.dealDamage(enemy.id, {
                    amount: data.damage,
                    type: 'magical',
                    source: 'player',
                    critical: Math.random() < 0.1 // 10% crit chance for spells
                });
            });
        });

        this.eventBus.on('magic:spellCastComplete', () => {
            this.achievementSystem.trackSpellCast();
        });

        this.eventBus.on('magic:spellCastStart', (spell: any) => {
            this.uiManager.showNotification(
                `🔮 Casting ${spell.name}...`,
                'info'
            );
        });

        this.eventBus.on('magic:spellCastProgress', (data: any) => {
            this.uiManager.updateCastingInfo(data.spell.name, data.progress * 100);
        });

        this.eventBus.on('magic:spellCastComplete', () => {
            this.uiManager.hideCastingInfo();
        });

        this.eventBus.on('magic:spellCastCancelled', () => {
            this.uiManager.hideCastingInfo();
            this.uiManager.showNotification(
                'Spell cancelled',
                'warning'
            );
        });

        this.eventBus.on('magic:statusEffectApplied', (data: any) => {
            if (data.target === 'player' && data.effect.type === 'buff') {
                this.uiManager.showNotification(
                    `✨ ${data.effect.name} activated`,
                    'success'
                );
            }
        });

        this.eventBus.on('magic:playerHealed', (amount: number) => {
            this.uiManager.showNotification(
                `💚 Healed for ${amount} health`,
                'success'
            );
        });

        // Achievement System Integrations
        this.eventBus.on('achievement:rewardXP', (xp: number) => {
            this.gameState.addExperience(xp);
        });

        this.eventBus.on('achievement:rewardGold', (gold: number) => {
            // Add gold to inventory when currency system is implemented
            console.log(`💰 Awarded ${gold} gold from achievement`);
        });

        this.eventBus.on('achievement:achievementUnlocked', (data: any) => {
            // Show achievement notification
            this.uiManager.showNotification(
                `🏆 Achievement Unlocked: ${data.achievement.name}`,
                'success'
            );
            
            // Play achievement particle effect
            const playerPosition = this.playerController.getPosition();
            this.particleSystem.playEffect('levelup', playerPosition, 3);
        });

        // Audio System Integrations
        this.eventBus.on('combat:playerAttack', () => {
            this.audioSystem.playSoundEffect('sword_swing');
        });

        this.eventBus.on('combat:damageDealt', (data: any) => {
            if (data.target !== 'player') {
                this.audioSystem.playSoundEffect('sword_hit');
            } else {
                this.audioSystem.onPlayerHurt(data.damage.amount);
            }
        });

        this.eventBus.on('combat:enemyDefeated', () => {
            this.audioSystem.onEnemyDeath();
        });

        this.eventBus.on('interaction:chestOpened', () => {
            this.audioSystem.onChestOpen();
        });

        this.eventBus.on('interaction:itemPickedUp', () => {
            this.audioSystem.onItemPickup();
        });

        this.eventBus.on('enemy:enemySpawned', () => {
            // Start combat music when enemies are around
            if (this.audioSystem.getCurrentMusicTrack() !== 'combat') {
                this.audioSystem.onCombatStart();
            }
        });

        this.eventBus.on('enemy:allEnemiesDefeated', () => {
            // Return to exploration music when all enemies are defeated
            this.audioSystem.onCombatEnd();
        });

        this.eventBus.on('magic:spellCast', () => {
            this.audioSystem.playSoundEffect('magic_cast');
        });

        // Crafting System Integrations
        this.eventBus.on('crafting:completed', (data: any) => {
            this.uiManager.showNotification(
                `🔨 Crafted ${data.recipeName}!`,
                'success'
            );
            
            // Show experience gained
            if (data.experienceGained > 0) {
                this.uiManager.showNotification(
                    `⚡ +${data.experienceGained} ${data.skill} XP`,
                    'info'
                );
            }
        });

        this.eventBus.on('crafting:started', (data: any) => {
            this.uiManager.showNotification(
                `🔨 Crafting ${data.recipeName}... (${data.duration}s)`,
                'info'
            );
        });

        this.eventBus.on('crafting:cancelled', () => {
            this.uiManager.showNotification(
                '❌ Crafting cancelled',
                'warning'
            );
        });

        console.log('🚌 EventBus integrations set up');
    }
    
    private setupPlayerCombatInput(): void {
        window.addEventListener('playerAttack', () => {
            this.playerAttack();
        });
        
        window.addEventListener('playerInteract', () => {
            const playerPosition = this.playerController.getPosition();
            this.interactionSystem.interactWithNearest(playerPosition, this.gameState);
        });

        // Magic spell hotkeys
        window.addEventListener('keydown', (event) => {
            const playerPosition = this.playerController.getPosition();
            const forwardDirection = this.playerController.getForwardDirection();
            const spellTarget = playerPosition.clone().add(forwardDirection.multiplyScalar(10));

            switch (event.code) {
                case 'Digit1':
                    event.preventDefault();
                    this.magicSystem.castSpell('fireball', spellTarget);
                    break;
                case 'Digit2':
                    event.preventDefault();
                    this.magicSystem.castSpell('heal');
                    break;
                case 'Digit3':
                    event.preventDefault();
                    this.magicSystem.castSpell('lightning_bolt', spellTarget);
                    break;
                case 'Digit4':
                    event.preventDefault();
                    this.magicSystem.castSpell('ice_shard', spellTarget);
                    break;
                case 'Digit5':
                    event.preventDefault();
                    this.magicSystem.castSpell('shield');
                    break;
                case 'KeyC':
                    event.preventDefault();
                    this.openCraftingInterface();
                    break;
                case 'KeyX':
                    event.preventDefault();
                    this.magicSystem.cancelCurrentCast();
                    break;
            }
        });
    }

    private addWorldLighting(): void {
        // Add scattered torches around the world for atmosphere
        const torchPositions = [
            new THREE.Vector3(10, 2, 10),
            new THREE.Vector3(-15, 2, 8),
            new THREE.Vector3(20, 2, -12),
            new THREE.Vector3(-8, 2, -20),
            new THREE.Vector3(0, 2, 25),
            new THREE.Vector3(-25, 2, 0)
        ];
        
        torchPositions.forEach((position) => {
            this.lightingSystem.addTorchAt(position);
        });
        
        // Add a central campfire
        this.lightingSystem.addCampfireAt(new THREE.Vector3(0, 0.5, 0));
        
        // Add some magic crystals for mystical ambiance
        const crystalPositions = [
            new THREE.Vector3(15, 1, 15),
            new THREE.Vector3(-12, 1, 18),
            new THREE.Vector3(22, 1, -8)
        ];
        
        crystalPositions.forEach((position) => {
            this.lightingSystem.addCrystalAt(position);
        });
    }
    
    private addWorldWater(): void {
        // Add a central lake for visual appeal and immersion
        this.waterSystem.createWaterBody({
            width: 30,
            height: 30,
            position: new THREE.Vector3(-10, -0.5, 15),
            segments: 64,
            waveHeight: 0.3,
            waveSpeed: 1.2,
            color: 0x006994,
            transparency: 0.8,
            reflectivity: 0.7,
            flowDirection: (() => {
                try {
                    return new THREE.Vector2(0.3, 0.7);
                } catch (error) {
                    return { x: 0.3, y: 0.7 } as any;
                }
            })()
        });
        
        // Add a smaller pond near the spawn area
        this.waterSystem.createWaterBody({
            width: 15,
            height: 12,
            position: new THREE.Vector3(25, -0.3, -8),
            segments: 32,
            waveHeight: 0.2,
            waveSpeed: 0.8,
            color: 0x0099CC,
            transparency: 0.75,
            reflectivity: 0.6,
            flowDirection: (() => {
                try {
                    return new THREE.Vector2(1, 0);
                } catch (error) {
                    return { x: 1, y: 0 } as any;
                }
            })()
        });
        
        // Add a decorative stream
        this.waterSystem.createWaterBody({
            width: 40,
            height: 4,
            position: new THREE.Vector3(0, -0.4, -25),
            segments: 48,
            waveHeight: 0.15,
            waveSpeed: 1.8,
            color: 0x004488,
            transparency: 0.7,
            reflectivity: 0.5,
            flowDirection: (() => {
                try {
                    return new THREE.Vector2(1, 0.2);
                } catch (error) {
                    return { x: 1, y: 0.2 } as any;
                }
            })()
        });
        
        console.log('🌊 World water bodies added');
    }
    
    private addStartingCraftingMaterials(): void {
        // Add basic crafting materials to get players started
        const startingMaterials = [
            {
                id: 'iron_ingot',
                name: 'Iron Ingot',
                type: 'resource' as const,
                rarity: 'common' as const,
                quantity: 5,
                description: 'Refined iron ready for crafting',
                value: 15
            },
            {
                id: 'wood',
                name: 'Wood',
                type: 'resource' as const,
                rarity: 'common' as const,
                quantity: 8,
                description: 'Sturdy wood for crafting',
                value: 3
            },
            {
                id: 'leather',
                name: 'Leather',
                type: 'resource' as const,
                rarity: 'common' as const,
                quantity: 3,
                description: 'Tanned animal hide',
                value: 8
            },
            {
                id: 'healing_herb',
                name: 'Healing Herb',
                type: 'resource' as const,
                rarity: 'common' as const,
                quantity: 4,
                description: 'Natural herb with healing properties',
                value: 12
            },
            {
                id: 'crystal_essence',
                name: 'Crystal Essence',
                type: 'resource' as const,
                rarity: 'rare' as const,
                quantity: 2,
                description: 'Magical essence extracted from crystals',
                value: 50
            }
        ];

        startingMaterials.forEach(material => {
            this.gameState.addItem({
                ...material,
                properties: {
                    description: material.description,
                    value: material.value
                }
            });
        });

        console.log('🔨 Starting crafting materials added to inventory');
    }
    
    private setupStartingWeapon(): void {
        // Give the player a starting weapon
        const startingWeapon = this.weaponSystem.createWeapon('iron_sword');
        if (startingWeapon) {
            this.weaponSystem.equipWeapon(startingWeapon);
            
            // Add weapon visual to player (simplified - in a full game this would be on the player model)
            const playerPosition = this.playerController.getPosition();
            startingWeapon.getMesh().position.copy(playerPosition);
            startingWeapon.getMesh().position.y += 1;
            this.sceneManager.addToScene(startingWeapon.getMesh());
        }
    }

    // Public methods for combat interaction
    playerAttack(): boolean {
        const attackResult = this.combatSystem.playerAttack();
        
        // Emit EventBus event for weapon system integration and combat effects
        if (attackResult) {
            this.eventBus.emit('combat:playerAttack');
        }
        
        return attackResult;
    }
    
    canPlayerAttack(): boolean {
        return this.combatSystem.canPlayerAttack();
    }
    
    getPlayerAttackCooldown(): number {
        return this.combatSystem.getPlayerAttackCooldown();
    }

    // Public methods for UI interaction
    toggleMenu(): void {
        const menu = document.getElementById('menu');
        if (menu) {
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    async saveGame(): Promise<void> {
        await this.saveSystem.saveGame(this.gameState);
        console.log('💾 Game saved');
    }
    
    async loadGame(): Promise<void> {
        await this.saveSystem.loadGame(this.gameState);
        console.log('📂 Game loaded');
    }
    
    openCraftingInterface(): void {
        const playerPosition = this.playerController.getPosition();
        const nearbyStations = this.craftingSystem.getStationsInRange(playerPosition, 10);
        
        if (nearbyStations.length === 0) {
            this.uiManager.showNotification(
                '🔨 No crafting stations nearby',
                'warning'
            );
            return;
        }
        
        // Get craftable recipes
        const craftableRecipes = this.craftingSystem.getCraftableRecipes();
        
        if (craftableRecipes.length === 0) {
            this.uiManager.showNotification(
                '🔨 No recipes available with current materials',
                'info'
            );
        } else {
            this.uiManager.showNotification(
                `🔨 Found ${craftableRecipes.length} craftable recipes at nearby stations`,
                'success'
            );
            
            // In a full implementation, this would open a crafting UI
            // For now, just show the first available recipe as a demo
            const firstRecipe = craftableRecipes[0];
            console.log(`🔨 Available recipe: ${firstRecipe.name} - ${firstRecipe.description}`);
            
            // Try to craft the first available recipe as demonstration
            if (this.craftingSystem.canCraftRecipe(firstRecipe.id)) {
                this.craftingSystem.startCrafting(firstRecipe.id, playerPosition);
            }
        }
    }
    
    /**
     * Register character models with LOD system for performance optimization
     */
    private registerCharacterModelsWithLOD(): void {
        // Register player character
        const player = this.playerController.getPlayer();
        this.lodSystem.registerObject('player', player, {
            highDetail: 15,   // Player should be detailed up close
            mediumDetail: 30,
            lowDetail: 60,
            cullDistance: 100
        });
        
        // Register enemy characters
        this.enemySystem.getAllEnemies().forEach((enemy, index) => {
            if (enemy.mesh) {
                this.lodSystem.registerObject(`enemy_${index}`, enemy.mesh, {
                    highDetail: 20,   // Enemies can be slightly less detailed
                    mediumDetail: 40,
                    lowDetail: 80,
                    cullDistance: 120
                });
            }
        });
        
        console.log('🎯 Character models registered with LOD system for performance optimization');
    }
    
    start(): void {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('🎯 Game loop started');
    }
    
    stop(): void {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Cleanup water system resources
        this.waterSystem.cleanup();
        
        // Cleanup audio system resources
        this.audioSystem.cleanup();
        
        // Cleanup crafting system resources
        this.craftingSystem.cleanup();
        
        console.log('⏸️ Game stopped');
    }
    
    private gameLoop(): void {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;
        
        // Cap delta time to prevent large jumps
        const cappedDeltaTime = Math.min(deltaTime, 1/30);
        
        // Update all systems
        this.update(cappedDeltaTime);
        
        // Render the scene
        this.render();
        
        // Continue the loop
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    private update(deltaTime: number): void {
        // Update input
        this.inputManager.update();
        
        // Update player
        this.playerController.update(deltaTime);
        
        // Update game state
        this.gameState.update(deltaTime);
        
        // Update environmental systems
        this.weatherSystem.update(deltaTime);
        this.dayNightCycle.update(deltaTime);
        
        // Update lighting system with time of day
        const currentTime = this.dayNightCycle.getCurrentTime();
        this.lightingSystem.updateTimeOfDay(currentTime);
        this.lightingSystem.update(deltaTime);
        
        // Update particle system
        this.particleSystem.update(deltaTime);
        
        // Update magic system
        this.magicSystem.update(deltaTime);
        
        // Update combat and enemy systems
        const playerPosition = this.playerController.getPosition();
        this.combatSystem.updatePlayerPosition(playerPosition);
        this.combatSystem.update(deltaTime);
        this.enemySystem.update(deltaTime, playerPosition);
        this.interactionSystem.update(deltaTime);
        
        // Update LOD system for performance optimization
        this.lodSystem.updatePlayerPosition(playerPosition);
        this.lodSystem.update();
        
        // Update water system for wave animations and reflections
        this.waterSystem.update(deltaTime);
        
        // Update audio system for 3D spatial audio
        this.audioSystem.update(deltaTime);
        
        // Update crafting system for recipe progress
        this.craftingSystem.update(deltaTime);
        
        // Update scene
        this.sceneManager.update(deltaTime);
        
        // Update UI
        const nearbyEnemies = this.enemySystem.getEnemiesInRange(playerPosition, 15);
        const combatInfo = {
            enemyCount: nearbyEnemies.length,
            attackCooldown: this.combatSystem.getPlayerAttackCooldown()
        };
        
        const nearbyInteractables = this.interactionSystem.getInteractablesInRange(playerPosition, 3);
        const interactionInfo = {
            nearbyInteractables
        };
        
        this.uiManager.update(this.gameState, combatInfo, interactionInfo);
    }
    
    private render(): void {
        this.sceneManager.render();
    }
    
    private onWindowResize(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.renderer.setSize(width, height);
        this.sceneManager.onResize(width, height);
    }
    
    private onVisibilityChange(): void {
        if (document.hidden) {
            this.stop();
        } else {
            this.start();
        }
    }
    
    // Getters for system access
    getRenderer(): THREE.WebGLRenderer { return this.renderer; }
    getSceneManager(): SceneManager { return this.sceneManager; }
    getInputManager(): InputManager { return this.inputManager; }
    getGameState(): GameState { return this.gameState; }
    getPlayerController(): PlayerController { return this.playerController; }
    getCombatSystem(): CombatSystem { return this.combatSystem; }
    getEnemySystem(): EnemySystem { return this.enemySystem; }
    getInteractionSystem(): InteractionSystem { return this.interactionSystem; }
    getParticleSystem(): ParticleSystem { return this.particleSystem; }
    getLightingSystem(): LightingSystem { return this.lightingSystem; }
    getWeaponSystem(): WeaponSystem { return this.weaponSystem; }
    getAchievementSystem(): AchievementSystem { return this.achievementSystem; }
    getMagicSystem(): MagicSystem { return this.magicSystem; }
}