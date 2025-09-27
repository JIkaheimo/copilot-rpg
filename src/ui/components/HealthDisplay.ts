import { GameState } from '@core/GameState';

/**
 * Interface for UI component contract
 * Following Interface Segregation Principle
 */
export interface IUIComponent {
    initialize(): void;
    update(gameState: GameState): void;
}

/**
 * Health display component following Single Responsibility Principle
 * Only responsible for displaying health-related UI
 */
export class HealthDisplay implements IUIComponent {
    private healthBar: HTMLElement | null = null;
    private healthText: HTMLElement | null = null;

    initialize(): void {
        this.healthBar = document.getElementById('healthBar');
        this.healthText = document.getElementById('healthText');
        
        if (!this.healthBar || !this.healthText) {
            console.warn('🎨 Health display elements not found in DOM');
        }
    }

    update(gameState: GameState): void {
        if (!gameState || !this.healthBar || !this.healthText) return;

        const { health, maxHealth } = gameState.player;
        const healthPercentage = (health / maxHealth) * 100;

        this.healthBar.style.width = `${healthPercentage}%`;
        this.healthText.textContent = `${Math.round(health)}/${maxHealth}`;
    }
}