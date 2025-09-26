import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { InputManager } from './InputManager';
import { UIManager } from '../ui/UIManager';
import { PlayerController } from '../systems/PlayerController';
import { GameState } from './GameState';
import { WeatherSystem } from '../systems/WeatherSystem';
import { DayNightCycle } from '../systems/DayNightCycle';
import { SaveSystem } from '../systems/SaveSystem';

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
        
        // Load saved game if available
        await this.saveSystem.loadGame(this.gameState);
        
        console.log('✅ Game systems initialized');
        
        // Start the game loop
        this.start();
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
        
        // Update scene
        this.sceneManager.update(deltaTime);
        
        // Update UI
        this.uiManager.update(this.gameState);
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
    
    // Getters for system access
    getRenderer(): THREE.WebGLRenderer { return this.renderer; }
    getSceneManager(): SceneManager { return this.sceneManager; }
    getInputManager(): InputManager { return this.inputManager; }
    getGameState(): GameState { return this.gameState; }
    getPlayerController(): PlayerController { return this.playerController; }
}