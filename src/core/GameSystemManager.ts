import { GameState } from '@core/GameState';
import { SceneManager } from '@core/SceneManager';
import { EventBus } from '@core/EventBus';
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

/**
 * Interface defining the contract for initializable game systems
 * Following Interface Segregation Principle - only methods that are needed
 */
export interface IInitializable {
    initialize(...args: any[]): void | Promise<void>;
}

/**
 * Interface defining the contract for updatable game systems
 */
export interface IUpdatable {
    update(deltaTime: number): void;
}

/**
 * Interface defining the contract for cleanable game systems
 */
export interface ICleanable {
    cleanup(): void;
}

/**
 * System lifecycle management following Single Responsibility Principle
 * Handles initialization, updates, and cleanup of all game systems
 */
export class GameSystemManager {
    private systems: Map<string, any> = new Map();
    private updatableSystems: IUpdatable[] = [];
    private cleanableSystems: ICleanable[] = [];
    
    private sceneManager: SceneManager;
    private gameState: GameState;
    
    constructor(_eventBus: EventBus, sceneManager: SceneManager, gameState: GameState) {
        // EventBus available for future use in system communication
        this.sceneManager = sceneManager;
        this.gameState = gameState;
        
        this.initializeSystems();
    }
    
    /**
     * Creates all game systems - following Dependency Inversion Principle
     * High-level GameSystemManager doesn't depend on concrete system implementations
     */
    private initializeSystems(): void {
        // Create systems
        const weatherSystem = new WeatherSystem();
        const dayNightCycle = new DayNightCycle();
        const saveSystem = new SaveSystem();
        const combatSystem = new CombatSystem();
        const enemySystem = new EnemySystem();
        const interactionSystem = new InteractionSystem();
        const particleSystem = new ParticleSystem();
        const lightingSystem = new LightingSystem();
        const weaponSystem = new WeaponSystem();
        const achievementSystem = new AchievementSystem();
        const magicSystem = new MagicSystem();
        const lodSystem = new LODSystem();
        
        // Register systems
        this.registerSystem('weather', weatherSystem);
        this.registerSystem('dayNight', dayNightCycle);
        this.registerSystem('save', saveSystem);
        this.registerSystem('combat', combatSystem);
        this.registerSystem('enemy', enemySystem);
        this.registerSystem('interaction', interactionSystem);
        this.registerSystem('particle', particleSystem);
        this.registerSystem('lighting', lightingSystem);
        this.registerSystem('weapon', weaponSystem);
        this.registerSystem('achievement', achievementSystem);
        this.registerSystem('magic', magicSystem);
        this.registerSystem('lod', lodSystem);
    }
    
    /**
     * Register a system and categorize it by its capabilities
     * Following Interface Segregation Principle
     */
    private registerSystem(name: string, system: any): void {
        this.systems.set(name, system);
        
        // Only add to updatable if it implements IUpdatable
        if (this.implementsInterface(system, 'update')) {
            this.updatableSystems.push(system as IUpdatable);
        }
        
        // Only add to cleanable if it implements ICleanable
        if (this.implementsInterface(system, 'cleanup')) {
            this.cleanableSystems.push(system as ICleanable);
        }
    }
    
    /**
     * Type-safe interface checking
     */
    private implementsInterface(obj: any, method: string): boolean {
        return typeof obj[method] === 'function';
    }
    
    /**
     * Initialize all systems in the correct order
     * Following dependency order to ensure proper initialization
     */
    async initializeAllSystems(): Promise<void> {
        const scene = this.sceneManager.getScene();
        const camera = this.sceneManager.getCamera();
        
        // Phase 1: Initialize core systems first
        const particleSystem = this.getSystem<ParticleSystem>('particle');
        particleSystem.initialize(scene);
        
        // Phase 2: Initialize systems that depend on particle system
        const weatherSystem = this.getSystem<WeatherSystem>('weather');
        const dayNightCycle = this.getSystem<DayNightCycle>('dayNight');
        const lightingSystem = this.getSystem<LightingSystem>('lighting');
        
        weatherSystem.initialize(scene, particleSystem);
        dayNightCycle.initialize(scene);
        lightingSystem.initialize(scene);
        
        // Phase 3: Initialize game logic systems
        const weaponSystem = this.getSystem<WeaponSystem>('weapon');
        const achievementSystem = this.getSystem<AchievementSystem>('achievement');
        const magicSystem = this.getSystem<MagicSystem>('magic');
        const combatSystem = this.getSystem<CombatSystem>('combat');
        
        weaponSystem.initialize();
        achievementSystem.initialize();
        magicSystem.initialize(scene, this.gameState, particleSystem);
        combatSystem.initialize(scene, this.gameState);
        
        // Phase 4: Initialize systems that depend on combat
        const enemySystem = this.getSystem<EnemySystem>('enemy');
        const interactionSystem = this.getSystem<InteractionSystem>('interaction');
        const lodSystem = this.getSystem<LODSystem>('lod');
        
        enemySystem.initialize(scene);
        interactionSystem.initialize(scene);
        lodSystem.initialize(scene, camera);
        
        console.log('🎮 All game systems initialized successfully');
    }
    
    /**
     * Get a specific system by name with type safety
     */
    getSystem<T>(name: string): T {
        const system = this.systems.get(name);
        if (!system) {
            throw new Error(`System '${name}' not found`);
        }
        return system as T;
    }
    
    /**
     * Update all updatable systems
     */
    update(deltaTime: number): void {
        for (const system of this.updatableSystems) {
            system.update(deltaTime);
        }
    }
    
    /**
     * Clean up all systems
     */
    cleanup(): void {
        for (const system of this.cleanableSystems) {
            system.cleanup();
        }
        
        this.systems.clear();
        this.updatableSystems.length = 0;
        this.cleanableSystems.length = 0;
    }
    
    /**
     * Get all systems for external access if needed
     */
    getAllSystems(): ReadonlyMap<string, any> {
        return this.systems;
    }
}