import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { InputManager } from './InputManager';
import { UIManager } from '../ui/UIManager';
import { PlayerController } from '../systems/PlayerController';
import { GameState } from './GameState';
import { WeatherSystem } from '../systems/WeatherSystem';
import { DayNightCycle } from '../systems/DayNightCycle';
import { SaveSystem } from '../systems/SaveSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { InteractionSystem } from '../systems/InteractionSystem';

export class Game {
    private canvas: HTMLCanvasElement;
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
    
    private isRunning: boolean = false;
    private lastTime: number = 0;
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        
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
        
        // Add player to scene
        const player = this.playerController.getPlayer();
        this.sceneManager.addToScene(player);
        
        // Initialize weather and day/night cycle
        this.weatherSystem.initialize(this.sceneManager.getScene());
        this.dayNightCycle.initialize(this.sceneManager.getScene());
        
        // Initialize combat and enemy systems
        this.combatSystem.initialize(this.sceneManager.getScene(), this.gameState);
        this.enemySystem.initialize(this.sceneManager.getScene());
        this.interactionSystem.initialize(this.sceneManager.getScene());
        
        // Set up system integrations
        this.setupCombatIntegration();
        this.setupInteractionIntegration();
        
        // Set up player combat input
        this.setupPlayerCombatInput();
        
        // Load saved game if available
        await this.saveSystem.loadGame(this.gameState);
        
        console.log('✅ Game systems initialized');
        
        // Start the game loop
        this.start();
    }
    
    private setupCombatIntegration(): void {
        // Connect enemy system to combat system
        this.enemySystem.on('enemySpawned', (enemy: any) => {
            this.combatSystem.addEnemy(enemy.id, enemy.position, {
                health: enemy.health,
                maxHealth: enemy.maxHealth,
                attackPower: enemy.attackPower,
                defense: enemy.defense,
                attackRange: enemy.attackRange
            });
        });
        
        this.enemySystem.on('enemyKilled', (data: any) => {
            this.combatSystem.removeEnemy(data.enemyId);
        });
        
        this.enemySystem.on('enemyAttack', (data: any) => {
            this.combatSystem.dealDamage('player', {
                amount: data.damage,
                type: 'physical',
                source: data.enemyId,
                critical: false
            });
        });
        
        // Connect combat system to enemy system  
        this.combatSystem.on('damageDealt', (data: any) => {
            if (data.target !== 'player') {
                this.enemySystem.damageEnemy(data.target, data.damage.amount);
            }
        });
        
        this.combatSystem.on('enemyDefeated', () => {
            // Enemy system handles its own cleanup
        });
    }
    
    private setupPlayerCombatInput(): void {
        window.addEventListener('playerAttack', () => {
            this.playerAttack();
        });
        
        window.addEventListener('playerInteract', () => {
            const playerPosition = this.playerController.getPosition();
            this.interactionSystem.interactWithNearest(playerPosition, this.gameState);
        });
    }
    
    private setupInteractionIntegration(): void {
        this.interactionSystem.on('chestOpened', (data: any) => {
            console.log(`🎯 Opened chest with ${data.items.length} items`);
        });
        
        this.interactionSystem.on('resourceHarvested', (data: any) => {
            console.log(`🎯 Harvested ${data.resourceType}, ${data.remaining} remaining`);
        });
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
        requestAnimationFrame(() => this.gameLoop());
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
        
        // Update combat and enemy systems
        const playerPosition = this.playerController.getPosition();
        this.combatSystem.updatePlayerPosition(playerPosition);
        this.combatSystem.update(deltaTime);
        this.enemySystem.update(deltaTime, playerPosition);
        this.interactionSystem.update(deltaTime);
        
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
    
    // Combat methods for UI integration
    playerAttack(): boolean {
        return this.combatSystem.playerAttack();
    }
    
    canPlayerAttack(): boolean {
        return this.combatSystem.canPlayerAttack();
    }
    
    getPlayerAttackCooldown(): number {
        return this.combatSystem.getPlayerAttackCooldown();
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
}