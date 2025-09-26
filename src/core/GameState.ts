export interface PlayerStats {
    level: number;
    experience: number;
    experienceToNext: number;
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    stamina: number;
    maxStamina: number;
    
    // Core attributes
    strength: number;
    dexterity: number;
    intelligence: number;
    vitality: number;
    luck: number;
    
    // Skills
    skills: { [skillName: string]: number };
    
    // Character progression
    skillPoints: number;
    attributePoints: number;
}

export interface InventoryItem {
    id: string;
    name: string;
    type: string;
    quantity: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    properties: { [key: string]: any };
}

export interface QuestObjective {
    id: string;
    description: string;
    completed: boolean;
    progress: number;
    maxProgress: number;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    type: 'main' | 'side' | 'daily';
    status: 'available' | 'active' | 'completed' | 'failed';
    objectives: QuestObjective[];
    rewards: {
        experience: number;
        gold: number;
        items: InventoryItem[];
    };
}

export interface WorldState {
    timeOfDay: number; // 0-24 hours
    weatherType: string;
    weatherIntensity: number;
    discoveredLocations: string[];
    npcsMetByid: string[];
    worldEvents: string[];
}

export class GameState {
    public player!: PlayerStats;
    public inventory: InventoryItem[];
    public equipment: { [slot: string]: InventoryItem | null };
    public quests: Quest[];
    public worldState: WorldState;
    public gameSettings: { [key: string]: any };
    
    private eventListeners: { [event: string]: Function[] } = {};
    
    constructor() {
        this.initializePlayerStats();
        this.inventory = [];
        this.equipment = {
            helmet: null,
            armor: null,
            weapon: null,
            shield: null,
            boots: null,
            ring1: null,
            ring2: null,
            amulet: null
        };
        this.quests = [];
        this.worldState = {
            timeOfDay: 12, // Start at noon
            weatherType: 'clear',
            weatherIntensity: 0,
            discoveredLocations: ['Starting Village'],
            npcsMetByid: [],
            worldEvents: []
        };
        this.gameSettings = {
            graphics: 'medium',
            soundVolume: 0.7,
            musicVolume: 0.5,
            controllerEnabled: false
        };
    }
    
    private initializePlayerStats(): void {
        this.player = {
            level: 1,
            experience: 0,
            experienceToNext: 100,
            health: 100,
            maxHealth: 100,
            mana: 50,
            maxMana: 50,
            stamina: 100,
            maxStamina: 100,
            
            strength: 10,
            dexterity: 10,
            intelligence: 10,
            vitality: 10,
            luck: 10,
            
            skills: {
                'sword': 1,
                'archery': 1,
                'magic': 1,
                'stealth': 1,
                'crafting': 1,
                'lockpicking': 1,
                'persuasion': 1
            },
            
            skillPoints: 0,
            attributePoints: 0
        };
    }
    
    update(deltaTime: number): void {
        // Regenerate stamina
        if (this.player.stamina < this.player.maxStamina) {
            this.player.stamina = Math.min(
                this.player.maxStamina,
                this.player.stamina + deltaTime * 20
            );
        }
        
        // Regenerate mana slowly
        if (this.player.mana < this.player.maxMana) {
            this.player.mana = Math.min(
                this.player.maxMana,
                this.player.mana + deltaTime * 5
            );
        }
    }
    
    // Player stat methods
    addExperience(amount: number): boolean {
        this.player.experience += amount;
        
        if (this.player.experience >= this.player.experienceToNext) {
            return this.levelUp();
        }
        
        this.emit('experienceGained', amount);
        return false;
    }
    
