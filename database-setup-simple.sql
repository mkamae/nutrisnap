-- =====================================================
-- NutriSnap Database Setup - Enhanced Version
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- =====================================================

-- IMPORTANT: If you're having profile editing issues, you may need to:
-- 1. Drop the existing profiles table: DROP TABLE IF EXISTS public.profiles;
-- 2. Run the CREATE TABLE profiles statement below
-- 3. Or update your existing table to match the column names below

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Create core tables
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced profiles table with objectives and fitness goals
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  age INTEGER CHECK (age > 0 AND age < 150),
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 500),
  height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')) NOT NULL,
  daily_calorie_goal INTEGER CHECK (daily_calorie_goal > 0 AND daily_calorie_goal < 10000),
  
  -- Fitness objectives
  primary_goal TEXT CHECK (primary_goal IN ('lose_weight', 'gain_weight', 'maintain_weight', 'build_muscle', 'improve_fitness')),
  target_weight_kg DECIMAL(5,2) CHECK (target_weight_kg > 0 AND target_weight_kg < 500),
  weekly_goal TEXT CHECK (weekly_goal IN ('lose_0.5kg', 'lose_1kg', 'gain_0.5kg', 'gain_1kg', 'maintain')),
  
  -- Body composition
  body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
  muscle_mass_kg DECIMAL(5,2) CHECK (muscle_mass_kg > 0),
  
  -- Activity preferences
  preferred_activities TEXT[], -- Array of preferred workout types
  fitness_experience TEXT CHECK (fitness_experience IN ('beginner', 'intermediate', 'advanced')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout routines table
CREATE TABLE IF NOT EXISTS public.workout_routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  frequency TEXT CHECK (frequency IN ('daily', '3x_week', '4x_week', '5x_week', '6x_week', 'custom')),
  custom_frequency_days INTEGER CHECK (custom_frequency_days > 0 AND custom_frequency_days <= 7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout exercises table
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID REFERENCES public.workout_routines(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER CHECK (sets > 0),
  reps INTEGER CHECK (reps > 0),
  weight_kg DECIMAL(5,2) CHECK (weight_kg >= 0),
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  rest_seconds INTEGER CHECK (rest_seconds >= 0),
  notes TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout sessions table (to track completed workouts)
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  routine_id UUID REFERENCES public.workout_routines(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  total_duration_minutes INTEGER CHECK (total_duration_minutes > 0),
  calories_burned INTEGER CHECK (calories_burned >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise logs table (to track individual exercises in sessions)
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  sets_completed INTEGER CHECK (sets_completed > 0),
  reps_completed INTEGER CHECK (reps_completed > 0),
  weight_used_kg DECIMAL(5,2) CHECK (weight_used_kg >= 0),
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create meals table with column names that match the app
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  mealname TEXT NOT NULL,  -- matches app's mealName
  portionsize TEXT NOT NULL,  -- matches app's portionSize
  imageurl TEXT,  -- matches app's imageUrl
  calories INTEGER CHECK (calories >= 0) NOT NULL,
  protein DECIMAL(5,2) CHECK (protein >= 0) NOT NULL,
  carbs DECIMAL(5,2) CHECK (carbs >= 0) NOT NULL,
  fat DECIMAL(5,2) CHECK (fat >= 0) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create food items table
CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size TEXT NOT NULL,
  calories_per_serving INTEGER CHECK (calories_per_serving >= 0) NOT NULL,
  protein_per_serving DECIMAL(5,2) CHECK (protein_per_serving >= 0) NOT NULL,
  carbs_per_serving DECIMAL(5,2) CHECK (carbs_per_serving >= 0) NOT NULL,
  fat_per_serving DECIMAL(5,2) CHECK (fat_per_serving >= 0) NOT NULL,
  fiber_per_serving DECIMAL(5,2) CHECK (fiber_per_serving >= 0) DEFAULT 0,
  sugar_per_serving DECIMAL(5,2) CHECK (sugar_per_serving >= 0) DEFAULT 0,
  sodium_per_serving DECIMAL(5,2) CHECK (sodium_per_serving >= 0) DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for name + brand combination
ALTER TABLE public.food_items ADD CONSTRAINT food_items_name_brand_unique UNIQUE (name, brand);

-- Step 5: Create additional tracking tables
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 500) NOT NULL,
  body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
  muscle_mass_kg DECIMAL(5,2) CHECK (muscle_mass_kg > 0),
  notes TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount_ml INTEGER CHECK (amount_ml > 0) NOT NULL,
  date DATE NOT NULL,
  time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date, time)
);

-- Daily activity summary view
DROP VIEW IF EXISTS daily_activity_summary CASCADE;

CREATE OR REPLACE VIEW daily_activity_summary AS
SELECT 
  u.id as user_id,
  u.email,
  p.name,
  d.log_date,
  COALESCE(SUM(m.calories), 0) as calories_consumed,
  COALESCE(SUM(m.protein), 0) as protein_consumed,
  COALESCE(SUM(m.carbs), 0) as carbs_consumed,
  COALESCE(SUM(m.fat), 0) as fat_consumed,
  COALESCE(SUM(ws.calories_burned), 0) as calories_burned,
  COALESCE(SUM(ws.total_duration_minutes), 0) as workout_minutes,
  p.daily_calorie_goal,
  (p.daily_calorie_goal - COALESCE(SUM(m.calories), 0) + COALESCE(SUM(ws.calories_burned), 0)) as net_calories,
  CASE 
    WHEN COALESCE(SUM(ws.total_duration_minutes), 0) > 0 THEN 'Active'
    ELSE 'Rest Day'
  END as activity_status
FROM public.users u
JOIN public.profiles p ON u.id = p.user_id
CROSS JOIN generate_series(
  CURRENT_DATE - INTERVAL '30 days', 
  CURRENT_DATE, 
  '1 day'::interval
) d(log_date)
LEFT JOIN public.meals m ON u.id = m.user_id AND m.date = d.log_date
LEFT JOIN public.workout_sessions ws ON u.id = ws.user_id AND ws.session_date = d.log_date
GROUP BY u.id, u.email, p.name, d.log_date, p.daily_calorie_goal
ORDER BY d.log_date DESC;

-- Step 6: Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Workout routines policies
CREATE POLICY "Users can view own workout routines" ON public.workout_routines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout routines" ON public.workout_routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout routines" ON public.workout_routines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout routines" ON public.workout_routines
  FOR DELETE USING (auth.uid() = user_id);

-- Workout exercises policies
CREATE POLICY "Users can view own workout exercises" ON public.workout_exercises
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM public.workout_routines WHERE id = routine_id
  ));

