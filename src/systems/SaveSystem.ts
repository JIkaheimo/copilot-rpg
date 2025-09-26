import { GameState } from '../core/GameState';

export interface SaveData {
    version: string;
    timestamp: number;
    gameState: string;
    playTime: number;
    saveSlot: number;
    description: string;
}

export class SaveSystem {
    private readonly SAVE_KEY_PREFIX = 'copilot-rpg-save-';
    private readonly MAX_SAVE_SLOTS = 10;
    private readonly CURRENT_VERSION = '1.0.0';
    
    async saveGame(gameState: GameState, slot: number = 0, description: string = ''): Promise<boolean> {
        try {
            const saveData: SaveData = {
                version: this.CURRENT_VERSION,
                timestamp: Date.now(),
                gameState: gameState.serialize(),
                playTime: this.getPlayTime(),
                saveSlot: slot,
                description: description || `Save ${slot + 1} - ${new Date().toLocaleString()}`
            };
            
            const saveKey = this.getSaveKey(slot);
            const serializedData = JSON.stringify(saveData);
            
            // Save to localStorage
            localStorage.setItem(saveKey, serializedData);
            
            // Also save to IndexedDB for larger saves (future enhancement)
            // await this.saveToIndexedDB(saveKey, saveData);
            
            console.log(`💾 Game saved to slot ${slot}`);
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }
    
    async loadGame(gameState: GameState, slot: number = 0): Promise<boolean> {
        try {
            const saveKey = this.getSaveKey(slot);
            const serializedData = localStorage.getItem(saveKey);
            
            if (!serializedData) {
                console.log(`No save data found in slot ${slot}`);
                return false;
            }
            
            const saveData: SaveData = JSON.parse(serializedData);
            
            // Version compatibility check
            if (!this.isCompatibleVersion(saveData.version)) {
                console.warn(`Save version ${saveData.version} is not compatible with current version ${this.CURRENT_VERSION}`);
                return false;
            }
            
            // Load game state
            gameState.deserialize(saveData.gameState);
            
            console.log(`📂 Game loaded from slot ${slot}`);
            return true;
        } catch (error) {
            console.error('Failed to load game:', error);
            return false;
        }
    }
    
    getSaveSlots(): SaveData[] {
        const saves: SaveData[] = [];
        
        for (let i = 0; i < this.MAX_SAVE_SLOTS; i++) {
            const saveKey = this.getSaveKey(i);
            const serializedData = localStorage.getItem(saveKey);
            
            if (serializedData) {
                try {
                    const saveData: SaveData = JSON.parse(serializedData);
                    saves.push(saveData);
                } catch (error) {
                    console.warn(`Failed to parse save data for slot ${i}:`, error);
                }
            }
        }
        
        return saves.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    deleteSave(slot: number): boolean {
        try {
            const saveKey = this.getSaveKey(slot);
            localStorage.removeItem(saveKey);
            console.log(`🗑️ Save slot ${slot} deleted`);
            return true;
        } catch (error) {
            console.error(`Failed to delete save slot ${slot}:`, error);
            return false;
        }
    }
    
    hasSave(slot: number): boolean {
        const saveKey = this.getSaveKey(slot);
        return localStorage.getItem(saveKey) !== null;
    }
    
    exportSave(slot: number): string | null {
        const saveKey = this.getSaveKey(slot);
        const saveData = localStorage.getItem(saveKey);
        
        if (saveData) {
            // Encode as base64 for easy sharing
            return btoa(saveData);
        }
        
        return null;
    }
    
    importSave(encodedSave: string, slot: number): boolean {
        try {
            // Decode from base64
            const saveData = atob(encodedSave);
            const parsedData: SaveData = JSON.parse(saveData);
            
            // Validate save data
            if (!this.isValidSaveData(parsedData)) {
                throw new Error('Invalid save data format');
            }
            
            // Update slot number
            parsedData.saveSlot = slot;
            
            const saveKey = this.getSaveKey(slot);
            localStorage.setItem(saveKey, JSON.stringify(parsedData));
            
            console.log(`📥 Save imported to slot ${slot}`);
            return true;
        } catch (error) {
            console.error('Failed to import save:', error);
            return false;
        }
    }
    
    // Auto-save functionality
    async autoSave(gameState: GameState): Promise<void> {
        const autoSaveSlot = this.MAX_SAVE_SLOTS - 1; // Use last slot for auto-save
        await this.saveGame(gameState, autoSaveSlot, 'Auto Save');
    }
    
    hasAutoSave(): boolean {
        return this.hasSave(this.MAX_SAVE_SLOTS - 1);
    }
    
    async loadAutoSave(gameState: GameState): Promise<boolean> {
        const autoSaveSlot = this.MAX_SAVE_SLOTS - 1;
        return await this.loadGame(gameState, autoSaveSlot);
    }
    
    // Utility methods
    private getSaveKey(slot: number): string {
        return `${this.SAVE_KEY_PREFIX}${slot}`;
    }
    
    private isCompatibleVersion(version: string): boolean {
        // Simple version compatibility check
        // In a real game, you'd have more sophisticated version migration logic
        const currentMajor = parseInt(this.CURRENT_VERSION.split('.')[0]);
        const saveMajor = parseInt(version.split('.')[0]);
        
        return currentMajor === saveMajor;
    }
    
    private isValidSaveData(data: any): data is SaveData {
        return (
            typeof data === 'object' &&
            typeof data.version === 'string' &&
            typeof data.timestamp === 'number' &&
            typeof data.gameState === 'string' &&
            typeof data.playTime === 'number' &&
            typeof data.saveSlot === 'number' &&
            typeof data.description === 'string'
        );
    }
    
    private getPlayTime(): number {
        // This would normally track actual play time
        // For now, just return a placeholder
        return Date.now() - (localStorage.getItem('copilot-rpg-start-time') ? 
            parseInt(localStorage.getItem('copilot-rpg-start-time')!) : Date.now());
    }
    
    // Cleanup old saves if storage is getting full
    cleanupOldSaves(): void {
        try {
            const saves = this.getSaveSlots();
            
            // Keep only the most recent saves if we have too many
            if (saves.length > this.MAX_SAVE_SLOTS) {
                const excessSaves = saves.slice(this.MAX_SAVE_SLOTS);
                excessSaves.forEach(save => {
                    this.deleteSave(save.saveSlot);
                });
            }
        } catch (error) {
            console.error('Failed to cleanup old saves:', error);
        }
    }
    
    // Get storage usage info
    getStorageInfo(): { used: number; total: number; percentage: number } {
        try {
            let used = 0;
            
            for (let i = 0; i < this.MAX_SAVE_SLOTS; i++) {
                const saveKey = this.getSaveKey(i);
                const saveData = localStorage.getItem(saveKey);
                if (saveData) {
                    used += saveData.length;
                }
            }
            
            // Estimate localStorage limit (usually ~5-10MB)
            const total = 5 * 1024 * 1024; // 5MB estimate
            const percentage = (used / total) * 100;
            
            return { used, total, percentage };
        } catch {
            return { used: 0, total: 0, percentage: 0 };
        }
    }
}