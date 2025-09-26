# Copilot RPG - AI Coding Assistant Prompts

This file contains specific prompts and context for AI coding assistants working on the Copilot RPG project.

## Project Context

You are working on **Copilot RPG**, a comprehensive single-player 3D RPG built with:
- **TypeScript** for type safety and maintainability
- **Three.js** for 3D graphics and WebGL rendering
- **Vite** for fast development and build tooling
- **Modular architecture** with event-driven communication

## Current Implementation Status

✅ **Completed Systems:**
- 3D world with procedural terrain, trees, and rocks
- Player character with third-person movement and camera
- Health/mana/stamina system with regeneration
- Character progression (XP, levels, skill trees)
- Weather system (rain, snow, fog, storms)
- Day/night cycle with dynamic lighting
- Save/load system with multiple slots
- Professional UI with HUD, minimap, and menus
- Input handling (keyboard/mouse + gamepad support)

## Code Generation Guidelines

### When adding new features, always:

1. **Follow TypeScript patterns** with proper interfaces and types
2. **Use the existing architecture** - don't reinvent core systems
3. **Add proper error handling** and console logging with emojis
4. **Emit events** for system communication instead of direct coupling
5. **Include cleanup methods** for resource management
6. **Test in development mode** before finalizing

### Example Prompts for Common Tasks

#### Adding a New Game System
```
Create a new game system for [SYSTEM_NAME] following the existing pattern in src/systems/. 
The system should:
- Initialize with scene dependencies
- Have an update(deltaTime) method
- Use event emission for communication
- Include proper TypeScript interfaces
- Follow the console logging pattern with appropriate emoji
- Integrate with the main Game class
```

#### Extending Character Abilities
```
Add a new ability system to the player character that:
- Integrates with the existing skill system
- Uses mana/stamina costs
- Has cooldown mechanics
- Emits events for UI updates
- Follows the existing PlayerController patterns
```

#### Creating UI Components
```
Create a new UI component for [FEATURE] that:
- Integrates with the existing UIManager
- Uses the established CSS styling patterns
- Updates based on GameState events
- Includes responsive design principles
- Has proper cleanup methods
```

#### Adding Environmental Features
```
Add [ENVIRONMENTAL_FEATURE] to the 3D world that:
- Uses Three.js best practices
- Integrates with the SceneManager
- Has proper shadow casting/receiving
- Uses efficient geometry and materials
- Follows the procedural generation patterns
```

## Specific Implementation Patterns

### Game System Template
When creating new systems, use this structure:

```typescript
import * as THREE from 'three';

export class [SystemName] {
    private scene: THREE.Scene | null = null;
    private initialized: boolean = false;
    
    initialize(scene: THREE.Scene): void {
        this.scene = scene;
        this.setupSystem();
        this.initialized = true;
        console.log('🎮 [SystemName] initialized');
    }
    
    private setupSystem(): void {
        // Initialization logic here
    }
    
    update(deltaTime: number): void {
        if (!this.initialized || !this.scene) return;
        // Update logic here
    }
    
    cleanup(): void {
        // Cleanup resources
        this.initialized = false;
    }
}
```

### Event Integration
Always use events for system communication:

```typescript
// In Game.ts, connect system events
this.gameState.on('levelUp', (level) => {
    this.uiManager.showLevelUpAnimation();
    this.playerController.onLevelUp(level);
});
```

### Three.js Object Creation
Follow these patterns for 3D objects:

```typescript
private createGameObject(): THREE.Group {
    const group = new THREE.Group();
    
    // Create geometry and materials
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Configure shadows
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    group.add(mesh);
    return group;
}
```

### UI Update Patterns
Use efficient DOM updates:

```typescript
private updateUI(): void {
    // Batch DOM updates
    const healthPercent = (this.health / this.maxHealth) * 100;
    this.healthBar.style.width = `${healthPercent}%`;
    
    // Use requestAnimationFrame for smooth animations
    requestAnimationFrame(() => {
        this.element.classList.add('updated');
    });
}
```

## Performance Considerations

### Always consider:
- **Object pooling** for frequently created/destroyed objects
- **Efficient geometry** - avoid high poly counts for distant objects
- **Texture optimization** - use appropriate sizes and formats
- **Event listener cleanup** - prevent memory leaks
- **Delta time capping** - prevent large frame jumps

### Memory Management
```typescript
// Proper Three.js cleanup
dispose(): void {
    if (this.mesh) {
        this.mesh.geometry.dispose();
        if (this.mesh.material instanceof THREE.Material) {
            this.mesh.material.dispose();
        }
        this.scene?.remove(this.mesh);
    }
}
```

## Testing and Validation

### Development Testing Checklist:
- [ ] System initializes without errors
- [ ] Game loop maintains 60fps
- [ ] No memory leaks in dev tools
- [ ] All interactions work as expected
- [ ] Save/load preserves state correctly
- [ ] UI updates reflect game state changes

### Console Logging Standards:
```typescript
console.log('🎮 Game system events');
console.log('⚔️ Combat and abilities');
console.log('🌍 World and environment');
console.log('🎯 Achievements and progress');
console.log('💾 Save/load operations');
console.log('🌦️ Weather changes');
console.log('☀️ Day/night cycle');
console.log('🎨 UI updates');
console.log('🔧 Debug information');
```

## Integration Points

### Key files to understand:
- `src/core/Game.ts` - Main game loop and system coordination
- `src/core/GameState.ts` - Central state management and events
- `src/core/SceneManager.ts` - 3D scene and object management
- `src/systems/PlayerController.ts` - Player movement and interaction
- `src/ui/UIManager.ts` - UI updates and event handling

### Common extension patterns:
1. **New abilities**: Extend PlayerController and add to skill system
2. **Environmental objects**: Add to SceneManager's terrain generation
3. **UI elements**: Extend UIManager with new components
4. **Game mechanics**: Create new system and integrate with Game.ts
5. **Content**: Add items, quests, or NPCs through GameState

## Quality Standards

### Code should always:
- Be strongly typed with TypeScript
- Include comprehensive error handling
- Follow existing naming conventions
- Have proper documentation comments
- Use consistent formatting and style
- Include appropriate unit tests (when framework exists)

### Architecture should:
- Maintain separation of concerns
- Use dependency injection where appropriate
- Emit events for loose coupling
- Support easy testing and debugging
- Be easily extensible for new features

This context should help you generate code that fits seamlessly into the existing Copilot RPG architecture while maintaining high quality and performance standards.