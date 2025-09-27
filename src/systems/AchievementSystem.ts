export type AchievementCategory = 'combat' | 'exploration' | 'progression' | 'collection' | 'social' | 'secret';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

export interface AchievementCriteria {
    type: 'count' | 'reach' | 'collect' | 'defeat' | 'discover';
    target: number;
    current: number;
    data?: any; // Additional criteria data
}

export interface AchievementReward {
    xp?: number;
    gold?: number;
    items?: string[];
    title?: string;
}

export interface AchievementData {
    id: string;
    name: string;
    description: string;
    category: AchievementCategory;
    tier: AchievementTier;
    criteria: AchievementCriteria;
    reward: AchievementReward;
    isHidden: boolean;
    prerequisite?: string; // ID of required achievement
    icon?: string;
}

export interface UnlockedAchievement {
    achievement: AchievementData;
    unlockedAt: Date;
    progress: number; // 0-1
}

export class AchievementSystem {
    private achievements: Map<string, AchievementData> = new Map();
    private unlockedAchievements: Map<string, UnlockedAchievement> = new Map();
    private progressData: Map<string, any> = new Map();
    private listeners: { [event: string]: Function[] } = {};
    
    initialize(): void {
        this.createAchievements();
        console.log('🏆 Achievement System initialized');
    }

    private createAchievements(): void {
        // Combat Achievements
        this.achievements.set('first_blood', {
            id: 'first_blood',
            name: 'First Blood',
            description: 'Defeat your first enemy',
            category: 'combat',
            tier: 'bronze',
            criteria: {
                type: 'defeat',
                target: 1,
                current: 0
            },
            reward: {
                xp: 25,
                gold: 10
            },
            isHidden: false
        });

        this.achievements.set('monster_slayer', {
            id: 'monster_slayer',
            name: 'Monster Slayer',
            description: 'Defeat 25 enemies',
            category: 'combat',
            tier: 'silver',
            criteria: {
                type: 'defeat',
                target: 25,
                current: 0
            },
            reward: {
                xp: 100,
                gold: 50,
                title: 'Monster Slayer'
            },
            isHidden: false
        });

        this.achievements.set('legendary_warrior', {
            id: 'legendary_warrior',
            name: 'Legendary Warrior',
            description: 'Defeat 100 enemies',
            category: 'combat',
            tier: 'gold',
            criteria: {
                type: 'defeat',
                target: 100,
                current: 0
            },
            reward: {
                xp: 500,
                gold: 200,
                items: ['legendary_weapon_token'],
                title: 'Legendary Warrior'
            },
            isHidden: false,
            prerequisite: 'monster_slayer'
        });

        // Progression Achievements
        this.achievements.set('level_up', {
            id: 'level_up',
            name: 'Growth',
            description: 'Reach level 5',
            category: 'progression',
            tier: 'bronze',
            criteria: {
                type: 'reach',
                target: 5,
                current: 1
            },
            reward: {
                xp: 50,
                gold: 25
            },
            isHidden: false
        });

        this.achievements.set('veteran', {
            id: 'veteran',
            name: 'Veteran Adventurer',
            description: 'Reach level 20',
            category: 'progression',
            tier: 'gold',
            criteria: {
                type: 'reach',
                target: 20,
                current: 1
            },
            reward: {
                xp: 200,
                gold: 100,
                title: 'Veteran'
            },
            isHidden: false,
            prerequisite: 'level_up'
        });

        // Exploration Achievements
        this.achievements.set('treasure_hunter', {
            id: 'treasure_hunter',
            name: 'Treasure Hunter',
            description: 'Open 5 treasure chests',
            category: 'exploration',
            tier: 'bronze',
            criteria: {
                type: 'count',
                target: 5,
                current: 0
            },
            reward: {
                xp: 75,
                gold: 35
            },
            isHidden: false
        });

        this.achievements.set('master_explorer', {
            id: 'master_explorer',
            name: 'Master Explorer',
            description: 'Discover all areas of the world',
            category: 'exploration',
            tier: 'platinum',
            criteria: {
                type: 'discover',
                target: 10, // Number of areas to discover
                current: 0,
                data: {
                    discoveredAreas: new Set<string>()
                }
            },
            reward: {
                xp: 300,
                gold: 150,
                items: ['explorer_cloak'],
                title: 'Master Explorer'
            },
            isHidden: false
        });

        // Collection Achievements
        this.achievements.set('collector', {
            id: 'collector',
            name: 'Collector',
            description: 'Gather 50 resources',
            category: 'collection',
            tier: 'silver',
            criteria: {
                type: 'collect',
                target: 50,
                current: 0
            },
            reward: {
                xp: 100,
                gold: 40
            },
            isHidden: false
        });

        this.achievements.set('weapon_master', {
            id: 'weapon_master',
            name: 'Weapon Master',
            description: 'Collect weapons of all rarity types',
            category: 'collection',
            tier: 'gold',
            criteria: {
                type: 'collect',
                target: 5, // 5 rarity types
                current: 0,
                data: {
                    rarities: new Set<string>()
                }
            },
            reward: {
                xp: 250,
                gold: 125,
                items: ['weapon_display_case'],
                title: 'Weapon Master'
            },
            isHidden: false
        });

        // Secret Achievements
        this.achievements.set('night_owl', {
            id: 'night_owl',
            name: 'Night Owl',
            description: 'Play during the night cycle for 10 minutes',
            category: 'secret',
            tier: 'silver',
            criteria: {
                type: 'count',
                target: 600, // 10 minutes in seconds
                current: 0
            },
            reward: {
                xp: 150,
                gold: 60,
                title: 'Night Owl'
            },
            isHidden: true
        });

        this.achievements.set('perfectionist', {
            id: 'perfectionist',
            name: 'Perfectionist',
            description: 'Complete all other achievements',
            category: 'secret',
            tier: 'legendary',
            criteria: {
                type: 'count',
                target: this.achievements.size - 1, // All except this one
                current: 0
            },
            reward: {
                xp: 1000,
                gold: 500,
                items: ['legendary_title_token'],
                title: 'The Perfect One'
            },
            isHidden: true
        });
    }

