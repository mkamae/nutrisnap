
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
  weightKg: number;
  heightCm: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dailyCalorieGoal: number;
  updated_at?: string; // ISO string
}

export interface AuthUser {
  id: string;
  email?: string;
  created_at: string;
}

export type View = 'dashboard' | 'add_meal' | 'progress' | 'profile';
