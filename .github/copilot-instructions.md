# GitHub Copilot Instructions for Copilot RPG

This document provides context and coding guidelines for GitHub Copilot when working on the Copilot RPG project - a comprehensive 3D RPG built with TypeScript and Three.js.

## Project Overview

Copilot RPG is a single-player 3D RPG featuring:
- Open world exploration with procedural terrain
- Real-time combat system with health/mana/stamina mechanics
- Character progression with XP, levels, and skill trees
- Dynamic weather and day/night cycles
- Comprehensive inventory and equipment system
- Quest system with branching objectives
- Save/load functionality with multiple slots

## Architecture Patterns

### Core Systems Architecture
The game follows a modular system design with clear separation of concerns:

```
src/
├── core/           # Game engine components
├── systems/        # Game systems (Weather, Combat, etc.)
├── components/     # Reusable game components
├── ui/            # User interface management
├── assets/        # Game assets and resources
└── utils/         # Utility functions
```

### Key Design Principles

1. **Event-Driven Communication**: Systems communicate via event emitters, not direct references
2. **Modular Design**: Each system is independent and can be easily extended or replaced
3. **TypeScript First**: All code is strongly typed with comprehensive interfaces
4. **Performance Focused**: Efficient game loops, object pooling, and optimized rendering

## Coding Standards

### TypeScript Patterns

#### System Classes
All game systems follow this pattern:
```typescript
export class SystemName {
    private initialized: boolean = false;
    
    initialize(dependencies: Dependencies): void {
        // System initialization logic
        this.initialized = true;
        console.log('🎯 SystemName initialized');
    }
    
    update(deltaTime: number): void {
        if (!this.initialized) return;
        // Update logic here
    }
    
    cleanup(): void {
        // Cleanup resources
    }
}
```

#### Event-Driven Communication
```typescript
// Event emitter pattern for system communication
private eventListeners: { [event: string]: Function[] } = {};

on(event: string, callback: Function): void {
    if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
}

private emit(event: string, data?: any): void {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event].forEach(callback => callback(data));
}
```

#### State Management
```typescript
// Game state with serialization support
export interface GameStateData {
    // Define all serializable state properties
}

export class GameState {
    serialize(): string {
        return JSON.stringify(this.getData());
    }
    
    deserialize(data: string): void {
        const parsed = JSON.parse(data);
        this.loadData(parsed);
    }
}
```

### Three.js Integration

#### Scene Management
- Use `SceneManager` for centralized scene operations
- All 3D objects should be added through `SceneManager.addToScene()`
- Implement proper cleanup with `removeFromScene()`

#### Performance Optimizations
- Use object pooling for frequently created/destroyed objects
- Implement LOD (Level of Detail) for distant objects
- Use `requestAnimationFrame` with capped delta time

### UI Patterns

#### UI Manager Structure
```typescript
export class UIManager {
    private elements: { [key: string]: HTMLElement } = {};
    
    initialize(gameState: GameState): void {
        this.cacheElements();
        this.setupEventListeners();
    }
    
    private cacheElements(): void {
        // Cache all UI elements for performance
    }
    
    update(gameState: GameState): void {
        // Update UI based on game state
    }
}
```

## Specific Implementation Guidelines

### Adding New Game Systems

When creating new game systems:

1. **Create in `src/systems/` directory**
2. **Follow the System class pattern above**
3. **Add initialization to `Game.ts`**
4. **Use event-driven communication**
5. **Include proper TypeScript interfaces**

Example:
```typescript
// src/systems/NewSystem.ts
export class NewSystem {
    private scene: THREE.Scene | null = null;
    
    initialize(scene: THREE.Scene): void {
        this.scene = scene;
        console.log('🎮 NewSystem initialized');
    }
    
    update(deltaTime: number): void {
        // System update logic
    }
}

// Add to Game.ts constructor:
this.newSystem = new NewSystem();

// Add to Game.initialize():
this.newSystem.initialize(this.sceneManager.getScene());
```

### Character and Combat Systems

#### Player Controller Pattern
- Movement handling in `update()` method with delta time
- Input processing through `InputManager`
- Physics integration with position updates
- Camera management for third-person perspective

#### Combat System Integration
```typescript
// Combat actions should emit events
this.emit('damageDealt', { target, amount, type });
this.emit('playerDied');
this.emit('enemyDefeated', enemy);

// Health/mana/stamina management
private updateResources(deltaTime: number): void {
    // Regeneration logic with proper capping
    this.stamina = Math.min(this.maxStamina, this.stamina + regenRate * deltaTime);
}
```

### Weather and Environmental Systems

#### Weather System Pattern
```typescript
export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'storm';

// Weather changes should be gradual with transitions
private updateWeatherTransition(deltaTime: number): void {
    // Smooth interpolation between weather states
}
```

#### Day/Night Cycle
- Use time-based lighting changes
- Implement smooth color transitions
- Update sun position based on time of day

### Save System Integration

#### Serialization Pattern
All game systems that need persistence should implement:
```typescript
interface Serializable {
    serialize(): any;
    deserialize(data: any): void;
}
```

## Performance Guidelines

### Optimization Practices

1. **Frame Rate Management**
   - Cap delta time to prevent large jumps
   - Use `requestAnimationFrame` for smooth rendering
   - Monitor performance with dev tools

2. **Memory Management**
   - Dispose of Three.js objects properly
   - Use object pooling for particles
   - Clear event listeners on cleanup

3. **Rendering Optimization**
   - Enable frustum culling
   - Use shadow map optimization
   - Implement texture streaming for large worlds

### Testing and Quality

#### Console Logging Pattern
Use emoji prefixes for different systems:
```typescript
console.log('🎮 Game system message');
console.log('🌍 World/Scene message');
console.log('⚔️ Combat message');
console.log('🎯 Achievement/Progress message');
console.log('💾 Save/Load message');
console.log('🌦️ Weather message');
console.log('☀️ Day/Night message');
```

## Common Patterns and Utilities

### Vector and Math Operations
```typescript
// Common Three.js vector operations
const moveVector = new THREE.Vector3();
moveVector.normalize();
position.add(moveVector.multiplyScalar(speed * deltaTime));
```

### Input Handling
```typescript
// Key state checking
if (inputManager.isKeyPressed('KeyW')) {
    // Handle forward movement
}

// Mouse delta for camera
const mouseDelta = inputManager.getMouseDelta();
cameraRotation.y -= mouseDelta.x * sensitivity;
```

### UI Updates
```typescript
// Efficient UI updates
private updateHealthDisplay(): void {
    const healthPercentage = (health / maxHealth) * 100;
    this.healthBar.style.width = `${healthPercentage}%`;
}
```

## Extension Points

The current architecture supports easy extension in these areas:

1. **New Skill Trees**: Add to `GameState.skills` object
2. **Additional Weather Types**: Extend `WeatherType` union
3. **New Item Types**: Extend `InventoryItem` interface
4. **Quest Types**: Add to quest system with new objective types
5. **Combat Mechanics**: Event-driven system supports new abilities
6. **UI Components**: Modular UI manager supports new interfaces

## Development Workflow

1. **Create feature branch**: `git checkout -b feature/new-system`
2. **Implement with TypeScript**: Follow patterns above
3. **Test in development**: `npm run dev`
4. **Lint code**: `npm run lint`
5. **Build for production**: `npm run build`
6. **Update documentation**: Include new features in README

This architecture provides a solid foundation for expanding the RPG with new features while maintaining code quality and performance.