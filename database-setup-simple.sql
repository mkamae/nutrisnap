-- =====================================================
-- NutriSnap Database Setup - Simplified Version
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- =====================================================

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
  daily_protein_goal INTEGER CHECK (daily_protein_goal > 0 AND daily_protein_goal < 500),
  daily_carbs_goal INTEGER CHECK (daily_carbs_goal > 0 AND daily_carbs_goal < 1000),
  daily_fat_goal INTEGER CHECK (daily_fat_goal > 0 AND daily_fat_goal < 200),
  weight_goal_kg DECIMAL(5,2),
  goal_type TEXT CHECK (goal_type IN ('lose', 'maintain', 'gain')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  meal_name TEXT NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  calories INTEGER CHECK (calories >= 0) NOT NULL,
  protein DECIMAL(5,2) CHECK (protein >= 0) NOT NULL,
  carbs DECIMAL(5,2) CHECK (carbs >= 0) NOT NULL,
  fat DECIMAL(5,2) CHECK (fat >= 0) NOT NULL,
  fiber DECIMAL(5,2) CHECK (fiber >= 0) DEFAULT 0,
  sugar DECIMAL(5,2) CHECK (sugar >= 0) DEFAULT 0,
  sodium DECIMAL(5,2) CHECK (sodium >= 0) DEFAULT 0,
  portion_size TEXT NOT NULL,
  image_url TEXT,
  notes TEXT,
  date DATE NOT NULL,
  time TIME,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create food items table
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

-- Step 4: Create additional tracking tables
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own meals" ON public.meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON public.meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON public.meals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON public.meals
  FOR DELETE USING (auth.uid() = user_id);

-- Food items policies (readable by all, writable by creators)
CREATE POLICY "Anyone can view food items" ON public.food_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert food items" ON public.food_items
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own food items" ON public.food_items
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own food items" ON public.food_items
  FOR DELETE USING (auth.uid() = created_by);

CREATE POLICY "Users can view own weight logs" ON public.weight_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight logs" ON public.weight_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight logs" ON public.weight_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight logs" ON public.weight_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own water logs" ON public.water_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs" ON public.water_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water logs" ON public.water_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own water logs" ON public.water_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_date ON public.meals(date);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_food_items_name ON public.food_items(name);
CREATE INDEX IF NOT EXISTS idx_food_items_brand ON public.food_items(brand);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON public.weight_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON public.water_logs(user_id, date);

-- Step 8: Create function and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON public.food_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Insert sample data
INSERT INTO public.food_items (name, brand, serving_size, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, verified) VALUES
('Chicken Breast', 'Generic', '100g', 165, 31.0, 0.0, 3.6, true),
('Brown Rice', 'Generic', '100g', 111, 2.6, 23.0, 0.9, true),
('Broccoli', 'Generic', '100g', 34, 2.8, 7.0, 0.4, true),
('Salmon', 'Generic', '100g', 208, 25.0, 0.0, 12.0, true),
('Sweet Potato', 'Generic', '100g', 86, 1.6, 20.0, 0.1, true)
ON CONFLICT (name, brand) DO NOTHING;

-- Step 10: Create useful views
CREATE OR REPLACE VIEW daily_nutrition_summary AS
SELECT 
  m.user_id,
  m.date,
  SUM(m.calories) as total_calories,
  SUM(m.protein) as total_protein,
  SUM(m.carbs) as total_carbs,
  SUM(m.fat) as total_fat,
  COUNT(*) as meal_count
FROM public.meals m
GROUP BY m.user_id, m.date;

-- Database setup complete! 
-- You can now use the NutriSnap app with full database functionality.
