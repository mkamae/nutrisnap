// =====================================================
// MEAL ANALYSIS TYPES
// =====================================================

export interface Nutrients {
  mealname: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portionsize?: string;
}

export interface MealEntry {
  id: string;
  user_id: string;
  mealname: string;
  portionsize?: string;
  imageurl?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
  created_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  category?: string;
  created_at: string;
}

// =====================================================
// GUIDED WORKOUTS TYPES
// =====================================================

export interface DemoWorkout {
  id: string;
  name: string;
  category: string;
  reps?: number;
  sets?: number;
  duration_seconds?: number;
  instructions?: string;
  muscle_groups?: string[];
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  duration_seconds?: number;
  reps?: number;
  image_url?: string;
  instructions?: string;
  muscle_groups?: string[];
  gif_url?: string;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  exercises: any; // jsonb array of exercise IDs with sets/reps
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_id?: string;
  demo_workout_id?: string;
  started_at: string;
  completed_at?: string;
  total_duration_seconds?: number;
  calories_burned: number;
  notes?: string;
}

export interface ExerciseLog {
  id: string;
  session_id: string;
  exercise_id?: string;
  demo_workout_id?: string;
  sets_completed: number;
  reps_completed: number;
  duration_seconds: number;
  weight_used?: number;
  notes?: string;
  created_at: string;
}

// =====================================================
// USER PROFILE TYPES
// =====================================================

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

// =====================================================
// DASHBOARD & ANALYTICS TYPES
// =====================================================

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

// =====================================================
// WORKOUT PLAYER TYPES
// =====================================================

export interface WorkoutPlayerState {
  workoutId?: string;
  demoWorkoutId?: string;
  exercises: Exercise[];
  currentExerciseIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  timeRemaining?: number;
  startTime: Date;
  sessionId?: string;
}

// =====================================================
// UI TYPES
// =====================================================

export type View = 'dashboard' | 'add_meal' | 'progress' | 'profile' | 'workouts' | 'activity';

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface WorkoutFilters {
  category?: string;
  muscleGroup?: string;
  duration?: 'short' | 'medium' | 'long'; // <15min, 15-30min, >30min
}

export interface MealFilters {
  date?: string;
  category?: string;
}