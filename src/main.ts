import { Game } from './core/Game';

// Global game instance for easy access from HTML
declare global {
    interface Window {
        game: Game;
    }
}

async function init() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const loadingScreen = document.getElementById('loadingScreen') as HTMLElement;
    
    if (!canvas) {
        throw new Error('Canvas element not found');
    }
    
    try {
        // Initialize the game
        const game = new Game(canvas);
        window.game = game;
        
        // Start the game
        await game.initialize();
        
        // Hide loading screen
        loadingScreen.style.display = 'none';
        
        console.log('🎮 Copilot RPG initialized successfully!');
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        loadingScreen.innerHTML = `
            <div style="color: red;">
                <h2>Failed to Load Game</h2>
                <p>${error}</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', init);