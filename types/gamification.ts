// =====================================================
// GAMIFICATION TYPES
// =====================================================

export interface GamificationData {
  points: number;
  level: number;
  streak: number;
  lastActivityDate: string;
  unlockedBadges: string[];
  totalMealsLogged: number;
  totalWorkoutsCompleted: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: (data: GamificationData) => boolean;
  pointsReward: number;
}

export interface Level {
  level: number;
  pointsRequired: number;
  title: string;
  emoji: string;
}

export interface GamificationState {
  data: GamificationData;
  badges: Badge[];
  levels: Level[];
  isLoading: boolean;
  error?: string;
}

// =====================================================
// GAMIFICATION EVENTS
// =====================================================

export interface GamificationEvent {
  type: 'meal_logged' | 'workout_completed' | 'streak_check';
  timestamp: string;
  points?: number;
  badgeUnlocked?: string;
  levelUp?: boolean;
}

// =====================================================
// GAMIFICATION CONSTANTS
// =====================================================

export const GAMIFICATION_CONSTANTS = {
  POINTS_PER_MEAL: 10,
  POINTS_PER_WORKOUT: 20,
  POINTS_PER_LEVEL: 100,
  STREAK_CHECK_HOURS: 24,
  STORAGE_KEY: 'nutrisnap_gamification',
} as const;
