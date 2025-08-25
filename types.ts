
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

export interface WorkoutRoutine {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  isActive: boolean;
  frequency: 'daily' | '3x_week' | '4x_week' | '5x_week' | '6x_week' | 'custom';
  customFrequencyDays?: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  routineId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg?: number;
  durationMinutes?: number;
  restSeconds?: number;
  notes?: string;
  orderIndex: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  routineId?: string;
  sessionDate: string; // ISO date string
  startTime?: string; // ISO timestamp
  endTime?: string; // ISO timestamp
  totalDurationMinutes: number;
  caloriesBurned: number;
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

export type View = 'dashboard' | 'add_meal' | 'progress' | 'profile' | 'onboarding' | 'workouts' | 'activity' | 'fitness' | 'enhanced_workouts' | 'enhanced_activity';
