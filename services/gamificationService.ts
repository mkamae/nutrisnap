import { 
  GamificationData, 
  Badge, 
  Level, 
  GamificationEvent,
  GAMIFICATION_CONSTANTS 
} from '../types/gamification';
import { fetchGamification, upsertGamification } from './gamificationSync';

// =====================================================
// GAMIFICATION SERVICE
// =====================================================

class GamificationService {
  private storageKey = GAMIFICATION_CONSTANTS.STORAGE_KEY;

  // Initialize default gamification data
  private getDefaultData(): GamificationData {
    return {
      points: 0,
      level: 1,
      streak: 0,
      lastActivityDate: '',
      lastLoginDate: '',
      unlockedBadges: [],
      totalMealsLogged: 0,
      totalWorkoutsCompleted: 0,
      totalLogins: 0,
    };
  }

  // Load data from localStorage
  loadData(): GamificationData {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Ensure all required fields exist
        return { ...this.getDefaultData(), ...data };
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
    return this.getDefaultData();
  }

  // Save data to localStorage
  saveData(data: GamificationData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving gamification data:', error);
    }
  }

  // Load from DB for a user (fallback to local if missing)
  async loadForUser(userId: string): Promise<GamificationData> {
    try {
      const db = await fetchGamification(userId);
      if (db) {
        // Merge with defaults to future-proof fields
        const merged: GamificationData = { ...this.getDefaultData(), ...db } as any;
        this.saveData(merged); // keep local mirror
        return merged;
      }
    } catch (e) {
      console.warn('Gamification DB load failed, using local:', e);
    }
    return this.loadData();
  }

  // Persist to DB for a user (optimistic UI: caller updates UI first, then call this)
  async persistForUser(userId: string, data: GamificationData): Promise<void> {
    try {
      await upsertGamification(userId, {
        points: data.points,
        level: data.level,
        streak: data.streak,
        lastActivityDate: data.lastActivityDate,
        lastLoginDate: data.lastLoginDate,
        unlockedBadges: data.unlockedBadges,
        totalMealsLogged: data.totalMealsLogged,
        totalWorkoutsCompleted: data.totalWorkoutsCompleted,
        totalLogins: data.totalLogins,
      });
      this.saveData(data);
    } catch (e) {
      console.error('Gamification sync failed (kept local):', e);
    }
  }

  // Check and update streak
  updateStreak(data: GamificationData): GamificationData {
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = data.lastActivityDate;

    if (!lastActivity) {
      // First time activity
      return { ...data, streak: 1, lastActivityDate: today };
    }

    const lastActivityDate = new Date(lastActivity);
    const todayDate = new Date(today);
    const daysDifference = Math.floor((todayDate.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDifference === 0) {
      // Same day, no change
      return data;
    } else if (daysDifference === 1) {
      // Consecutive day, increment streak
      return { ...data, streak: data.streak + 1, lastActivityDate: today };
    } else {
      // Streak broken, reset to 1
      return { ...data, streak: 1, lastActivityDate: today };
    }
  }

  // Calculate level based on points
  calculateLevel(points: number): number {
    return Math.floor(points / GAMIFICATION_CONSTANTS.POINTS_PER_LEVEL) + 1;
  }

  // Calculate progress towards next level
  calculateProgress(points: number, level: number): number {
    const currentLevelPoints = (level - 1) * GAMIFICATION_CONSTANTS.POINTS_PER_LEVEL;
    const nextLevelPoints = level * GAMIFICATION_CONSTANTS.POINTS_PER_LEVEL;
    const progressPoints = points - currentLevelPoints;
    const totalPointsNeeded = nextLevelPoints - currentLevelPoints;
    
    return Math.min(100, Math.max(0, (progressPoints / totalPointsNeeded) * 100));
  }

  // Award points for meal logging
  awardMealPoints(): GamificationEvent {
    const data = this.loadData();
    const updatedData = this.updateStreak({
      ...data,
      points: data.points + GAMIFICATION_CONSTANTS.POINTS_PER_MEAL,
      totalMealsLogged: data.totalMealsLogged + 1,
    });

    const newLevel = this.calculateLevel(updatedData.points);
    const levelUp = newLevel > data.level;

    this.saveData(updatedData);

    return {
      type: 'meal_logged',
      timestamp: new Date().toISOString(),
      points: GAMIFICATION_CONSTANTS.POINTS_PER_MEAL,
      levelUp,
    };
  }

  // Award points for workout completion
  awardWorkoutPoints(): GamificationEvent {
    const data = this.loadData();
    const updatedData = this.updateStreak({
      ...data,
      points: data.points + GAMIFICATION_CONSTANTS.POINTS_PER_WORKOUT,
      totalWorkoutsCompleted: data.totalWorkoutsCompleted + 1,
    });

    const newLevel = this.calculateLevel(updatedData.points);
    const levelUp = newLevel > data.level;

    this.saveData(updatedData);

    return {
      type: 'workout_completed',
      timestamp: new Date().toISOString(),
      points: GAMIFICATION_CONSTANTS.POINTS_PER_WORKOUT,
      levelUp,
    };
  }

  // Award points for daily login (once per day)
  awardDailyLoginPoints(): GamificationEvent | null {
    const data = this.loadData();
    const today = new Date().toISOString().split('T')[0];
    
    // Check if user already logged in today
    if (data.lastLoginDate === today) {
      return null; // No reward, already logged in today
    }

    const updatedData = {
      ...data,
      points: data.points + GAMIFICATION_CONSTANTS.POINTS_PER_LOGIN,
      lastLoginDate: today,
      totalLogins: data.totalLogins + 1,
    };

    const newLevel = this.calculateLevel(updatedData.points);
    const levelUp = newLevel > data.level;

    this.saveData(updatedData);

    return {
      type: 'daily_login',
      timestamp: new Date().toISOString(),
      points: GAMIFICATION_CONSTANTS.POINTS_PER_LOGIN,
      levelUp,
    };
  }

  // Check for badge unlocks
  checkBadgeUnlocks(): string[] {
    const data = this.loadData();
    const badges = this.getBadges();
    const newBadges: string[] = [];

    badges.forEach(badge => {
      if (!data.unlockedBadges.includes(badge.id) && badge.condition(data)) {
        newBadges.push(badge.id);
      }
    });

    if (newBadges.length > 0) {
      const updatedData = {
        ...data,
        unlockedBadges: [...data.unlockedBadges, ...newBadges],
        points: data.points + newBadges.reduce((sum, badgeId) => {
          const badge = badges.find(b => b.id === badgeId);
          return sum + (badge?.pointsReward || 0);
        }, 0),
      };
      this.saveData(updatedData);
    }

    return newBadges;
  }

  // Get all available badges
  getBadges(): Badge[] {
    return [
      {
        id: 'first_meal',
        name: 'First Bite',
        description: 'Logged your first meal!',
        emoji: '🎉',
        condition: (data) => data.totalMealsLogged >= 1,
        pointsReward: 5,
      },
      {
        id: 'three_day_streak',
        name: 'On Fire',
        description: '3-day streak!',
        emoji: '🔥',
        condition: (data) => data.streak >= 3,
        pointsReward: 15,
      },
      {
        id: 'week_streak',
        name: 'Consistency King',
        description: '7-day streak!',
        emoji: '👑',
        condition: (data) => data.streak >= 7,
        pointsReward: 50,
      },
      {
        id: 'hundred_points',
        name: 'Century Club',
        description: 'Earned 100 points!',
        emoji: '🏆',
        condition: (data) => data.points >= 100,
        pointsReward: 25,
      },
      {
        id: 'ten_meals',
        name: 'Foodie',
        description: 'Logged 10 meals!',
        emoji: '🍽️',
        condition: (data) => data.totalMealsLogged >= 10,
        pointsReward: 20,
      },
      {
        id: 'five_workouts',
        name: 'Fitness Enthusiast',
        description: 'Completed 5 workouts!',
        emoji: '💪',
        condition: (data) => data.totalWorkoutsCompleted >= 5,
        pointsReward: 30,
      },
      {
        id: 'level_five',
        name: 'Rising Star',
        description: 'Reached level 5!',
        emoji: '⭐',
        condition: (data) => data.level >= 5,
        pointsReward: 50,
      },
      {
        id: 'daily_login_streak',
        name: 'Daily Visitor',
        description: 'Logged in 5 days in a row!',
        emoji: '📅',
        condition: (data) => data.totalLogins >= 5,
        pointsReward: 25,
      },
      {
        id: 'login_master',
        name: 'Login Master',
        description: 'Logged in 30 days total!',
        emoji: '🏅',
        condition: (data) => data.totalLogins >= 30,
        pointsReward: 100,
      },
    ];
  }

  // Get level information
  getLevelInfo(level: number): Level {
    const levels: Level[] = [
      { level: 1, pointsRequired: 0, title: 'Beginner', emoji: '🌱' },
      { level: 2, pointsRequired: 100, title: 'Explorer', emoji: '🚀' },
      { level: 3, pointsRequired: 200, title: 'Adventurer', emoji: '🗺️' },
      { level: 4, pointsRequired: 300, title: 'Champion', emoji: '🏅' },
      { level: 5, pointsRequired: 400, title: 'Master', emoji: '👑' },
      { level: 6, pointsRequired: 500, title: 'Legend', emoji: '🌟' },
      { level: 7, pointsRequired: 600, title: 'Hero', emoji: '🦸' },
      { level: 8, pointsRequired: 700, title: 'Superstar', emoji: '✨' },
      { level: 9, pointsRequired: 800, title: 'Icon', emoji: '🎭' },
      { level: 10, pointsRequired: 900, title: 'Legendary', emoji: '🏆' },
    ];

    return levels.find(l => l.level === level) || levels[0];
  }

  // Reset all data (for testing)
  resetData(): void {
    localStorage.removeItem(this.storageKey);
  }
}

// Export singleton instance
export const gamificationService = new GamificationService();
