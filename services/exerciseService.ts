import { supabase } from './supabaseService';
import { Exercise } from '../types';

export const exerciseService = {
  // Exercise library management
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

  async getExerciseCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('category')
        .order('category', { ascending: true });

      if (error) {
        console.error('Error fetching exercise categories:', error);
        throw new Error('Failed to fetch exercise categories');
      }

      // Get unique categories
      const categories = [...new Set(data?.map(item => item.category) || [])];
      return categories;
    } catch (error) {
      console.error('Error in getExerciseCategories:', error);
      throw error;
    }
  },

  async searchExercises(query: string): Promise<Exercise[]> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%,instructions.ilike.%${query}%`)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error searching exercises:', error);
        throw new Error('Failed to search exercises');
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchExercises:', error);
      throw error;
    }
  },

  async createExercise(exercise: Omit<Exercise, 'id'>): Promise<Exercise> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .insert([{
          name: exercise.name,
          category: exercise.category,
          instructions: exercise.instructions,
          duration_seconds: exercise.duration_seconds,
          reps: exercise.reps,
          gif_url: exercise.gif_url
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating exercise:', error);
        throw new Error('Failed to create exercise');
      }

      return data;
    } catch (error) {
      console.error('Error in createExercise:', error);
      throw error;
    }
  },

  async updateExercise(id: string, updates: Partial<Omit<Exercise, 'id'>>): Promise<Exercise> {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating exercise:', error);
        throw new Error('Failed to update exercise');
      }

      return data;
    } catch (error) {
      console.error('Error in updateExercise:', error);
      throw error;
    }
  },

  async deleteExercise(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting exercise:', error);
        throw new Error('Failed to delete exercise');
      }
    } catch (error) {
      console.error('Error in deleteExercise:', error);
      throw error;
    }
  }
};

export default exerciseService;