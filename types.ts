
export interface Nutrients {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portionSize: string;
}

export interface MealEntry extends Nutrients {
  id: string;
  date: string; // ISO string
  imageUrl: string; // data URL
  user_id?: string; // Supabase user ID
  created_at?: string; // ISO string
}

export interface UserProfile {
  id?: string;
  user_id?: string;
  name: string;
  age: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  weightKg: number;
  heightCm: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dailyCalorieGoal: number;
  
  // Fitness objectives
  primaryGoal?: 'lose_weight' | 'gain_weight' | 'maintain_weight' | 'build_muscle' | 'improve_fitness';
  targetWeightKg?: number;
  weeklyGoal?: 'lose_0.5kg' | 'lose_1kg' | 'gain_0.5kg' | 'gain_1kg' | 'maintain';
  
  // Body composition
  bodyFatPercentage?: number;
  muscleMassKg?: number;
  
  // Activity preferences
  preferredActivities?: string[]; // Array of preferred workout types
  fitnessExperience?: 'beginner' | 'intermediate' | 'advanced';
  
  updated_at?: string; // ISO string
}



export interface Workout {
  id: string;
  user_id: string;
  workout_type: string;
  duration_minutes: number;
  calories_burned?: number;
  workout_date: string; // ISO date string
  notes?: string;
  created_at: string;
}

export interface ExerciseLog {
  id: string;
  sessionId: string;
  exerciseName: string;
  setsCompleted: number;
  repsCompleted: number;
  weightUsedKg?: number;
  durationMinutes?: number;
  notes?: string;
  created_at: string;
}

export interface DailyActivitySummary {
  userId: string;
  email: string;
  name: string;
  date: string;
  caloriesConsumed: number;
  proteinConsumed: number;
  carbsConsumed: number;
  fatConsumed: number;
  caloriesBurned: number;
  workoutMinutes: number;
  dailyCalorieGoal: number;
  netCalories: number;
  activityStatus: 'Active' | 'Rest Day';
}

export interface AuthUser {
  id: string;
  email?: string;
  created_at: string;
}

// Update View type to remove guided workouts
export type View = 'dashboard' | 'add_meal' | 'progress' | 'profile' | 'onboarding' | 'workouts' | 'activity';
