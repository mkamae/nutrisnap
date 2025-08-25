import { createClient } from '@supabase/supabase-js';
import { UserProfile, MealEntry, WorkoutRoutine, WorkoutExercise, WorkoutSession, ExerciseLog } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
        console.error('Error fetching profile:', error);
        return null;
      }

      if (data) {
        // Map database column names to app field names
        const mappedProfile: UserProfile = {
          id: data.id,
          user_id: data.user_id,
          name: data.name,
          age: data.age,
          gender: data.gender,
          weightKg: data.weight_kg,
          heightCm: data.height_cm,
          activityLevel: data.activity_level,
          dailyCalorieGoal: data.daily_calorie_goal,
          primaryGoal: data.primary_goal,
          targetWeightKg: data.target_weight_kg,
          weeklyGoal: data.weekly_goal,
          bodyFatPercentage: data.body_fat_percentage,
          muscleMassKg: data.muscle_mass_kg,
          preferredActivities: data.preferred_activities,
          fitnessExperience: data.fitness_experience,
          updated_at: data.updated_at
        };
        return mappedProfile;
      }
      return null;
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  },

  async upsertProfile(profile: UserProfile, userId: string): Promise<UserProfile> {
    try {
      // Map app field names to database column names
      const profileData = {
        id: profile.id || undefined, // Allow undefined for new profiles
        user_id: userId,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        weight_kg: profile.weightKg,
        height_cm: profile.heightCm,
        activity_level: profile.activityLevel,
        daily_calorie_goal: profile.dailyCalorieGoal,
        primary_goal: profile.primaryGoal,
        target_weight_kg: profile.targetWeightKg,
        weekly_goal: profile.weeklyGoal,
        body_fat_percentage: profile.bodyFatPercentage,
        muscle_mass_kg: profile.muscleMassKg,
        preferred_activities: profile.preferredActivities,
        fitness_experience: profile.fitnessExperience,
        updated_at: new Date().toISOString()
      };

      // Remove undefined id field for new profiles
      if (!profileData.id) {
        delete profileData.id;
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error upserting profile:', error);
        throw new Error('Failed to save profile');
      }

      // Return the profile in app format after upsert
      const mappedProfile: UserProfile = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        age: data.age,
        gender: data.gender,
        weightKg: data.weight_kg,
        heightCm: data.height_cm,
        activityLevel: data.activity_level,
        dailyCalorieGoal: data.daily_calorie_goal,
        primaryGoal: data.primary_goal,
        targetWeightKg: data.target_weight_kg,
        weeklyGoal: data.weekly_goal,
        bodyFatPercentage: data.body_fat_percentage,
        muscleMassKg: data.muscle_mass_kg,
        preferredActivities: data.preferred_activities,
        fitnessExperience: data.fitness_experience,
        updated_at: data.updated_at
      };

      return mappedProfile;
    } catch (error) {
      console.error('Error in upsertProfile:', error);
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
  async createWorkoutRoutine(routine: Omit<WorkoutRoutine, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<WorkoutRoutine> {
    try {
      const { data, error } = await supabase
        .from('workout_routines')
        .insert([
          {
            user_id: userId,
            name: routine.name,
            description: routine.description,
            is_active: routine.isActive,
            frequency: routine.frequency,
            custom_frequency_days: routine.customFrequencyDays
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating workout routine:', error);
        throw new Error('Failed to create workout routine');
      }

      return {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        description: data.description,
        isActive: data.is_active,
        frequency: data.frequency,
        customFrequencyDays: data.custom_frequency_days,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error in createWorkoutRoutine:', error);
      throw error;
    }
  },

  async getWorkoutRoutines(userId: string): Promise<WorkoutRoutine[]> {
    try {
      const { data, error } = await supabase
        .from('workout_routines')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching workout routines:', error);
        throw new Error('Failed to fetch workout routines');
      }

      return data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        description: item.description,
        isActive: item.is_active,
        frequency: item.frequency,
        customFrequencyDays: item.custom_frequency_days,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Error in getWorkoutRoutines:', error);
      throw error;
    }
  },

  async addWorkoutExercises(exercises: Omit<WorkoutExercise, 'id' | 'created_at' | 'updated_at'>[], routineId: string): Promise<WorkoutExercise[]> {
    try {
      const exerciseData = exercises.map(exercise => ({
        routine_id: routineId,
        exercise_name: exercise.exerciseName,
        sets: exercise.sets,
        reps: exercise.reps,
        weight_kg: exercise.weightKg,
        duration_minutes: exercise.durationMinutes,
        rest_seconds: exercise.restSeconds,
        notes: exercise.notes,
        order_index: exercise.orderIndex
      }));

      const { data, error } = await supabase
        .from('workout_exercises')
        .insert(exerciseData)
        .select();

      if (error) {
        console.error('Error adding workout exercises:', error);
        throw new Error('Failed to add workout exercises');
      }

      return data.map(item => ({
        id: item.id,
        routineId: item.routine_id,
        exerciseName: item.exercise_name,
        sets: item.sets,
        reps: item.reps,
        weightKg: item.weight_kg,
        durationMinutes: item.duration_minutes,
        restSeconds: item.rest_seconds,
        notes: item.notes,
        orderIndex: item.order_index,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Error in addWorkoutExercises:', error);
      throw error;
    }
  },

  async logWorkoutSession(session: Omit<WorkoutSession, 'id' | 'created_at'>, userId: string): Promise<WorkoutSession> {
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert([
          {
            user_id: userId,
            routine_id: session.routineId,
            session_date: session.sessionDate,
            start_time: session.startTime,
            end_time: session.endTime,
            total_duration_minutes: session.totalDurationMinutes,
            calories_burned: session.caloriesBurned,
            notes: session.notes
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error logging workout session:', error);
        throw new Error('Failed to log workout session');
      }

      return {
        id: data.id,
        userId: data.user_id,
        routineId: data.routine_id,
        sessionDate: data.session_date,
        startTime: data.start_time,
        endTime: data.end_time,
        totalDurationMinutes: data.total_duration_minutes,
        caloriesBurned: data.calories_burned,
        notes: data.notes,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Error in logWorkoutSession:', error);
      throw error;
    }
  },

  async getWorkoutSessions(userId: string, days: number = 30): Promise<WorkoutSession[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('session_date', startDate.toISOString().split('T')[0])
        .order('session_date', { ascending: false });

      if (error) {
        console.error('Error fetching workout sessions:', error);
        throw new Error('Failed to fetch workout sessions');
      }

      return data.map(item => ({
        id: item.id,
        userId: item.user_id,
        routineId: item.routine_id,
        sessionDate: item.session_date,
        startTime: item.start_time,
        endTime: item.end_time,
        totalDurationMinutes: item.total_duration_minutes,
        caloriesBurned: item.calories_burned,
        notes: item.notes,
        created_at: item.created_at
      }));
    } catch (error) {
      console.error('Error in getWorkoutSessions:', error);
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
