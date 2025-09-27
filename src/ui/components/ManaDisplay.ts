import { GameState } from '@core/GameState';
import { IUIComponent } from './HealthDisplay';

/**
 * Mana display component following Single Responsibility Principle
 * Only responsible for displaying mana-related UI
 */
export class ManaDisplay implements IUIComponent {
    private manaBar: HTMLElement | null = null;
    private manaText: HTMLElement | null = null;

    initialize(): void {
        this.manaBar = document.getElementById('manaBar');
        this.manaText = document.getElementById('manaText');
        
        if (!this.manaBar || !this.manaText) {
            console.warn('🎨 Mana display elements not found in DOM');
        }
    }

    update(gameState: GameState): void {
        if (!gameState || !this.manaBar || !this.manaText) return;

        const { mana, maxMana } = gameState.player;
        const manaPercentage = (mana / maxMana) * 100;

        this.manaBar.style.width = `${manaPercentage}%`;
        this.manaText.textContent = `${Math.round(mana)}/${maxMana}`;
    }
}