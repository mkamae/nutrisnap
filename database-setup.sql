-- =====================================================
-- NutriSnap Database Setup Script
-- =====================================================
-- This script creates all necessary tables, indexes, and policies
-- for the NutriSnap nutrition tracking application
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
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

-- Meals table
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

-- Food items table (for detailed tracking)
CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT UNIQUE,
  serving_size TEXT NOT NULL,
  calories_per_serving INTEGER CHECK (calories_per_serving >= 0) NOT NULL,
  protein_per_serving DECIMAL(5,2) CHECK (protein_per_serving >= 0) NOT NULL,
  carbs_per_serving DECIMAL(5,2) CHECK (carbs_per_serving >= 0) NOT NULL,
  fat_per_serving DECIMAL(5,2) CHECK (fat_per_serving >= 0) NOT NULL,
  fiber_per_serving DECIMAL(5,2) CHECK (fiber_per_serving >= 0) DEFAULT 0,
  sugar_per_serving DECIMAL(5,2) CHECK (sugar_per_serving >= 0) DEFAULT 0,
  sodium_per_serving DECIMAL(5,2) CHECK (sodium_per_serving >= 0) DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal food items (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.meal_food_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  food_item_id UUID REFERENCES public.food_items(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(5,2) CHECK (quantity > 0) NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meal_id, food_item_id)
);

-- Weight tracking table
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

-- Water intake tracking
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount_ml INTEGER CHECK (amount_ml > 0) NOT NULL,
  date DATE NOT NULL,
  time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise/Activity tracking
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  activity_name TEXT NOT NULL,
  activity_type TEXT CHECK (activity_type IN ('cardio', 'strength', 'flexibility', 'sports', 'other')) NOT NULL,
  duration_minutes INTEGER CHECK (duration_minutes > 0) NOT NULL,
  calories_burned INTEGER CHECK (calories_burned >= 0),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals and achievements
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  goal_type TEXT CHECK (goal_type IN ('weight', 'calories', 'protein', 'carbs', 'fat', 'water', 'exercise')) NOT NULL,
  target_value DECIMAL(8,2) NOT NULL,
  current_value DECIMAL(8,2) DEFAULT 0,
  unit TEXT NOT NULL,
  start_date DATE NOT NULL,
  target_date DATE,
  is_achieved BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_activity_level ON public.profiles(activity_level);

-- Meals indexes
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_date ON public.meals(date);
CREATE INDEX IF NOT EXISTS idx_meals_meal_type ON public.meals(meal_type);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, date);

-- Food items indexes
CREATE INDEX IF NOT EXISTS idx_food_items_name ON public.food_items(name);
CREATE INDEX IF NOT EXISTS idx_food_items_barcode ON public.food_items(barcode);
CREATE INDEX IF NOT EXISTS idx_food_items_brand ON public.food_items(brand);

-- Meal food items indexes
CREATE INDEX IF NOT EXISTS idx_meal_food_items_meal_id ON public.meal_food_items(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_food_items_food_item_id ON public.meal_food_items(food_item_id);

-- Weight logs indexes
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON public.weight_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON public.weight_logs(date);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON public.weight_logs(user_id, date);

-- Water logs indexes
CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON public.water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_date ON public.water_logs(user_id, date);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(user_id, date);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_type ON public.goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_achieved ON public.goals(is_achieved);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Meals policies
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

-- Meal food items policies
CREATE POLICY "Users can view meal food items" ON public.meal_food_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.meals 
      WHERE meals.id = meal_food_items.meal_id 
      AND meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert meal food items" ON public.meal_food_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meals 
      WHERE meals.id = meal_food_items.meal_id 
      AND meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update meal food items" ON public.meal_food_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.meals 
      WHERE meals.id = meal_food_items.meal_id 
      AND meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete meal food items" ON public.meal_food_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.meals 
      WHERE meals.id = meal_food_items.meal_id 
      AND meals.user_id = auth.uid()
    )
  );

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

-- Activities policies
CREATE POLICY "Users can view own activities" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON public.activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities" ON public.activities
  FOR DELETE USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate daily totals
CREATE OR REPLACE FUNCTION get_daily_totals(user_uuid UUID, target_date DATE)
RETURNS TABLE (
  total_calories BIGINT,
  total_protein DECIMAL,
  total_carbs DECIMAL,
  total_fat DECIMAL,
  total_fiber DECIMAL,
  total_sugar DECIMAL,
  total_sodium DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(calories), 0)::BIGINT,
    COALESCE(SUM(protein), 0),
    COALESCE(SUM(carbs), 0),
    COALESCE(SUM(fat), 0),
    COALESCE(SUM(fiber), 0),
    COALESCE(SUM(sugar), 0),
    COALESCE(SUM(sodium), 0)
  FROM public.meals 
  WHERE user_id = user_uuid AND date = target_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current weight
CREATE OR REPLACE FUNCTION get_current_weight(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  current_weight DECIMAL;
BEGIN
  SELECT weight_kg INTO current_weight
  FROM public.weight_logs
  WHERE user_id = user_uuid
  ORDER BY date DESC
  LIMIT 1;
  
  RETURN COALESCE(current_weight, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON public.food_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert some common food items for testing
INSERT INTO public.food_items (name, brand, serving_size, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, verified) VALUES
('Chicken Breast', 'Generic', '100g', 165, 31.0, 0.0, 3.6, true),
('Brown Rice', 'Generic', '100g', 111, 2.6, 23.0, 0.9, true),
('Broccoli', 'Generic', '100g', 34, 2.8, 7.0, 0.4, true),
('Salmon', 'Generic', '100g', 208, 25.0, 0.0, 12.0, true),
('Sweet Potato', 'Generic', '100g', 86, 1.6, 20.0, 0.1, true),
('Greek Yogurt', 'Generic', '100g', 59, 10.0, 3.6, 0.4, true),
('Almonds', 'Generic', '100g', 579, 21.2, 21.7, 49.9, true),
('Spinach', 'Generic', '100g', 23, 2.9, 3.6, 0.4, true),
('Eggs', 'Generic', '100g', 155, 12.6, 1.1, 11.3, true),
('Quinoa', 'Generic', '100g', 120, 4.4, 21.3, 1.9, true)
ON CONFLICT (name, brand) DO NOTHING;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Daily nutrition summary view
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

-- Weekly progress view
CREATE OR REPLACE VIEW weekly_progress AS
SELECT 
  m.user_id,
  DATE_TRUNC('week', m.date) as week_start,
  SUM(m.calories) as weekly_calories,
  AVG(m.calories) as avg_daily_calories,
  COUNT(*) as total_meals
FROM public.meals m
GROUP BY m.user_id, DATE_TRUNC('week', m.date);

-- =====================================================
-- FINAL COMMENTS
-- =====================================================

-- Database setup complete!
-- 
-- To use this database:
-- 1. Run this script in your Supabase SQL Editor
-- 2. The tables will be created with proper RLS policies
-- 3. Users can only access their own data
-- 4. Sample food items are included for testing
-- 5. Views are created for common queries
-- 6. Functions are available for calculations
--
-- Next steps:
-- 1. Test the RLS policies
-- 2. Create a test user account
-- 3. Try inserting some sample data
-- 4. Verify the policies work correctly
