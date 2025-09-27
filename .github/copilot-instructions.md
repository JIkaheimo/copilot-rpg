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
5. **SOLID Principles**: All code must follow SOLID design principles for maintainability and extensibility

## Coding Standards

### TypeScript Patterns

#### System Classes
All game systems follow this pattern and **MUST** implement SOLID principles:
```typescript
// Systems implement only the interfaces they need (ISP)
export class SystemName implements IInitializable, IUpdatable {
    private initialized: boolean = false;
    
    // Single responsibility: only system initialization (SRP)
    initialize(dependencies: Dependencies): void {
        // Accept dependencies instead of creating them (DIP)
        this.initialized = true;
        console.log('🎯 SystemName initialized');
    }
    
    // Single responsibility: only system updates (SRP)
    update(deltaTime: number): void {
        if (!this.initialized) return;
        // Update logic here
    }
    
    // Optional: only implement if system needs cleanup (ISP)
    cleanup?(): void {
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

### SOLID Principles Implementation

All code in this project **MUST** follow SOLID principles. These principles ensure maintainable, extensible, and testable code.

#### Single Responsibility Principle (SRP)
Each class should have only one reason to change.

**✅ Good Example:**
```typescript
// HealthDisplay only handles health UI
export class HealthDisplay implements IUIComponent {
    private healthBar: HTMLElement | null = null;
    
    initialize(): void {
        this.healthBar = document.getElementById('healthBar');
    }
    
    update(gameState: GameState): void {
        const healthPercentage = (gameState.player.health / gameState.player.maxHealth) * 100;
        this.healthBar.style.width = `${healthPercentage}%`;
    }
}
```

**❌ Bad Example:**
```typescript
// UIManager handles ALL UI - violates SRP
export class UIManager {
    updateHealth() { /* health logic */ }
    updateMana() { /* mana logic */ }
    updateInventory() { /* inventory logic */ }
    showNotifications() { /* notification logic */ }
    // Too many responsibilities!
}
```

#### Open/Closed Principle (OCP)
Classes should be open for extension but closed for modification.

**✅ Good Example:**
```typescript
// Factory pattern allows new types without modifying existing code
export interface IInteractableCreator {
    create(position: THREE.Vector3, config: any): IInteractable;
    getType(): string;
}

export class InteractableObjectFactory {
    private creators: Map<string, IInteractableCreator> = new Map();
    
    // Can add new creators without modifying this class
    registerCreator(creator: IInteractableCreator): void {
        this.creators.set(creator.getType(), creator);
    }
}

// New interactable types extend the system
export class DoorCreator implements IInteractableCreator {
    getType(): string { return 'door'; }
    create(position: THREE.Vector3, config: any): IInteractable {
        // Door creation logic
    }
}
```

**❌ Bad Example:**
```typescript
// Must modify createInteractable for every new type
createInteractable(type: string, position: THREE.Vector3): IInteractable {
    switch (type) {
        case 'chest': return this.createChest(position);
        case 'tree': return this.createTree(position);
        case 'door': return this.createDoor(position); // New addition requires modification
        default: throw new Error('Unknown type');
    }
}
```

#### Liskov Substitution Principle (LSP)
Objects should be replaceable with instances of their subtypes without altering correctness.

**✅ Good Example:**
```typescript
interface IUIComponent {
    initialize(): void;
    update(gameState: GameState): void;
}

// All UI components can be used interchangeably
class HealthDisplay implements IUIComponent { /* implementation */ }
class ManaDisplay implements IUIComponent { /* implementation */ }

// Can substitute any IUIComponent
function updateUI(component: IUIComponent, gameState: GameState): void {
    component.update(gameState); // Works with any implementation
}
```

#### Interface Segregation Principle (ISP)
Clients should not be forced to depend on interfaces they don't use.

**✅ Good Example:**
```typescript
// Segregated interfaces - only implement what you need
interface IInitializable {
    initialize(...args: any[]): void | Promise<void>;
}

interface IUpdatable {
    update(deltaTime: number): void;
}

interface ICleanable {
    cleanup(): void;
}

// System only implements interfaces it needs
export class WeatherSystem implements IInitializable, IUpdatable {
    initialize(scene: THREE.Scene): void { /* */ }
    update(deltaTime: number): void { /* */ }
    // No cleanup method - doesn't implement ICleanable
}
```

**❌ Bad Example:**
```typescript
// Fat interface forces unused methods
interface IGameSystem {
    initialize(): void;
    update(deltaTime: number): void;
    render(): void;        // Not all systems render
    handleInput(): void;   // Not all systems handle input
    serialize(): string;   // Not all systems serialize
}
```

#### Dependency Inversion Principle (DIP)
Depend on abstractions, not concretions.

**✅ Good Example:**
```typescript
// High-level module depends on abstraction
export class GameSystemManager {
    private systems: Map<string, IInitializable> = new Map();
    
