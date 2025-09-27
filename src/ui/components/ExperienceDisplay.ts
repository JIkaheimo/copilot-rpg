import { GameState } from '@core/GameState';
import { IUIComponent } from './HealthDisplay';

/**
 * Experience display component following Single Responsibility Principle
 * Only responsible for displaying level and XP-related UI
 */
export class ExperienceDisplay implements IUIComponent {
    private levelText: HTMLElement | null = null;
    private xpText: HTMLElement | null = null;

    initialize(): void {
        this.levelText = document.getElementById('levelText');
        this.xpText = document.getElementById('xpText');
        
        if (!this.levelText || !this.xpText) {
            console.warn('🎨 Experience display elements not found in DOM');
        }
    }

    update(gameState: GameState): void {
        if (!gameState || !this.levelText || !this.xpText) return;

        const { level, experience, experienceToNext } = gameState.player;

        this.levelText.textContent = level.toString();
        this.xpText.textContent = `${experience}/${experienceToNext}`;
    }

    /**
     * Show level up animation
     */
    showLevelUpAnimation(): void {
        if (!this.levelText) return;

        this.levelText.style.animation = 'levelUp 1s ease-in-out';
        
        // Reset animation after completion
        setTimeout(() => {
            if (this.levelText) {
                this.levelText.style.animation = '';
            }
        }, 1000);
    }
}