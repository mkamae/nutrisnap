
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

// Guided Workouts Types
export interface WorkoutPlan {
  id: string;
  user_id?: string; // null for default plans
  title: string;
  description: string;
  duration_minutes: number;
  total_exercises: number;
  est_calories: number;
  created_at: string;
}

export interface WorkoutDay {
  id: string;
  plan_id: string;
  day_number: number;
  title?: string; // e.g., "Upper Body", "Cardio Day"
}

export interface Exercise {
  id: string;
  name: string;
  category: string; // e.g., "strength", "cardio", "flexibility"
  duration_seconds?: number;
  reps?: number;
  image_url?: string;
  gif_url?: string;
  instructions: string;
}

export interface WorkoutDayExercise {
  id: string;
  day_id: string;
  exercise_id: string;
  sort_order: number;
  exercise?: Exercise; // Populated via join
}

export interface WorkoutCompletion {
  id: string;
  user_id: string;
  plan_id: string;
  day_id: string;
  completed_at: string;
  duration_minutes: number;
  exercises_completed: number;
  total_exercises: number;
}

export interface WorkoutPlayerState {
  planId: string;
  dayId: string;
  exercises: (WorkoutDayExercise & { exercise: Exercise })[];
  currentExerciseIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  timeRemaining?: number;
  startTime: Date;
}

// Update View type to include guided workouts
export type View = 'dashboard' | 'add_meal' | 'progress' | 'profile' | 'onboarding' | 'workouts' | 'activity' | 'guided-workouts';