CREATE POLICY "Users can insert own workout exercises" ON public.workout_exercises
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.workout_routines WHERE id = routine_id
  ));

CREATE POLICY "Users can update own workout exercises" ON public.workout_exercises
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM public.workout_routines WHERE id = routine_id
  ));

CREATE POLICY "Users can delete own workout exercises" ON public.workout_exercises
  FOR DELETE USING (auth.uid() IN (
    SELECT user_id FROM public.workout_routines WHERE id = routine_id
  ));

-- Workout sessions policies
CREATE POLICY "Users can view own workout sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions" ON public.workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Exercise logs policies
CREATE POLICY "Users can view own exercise logs" ON public.exercise_logs
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM public.workout_sessions WHERE id = session_id
  ));

CREATE POLICY "Users can insert own exercise logs" ON public.exercise_logs
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.workout_sessions WHERE id = session_id
  ));

CREATE POLICY "Users can update own exercise logs" ON public.exercise_logs
  FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM public.workout_sessions WHERE id = session_id
  ));

CREATE POLICY "Users can delete own exercise logs" ON public.exercise_logs
  FOR DELETE USING (auth.uid() IN (
    SELECT user_id FROM public.workout_sessions WHERE id = session_id
  ));

-- Meals policies
CREATE POLICY "Users can view own meals" ON public.meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON public.meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON public.meals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON public.meals
  FOR DELETE USING (auth.uid() = user_id);

-- Weight logs policies
CREATE POLICY "Users can view own weight logs" ON public.weight_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight logs" ON public.weight_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight logs" ON public.weight_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight logs" ON public.weight_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Water logs policies
CREATE POLICY "Users can view own water logs" ON public.water_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs" ON public.water_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water logs" ON public.water_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own water logs" ON public.water_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Food items can be viewed by all users but only created by authenticated users
CREATE POLICY "Anyone can view food items" ON public.food_items
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create food items" ON public.food_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own food items" ON public.food_items
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own food items" ON public.food_items
  FOR DELETE USING (auth.uid() = created_by);

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_routines_user_id ON public.workout_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_routine_id ON public.workout_exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON public.workout_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_session_id ON public.exercise_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_date ON public.meals(date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON public.weight_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON public.weight_logs(date);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON public.water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_date ON public.water_logs(date);

-- Step 9: Insert sample workout routines (optional)
-- Uncomment the lines below if you want to add some sample workout routines for testing

-- INSERT INTO public.workout_routines (user_id, name, description, frequency) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'Full Body Workout', 'Complete full body workout for beginners', '3x_week');

-- Step 10: Verify setup
-- Run these queries to verify your tables were created correctly:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workout_routines';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'meals';