    private levelUp(): boolean {
        this.player.experience -= this.player.experienceToNext;
        this.player.level++;
        
        // Increase max stats
        this.player.maxHealth += 10;
        this.player.maxMana += 5;
        this.player.maxStamina += 5;
        
        // Restore health/mana/stamina on level up
        this.player.health = this.player.maxHealth;
        this.player.mana = this.player.maxMana;
        this.player.stamina = this.player.maxStamina;
        
        // Award points
        this.player.skillPoints += 2;
        this.player.attributePoints += 1;
        
        // Calculate next level experience requirement
        this.player.experienceToNext = Math.floor(100 * Math.pow(1.2, this.player.level - 1));
        
        this.emit('levelUp', this.player.level);
        return true;
    }
    
    takeDamage(amount: number): boolean {
        this.player.health = Math.max(0, this.player.health - amount);
        this.emit('healthChanged', this.player.health);
        
        if (this.player.health <= 0) {
            this.emit('playerDied');
            return true; // Player died
        }
        return false;
    }
    
    heal(amount: number): void {
        this.player.health = Math.min(this.player.maxHealth, this.player.health + amount);
        this.emit('healthChanged', this.player.health);
    }
    
    // Inventory methods
    addItem(item: InventoryItem): boolean {
        // Check if item already exists and is stackable
        const existingItem = this.inventory.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            this.inventory.push(item);
        }
        
        this.emit('itemAdded', item);
        return true;
    }
    
    removeItem(itemId: string, quantity: number = 1): boolean {
        const item = this.inventory.find(i => i.id === itemId);
        if (!item || item.quantity < quantity) {
            return false;
        }
        
        item.quantity -= quantity;
        if (item.quantity <= 0) {
            const index = this.inventory.indexOf(item);
            this.inventory.splice(index, 1);
        }
        
        this.emit('itemRemoved', { itemId, quantity });
        return true;
    }
    
    // Quest methods
    addQuest(quest: Quest): void {
        this.quests.push(quest);
        this.emit('questAdded', quest);
    }
    
    completeQuest(questId: string): void {
        const quest = this.quests.find(q => q.id === questId);
        if (!quest) return;
        
        quest.status = 'completed';
        this.doCompleteQuest(quest);
    }
    
    updateQuestProgress(questId: string, objectiveId: string, progress: number): void {
        const quest = this.quests.find(q => q.id === questId);
        if (!quest) return;
        
        const objective = quest.objectives.find(o => o.id === objectiveId);
        if (!objective) return;
        
        objective.progress = Math.min(objective.maxProgress, progress);
        objective.completed = objective.progress >= objective.maxProgress;
        
        // Check if quest is complete
        if (quest.objectives.every(o => o.completed)) {
            quest.status = 'completed';
            this.doCompleteQuest(quest);
        }
        
        this.emit('questProgress', { questId, objectiveId, progress });
    }
    
    private doCompleteQuest(quest: Quest): void {
        // Award rewards
        this.addExperience(quest.rewards.experience);
        quest.rewards.items.forEach(item => this.addItem(item));
        
        this.emit('questCompleted', quest);
    }
    
    // Event system
    on(event: string, callback: Function): void {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    off(event: string, callback: Function): void {
        if (!this.eventListeners[event]) return;
        
        const index = this.eventListeners[event].indexOf(callback);
        if (index > -1) {
            this.eventListeners[event].splice(index, 1);
        }
    }
    
    private emit(event: string, data?: any): void {
        if (!this.eventListeners[event]) return;
        
        this.eventListeners[event].forEach(callback => {
            callback(data);
        });
    }
    
    // Serialization methods for save/load
    serialize(): string {
        return JSON.stringify({
            player: this.player,
            inventory: this.inventory,
            equipment: this.equipment,
            quests: this.quests,
            worldState: this.worldState,
            gameSettings: this.gameSettings
        });
    }
    
    deserialize(data: string): void {
        const parsed = JSON.parse(data);
        this.player = parsed.player || this.player;
        this.inventory = parsed.inventory || this.inventory;
        this.equipment = parsed.equipment || this.equipment;
        this.quests = parsed.quests || this.quests;
        this.worldState = parsed.worldState || this.worldState;
        this.gameSettings = parsed.gameSettings || this.gameSettings;
    }
}