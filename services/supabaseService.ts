import { createClient } from '@supabase/supabase-js';
import { MealEntry, Workout } from '../types';

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

// Test connection function with timeout
export const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    // Add timeout to prevent hanging
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

// Meal Service
export const mealService = {
  async addMeal(meal: Omit<MealEntry, 'id' | 'created_at'>, userId: string): Promise<MealEntry> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .insert([
          {
            mealname: meal.mealName,       // lowercase DB column
            portionsize: meal.portionSize, // lowercase DB column
            imageurl: meal.imageUrl,       // lowercase DB column
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            date: meal.date,
            user_id: userId,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding meal:', error);
        throw new Error('Failed to add meal');
      }

      // Map database response back to app format
      const mappedMeal: MealEntry = {
        id: data.id,
        mealName: data.mealname,
        portionSize: data.portionsize,
        imageUrl: data.imageurl,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        date: data.date,
        user_id: data.user_id,
        created_at: data.created_at
      };

      return mappedMeal;
    } catch (error) {
      console.error('Error in addMeal:', error);
      throw error;
    }
  },

  async getMeals(userId: string): Promise<MealEntry[]> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching meals:', error);
        throw new Error('Failed to fetch meals');
      }

      // Map database column names to app field names
      return data.map(item => ({
        id: item.id,
        mealName: item.mealname,
        portionSize: item.portionsize,
        imageUrl: item.imageurl,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        date: item.date,
        user_id: item.user_id,
        created_at: item.created_at
      }));
    } catch (error) {
      console.error('Error in getMeals:', error);
      throw error;
    }
  }
};

// Workout Service
export const workoutService = {
  async createWorkout(workout: Omit<Workout, 'id' | 'created_at'>, userId: string): Promise<Workout> {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .insert([
          {
            user_id: userId,
            workout_type: workout.workout_type,
            duration_minutes: workout.duration_minutes,
            calories_burned: workout.calories_burned,
            workout_date: workout.workout_date,
            notes: workout.notes
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating workout:', error);
        throw new Error('Failed to create workout');
      }

      return {
        id: data.id,
        user_id: data.user_id,
        workout_type: data.workout_type,
        duration_minutes: data.duration_minutes,
        calories_burned: data.calories_burned,
        workout_date: data.workout_date,
        notes: data.notes,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Error in createWorkout:', error);
      throw error;
    }
  },

  async getWorkouts(userId: string, days: number = 30): Promise<Workout[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .gte('workout_date', startDate.toISOString().split('T')[0])
        .order('workout_date', { ascending: false });

      if (error) {
        console.error('Error fetching workouts:', error);
        throw new Error('Failed to fetch workouts');
      }

      return data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        workout_type: item.workout_type,
        duration_minutes: item.duration_minutes,
        calories_burned: item.calories_burned,
        workout_date: item.workout_date,
        notes: item.notes,
        created_at: item.created_at
      }));
    } catch (error) {
      console.error('Error in getWorkouts:', error);
      throw error;
    }
  },

  async updateWorkout(workout: Workout, userId: string): Promise<Workout> {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .update({
          workout_type: workout.workout_type,
          duration_minutes: workout.duration_minutes,
          calories_burned: workout.calories_burned,
          workout_date: workout.workout_date,
          notes: workout.notes
        })
        .eq('id', workout.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating workout:', error);
        throw new Error('Failed to update workout');
      }

      return {
        id: data.id,
        user_id: data.user_id,
        workout_type: data.workout_type,
        duration_minutes: data.duration_minutes,
        calories_burned: data.calories_burned,
        workout_date: data.workout_date,
        notes: data.notes,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Error in updateWorkout:', error);
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
        throw new Error('Failed to delete workout');
      }
    } catch (error) {
      console.error('Error in deleteWorkout:', error);
      throw error;
    }
  }
};

export default supabase;
