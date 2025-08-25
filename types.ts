
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

// Guided Workout System Types
export interface WorkoutPlan {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  total_exercises?: number;
  est_calories?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  category?: 'strength' | 'cardio' | 'flexibility' | 'mixed' | 'hiit' | 'yoga';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutDay {
  id: string;
  plan_id: string;
  day_number: number;
  day_title?: string;
  rest_day: boolean;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'core';
  duration_seconds?: number;
  reps?: number;
  sets?: number;
  weight_kg?: number;
  image_url?: string;
  gif_url?: string;
  instructions?: string;
  muscle_groups?: string[];
  equipment_needed?: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkoutDayExercise {
  id: string;
  day_id: string;
  exercise_id: string;
  sort_order: number;
  custom_duration_seconds?: number;
  custom_reps?: number;
  custom_sets?: number;
  custom_weight_kg?: number;
  rest_seconds: number;
  created_at: string;
  // Joined fields
  exercise?: Exercise;
}

export interface UserWorkoutProgress {
  id: string;
  user_id: string;
  plan_id: string;
  day_id: string;
  exercise_id: string;
  completed_at: string;
  actual_duration_seconds?: number;
  actual_reps?: number;
  actual_sets?: number;
  actual_weight_kg?: number;
  notes?: string;
}

// Extended types for UI
export interface WorkoutPlanWithDays extends WorkoutPlan {
  days: WorkoutDayWithExercises[];
}

export interface WorkoutDayWithExercises extends WorkoutDay {
  exercises: WorkoutDayExercise[];
}

export interface ExerciseWithCustomization extends Exercise {
  custom_duration_seconds?: number;
  custom_reps?: number;
  custom_sets?: number;
  custom_weight_kg?: number;
  rest_seconds: number;
  sort_order: number;
}

// Update View type to include guided workouts
export type View = 'dashboard' | 'add_meal' | 'progress' | 'profile' | 'onboarding' | 'workouts' | 'activity' | 'guided_workouts' | 'workout_player';
