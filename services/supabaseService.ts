import { createClient } from '@supabase/supabase-js';
import { UserProfile, MealEntry, Workout } from '../types';

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
      .from('profiles')
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

// Profile Service
export const profileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - return null, profile will be created when user edits
          return null;
        }
        console.error('Error fetching profile:', error);
        throw new Error('Failed to fetch profile');
      }

      // Map database column names to app field names
      // Handle missing columns gracefully with default values
      return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        age: data.age,
        gender: data.gender || 'prefer_not_to_say',
        weightKg: data.weight_kg,
        heightCm: data.height_cm,
        activityLevel: data.activity_level,
        dailyCalorieGoal: data.daily_calorie_goal,
        primaryGoal: data.primary_goal || 'maintain_weight',
        targetWeightKg: data.target_weight_kg || 70,
        weeklyGoal: data.weekly_goal || 'maintain',
        bodyFatPercentage: data.body_fat_percentage || 0,
        muscleMassKg: data.muscle_mass_kg || 0,
        preferredActivities: data.preferred_activities || [],
        fitnessExperience: data.fitness_experience || 'beginner',
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  },

  async upsertProfile(profile: UserProfile, userId: string): Promise<UserProfile> {
    try {
      console.log('=== UPSERT PROFILE DEBUG ===');
      console.log('upsertProfile called with:', { profile, userId });
      
      // Validate required fields
      if (!profile.name || !profile.age || !profile.weightKg || !profile.heightCm || !profile.activityLevel || !profile.dailyCalorieGoal) {
        throw new Error('Missing required profile fields');
      }
      
      // Map app field names to database column names
      // Use all available fields from the comprehensive database schema
      const profileData = {
        id: profile.id || undefined, // Allow undefined for new profiles
        user_id: userId,
        name: profile.name,
        age: profile.age,
        gender: profile.gender || 'prefer_not_to_say',
        weight_kg: profile.weightKg,
        height_cm: profile.heightCm,
        activity_level: profile.activityLevel,
        daily_calorie_goal: profile.dailyCalorieGoal,
        primary_goal: profile.primaryGoal || 'maintain_weight',
        target_weight_kg: profile.targetWeightKg || 70,
        weekly_goal: profile.weeklyGoal || 'maintain',
        body_fat_percentage: profile.bodyFatPercentage || 0,
        muscle_mass_kg: profile.muscleMassKg || 1, // Changed from 0 to 1 to avoid constraint violation
        preferred_activities: profile.preferredActivities || [],
        fitness_experience: profile.fitnessExperience || 'beginner'
      };

      console.log('📝 Profile data to insert:', profileData);

      // Remove undefined id field for new profiles
      if (!profileData.id) {
        delete profileData.id;
      }

      console.log('🚀 Attempting to upsert profile...');
      
      // Perform the upsert operation with timeout protection
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timed out after 15 seconds')), 15000);
      });
      
      const upsertPromise = supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();
      
      const result = await Promise.race([upsertPromise, timeoutPromise]);
      const { data, error } = result;

      // Log Supabase response as requested
      console.log('📊 Supabase response:', { data, error });

      // Log error if it exists
      if (error) {
        console.error('❌ Error upserting profile:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Failed to save profile: ${error.message}`);
      }

      console.log('✅ Profile upserted successfully:', data);

      // Verify the profile was saved by loading it back
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (verifyError) {
        console.error('❌ Error verifying profile save:', verifyError);
        throw new Error(`Profile saved but verification failed: ${verifyError.message}`);
      }
      
      console.log('✅ Profile verification successful:', verifyData);

      // Map back to app format - use actual database values
      const mappedProfile = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        age: data.age,
        weightKg: data.weight_kg,
        heightCm: data.height_cm,
        activityLevel: data.activity_level,
        dailyCalorieGoal: data.daily_calorie_goal,
        // Use actual database values for all fields
        gender: data.gender || 'prefer_not_to_say',
        primaryGoal: data.primary_goal || 'maintain_weight',
        targetWeightKg: data.target_weight_kg || 70,
        weeklyGoal: data.weekly_goal || 'maintain',
        bodyFatPercentage: data.body_fat_percentage || 0,
        muscleMassKg: data.muscle_mass_kg || 1, // Changed from 0 to 1
        preferredActivities: data.preferred_activities || [],
        fitnessExperience: data.fitness_experience || 'beginner',
        updated_at: data.updated_at
      };

      console.log('🔄 Mapped profile for return:', mappedProfile);
      return mappedProfile;
      
    } catch (error) {
      console.error('❌ Error in upsertProfile:', error);
      throw error;
    }
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

// Authentication Service
export const authService = {
  async signUp(email: string, password: string): Promise<{ user: any; error: any }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { user: data.user, error };
    } catch (error) {
      console.error('Error in signUp:', error);
      return { user: null, error };
    }
  },

  async signIn(email: string, password: string): Promise<{ user: any; error: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { user: data.user, error };
    } catch (error) {
      console.error('Error in signIn:', error);
      return { user: null, error };
    }
  },

  async getCurrentUser(): Promise<any> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        // Only log unexpected errors, not missing sessions
        if (error.message !== 'Auth session missing!') {
          console.error('Error getting current user:', error);
        }
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      return null;
    }
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error in signOut:', error);
    }
  }
};