    // Depends on interface, not concrete class
    registerSystem(name: string, system: IInitializable): void {
        this.systems.set(name, system);
    }
}

// Low-level modules implement abstraction
export class CombatSystem implements IInitializable {
    initialize(scene: THREE.Scene, gameState: GameState): void {
        // Implementation details
    }
}
```

**❌ Bad Example:**
```typescript
// High-level module depends on concrete classes
export class Game {
    private combatSystem: CombatSystem;      // Concrete dependency
    private weatherSystem: WeatherSystem;   // Concrete dependency
    
    constructor() {
        this.combatSystem = new CombatSystem();    // Direct instantiation
        this.weatherSystem = new WeatherSystem();  // Direct instantiation
    }
}
```

### SOLID Compliance Guidelines

#### For New Classes
1. **Define clear responsibility** - What is the single purpose of this class?
2. **Create focused interfaces** - Only include methods the class actually needs
3. **Use dependency injection** - Accept dependencies through constructor or setters
4. **Design for extension** - Use composition and interfaces over inheritance

#### For Existing Code
1. **Identify violations** - Look for classes with multiple responsibilities
2. **Extract concerns** - Split large classes into focused components
3. **Introduce abstractions** - Create interfaces for external dependencies
4. **Refactor incrementally** - Make small, safe changes with tests

#### Code Patterns to Follow

**Factory Pattern for Object Creation:**
```typescript
export class SystemFactory {
    createSystem(type: string, config: any): IGameSystem {
        const creator = this.creators.get(type);
        return creator.create(config);
    }
}
```

**Strategy Pattern for Algorithms:**
```typescript
interface IRenderStrategy {
    render(scene: THREE.Scene, camera: THREE.Camera): void;
}

export class Renderer {
    private strategy: IRenderStrategy;
    
    setStrategy(strategy: IRenderStrategy): void {
        this.strategy = strategy;
    }
}
```

**Observer Pattern for Events:**
```typescript
interface IEventListener {
    onEvent(event: GameEvent): void;
}

export class EventBus {
    private listeners: Map<string, IEventListener[]> = new Map();
    
    subscribe(event: string, listener: IEventListener): void {
        // Registration logic
    }
}
```

### Code Review Checklist

Before submitting code, verify:
- [ ] Each class has a single, clear responsibility
- [ ] New functionality extends existing code without modification
- [ ] Dependencies are injected, not instantiated directly
- [ ] Interfaces are focused and cohesive
- [ ] Abstractions are used instead of concrete types
- [ ] Code is testable with mock dependencies
- [ ] Documentation explains the design decisions

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

When creating new game systems, **MUST** follow SOLID principles:

1. **Create in `src/systems/` directory**
2. **Follow SOLID principles** - Single responsibility, proper interfaces, dependency injection
3. **Use GameSystemManager** - Register with the system manager instead of modifying Game.ts
4. **Use event-driven communication** - No direct system-to-system dependencies
5. **Include proper TypeScript interfaces** - Implement only needed interfaces (ISP)
6. **Design for extension** - Use factory patterns where applicable (OCP)

Example:
```typescript
// src/systems/NewSystem.ts - Following SOLID principles
export class NewSystem implements IInitializable, IUpdatable {
    private scene: THREE.Scene | null = null;
    
    // Single responsibility: initialization (SRP)
    initialize(scene: THREE.Scene): void {
        this.scene = scene; // Dependency injection (DIP)
        console.log('🎮 NewSystem initialized');
    }
    
    // Single responsibility: updates (SRP)
    update(deltaTime: number): void {
        if (!this.scene) return;
        // System update logic
    }
}

// Register with GameSystemManager (OCP - no Game.ts modification needed):
const systemManager = new GameSystemManager(eventBus, sceneManager, gameState);
systemManager.registerSystem('newSystem', new NewSystem());
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

#### Testing Requirements and Guidelines

**Test Coverage Target**: Aim for **80% test coverage** across all code files. This ensures high code quality and reliability.

**Test Creation Standards**:
- **Every new feature MUST have comprehensive tests** covering all public methods and edge cases
- **All new systems MUST have test files** in the `src/__tests__/` directory following the pattern: `SystemName.test.ts`
- **Critical path testing**: Focus on main user flows and system integrations
- **Edge case coverage**: Test error conditions, boundary values, and unexpected inputs
- **Mock external dependencies**: Use proper mocking for Three.js, DOM elements, and external APIs

**Test Organization**:
```typescript
describe('SystemName', () => {
  describe('Initialization', () => {
    // Test system setup and configuration
  });
  
  describe('Core Functionality', () => {
    // Test main system behaviors
  });
  
  describe('Edge Cases', () => {
    // Test error conditions and boundary cases
  });
  
  describe('Integration', () => {
    // Test interactions with other systems
  });
  
  describe('Cleanup', () => {
    // Test resource cleanup and teardown
  });
});
```

