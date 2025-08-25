-- =====================================================
-- Complete Database Schema for NutriSnap with Workout Support
-- =====================================================
-- Run this script in your Supabase SQL Editor to set up all required tables
-- =====================================================

-- Step 1: Drop existing tables if they exist (WARNING: This will delete all data)
DROP TABLE IF EXISTS public.exercise_logs CASCADE;
DROP TABLE IF EXISTS public.workout_sessions CASCADE;
DROP TABLE IF EXISTS public.workout_exercises CASCADE;
DROP TABLE IF EXISTS public.workout_routines CASCADE;
DROP TABLE IF EXISTS public.meals CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Create the profiles table with all fitness fields
CREATE TABLE public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
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
  muscle_mass_kg DECIMAL(5,2) CHECK (muscle_mass_kg > 0 AND muscle_mass_kg < 500),
  
  -- Activity preferences
  preferred_activities TEXT[], -- Array of preferred workout types
  fitness_experience TEXT CHECK (fitness_experience IN ('beginner', 'intermediate', 'advanced')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create the meals table
CREATE TABLE public.meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Step 4: Create workout_routines table
CREATE TABLE public.workout_routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  frequency TEXT CHECK (frequency IN ('daily', '3x_week', '4x_week', '5x_week', '6x_week', 'custom')) NOT NULL,
  custom_frequency_days INTEGER CHECK (custom_frequency_days > 0 AND custom_frequency_days <= 7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create workout_exercises table
CREATE TABLE public.workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID REFERENCES public.workout_routines(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER CHECK (sets > 0) NOT NULL,
  reps INTEGER CHECK (reps > 0) NOT NULL,
  weight_kg DECIMAL(5,2) CHECK (weight_kg >= 0),
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  rest_seconds INTEGER CHECK (rest_seconds >= 0),
  notes TEXT,
  order_index INTEGER CHECK (order_index > 0) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create workout_sessions table
CREATE TABLE public.workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  routine_id UUID REFERENCES public.workout_routines(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  total_duration_minutes INTEGER CHECK (total_duration_minutes > 0) NOT NULL,
  calories_burned INTEGER CHECK (calories_burned >= 0) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create exercise_logs table
CREATE TABLE public.exercise_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  sets_completed INTEGER CHECK (sets_completed >= 0) NOT NULL,
  reps_completed INTEGER CHECK (reps_completed >= 0) NOT NULL,
  weight_used_kg DECIMAL(5,2) CHECK (weight_used_kg >= 0),
  duration_minutes INTEGER CHECK (duration_minutes > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Step 10: Create RLS policies for meals
CREATE POLICY "Users can view own meals" ON public.meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON public.meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON public.meals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON public.meals
  FOR DELETE USING (auth.uid() = user_id);

-- Step 11: Create RLS policies for workout_routines
CREATE POLICY "Users can view own workout routines" ON public.workout_routines
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout routines" ON public.workout_routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout routines" ON public.workout_routines
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout routines" ON public.workout_routines
  FOR DELETE USING (auth.uid() = user_id);

-- Step 12: Create RLS policies for workout_exercises
CREATE POLICY "Users can view workout exercises for own routines" ON public.workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_routines 
      WHERE id = workout_exercises.routine_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workout exercises for own routines" ON public.workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_routines 
      WHERE id = workout_exercises.routine_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update workout exercises for own routines" ON public.workout_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workout_routines 
      WHERE id = workout_exercises.routine_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workout exercises for own routines" ON public.workout_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workout_routines 
      WHERE id = workout_exercises.routine_id 
      AND user_id = auth.uid()
    )
  );

-- Step 13: Create RLS policies for workout_sessions
CREATE POLICY "Users can view own workout sessions" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions" ON public.workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Step 14: Create RLS policies for exercise_logs
CREATE POLICY "Users can view exercise logs for own sessions" ON public.exercise_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions 
      WHERE id = exercise_logs.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert exercise logs for own sessions" ON public.exercise_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_sessions 
      WHERE id = exercise_logs.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercise logs for own sessions" ON public.exercise_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions 
      WHERE id = exercise_logs.session_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercise logs for own sessions" ON public.exercise_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions 
      WHERE id = exercise_logs.session_id 
      AND user_id = auth.uid()
    )
  );

-- Step 15: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_date ON public.meals(date);
CREATE INDEX IF NOT EXISTS idx_workout_routines_user_id ON public.workout_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_routines_active ON public.workout_routines(is_active);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_routine_id ON public.workout_exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON public.workout_exercises(routine_id, order_index);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON public.workout_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_session_id ON public.exercise_logs(session_id);

-- Step 16: Create a daily activity summary view
CREATE OR REPLACE VIEW public.daily_activity_summary AS
SELECT 
  p.user_id,
  u.email,
  p.name,
  p.daily_calorie_goal,
  p.activity_level,
  p.primary_goal,
  p.target_weight_kg,
  p.weekly_goal
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id;

-- Step 17: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Step 18: Verify the setup
-- Run these queries to verify your tables were created correctly:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workout_sessions' ORDER BY ordinal_position;

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. This script will DELETE all existing data in the affected tables
-- 2. Make sure you're logged into the correct Supabase project
-- 3. Run this in the SQL Editor, not in your app
-- 4. After running this, restart your app and try the onboarding process again
-- 5. All workout functionality will now work properly
-- =====================================================
