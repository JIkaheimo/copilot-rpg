import { GameState } from '@core/GameState';

export class UIManager {
    private gameState: GameState | null = null;
    
    // UI Elements
    private healthBar: HTMLElement | null = null;
    private healthText: HTMLElement | null = null;
    private manaBar: HTMLElement | null = null;
    private manaText: HTMLElement | null = null;
    private levelText: HTMLElement | null = null;
    private xpText: HTMLElement | null = null;
    private enemyCount: HTMLElement | null = null;
    private attackCooldown: HTMLElement | null = null;
    private cooldownTime: HTMLElement | null = null;
    private castingInfo: HTMLElement | null = null;
    private spellName: HTMLElement | null = null;
    private castProgress: HTMLElement | null = null;
    private interactionPrompt: HTMLElement | null = null;
    private interactableName: HTMLElement | null = null;
    private minimapCanvas: HTMLCanvasElement | null = null;
    private minimapContext: CanvasRenderingContext2D | null = null;
    
    initialize(gameState: GameState): void {
        this.gameState = gameState;
        
        // Get UI elements
        this.healthBar = document.getElementById('healthBar');
        this.healthText = document.getElementById('healthText');
        this.manaBar = document.getElementById('manaBar');
        this.manaText = document.getElementById('manaText');
        this.levelText = document.getElementById('levelText');
        this.xpText = document.getElementById('xpText');
        this.enemyCount = document.getElementById('enemyCount');
        this.attackCooldown = document.getElementById('attackCooldown');
        this.cooldownTime = document.getElementById('cooldownTime');
        this.castingInfo = document.getElementById('castingInfo');
        this.spellName = document.getElementById('spellName');
        this.castProgress = document.getElementById('castProgress');
        this.interactionPrompt = document.getElementById('interactionPrompt');
        this.interactableName = document.getElementById('interactableName');
        
        // Initialize minimap
        this.initializeMinimap();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('🎨 UI Manager initialized');
    }
    
    private initializeMinimap(): void {
        const minimapContainer = document.getElementById('minimap');
        if (!minimapContainer) return;
        
        // Create canvas for minimap
        this.minimapCanvas = document.createElement('canvas');
        if (!this.minimapCanvas) return; // Handle creation failure
        
        this.minimapCanvas.width = 196; // Container width - padding
        this.minimapCanvas.height = 196;
        this.minimapCanvas.style.width = '100%';
        this.minimapCanvas.style.height = '100%';
        this.minimapCanvas.style.borderRadius = '8px';
        
        this.minimapContext = this.minimapCanvas.getContext('2d');
        minimapContainer.appendChild(this.minimapCanvas);
    }
    