**Test Requirements for New Features**:
1. **Unit Tests**: Test individual methods and functions in isolation
2. **Integration Tests**: Test how systems work together
3. **Error Handling Tests**: Verify graceful handling of error conditions
4. **Performance Tests**: Ensure systems perform within acceptable limits
5. **Mock Testing**: Properly mock Three.js objects, DOM elements, and external dependencies

**Coverage Monitoring**:
- Run `npm run test:coverage` to check current coverage levels
- New code should not decrease overall coverage percentage
- Aim for 80%+ coverage on statements, branches, functions, and lines
- Use coverage reports to identify untested code paths

**Test Quality Standards**:
- **Descriptive test names**: Tests should clearly describe what they're testing
- **Single responsibility**: Each test should verify one specific behavior
- **Arrange-Act-Assert pattern**: Structure tests with clear setup, execution, and verification
- **No test interdependencies**: Tests should be able to run in any order
- **Fast execution**: Tests should complete quickly to enable frequent testing

**CI/CD Integration**:
- Tests must pass before code can be merged
- Coverage reports are generated automatically
- Failed tests block deployment to production
- Performance regression tests prevent performance degradation

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

## Feature Backlog Management

### Backlog Overview
The project maintains a comprehensive feature backlog in `FEATURE_BACKLOG.md` that serves as the central planning document for all game features. This backlog is actively maintained by GitHub Copilot and should be updated with every feature implementation.

### Backlog Structure
Features are organized by:
- **Category**: Core RPG, World, Social, etc.
- **Priority**: P1 (Core) → P4 (Advanced)
- **Status**: ✅ Implemented, 🚧 In Progress, 📋 Planned, 💡 Concept, 🔄 Needs Refactor

### Feature Implementation Workflow

#### When implementing new features:
1. **Review Backlog**: Check `FEATURE_BACKLOG.md` for related features
2. **Update Status**: Mark feature as 🚧 In Progress
3. **Implement Feature**: Follow established patterns and architecture
4. **Update Status**: Mark as ✅ Implemented with brief description
5. **Update Dependencies**: Mark related features that are now unblocked

#### When planning features:
1. **Add to Backlog**: New features should be added to appropriate category
2. **Set Priority**: Assign based on impact and dependencies
3. **Define Requirements**: Include technical requirements and acceptance criteria
4. **Consider Architecture**: Ensure feature fits with existing systems

### Backlog Maintenance Guidelines

#### Regular Updates
- Update feature status with each implementation
- Add new feature ideas as they arise
- Refine feature descriptions based on implementation learnings
- Adjust priorities based on user feedback and technical constraints

#### Feature Categories

**Core RPG Systems**: Essential gameplay mechanics (combat, progression, inventory)
**World & Environment**: World generation, exploration, environmental systems
**Social & Economy**: NPCs, trading, factions, multiplayer preparation
**Quests & Narrative**: Story systems, quest mechanics, content generation
**Crafting & Professions**: Item creation, resource gathering, specialization
**Combat & Challenge**: Enemy systems, bosses, competitive content
**Quality of Life**: UI/UX improvements, accessibility, settings
**Technical & Performance**: Graphics, audio, optimization, infrastructure
**Multiplayer & Social**: Networking, cooperative/competitive features
**Content Creation**: Modding support, tools, community features

#### Implementation Priorities

**Priority 1 (Core Gameplay)**: Features essential for basic gameplay loop
- Real-time combat system
- Weapon and equipment mechanics
- Basic enemy AI and encounters
- World interaction systems

**Priority 2 (Content Depth)**: Features that add variety and replayability
- Biome and dungeon generation
- Advanced character progression
- Dynamic quest systems
- Crafting and profession systems

**Priority 3 (Polish & Features)**: Features that enhance user experience
- Visual and audio improvements
- Advanced UI systems
- Achievement and progression tracking
- Performance optimizations

**Priority 4 (Advanced Features)**: Features for long-term goals
- Multiplayer capabilities
- Modding support infrastructure
- Advanced AI and simulation systems
- Community and social features

### Integration with Development Process

#### Issue Creation
When creating GitHub issues:
- Reference specific features from the backlog
- Include backlog category and priority level
- Link to related features and dependencies
- Update backlog status to reflect issue creation

#### Pull Request Guidelines
When submitting PRs:
- Reference implemented features from backlog
- Update backlog status in the PR
- Include any new features discovered during implementation
- Note any features that may need refactoring

#### Documentation Updates
- Keep README.md in sync with implemented features
- Update architecture documentation for new systems
- Ensure code examples reflect current best practices
- Maintain consistency between backlog and documentation

This systematic approach to feature management ensures that Copilot RPG development remains organized, prioritized, and aligned with the overall vision while maintaining high code quality and architectural integrity.