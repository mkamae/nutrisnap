import { supabase } from './supabaseService';
import { WorkoutPlan, WorkoutDay, Exercise, WorkoutDayExercise, WorkoutCompletion } from '../types';

export const guidedWorkoutService = {
  // Initialize default data if needed
  async initializeDefaultData(): Promise<void> {
    try {
      console.log('🔍 Checking if default workout data exists...');
      
      // Check if we have any default workout plans
      const { data: existingPlans, error: plansError } = await supabase
        .from('workout_plans')
        .select('id')
        .is('user_id', null)
        .limit(1);
      
      if (plansError) {
        console.error('Error checking existing plans:', plansError);
        return;
      }
      
      if (existingPlans && existingPlans.length > 0) {
        console.log('✅ Default workout data already exists');
        return;
      }
      
      console.log('📝 Creating default workout data...');
      
      // Create default exercises
      const exercises = [
        {
          name: 'Push-ups',
          category: 'strength',
          reps: 10,
          duration_seconds: null,
          instructions: 'Start in a plank position with hands shoulder-width apart. Lower your body until your chest nearly touches the floor, then push back up to starting position.',
          gif_url: 'https://media.giphy.com/media/ZD8ZjehSsLDZQRoJxW/giphy.gif'
        },
        {
          name: 'Squats',
          category: 'strength',
          reps: 15,
          duration_seconds: null,
          instructions: 'Stand with feet shoulder-width apart. Lower your body as if sitting back into a chair, keeping your chest up and knees behind your toes. Return to standing.',
          gif_url: 'https://media.giphy.com/media/1qfDU4MJv9xoGtRKvh/giphy.gif'
        },
        {
          name: 'Plank',
          category: 'core',
          reps: null,
          duration_seconds: 30,
          instructions: 'Start in a push-up position but rest on your forearms. Keep your body in a straight line from head to heels. Hold this position.',
          gif_url: 'https://media.giphy.com/media/3o6fJ5LANL0x31R1Ic/giphy.gif'
        },
        {
          name: 'Jumping Jacks',
          category: 'cardio',
          reps: null,
          duration_seconds: 30,
          instructions: 'Stand with feet together and arms at your sides. Jump while spreading your legs shoulder-width apart and raising your arms overhead. Jump back to starting position.',
          gif_url: 'https://media.giphy.com/media/3o6fJeWZrlAIyN1EKQ/giphy.gif'
        }
      ];
      
      // Insert exercises
      for (const exercise of exercises) {
        await supabase.from('exercises').upsert(exercise, { onConflict: 'name' });
      }
      
      // Create default workout plan
      const { data: planData } = await supabase
        .from('workout_plans')
        .upsert({
          user_id: null,
          title: 'Beginner Full Body',
          description: 'Perfect for fitness beginners! A gentle introduction to exercise targeting all major muscle groups.',
          duration_minutes: 15,
          total_exercises: 4,
          est_calories: 120
        }, { onConflict: 'title' })
        .select()
        .single();
      
      if (planData) {
        // Create workout day
        const { data: dayData } = await supabase
          .from('workout_days')
          .upsert({
            plan_id: planData.id,
            day_number: 1,
            title: 'Full Body Basics'
          }, { onConflict: 'plan_id,day_number' })
          .select()
          .single();
        
        if (dayData) {
          // Add exercises to day
          const exerciseNames = ['Jumping Jacks', 'Push-ups', 'Squats', 'Plank'];
          for (let i = 0; i < exerciseNames.length; i++) {
            const { data: exerciseData } = await supabase
              .from('exercises')
              .select('id')
              .eq('name', exerciseNames[i])
              .single();
            
            if (exerciseData) {
              await supabase
                .from('workout_day_exercises')
                .upsert({
                  day_id: dayData.id,
                  exercise_id: exerciseData.id,
                  sort_order: i + 1
                }, { onConflict: 'day_id,exercise_id' });
            }
          }
        }
      }
      
      console.log('✅ Default workout data created successfully');
      
    } catch (error) {
      console.error('❌ Error initializing default data:', error);
    }
  },

  // Plan management
  async getWorkoutPlans(userId?: string): Promise<WorkoutPlan[]> {
    try {
      console.log('🔍 getWorkoutPlans called with userId:', userId);
      
      // Simplified query - just get all plans first
      console.log('📊 Executing basic query...');
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('📊 Query result:', { data, error });
      
      if (error) {
        console.error('❌ Error fetching workout plans:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!data) {
        console.log('⚠️ No data returned from query');
        return [];
      }
      
      console.log('✅ Raw data from database:', data);
      
      // Filter based on user if needed
      let filteredData = data;
      if (userId) {
        // Get both default plans (user_id is null) and user's custom plans
        filteredData = data.filter(plan => plan.user_id === null || plan.user_id === userId);
        console.log('🔍 Filtered data for user:', filteredData);
      } else {
        // Only get default plans
        filteredData = data.filter(plan => plan.user_id === null);
        console.log('🔍 Filtered default plans:', filteredData);
      }
      
      console.log('✅ Returning plans:', filteredData);
      return filteredData;
    } catch (error) {
      console.error('❌ Error in getWorkoutPlans:', error);
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