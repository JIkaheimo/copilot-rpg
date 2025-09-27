import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AchievementSystem } from '@systems/AchievementSystem';

describe('AchievementSystem', () => {
    let achievementSystem: AchievementSystem;

    beforeEach(() => {
        achievementSystem = new AchievementSystem();
    });

    describe('Initialization', () => {
        it('should initialize successfully', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            achievementSystem.initialize();
            
            expect(consoleSpy).toHaveBeenCalledWith('🏆 Achievement System initialized');
            consoleSpy.mockRestore();
        });

        it('should create achievement templates', () => {
            achievementSystem.initialize();
            
            const achievements = achievementSystem.getAllAchievements();
            expect(achievements.length).toBeGreaterThan(0);
            
            // Check for specific achievements
            const firstBlood = achievements.find(a => a.id === 'first_blood');
            const monsterSlayer = achievements.find(a => a.id === 'monster_slayer');
            const treasureHunter = achievements.find(a => a.id === 'treasure_hunter');
            
            expect(firstBlood).toBeDefined();
            expect(monsterSlayer).toBeDefined();
            expect(treasureHunter).toBeDefined();
        });

        it('should not show hidden achievements initially', () => {
            achievementSystem.initialize();
            
            const allAchievements = achievementSystem.getAllAchievements();
            const hiddenAchievements = allAchievements.filter(a => a.isHidden);
            
            expect(hiddenAchievements.length).toBe(0);
        });
    });

    describe('Achievement Tracking', () => {
        beforeEach(() => {
            achievementSystem.initialize();
        });

        it('should track enemy defeats', () => {
            const progress = achievementSystem.getAchievementProgress('first_blood');
            expect(progress).toBe(0);
            
            achievementSystem.trackEnemyDefeat('goblin', 1);
            
            const newProgress = achievementSystem.getAchievementProgress('first_blood');
            expect(newProgress).toBe(1); // Should be completed
        });

        it('should track level progression', () => {
            const progress = achievementSystem.getAchievementProgress('level_up');
            expect(progress).toBe(0.2); // Current level 1, target 5 = 1/5 = 0.2
            
            achievementSystem.trackLevelUp(5);
            
            const newProgress = achievementSystem.getAchievementProgress('level_up');
            expect(newProgress).toBe(1); // Should be completed
        });

        it('should track chest openings', () => {
            const progress = achievementSystem.getAchievementProgress('treasure_hunter');
            expect(progress).toBe(0);
            
            achievementSystem.trackChestOpened();
            achievementSystem.trackChestOpened();
            achievementSystem.trackChestOpened();
            
            const newProgress = achievementSystem.getAchievementProgress('treasure_hunter');
            expect(newProgress).toBe(0.6); // 3/5 = 0.6
        });

        it('should track resource gathering', () => {
            const progress = achievementSystem.getAchievementProgress('collector');
            expect(progress).toBe(0);
            
            for (let i = 0; i < 25; i++) {
                achievementSystem.trackResourceGathered('wood');
            }
            
            const newProgress = achievementSystem.getAchievementProgress('collector');
            expect(newProgress).toBe(0.5); // 25/50 = 0.5
        });

        it('should track weapon collection by rarity', () => {
            const progress = achievementSystem.getAchievementProgress('weapon_master');
            expect(progress).toBe(0);
            
            achievementSystem.trackWeaponObtained('common');
            let newProgress = achievementSystem.getAchievementProgress('weapon_master');
            expect(newProgress).toBe(0.2); // 1/5 = 0.2
            
            achievementSystem.trackWeaponObtained('uncommon');
            newProgress = achievementSystem.getAchievementProgress('weapon_master');
            expect(newProgress).toBe(0.4); // 2/5 = 0.4
            
            achievementSystem.trackWeaponObtained('rare');
            newProgress = achievementSystem.getAchievementProgress('weapon_master');
            expect(newProgress).toBe(0.6); // 3/5 = 0.6
            
            // Adding same rarity again shouldn't increase progress
            achievementSystem.trackWeaponObtained('common');
            const sameProgress = achievementSystem.getAchievementProgress('weapon_master');
            expect(sameProgress).toBe(0.6);
        });
    });

    describe('Achievement Unlocking', () => {
        beforeEach(() => {
            achievementSystem.initialize();
        });

        it('should unlock achievements when criteria are met', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            let achievementUnlocked = false;
            
            achievementSystem.on('achievementUnlocked', () => {
                achievementUnlocked = true;
            });
            
            expect(achievementSystem.isAchievementUnlocked('first_blood')).toBe(false);
            
            achievementSystem.trackEnemyDefeat('goblin', 1);
            
            expect(achievementSystem.isAchievementUnlocked('first_blood')).toBe(true);
            expect(achievementUnlocked).toBe(true);
            expect(consoleSpy).toHaveBeenCalledWith('🏆 Achievement unlocked: First Blood');
            consoleSpy.mockRestore();
        });

        it('should not unlock achievements multiple times', () => {
            let unlockCount = 0;
            
            achievementSystem.on('achievementUnlocked', () => {
                unlockCount++;
            });
            
            achievementSystem.trackEnemyDefeat('goblin', 1);
            achievementSystem.trackEnemyDefeat('goblin', 1);
            
            expect(unlockCount).toBe(1);
        });

        it('should respect prerequisites', () => {
            // Try to complete legendary_warrior without monster_slayer
            for (let i = 0; i < 100; i++) {
                achievementSystem.trackEnemyDefeat('goblin', 1);
            }
            
            // Should not unlock legendary_warrior because monster_slayer prerequisite isn't met
            expect(achievementSystem.isAchievementUnlocked('legendary_warrior')).toBe(false);
            expect(achievementSystem.isAchievementUnlocked('monster_slayer')).toBe(true);
            expect(achievementSystem.isAchievementUnlocked('first_blood')).toBe(true);
        });

        it('should award rewards when achievements are unlocked', () => {
            let xpAwarded = 0;
            let goldAwarded = 0;
            
            achievementSystem.on('rewardXP', (xp: number) => {
                xpAwarded += xp;
            });
            
            achievementSystem.on('rewardGold', (gold: number) => {
                goldAwarded += gold;
            });
            
            achievementSystem.trackEnemyDefeat('goblin', 1);
            
            expect(xpAwarded).toBe(25); // First Blood reward
            expect(goldAwarded).toBe(10);
        });
    });

    describe('Achievement Queries', () => {
        beforeEach(() => {
            achievementSystem.initialize();
        });

        it('should filter achievements by category', () => {
            const combatAchievements = achievementSystem.getAchievementsByCategory('combat');
            const explorationAchievements = achievementSystem.getAchievementsByCategory('exploration');
            
            expect(combatAchievements.length).toBeGreaterThan(0);
            expect(explorationAchievements.length).toBeGreaterThan(0);
            
            combatAchievements.forEach(achievement => {
                expect(achievement.category).toBe('combat');
            });
        });

        it('should filter achievements by tier', () => {
            const bronzeAchievements = achievementSystem.getAchievementsByTier('bronze');
            const goldAchievements = achievementSystem.getAchievementsByTier('gold');
            
            expect(bronzeAchievements.length).toBeGreaterThan(0);
            expect(goldAchievements.length).toBeGreaterThan(0);
            
            bronzeAchievements.forEach(achievement => {
                expect(achievement.tier).toBe('bronze');
            });
        });

        it('should get unlocked achievements', () => {
            expect(achievementSystem.getUnlockedAchievements().length).toBe(0);
            
            achievementSystem.trackEnemyDefeat('goblin', 1);
            
            const unlockedAchievements = achievementSystem.getUnlockedAchievements();
            expect(unlockedAchievements.length).toBe(1);
            expect(unlockedAchievements[0].achievement.id).toBe('first_blood');
        });

        it('should calculate completion percentage', () => {
            const initialCompletion = achievementSystem.getCompletionPercentage();
            expect(initialCompletion).toBe(0);
            
            achievementSystem.trackEnemyDefeat('goblin', 1);
            
            const newCompletion = achievementSystem.getCompletionPercentage();
            expect(newCompletion).toBeGreaterThan(0);
        });
    });

    describe('Statistics', () => {
        beforeEach(() => {
            achievementSystem.initialize();
        });

        it('should provide comprehensive statistics', () => {
            const stats = achievementSystem.getStatistics();
            
            expect(stats.totalAchievements).toBeGreaterThan(0);
            expect(stats.unlockedAchievements).toBe(0);
            expect(stats.completionPercentage).toBe(0);
            expect(stats.byCategory).toBeDefined();
            expect(stats.byTier).toBeDefined();
            expect(stats.totalXPAwarded).toBe(0);
            expect(stats.totalGoldAwarded).toBe(0);
            expect(stats.titlesEarned).toEqual([]);
        });

        it('should update statistics when achievements are unlocked', () => {
            achievementSystem.trackEnemyDefeat('goblin', 1);
            
            const stats = achievementSystem.getStatistics();
            
            expect(stats.unlockedAchievements).toBe(1);
            expect(stats.completionPercentage).toBeGreaterThan(0);
            expect(stats.totalXPAwarded).toBe(25);
            expect(stats.totalGoldAwarded).toBe(10);
        });
    });

    describe('Persistence', () => {
        beforeEach(() => {
            achievementSystem.initialize();
        });

        it('should serialize and deserialize achievement data', () => {
            // Unlock some achievements
            achievementSystem.trackEnemyDefeat('goblin', 1);
            achievementSystem.trackChestOpened();
            
            const serialized = achievementSystem.serialize();
            expect(serialized).toBeTruthy();
            
            // Create new system and load data
            const newSystem = new AchievementSystem();
            newSystem.initialize();
            newSystem.deserialize(serialized);
            
            expect(newSystem.isAchievementUnlocked('first_blood')).toBe(true);
            expect(newSystem.getAchievementProgress('treasure_hunter')).toBe(0.2); // 1/5
        });

        it('should handle invalid serialization data gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            expect(() => achievementSystem.deserialize('invalid json')).not.toThrow();
            expect(() => achievementSystem.deserialize('{}')).not.toThrow();
            
            consoleSpy.mockRestore();
        });
    });

    describe('Night Time Tracking', () => {
        beforeEach(() => {
            achievementSystem.initialize();
        });

        it('should track night time play', () => {
            const progress = achievementSystem.getAchievementProgress('night_owl');
            expect(progress).toBe(0);
            
            // Simulate 5 minutes of night play (300 seconds)
            for (let i = 0; i < 300; i++) {
                achievementSystem.trackNightTimePlay(1);
            }
            
            const newProgress = achievementSystem.getAchievementProgress('night_owl');
            expect(newProgress).toBe(0.5); // 300/600 = 0.5
        });
    });

    describe('Area Discovery', () => {
        beforeEach(() => {
            achievementSystem.initialize();
        });

        it('should track area discovery', () => {
            const progress = achievementSystem.getAchievementProgress('master_explorer');
            expect(progress).toBe(0);
            
            achievementSystem.trackAreaDiscovered('Forest');
            achievementSystem.trackAreaDiscovered('Mountains');
            achievementSystem.trackAreaDiscovered('Desert');
            
            const newProgress = achievementSystem.getAchievementProgress('master_explorer');
            expect(newProgress).toBe(0.3); // 3/10 = 0.3
        });
    });

    describe('Cleanup', () => {
        beforeEach(() => {
            achievementSystem.initialize();
        });

        it('should cleanup all resources', () => {
            achievementSystem.trackEnemyDefeat('goblin', 1);
            
            expect(achievementSystem.getAllAchievements().length).toBeGreaterThan(0);
            expect(achievementSystem.getUnlockedAchievements().length).toBe(1);
            
            achievementSystem.cleanup();
            
            expect(achievementSystem.getAllAchievements().length).toBe(0);
            expect(achievementSystem.getUnlockedAchievements().length).toBe(0);
        });
    });

    describe('Event System', () => {
        beforeEach(() => {
            achievementSystem.initialize();
        });

        it('should support event listeners', () => {
            let eventTriggered = false;
            let eventData: any = null;
            
            achievementSystem.on('achievementUnlocked', (data: any) => {
                eventTriggered = true;
                eventData = data;
            });
            
            achievementSystem.trackEnemyDefeat('goblin', 1);
            
            expect(eventTriggered).toBe(true);
            expect(eventData).toBeDefined();
            expect(eventData.achievement.id).toBe('first_blood');
        });

        it('should support multiple listeners for same event', () => {
            let listener1Called = false;
            let listener2Called = false;
            
            achievementSystem.on('achievementUnlocked', () => {
                listener1Called = true;
            });
            
            achievementSystem.on('achievementUnlocked', () => {
                listener2Called = true;
            });
            
            achievementSystem.trackEnemyDefeat('goblin', 1);
            
            expect(listener1Called).toBe(true);
            expect(listener2Called).toBe(true);
        });
    });
});