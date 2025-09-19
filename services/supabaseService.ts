import { createClient } from '@supabase/supabase-js';
import { 
  MealEntry, 
  FoodItem, 
  DemoWorkout, 
  Exercise, 
  Workout, 
  WorkoutSession, 
  ExerciseLog,
  UserProfile
} from '../types';

// Access environment variables directly
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

console.log('🔧 Supabase configuration loaded:');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey.length);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generic timeout wrapper for any Supabase query promise
export async function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs: number = 10000): Promise<T> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs))
    ]);
    const duration = Date.now() - start;
    console.log(`⏱️ ${label} completed in ${duration}ms`);
    return result as T;
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`⏱️ ${label} failed after ${duration}ms:`, err);
    throw err;
  }
}

// -----------------------------------------------------
// Connectivity audit utility
// -----------------------------------------------------
export async function auditSupabaseConnectivity() {
  const report: any = {
    timestamp: new Date().toISOString(),
    url: supabaseUrl,
    anonKeyPresent: Boolean(supabaseAnonKey),
    checks: [] as Array<{ name: string; ok: boolean; ms: number; note?: string; error?: string }>
  };

  async function run(name: string, fn: () => Promise<void>) {
    const start = performance.now();
    try {
      await fn();
      report.checks.push({ name, ok: true, ms: Math.round(performance.now() - start) });
    } catch (e: any) {
      report.checks.push({ name, ok: false, ms: Math.round(performance.now() - start), error: e?.message || String(e) });
    }
  }

  // 1) DNS/Network reachability to Supabase REST
  await run('REST reachability', async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${supabaseUrl}/rest/v1/`, { method: 'GET', signal: ctrl.signal });
    clearTimeout(t);
    // 200/401/404 are all fine for reachability
    if (!res.ok && ![401, 404].includes(res.status)) throw new Error(`HTTP ${res.status}`);
  });

  // 2) Auth state
  await run('Auth getUser', async () => {
    const u = await supabase.auth.getUser();
    if (u.error) throw new Error(u.error.message);
  });

  // 3) Simple table probes (existence/permission/latency)
  await run('Probe: demo_workouts', async () => {
    const { error } = await withTimeout(
      (async () => await supabase.from('demo_workouts').select('id').limit(1))(),
      'Audit: demo_workouts',
      8000
    ) as any;
    if (error) throw new Error(error.message);
  });

  await run('Probe: meals', async () => {
    const { error } = await withTimeout(
      (async () => await supabase.from('meals').select('id').limit(1))(),
      'Audit: meals',
      8000
    ) as any;
    if (error) throw new Error(error.message);
  });

  // 4) Storage/CORS quick ping (optional)
  await run('Edge ping', async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`${supabaseUrl}/status`, { method: 'GET', signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok && ![401, 404].includes(res.status)) throw new Error(`HTTP ${res.status}`);
  });

  return report;
}

// Expose quick access in the browser console
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(typeof window !== 'undefined' ? (window as any).__supabaseAudit = auditSupabaseConnectivity : undefined);

// Note: No local fallbacks — app requires live Supabase connectivity


// Test connection function with timeout
export const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection test timed out after 10 seconds')), 10000);
    });
    
    const connectionPromise = supabase
      .from('meals')
      .select('id')
      .limit(1);
    
    const result = await Promise.race([connectionPromise, timeoutPromise]);
    const { data, error } = result;
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase connection successful');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Connection test error:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// MEAL SERVICE
// =====================================================

export const mealService = {
  async createMeal(mealData: Omit<MealEntry, 'id' | 'created_at'>, userId: string): Promise<MealEntry> {
    try {
      console.log('🍽️ Creating meal:', { mealData, userId });
      
      const { data, error } = await withTimeout(
        (async () => await supabase
          .from('meals')
          .insert({
            user_id: userId,
            mealname: mealData.mealname,
            portionsize: mealData.portionsize,
            imageurl: mealData.imageurl,
            calories: mealData.calories,
            protein: mealData.protein,
            carbs: mealData.carbs,
            fat: mealData.fat,
            date: mealData.date
          })
          .select()
          .single())(),
        'Insert meal',
        10000
      ) as any;

      if (error) {
        console.error('❌ Error creating meal:', error);
        throw new Error(`Failed to save meal: ${error.message}`);
      }

      console.log('✅ Meal created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in createMeal:', error);
      throw error;
    }
  },

  async getMeals(userId: string): Promise<MealEntry[]> {
    try {
      const { data, error } = await withTimeout(
        (async () => await supabase
          .from('meals')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }))(),
        'Get meals',
        10000
      ) as any;

      if (error) {
        console.error('Error fetching meals:', error);
        throw new Error(`Failed to fetch meals: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getMeals:', error);
      throw error;
    }
  },

  async getMealsByDateRange(userId: string, startDate: string, endDate: string): Promise<MealEntry[]> {
    try {
      const { data, error } = await withTimeout(
        (async () => await supabase
          .from('meals')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('created_at', { ascending: false }))(),
        'Get meals by date range',
        15000
      ) as any;

      if (error) {
        console.error('Error fetching meals by date range:', error);
        throw new Error(`Failed to fetch meals: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getMealsByDateRange:', error);
      throw error;
    }
  },

  async deleteMeal(mealId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

      if (error) {
        console.error('Error deleting meal:', error);
        throw new Error(`Failed to delete meal: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteMeal:', error);
      throw error;
    }
  }
};

// =====================================================
// FOOD SERVICE
// =====================================================

export const foodService = {
  async getFoodItems(): Promise<FoodItem[]> {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching food items:', error);
        throw new Error(`Failed to fetch food items: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getFoodItems:', error);
      throw error;
    }
  },

  async searchFoodItems(query: string): Promise<FoodItem[]> {
    try {
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10);

      if (error) {
        console.error('Error searching food items:', error);
        throw new Error(`Failed to search food items: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in searchFoodItems:', error);
      throw error;
    }
  }
};

// =====================================================
// DEMO WORKOUT SERVICE
// =====================================================

export const demoWorkoutService = {
  async getDemoWorkouts(): Promise<DemoWorkout[]> {
    try {
      const { data, error } = await withTimeout(
        (async () => await supabase
          .from('demo_workouts')
          .select('*')
          .order('category', { ascending: true }))(),
        'Get demo workouts',
        12000
      ) as any;

      if (error) {
        throw new Error(`Failed to fetch demo workouts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getDemoWorkouts:', error);
    throw error;
    }
  },

  async getDemoWorkoutsByCategory(category: string): Promise<DemoWorkout[]> {
    try {
      const { data, error } = await withTimeout(
        (async () => await supabase
          .from('demo_workouts')
          .select('*')
          .eq('category', category)
          .order('name'))(),
        'Get demo workouts by category',
        12000
      ) as any;

      if (error) {
        throw new Error(`Failed to fetch demo workouts: ${error.message}`);
      }

      return (data || []).filter((w: any) => w.category === category);
    } catch (error) {
      console.error('Error in getDemoWorkoutsByCategory:', error);
    throw error;
    }
  }
};

// =====================================================
// EXERCISE SERVICE
// =====================================================

export const exerciseService = {
  async getExercises(): Promise<Exercise[]> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        console.error('Error fetching exercises:', error);
        throw new Error(`Failed to fetch exercises: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getExercises:', error);
      throw error;
    }
  },

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('category', category)
        .order('name');

      if (error) {
        console.error('Error fetching exercises by category:', error);
        throw new Error(`Failed to fetch exercises: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getExercisesByCategory:', error);
      throw error;
    }
  },

  async getExerciseById(id: string): Promise<Exercise | null> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching exercise by ID:', error);
        throw new Error(`Failed to fetch exercise: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getExerciseById:', error);
      throw error;
    }
  }
};

// =====================================================
// WORKOUT SERVICE
// =====================================================

export const workoutService = {
  async createWorkout(workoutData: Omit<Workout, 'id' | 'created_at'>, userId: string): Promise<Workout> {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          name: workoutData.name,
          description: workoutData.description,
          exercises: workoutData.exercises
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating workout:', error);
        throw new Error(`Failed to create workout: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createWorkout:', error);
      throw error;
    }
  },

  async getWorkouts(userId: string): Promise<Workout[]> {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching workouts:', error);
        throw new Error(`Failed to fetch workouts: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getWorkouts:', error);
      throw error;
    }
  },

  async deleteWorkout(workoutId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting workout:', error);
        throw new Error(`Failed to delete workout: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteWorkout:', error);
      throw error;
    }
  }
};

// =====================================================
// WORKOUT SESSION SERVICE
// =====================================================

export const workoutSessionService = {
  async startWorkoutSession(
    userId: string, 
    workoutId?: string, 
    demoWorkoutId?: string
  ): Promise<WorkoutSession> {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: userId,
          workout_id: workoutId,
          demo_workout_id: demoWorkoutId,
          started_at: new Date().toISOString(),
          calories_burned: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting workout session:', error);
        throw new Error(`Failed to start workout session: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in startWorkoutSession:', error);
      throw error;
    }
  },

  async completeWorkoutSession(
    sessionId: string, 
    totalDurationSeconds: number, 
    caloriesBurned: number,
    notes?: string
  ): Promise<WorkoutSession> {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .update({
          completed_at: new Date().toISOString(),
          total_duration_seconds: totalDurationSeconds,
          calories_burned: caloriesBurned,
          notes: notes
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Error completing workout session:', error);
        throw new Error(`Failed to complete workout session: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in completeWorkoutSession:', error);
      throw error;
    }
  },

  async getWorkoutSessions(userId: string, limit: number = 10): Promise<WorkoutSession[]> {
    try {
      const { data, error } = await withTimeout(
        (async () => await supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('started_at', { ascending: false })
          .limit(limit))(),
        'Get workout sessions',
        15000
      ) as any;

      if (error) {
        console.error('Error fetching workout sessions:', error);
        throw new Error(`Failed to fetch workout sessions: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getWorkoutSessions:', error);
      throw error;
    }
  }
};

// =====================================================
// EXERCISE LOG SERVICE
// =====================================================

export const exerciseLogService = {
  async logExercise(logData: Omit<ExerciseLog, 'id' | 'created_at'>): Promise<ExerciseLog> {
    try {
      const { data, error } = await supabase
        .from('exercise_logs')
        .insert({
          session_id: logData.session_id,
          exercise_id: logData.exercise_id,
          demo_workout_id: logData.demo_workout_id,
          sets_completed: logData.sets_completed,
          reps_completed: logData.reps_completed,
          duration_seconds: logData.duration_seconds,
          weight_used: logData.weight_used,
          notes: logData.notes
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging exercise:', error);
        throw new Error(`Failed to log exercise: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in logExercise:', error);
      throw error;
    }
  },

  async getExerciseLogs(sessionId: string): Promise<ExerciseLog[]> {
    try {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching exercise logs:', error);
        throw new Error(`Failed to fetch exercise logs: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getExerciseLogs:', error);
      throw error;
    }
  }
};

// =====================================================
// USER PROFILE SERVICE
// =====================================================

export const userProfileService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, return null
          return null;
        }
        console.error('Error fetching user profile:', error);
        throw new Error(`Failed to fetch user profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  },

  async createUserProfile(profile: Omit<UserProfile, 'id' | 'updated_at'>): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profile])
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        throw new Error(`Failed to create user profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      throw error;
    }
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw new Error(`Failed to update user profile: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  },

  async getOrCreateUserProfile(userId: string, email?: string): Promise<UserProfile> {
    try {
      // Try to get existing profile
      let profile = await this.getUserProfile(userId);
      
      if (!profile) {
        // Create default profile if none exists
        const defaultProfile: Omit<UserProfile, 'id' | 'updated_at'> = {
          user_id: userId,
          name: email ? email.split('@')[0] : 'User', // Use email prefix as default name
          age: 25,
          weightKg: 70,
          heightCm: 170,
          activityLevel: 'moderate',
          dailyCalorieGoal: 2500
        };
        
        profile = await this.createUserProfile(defaultProfile);
        console.log('✅ Created default user profile');
      }
      
      return profile;
    } catch (error) {
      console.error('Error in getOrCreateUserProfile:', error);
      throw error;
    }
  }
};

export default supabase;