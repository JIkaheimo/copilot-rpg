# GitHub Copilot Development Guide for Copilot RPG

This guide provides specific instructions for using GitHub Copilot effectively when developing the Copilot RPG project.

## Getting Started with Copilot on this Project

### 1. Setup Your Environment

Ensure you have GitHub Copilot enabled in your IDE and familiarize yourself with the project structure:

```bash
# Install dependencies
npm install

# Start development server  
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

### 2. Understanding the Codebase

Before using Copilot to generate code, understand these key concepts:

- **Event-driven architecture**: Systems communicate via events, not direct method calls
- **Modular design**: Each system is independent with clear interfaces
- **TypeScript-first**: All code uses strong typing and interfaces
- **Three.js integration**: 3D world managed through SceneManager
- **Performance focus**: Efficient game loops and resource management

## Effective Copilot Prompts

### System Development

#### Creating New Game Systems
```typescript
// Prompt: Create a magic system that integrates with existing player stats
// Context: Player has mana, spell casting should use mana and have cooldowns
export class MagicSystem {
    // Copilot will suggest implementation following existing patterns
}
```

#### Extending Player Abilities  
```typescript
// Prompt: Add stealth ability that affects player visibility and movement speed
// Context: Should integrate with existing PlayerController and use stamina
private handleStealthInput(input: InputManager): void {
    // Copilot will generate stealth mechanics
}
```

### 3D World Development

#### Environmental Objects
```typescript
// Prompt: Create interactive treasure chest that opens when player approaches
// Context: Should use Three.js, have animations, and integrate with inventory
private createTreasureChest(position: THREE.Vector3): THREE.Group {
    // Copilot will create 3D object with interaction logic
}
```

#### Procedural Generation
```typescript
// Prompt: Generate random dungeon layout with rooms and corridors
// Context: Use existing terrain patterns, should return Three.js objects
private generateDungeon(size: number): THREE.Group[] {
    // Copilot will create dungeon generation logic
}
```

### UI Development

#### HUD Components
```typescript
// Prompt: Create skill cooldown indicators for the HUD
// Context: Should integrate with UIManager and update based on game events
private createSkillCooldownUI(): void {
    // Copilot will generate UI elements and update logic
}
```

#### Menu Systems
```typescript
// Prompt: Create inventory grid UI with drag and drop functionality
// Context: Should show items from GameState and handle equipment changes
private createInventoryGrid(): void {
    // Copilot will generate inventory interface
}
```

## Best Practices for Copilot Usage

### 1. Provide Context Comments

Always include context about the existing system:

```typescript
// Context: This integrates with the existing WeatherSystem
// The weather affects player movement speed and visibility
// Weather types: 'clear' | 'rain' | 'snow' | 'fog' | 'storm'
private applyWeatherEffects(weather: WeatherType): void {
    // Copilot suggestions will be more accurate
}
```

### 2. Reference Existing Patterns

Point Copilot to similar existing code:

```typescript
// Follow the same pattern as PlayerController.handleInput()
// Use InputManager.isKeyPressed() for input checking
// Emit events for state changes like this.emit('actionPerformed')
private handleCombatInput(deltaTime: number): void {
    // Copilot will follow established patterns
}
```

### 3. Specify Integration Points

Be explicit about how new code should integrate:

```typescript
// This should be called from Game.update() after player updates
// Should modify this.gameState.player stats
// Should emit 'questProgress' event when objectives complete
updateActiveQuests(deltaTime: number): void {
    // Copilot will create proper integration
}
```

## Common Code Generation Scenarios

### 1. Adding New RPG Mechanics

#### Character Stats and Progression
```typescript
// Prompt: Add skill tree for archery with accuracy and damage bonuses
// Context: Integrate with existing skill system in GameState
interface ArcherySkills {
    // Copilot will suggest skill properties
}
```

#### Combat Abilities
```typescript
// Prompt: Create fireball spell with projectile physics and area damage
// Context: Use Three.js for visual effects, integrate with combat system
class Fireball {
    // Copilot will create spell implementation
}
```

### 2. Enhancing 3D World

#### Interactive Objects
```typescript
// Prompt: Create merchant NPC with dialogue and trading interface
// Context: Should have 3D model, respond to player interaction, show UI
class MerchantNPC {
    // Copilot will generate NPC behavior
}
```

#### Environmental Effects
```typescript
// Prompt: Add particle system for magical portal effects
// Context: Use Three.js particles, should animate and teleport player
private createPortalEffect(): THREE.Points {
    // Copilot will create particle effects
}
```

### 3. UI Enhancements

#### Game Menus
```typescript
// Prompt: Create settings menu with graphics and audio options
// Context: Should persist settings and apply changes immediately
class SettingsMenu {
    // Copilot will create settings interface
}
```

#### Status Displays
```typescript
// Prompt: Add buff/debuff status icons above health bar
// Context: Should show active effects with timers and tooltips
private updateStatusEffects(effects: StatusEffect[]): void {
    // Copilot will create status display logic
}
```

## Debugging and Testing with Copilot

### 1. Generate Test Cases

```typescript
// Prompt: Create test cases for the save system with edge cases
// Context: Should test serialization, corruption handling, version compatibility
describe('SaveSystem', () => {
    // Copilot will generate comprehensive tests
});
```

### 2. Add Debug Utilities

```typescript
// Prompt: Create debug overlay showing player stats and system performance
// Context: Should toggle with key press, show FPS, memory usage, player state
class DebugOverlay {
    // Copilot will create debug tools
}
```

### 3. Error Handling

```typescript
// Prompt: Add comprehensive error handling for Three.js resource loading
// Context: Should handle missing textures, geometry errors, memory limits
private handleResourceError(error: Error): void {
    // Copilot will create error recovery logic
}
```

## Advanced Copilot Techniques

### 1. Algorithm Implementation

When you need complex algorithms, provide mathematical context:

```typescript
// Prompt: Implement A* pathfinding for NPC navigation
// Context: Grid-based world, obstacles are trees/rocks, NPCs should avoid player
class Pathfinding {
    // Copilot will implement A* algorithm
}
```

### 2. Performance Optimization

```typescript
// Prompt: Optimize particle system using object pooling
// Context: Reduce garbage collection, reuse particle objects, maintain 60fps
class ParticlePool {
    // Copilot will create optimized particle management
}
```

### 3. Shader Development

```typescript
// Prompt: Create custom shader for water surface with reflection and waves
// Context: Use Three.js ShaderMaterial, should integrate with existing lighting
const waterShader = {
    // Copilot will generate GLSL shader code
};
```

## Code Review and Quality

### Before Accepting Copilot Suggestions:

1. **Check TypeScript compliance** - Ensure proper typing
2. **Verify integration** - Does it follow existing patterns?
3. **Test functionality** - Run in development mode
4. **Performance impact** - Check frame rate and memory usage
5. **Error cases** - Consider edge cases and error handling

### Refining Suggestions:

```typescript
// If Copilot suggests something that doesn't fit:
// Add more specific context and regenerate

// Original prompt: "Add inventory system"
// Better prompt: "Add inventory system that integrates with GameState.inventory,
// shows items in grid layout, supports drag-and-drop to equipment slots,
// and emits events when items are equipped/unequipped"
```

## Integration Checklist

When adding Copilot-generated code:

- [ ] Follows existing TypeScript patterns
- [ ] Integrates with event system
- [ ] Has proper error handling
- [ ] Includes cleanup methods
- [ ] Uses established logging format
- [ ] Maintains 60fps performance
- [ ] Works with save/load system
- [ ] Has appropriate UI feedback

This guide should help you leverage GitHub Copilot effectively while maintaining the high quality and architectural consistency of the Copilot RPG project.