    private setupEventListeners(): void {
        if (!this.gameState) return;
        
        // Listen to game state events
        this.gameState.subscribe('healthChanged', this.updateHealthDisplay.bind(this));
        this.gameState.subscribe('levelUp', this.updateLevelDisplay.bind(this));
        this.gameState.subscribe('experienceGained', this.updateXPDisplay.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Tab':
                    event.preventDefault();
                    this.toggleInventory();
                    break;
                case 'KeyM':
                    event.preventDefault();
                    this.toggleWorldMap();
                    break;
                case 'Escape':
                    event.preventDefault();
                    this.toggleMainMenu();
                    break;
                case 'KeyI':
                    event.preventDefault();
                    this.toggleInventory();
                    break;
            }
        });
    }
    
    update(gameState: GameState, combatInfo?: { enemyCount: number; attackCooldown: number }, interactionInfo?: { nearbyInteractables: any[] }): void {
        this.gameState = gameState;
        
        // Update all UI elements
        this.updateHealthDisplay();
        this.updateManaDisplay();
        this.updateLevelDisplay();
        this.updateXPDisplay();
        this.updateCombatInfo(combatInfo);
        this.updateInteractionInfo(interactionInfo);
        this.updateMinimap();
    }
    
    private updateHealthDisplay(): void {
        if (!this.gameState || !this.healthBar || !this.healthText) return;
        
        const healthPercentage = (this.gameState.player.health / this.gameState.player.maxHealth) * 100;
        
        // Update health bar
        this.healthBar.style.width = `${healthPercentage}%`;
        
        // Update health text
        this.healthText.textContent = `${Math.floor(this.gameState.player.health)}/${this.gameState.player.maxHealth}`;
        
        // Change color based on health level
        if (healthPercentage > 60) {
            this.healthBar.style.background = 'linear-gradient(90deg, #4ade80, #22c55e)';
        } else if (healthPercentage > 30) {
            this.healthBar.style.background = 'linear-gradient(90deg, #f59e0b, #eab308)';
        } else {
            this.healthBar.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        }
    }
    
    private updateManaDisplay(): void {
        if (!this.gameState || !this.manaBar || !this.manaText) return;
        
        const manaPercentage = (this.gameState.player.mana / this.gameState.player.maxMana) * 100;
        
        // Update mana bar
        this.manaBar.style.width = `${manaPercentage}%`;
        
        // Update mana text
        this.manaText.textContent = `${Math.floor(this.gameState.player.mana)}/${this.gameState.player.maxMana}`;
        
        // Change color based on mana level
        if (manaPercentage > 60) {
            this.manaBar.style.background = 'linear-gradient(90deg, #0066cc, #0088ff)';
        } else if (manaPercentage > 30) {
            this.manaBar.style.background = 'linear-gradient(90deg, #0044aa, #0066cc)';
        } else {
            this.manaBar.style.background = 'linear-gradient(90deg, #002288, #0044aa)';
        }
    }
    
    private updateLevelDisplay(): void {
        if (!this.gameState || !this.levelText) return;
        
        this.levelText.textContent = this.gameState.player.level.toString();
    }
    
    private updateXPDisplay(): void {
        if (!this.gameState || !this.xpText) return;
        
        this.xpText.textContent = `${this.gameState.player.experience}/${this.gameState.player.experienceToNext}`;
    }
    
    private updateCombatInfo(combatInfo?: { enemyCount: number; attackCooldown: number }): void {
        if (!combatInfo) return;
        
        // Update enemy count
        if (this.enemyCount) {
            this.enemyCount.textContent = combatInfo.enemyCount.toString();
        }
        
        // Update attack cooldown
        if (this.attackCooldown && this.cooldownTime) {
            if (combatInfo.attackCooldown > 0) {
                this.attackCooldown.style.display = 'block';
                this.cooldownTime.textContent = combatInfo.attackCooldown.toFixed(1);
            } else {
                this.attackCooldown.style.display = 'none';
            }
        }
    }
    
    private updateInteractionInfo(interactionInfo?: { nearbyInteractables: any[] }): void {
        if (!interactionInfo || !this.interactionPrompt || !this.interactableName) return;
        
        if (interactionInfo.nearbyInteractables.length > 0) {
            const nearest = interactionInfo.nearbyInteractables[0];
            this.interactionPrompt.style.display = 'block';
            this.interactableName.textContent = nearest.name;
        } else {
            this.interactionPrompt.style.display = 'none';
        }
    }
    
    private updateMinimap(): void {
        if (!this.minimapContext || !this.gameState) return;
        
        const ctx = this.minimapContext;
        const canvas = this.minimapCanvas!;
        
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(canvas.width, i);
            ctx.stroke();
        }
        
        // Draw player position (center of map)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw direction indicator
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY - 8);
        ctx.stroke();
        
        // Draw discovered locations (placeholder)
        ctx.fillStyle = '#ffff00';
        for (let i = 0; i < 3; i++) {
            const x = centerX + (Math.random() - 0.5) * 100;
            const y = centerY + (Math.random() - 0.5) * 100;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Menu toggle methods
    private toggleInventory(): void {
        // This would open/close the inventory UI
        console.log('🎒 Toggle inventory');
        // Implementation would create/show inventory modal
    }
    
    private toggleWorldMap(): void {
        console.log('🗺️ Toggle world map');
        // Implementation would create/show world map modal
    }
    
    private toggleMainMenu(): void {
        const menu = document.getElementById('menu');
        if (menu) {
            const isVisible = menu.style.display !== 'none';
            menu.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                // Update menu content
                this.updateMainMenu();
            }
        }
    }
    
    private updateMainMenu(): void {
        const menu = document.getElementById('menu');
        if (!menu || !this.gameState) return;
        
        menu.innerHTML = `
            <h2>Game Menu</h2>
            <div style="margin: 20px 0;">
                <p>Level: ${this.gameState.player.level}</p>
                <p>Health: ${Math.floor(this.gameState.player.health)}/${this.gameState.player.maxHealth}</p>
                <p>Experience: ${this.gameState.player.experience}/${this.gameState.player.experienceToNext}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="game.toggleMenu()" style="padding: 10px; background: #333; color: white; border: 1px solid #555; border-radius: 5px; cursor: pointer;">Resume Game</button>
                <button onclick="game.saveGame()" style="padding: 10px; background: #333; color: white; border: 1px solid #555; border-radius: 5px; cursor: pointer;">Save Game</button>
                <button onclick="game.loadGame()" style="padding: 10px; background: #333; color: white; border: 1px solid #555; border-radius: 5px; cursor: pointer;">Load Game</button>
                <button onclick="this.showSettings()" style="padding: 10px; background: #333; color: white; border: 1px solid #555; border-radius: 5px; cursor: pointer;">Settings</button>
            </div>
        `;
    }
    
    // Notification system
    showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            border-radius: 5px;
            z-index: 1000;
            max-width: 300px;
            word-wrap: break-word;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    private getNotificationColor(type: string): string {
        switch (type) {
            case 'success': return '#22c55e';
            case 'warning': return '#f59e0b';
            case 'error': return '#ef4444';
            default: return '#3b82f6';
        }
    }
    
    // Level up animation
    showLevelUpAnimation(): void {
        const levelUpDiv = document.createElement('div');
        levelUpDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            font-weight: bold;
            color: #ffd700;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            z-index: 1001;
            animation: levelUpPulse 2s ease-out;
            pointer-events: none;
        `;
        
        levelUpDiv.textContent = 'LEVEL UP!';
        document.body.appendChild(levelUpDiv);
        
        setTimeout(() => {
            if (levelUpDiv.parentNode) {
                levelUpDiv.parentNode.removeChild(levelUpDiv);
            }
        }, 2000);
    }
    
    // Magic system UI methods
    updateCastingInfo(spellName: string, progress: number): void {
        if (this.castingInfo && this.spellName && this.castProgress) {
            this.castingInfo.style.display = 'block';
            this.spellName.textContent = spellName;
            this.castProgress.textContent = Math.floor(progress).toString();
        }
    }
    
    hideCastingInfo(): void {
        if (this.castingInfo) {
            this.castingInfo.style.display = 'none';
        }
    }
}