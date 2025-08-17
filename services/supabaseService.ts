import { createClient } from '@supabase/supabase-js'
import { MealEntry, UserProfile } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database operations for meals
export const mealService = {
  // Get all meals for a user
  async getMeals(userId: string): Promise<MealEntry[]> {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching meals:', error)
      throw new Error('Failed to fetch meals')
    }

    return data || []
  },

  // Add a new meal
  async addMeal(meal: Omit<MealEntry, 'id'>, userId: string): Promise<MealEntry> {
    const { data, error } = await supabase
      .from('meals')
      .insert([{
        ...meal,
        user_id: userId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error adding meal:', error)
      throw new Error('Failed to add meal')
    }

    return data
  },

  // Delete a meal
  async deleteMeal(mealId: string): Promise<void> {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId)

    if (error) {
      console.error('Error deleting meal:', error)
      throw new Error('Failed to delete meal')
    }
  },

  // Update a meal
  async updateMeal(mealId: string, updates: Partial<MealEntry>): Promise<MealEntry> {
    const { data, error } = await supabase
      .from('meals')
      .update(updates)
      .eq('id', mealId)
      .select()
      .single()

    if (error) {
      console.error('Error updating meal:', error)
      throw new Error('Failed to update meal')
    }

    return data
  }
}

// Database operations for user profiles
export const profileService = {
  // Get user profile
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching profile:', error)
      throw new Error('Failed to fetch profile')
    }

    return data
  },

  // Create or update user profile
  async upsertProfile(profile: UserProfile, userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert([{
        ...profile,
        user_id: userId,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Error upserting profile:', error)
      throw new Error('Failed to save profile')
    }

    return data
  }
}

// Authentication helper
export const authService = {
  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        // Only log unexpected errors, not auth session missing which is expected for new users
        if (error.message && !error.message.includes('Auth session missing') && !error.message.includes('No user found')) {
          console.error('Error getting current user:', error)
        }
        return null
      }

      return user
    } catch (err) {
      // Handle any unexpected errors
      console.error('Unexpected error getting current user:', err)
      return null
    }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error signing out:', error)
      throw new Error('Failed to sign out')
    }
  }
}
