import { supabase } from './supabaseService';
import { WorkoutPlan, WorkoutDay, Exercise, WorkoutDayExercise, WorkoutCompletion } from '../types';

export const guidedWorkoutService = {
  // Plan management
  async getWorkoutPlans(userId?: string): Promise<WorkoutPlan[]> {
    try {
      console.log('🔍 Loading workout plans for user:', userId);
      
      let query = supabase
        .from('workout_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (userId) {
        // Get both default plans (user_id is null) and user's custom plans
        query = query.or(`user_id.is.null,user_id.eq.${userId}`);
      } else {
        // Only get default plans
        query = query.is('user_id', null);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching workout plans:', error);
        throw new Error('Failed to fetch workout plans');
      }
      
      console.log('✅ Successfully loaded', data?.length || 0, 'workout plans');
      return data || [];
    } catch (error) {
      console.error('Error in getWorkoutPlans:', error);
      throw error;
    }
  },

  async getWorkoutPlan(planId: string): Promise<WorkoutPlan> {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) {
        console.error('Error fetching workout plan:', error);
        throw new Error('Failed to fetch workout plan');
      }

      return data;
    } catch (error) {
      console.error('Error in getWorkoutPlan:', error);
      throw error;
    }
  },

  async createWorkoutPlan(plan: Omit<WorkoutPlan, 'id' | 'created_at'>, userId: string): Promise<WorkoutPlan> {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .insert([{
          user_id: userId,
          title: plan.title,
          description: plan.description,
          duration_minutes: plan.duration_minutes,
          total_exercises: plan.total_exercises,
          est_calories: plan.est_calories
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

  // Day management
  async getWorkoutDays(planId: string): Promise<WorkoutDay[]> {
    try {
      const { data, error } = await supabase
        .from('workout_days')
        .select('*')
        .eq('plan_id', planId)
        .order('day_number', { ascending: true });

      if (error) {
        console.error('Error fetching workout days:', error);
        throw new Error('Failed to fetch workout days');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getWorkoutDays:', error);
      throw error;
    }
  },

  async createWorkoutDay(day: Omit<WorkoutDay, 'id'>): Promise<WorkoutDay> {
    try {
      const { data, error } = await supabase
        .from('workout_days')
        .insert([{
          plan_id: day.plan_id,
          day_number: day.day_number,
          title: day.title
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

  // Exercise management
  async getExercises(category?: string): Promise<Exercise[]> {
    try {
      let query = supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching exercises:', error);
        throw new Error('Failed to fetch exercises');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getExercises:', error);
      throw error;
    }
  },

  async getExercise(exerciseId: string): Promise<Exercise> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', exerciseId)
        .single();

      if (error) {
        console.error('Error fetching exercise:', error);
        throw new Error('Failed to fetch exercise');
      }

      return data;
    } catch (error) {
      console.error('Error in getExercise:', error);
      throw error;
    }
  },

  // Exercise assignment to days
  async getWorkoutDayExercises(dayId: string): Promise<(WorkoutDayExercise & { exercise: Exercise })[]> {
    try {
      const { data, error } = await supabase
        .from('workout_day_exercises')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('day_id', dayId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching workout day exercises:', error);
        throw new Error('Failed to fetch workout day exercises');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getWorkoutDayExercises:', error);
      throw error;
    }
  },

  async addExerciseToDay(dayId: string, exerciseId: string, sortOrder: number): Promise<WorkoutDayExercise> {
    try {
      const { data, error } = await supabase
        .from('workout_day_exercises')
        .insert([{
          day_id: dayId,
          exercise_id: exerciseId,
          sort_order: sortOrder
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

  // Completion tracking
  async recordWorkoutCompletion(completion: Omit<WorkoutCompletion, 'id' | 'completed_at'>): Promise<WorkoutCompletion> {
    try {
      const { data, error } = await supabase
        .from('workout_completions')
        .insert([{
          user_id: completion.user_id,
          plan_id: completion.plan_id,
          day_id: completion.day_id,
          duration_minutes: completion.duration_minutes,
          exercises_completed: completion.exercises_completed,
          total_exercises: completion.total_exercises
        }])
        .select()
        .single();

      if (error) {
        console.error('Error recording workout completion:', error);
        throw new Error('Failed to record workout completion');
      }

      return data;
    } catch (error) {
      console.error('Error in recordWorkoutCompletion:', error);
      throw error;
    }
  },

  async getWorkoutHistory(userId: string, days: number = 30): Promise<WorkoutCompletion[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('workout_completions')
        .select(`
          *,
          workout_plan:workout_plans(title),
          workout_day:workout_days(title, day_number)
        `)
        .eq('user_id', userId)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching workout history:', error);
        throw new Error('Failed to fetch workout history');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getWorkoutHistory:', error);
      throw error;
    }
  }
};

export default guidedWorkoutService;