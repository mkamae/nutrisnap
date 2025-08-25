import { supabase } from './supabaseService';
import { 
  WorkoutPlan, 
  WorkoutDay, 
  Exercise, 
  WorkoutDayExercise, 
  UserWorkoutProgress,
  WorkoutPlanWithDays,
  WorkoutDayWithExercises 
} from '../types';

// Guided Workout Service
export const guidedWorkoutService = {
  // Workout Plans
  async getPublicWorkoutPlans(): Promise<WorkoutPlan[]> {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching public workout plans:', error);
        throw new Error('Failed to fetch workout plans');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPublicWorkoutPlans:', error);
      throw error;
    }
  },

  async getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user workout plans:', error);
        throw new Error('Failed to fetch user workout plans');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserWorkoutPlans:', error);
      throw error;
    }
  },

  async getWorkoutPlanById(planId: string): Promise<WorkoutPlanWithDays | null> {
    try {
      // Get the plan
      const { data: plan, error: planError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) {
        console.error('Error fetching workout plan:', planError);
        throw new Error('Failed to fetch workout plan');
      }

      // Get the days
      const { data: days, error: daysError } = await supabase
        .from('workout_days')
        .select('*')
        .eq('plan_id', planId)
        .order('day_number', { ascending: true });

      if (daysError) {
        console.error('Error fetching workout days:', daysError);
        throw new Error('Failed to fetch workout days');
      }

      // Get exercises for each day
      const daysWithExercises: WorkoutDayWithExercises[] = [];
      
      for (const day of days || []) {
        const { data: exercises, error: exercisesError } = await supabase
          .from('workout_day_exercises')
          .select(`
            *,
            exercise:exercises(*)
          `)
          .eq('day_id', day.id)
          .order('sort_order', { ascending: true });

        if (exercisesError) {
          console.error('Error fetching exercises for day:', exercisesError);
          continue;
        }

        daysWithExercises.push({
          ...day,
          exercises: exercises || []
        });
      }

      return {
        ...plan,
        days: daysWithExercises
      };
    } catch (error) {
      console.error('Error in getWorkoutPlanById:', error);
      throw error;
    }
  },

  async createWorkoutPlan(plan: Omit<WorkoutPlan, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<WorkoutPlan> {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .insert([{
          ...plan,
          user_id: userId
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating workout plan:', error);
        throw new Error('Failed to create workout plan');
      }

      return data;
    } catch (error) {
      console.error('Error in createWorkoutPlan:', error);
      throw error;
    }
  },

  // Workout Days
  async createWorkoutDay(day: Omit<WorkoutDay, 'id' | 'created_at'>, planId: string): Promise<WorkoutDay> {
    try {
      const { data, error } = await supabase
        .from('workout_days')
        .insert([{
          ...day,
          plan_id: planId
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating workout day:', error);
        throw new Error('Failed to create workout day');
      }

      return data;
    } catch (error) {
      console.error('Error in createWorkoutDay:', error);
      throw error;
    }
  },

  // Exercises
  async getAllExercises(): Promise<Exercise[]> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching exercises:', error);
        throw new Error('Failed to fetch exercises');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllExercises:', error);
      throw error;
    }
  },

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('category', category)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching exercises by category:', error);
        throw new Error('Failed to fetch exercises by category');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getExercisesByCategory:', error);
      throw error;
    }
  },

  // Workout Day Exercises
  async addExerciseToDay(exerciseData: Omit<WorkoutDayExercise, 'id' | 'created_at'>, dayId: string): Promise<WorkoutDayExercise> {
    try {
      const { data, error } = await supabase
        .from('workout_day_exercises')
        .insert([{
          ...exerciseData,
          day_id: dayId
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding exercise to day:', error);
        throw new Error('Failed to add exercise to day');
      }

      return data;
    } catch (error) {
      console.error('Error in addExerciseToDay:', error);
      throw error;
    }
  },

  async updateExerciseInDay(exerciseId: string, updates: Partial<WorkoutDayExercise>): Promise<WorkoutDayExercise> {
    try {
      const { data, error } = await supabase
        .from('workout_day_exercises')
        .update(updates)
        .eq('id', exerciseId)
        .select()
        .single();

      if (error) {
        console.error('Error updating exercise in day:', error);
        throw new Error('Failed to update exercise in day');
      }

      return data;
    } catch (error) {
      console.error('Error in updateExerciseInDay:', error);
      throw error;
    }
  },

  async removeExerciseFromDay(exerciseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workout_day_exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) {
        console.error('Error removing exercise from day:', error);
        throw new Error('Failed to remove exercise from day');
      }
    } catch (error) {
      console.error('Error in removeExerciseFromDay:', error);
      throw error;
    }
  },

  // User Progress
  async logExerciseCompletion(progress: Omit<UserWorkoutProgress, 'id' | 'completed_at'>): Promise<UserWorkoutProgress> {
    try {
      const { data, error } = await supabase
        .from('user_workout_progress')
        .insert([progress])
        .select()
        .single();

      if (error) {
        console.error('Error logging exercise completion:', error);
        throw new Error('Failed to log exercise completion');
      }

      return data;
    } catch (error) {
      console.error('Error in logExerciseCompletion:', error);
      throw error;
    }
  },

  async getUserProgress(userId: string, planId?: string): Promise<UserWorkoutProgress[]> {
    try {
      let query = supabase
        .from('user_workout_progress')
        .select('*')
        .eq('user_id', userId);

      if (planId) {
        query = query.eq('plan_id', planId);
      }

      const { data, error } = await query.order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching user progress:', error);
        throw new Error('Failed to fetch user progress');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserProgress:', error);
      throw error;
    }
  },

  // Utility functions
  async getWorkoutPlanStats(planId: string): Promise<{
    totalDays: number;
    totalExercises: number;
    estimatedDuration: number;
    estimatedCalories: number;
  }> {
    try {
      const plan = await this.getWorkoutPlanById(planId);
      if (!plan) {
        throw new Error('Workout plan not found');
      }

      const totalDays = plan.days.length;
      const totalExercises = plan.days.reduce((sum, day) => sum + day.exercises.length, 0);
      const estimatedDuration = plan.duration_minutes || 0;
      const estimatedCalories = plan.est_calories || 0;

      return {
        totalDays,
        totalExercises,
        estimatedDuration,
        estimatedCalories
      };
    } catch (error) {
      console.error('Error in getWorkoutPlanStats:', error);
      throw error;
    }
  }
};
