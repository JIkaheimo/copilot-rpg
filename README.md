# Copilot RPG

A comprehensive single-player 3D RPG built with TypeScript and Three.js, featuring real-time combat, dynamic quests, character progression, and an immersive open world.

![Game Screenshot](https://github.com/user-attachments/assets/d373365f-84d1-4895-893f-f4f71c789b86)

## Features

### Core RPG Systems
- ✅ **Character Progression**: Level up system with XP, skill trees, and attribute points
- ✅ **Real-time Combat**: Action-based combat with health, mana, and stamina systems
- ✅ **Inventory & Equipment**: Complete item management with rarity tiers and equipment slots
- ✅ **Quest System**: Dynamic quests with branching objectives and meaningful rewards
- ✅ **Skill System**: Multiple skill trees including combat, magic, stealth, and crafting

### 3D World & Environment
- ✅ **Open World**: Expansive 3D environment with procedural terrain generation
- ✅ **Day/Night Cycle**: Dynamic lighting that changes throughout the game day
- ✅ **Weather System**: Multiple weather types including rain, snow, fog, and storms
- ✅ **Environmental Objects**: Trees, rocks, and interactive world elements

### Player Experience
- ✅ **Third-Person Camera**: Smooth camera controls with mouse and gamepad support
- ✅ **Movement System**: WASD movement with running, jumping, and physics
- ✅ **User Interface**: Professional HUD with health bars, minimap, and menus
- ✅ **Save/Load System**: Complete game state persistence with multiple save slots

### Advanced Features
- ✅ **Controller Support**: Full gamepad compatibility alongside keyboard/mouse
- ✅ **Stealth Mechanics**: Sneak and avoid detection systems (foundation)
- ✅ **Morality System**: Character alignment and reputation tracking (foundation)
- ✅ **Mod Support**: Extensible architecture for game modifications (foundation)

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager
- Modern web browser with WebGL support

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JIkaheimo/copilot-rpg.git
cd copilot-rpg
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be available in the `dist/` directory.

## Controls

### Keyboard & Mouse
- **Movement**: WASD keys
- **Run**: Hold Shift while moving
- **Jump**: Space bar
- **Camera**: Mouse (click canvas to enable pointer lock)
- **Menu**: Escape key
- **Inventory**: Tab or I key
- **World Map**: M key

### Gamepad Support
- **Left Stick**: Movement
- **Right Stick**: Camera control
- **A Button**: Jump
- **Shoulder Buttons**: Run

## Game Systems

### Character Progression
- Start at Level 1 with basic stats
- Gain XP through combat, quests, and exploration
- Level up to increase health, mana, and stamina
- Allocate skill points across different skill trees
- Customize character attributes (Strength, Dexterity, Intelligence, etc.)

### Combat System
- Real-time action combat
- Health, mana, and stamina management
- Multiple weapon types and combat styles
- Stealth mechanics for avoiding combat

### World Systems
- Dynamic weather affecting gameplay
- Day/night cycle with different events and NPCs
- Procedural quest generation
- Hidden secrets and collectibles to discover

## Technical Architecture

### Core Technologies
- **TypeScript**: Type-safe game logic and systems
- **Three.js**: 3D graphics rendering and scene management
- **Vite**: Fast development and build tooling
- **WebGL**: Hardware-accelerated 3D graphics

### System Architecture
- **Modular Design**: Each game system is independent and extensible
- **Event-Driven**: Communication between systems via event emitters
- **Save System**: JSON-based game state serialization
- **Performance Optimized**: Efficient rendering and update loops

### File Structure
```
src/
├── core/           # Core game engine
├── systems/        # Game systems (combat, weather, etc.)
├── components/     # Reusable game components
├── ui/            # User interface management
├── assets/        # Game assets and resources
└── utils/         # Utility functions and helpers
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run code linting
- `npm run test` - Run unit tests (when implemented)

### Code Quality
The project uses ESLint for code quality and TypeScript for type safety. All code is thoroughly documented and follows consistent patterns.

## Roadmap

### Planned Features
- [ ] Advanced AI NPCs with complex behaviors
- [ ] Dungeon generation system
- [ ] Mount system for faster travel
- [ ] Companion management
- [ ] Puzzle-solving mechanics
- [ ] Enhanced crafting system
- [ ] Multiplayer support (future consideration)

### Performance Improvements
- [ ] Level-of-detail (LOD) system
- [ ] Texture streaming
- [ ] Optimized particle systems
- [ ] WebWorker for heavy computations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run linting and ensure builds pass
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js community for excellent 3D graphics library
- TypeScript team for powerful type system
- Open source contributors and game development community