    // Event listening methods
    on(event: string, callback: Function): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    private emit(event: string, data?: any): void {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => callback(data));
    }

    // Progress tracking methods
    trackEnemyDefeat(_enemyType: string, _playerLevel: number): void {
        this.updateProgress('first_blood', 1);
        this.updateProgress('monster_slayer', 1);
        this.updateProgress('legendary_warrior', 1);
    }

    trackLevelUp(newLevel: number): void {
        this.updateProgress('level_up', newLevel);
        this.updateProgress('veteran', newLevel);
    }

    trackChestOpened(): void {
        this.updateProgress('treasure_hunter', 1);
    }

    trackResourceGathered(_resourceType: string): void {
        this.updateProgress('collector', 1);
    }

    trackWeaponObtained(rarity: string): void {
        const achievement = this.achievements.get('weapon_master');
        if (achievement && achievement.criteria.data) {
            achievement.criteria.data.rarities.add(rarity);
            // Set current progress directly rather than adding
            achievement.criteria.current = achievement.criteria.data.rarities.size;
            
            // Check if achievement is completed
            if (achievement.criteria.current >= achievement.criteria.target) {
                this.unlockAchievement('weapon_master');
            }
        }
    }

    trackAreaDiscovered(areaName: string): void {
        const achievement = this.achievements.get('master_explorer');
        if (achievement && achievement.criteria.data) {
            achievement.criteria.data.discoveredAreas.add(areaName);
            // Set current progress directly rather than adding
            achievement.criteria.current = achievement.criteria.data.discoveredAreas.size;
            
            // Check if achievement is completed
            if (achievement.criteria.current >= achievement.criteria.target) {
                this.unlockAchievement('master_explorer');
            }
        }
    }

    trackNightTimePlay(deltaTime: number): void {
        this.updateProgress('night_owl', deltaTime);
    }

    trackSpellCast(): void {
        // Track spell casting for future magic achievements
        // This could be used for achievements like "Cast 100 spells" or "Master of Magic"
        console.log('🔮 Spell cast tracked for achievements');
    }

    private updateProgress(achievementId: string, value: number): void {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || this.unlockedAchievements.has(achievementId)) {
            return; // Achievement doesn't exist or already unlocked
        }

        // Check prerequisites
        if (achievement.prerequisite && !this.unlockedAchievements.has(achievement.prerequisite)) {
            return;
        }

        // Update progress based on criteria type
        switch (achievement.criteria.type) {
            case 'count':
            case 'collect':
            case 'defeat':
                achievement.criteria.current += value;
                break;
            case 'reach':
                achievement.criteria.current = Math.max(achievement.criteria.current, value);
                break;
            case 'discover':
                achievement.criteria.current = Math.max(achievement.criteria.current, value);
                break;
        }

        // Check if achievement is completed
        if (achievement.criteria.current >= achievement.criteria.target) {
            this.unlockAchievement(achievementId);
        }
    }

    private unlockAchievement(achievementId: string): void {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || this.unlockedAchievements.has(achievementId)) {
            return;
        }

        const unlockedAchievement: UnlockedAchievement = {
            achievement,
            unlockedAt: new Date(),
            progress: 1.0
        };

        this.unlockedAchievements.set(achievementId, unlockedAchievement);

        // Award rewards
        this.awardRewards(achievement.reward);

        // Emit achievement unlocked event
        this.emit('achievementUnlocked', {
            achievement,
            reward: achievement.reward
        });

        // Check perfectionist achievement
        this.updateProgress('perfectionist', this.unlockedAchievements.size);

        console.log(`🏆 Achievement unlocked: ${achievement.name}`);
    }

    private awardRewards(reward: AchievementReward): void {
        if (reward.xp) {
            this.emit('rewardXP', reward.xp);
        }
        if (reward.gold) {
            this.emit('rewardGold', reward.gold);
        }
        if (reward.items) {
            this.emit('rewardItems', reward.items);
        }
        if (reward.title) {
            this.emit('rewardTitle', reward.title);
        }
    }

    // Query methods
    getAllAchievements(): AchievementData[] {
        return Array.from(this.achievements.values()).filter(a => !a.isHidden || this.unlockedAchievements.has(a.id));
    }

    getUnlockedAchievements(): UnlockedAchievement[] {
        return Array.from(this.unlockedAchievements.values());
    }

    getAchievementsByCategory(category: AchievementCategory): AchievementData[] {
        return Array.from(this.achievements.values())
            .filter(a => a.category === category && (!a.isHidden || this.unlockedAchievements.has(a.id)));
    }

    getAchievementProgress(achievementId: string): number {
        const achievement = this.achievements.get(achievementId);
        if (!achievement) return 0;

        if (this.unlockedAchievements.has(achievementId)) return 1;

        return Math.min(achievement.criteria.current / achievement.criteria.target, 1);
    }

    isAchievementUnlocked(achievementId: string): boolean {
        return this.unlockedAchievements.has(achievementId);
    }

    getCompletionPercentage(): number {
        const totalAchievements = this.achievements.size;
        const unlockedCount = this.unlockedAchievements.size;
        return (unlockedCount / totalAchievements) * 100;
    }

    getAchievementsByTier(tier: AchievementTier): AchievementData[] {
        return Array.from(this.achievements.values())
            .filter(a => a.tier === tier && (!a.isHidden || this.unlockedAchievements.has(a.id)));
    }

    // Statistics
    getStatistics() {
        const stats = {
            totalAchievements: this.achievements.size,
            unlockedAchievements: this.unlockedAchievements.size,
            completionPercentage: this.getCompletionPercentage(),
            byCategory: {} as { [key in AchievementCategory]: { total: number; unlocked: number } },
            byTier: {} as { [key in AchievementTier]: { total: number; unlocked: number } },
            totalXPAwarded: 0,
            totalGoldAwarded: 0,
            titlesEarned: [] as string[]
        };

        // Calculate category and tier statistics
        const categories: AchievementCategory[] = ['combat', 'exploration', 'progression', 'collection', 'social', 'secret'];
        const tiers: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum', 'legendary'];

        categories.forEach(category => {
            const categoryAchievements = Array.from(this.achievements.values()).filter(a => a.category === category);
            const unlockedInCategory = categoryAchievements.filter(a => this.unlockedAchievements.has(a.id));
            
            stats.byCategory[category] = {
                total: categoryAchievements.length,
                unlocked: unlockedInCategory.length
            };
        });

        tiers.forEach(tier => {
            const tierAchievements = Array.from(this.achievements.values()).filter(a => a.tier === tier);
            const unlockedInTier = tierAchievements.filter(a => this.unlockedAchievements.has(a.id));
            
            stats.byTier[tier] = {
                total: tierAchievements.length,
                unlocked: unlockedInTier.length
            };
        });

        // Calculate rewards earned
        Array.from(this.unlockedAchievements.values()).forEach(unlocked => {
            const reward = unlocked.achievement.reward;
            if (reward.xp) stats.totalXPAwarded += reward.xp;
            if (reward.gold) stats.totalGoldAwarded += reward.gold;
            if (reward.title) stats.titlesEarned.push(reward.title);
        });

        return stats;
    }

    // Persistence
    serialize(): string {
        const data = {
            unlockedAchievements: Array.from(this.unlockedAchievements.entries()).map(([id, unlocked]) => ({
                id,
                unlockedAt: unlocked.unlockedAt.toISOString(),
                progress: unlocked.progress
            })),
            achievementProgress: Array.from(this.achievements.entries()).map(([id, achievement]) => ({
                id,
                current: achievement.criteria.current,
                data: achievement.criteria.data
            }))
        };

        return JSON.stringify(data);
    }

    deserialize(data: string): void {
        try {
            const parsed = JSON.parse(data);
            
            // Restore unlocked achievements
            if (parsed.unlockedAchievements) {
                this.unlockedAchievements.clear();
                parsed.unlockedAchievements.forEach((item: any) => {
                    const achievement = this.achievements.get(item.id);
                    if (achievement) {
                        this.unlockedAchievements.set(item.id, {
                            achievement,
                            unlockedAt: new Date(item.unlockedAt),
                            progress: item.progress
                        });
                    }
                });
            }

            // Restore progress
            if (parsed.achievementProgress) {
                parsed.achievementProgress.forEach((item: any) => {
                    const achievement = this.achievements.get(item.id);
                    if (achievement) {
                        achievement.criteria.current = item.current;
                        if (item.data) {
                            achievement.criteria.data = item.data;
                            // Convert arrays back to Sets if needed
                            if (item.data.rarities && Array.isArray(item.data.rarities)) {
                                achievement.criteria.data.rarities = new Set(item.data.rarities);
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Failed to deserialize achievement data:', error);
        }
    }

    cleanup(): void {
        this.achievements.clear();
        this.unlockedAchievements.clear();
        this.progressData.clear();
        this.listeners = {};
    }
}