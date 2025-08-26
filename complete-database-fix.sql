-- Complete Database Fix for NutriSnap
-- Run this in your Supabase SQL Editor to fix all profile saving issues

-- Step 1: Check current table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 2: Check current constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

-- Step 3: Drop dependent views first
DROP VIEW IF EXISTS public.daily_activity_summary CASCADE;

-- Step 4: Fix the profiles table structure
-- First, drop the problematic foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Step 5: Update the profiles table to match your app requirements
ALTER TABLE public.profiles 
  ALTER COLUMN user_id SET DATA TYPE uuid,
  ALTER COLUMN user_id SET NOT NULL,
  ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 6: Fix the preferred_activities column type
ALTER TABLE public.profiles 
  ALTER COLUMN preferred_activities TYPE text[] USING 
    CASE 
      WHEN preferred_activities IS NULL THEN '{}'::text[]
      WHEN preferred_activities = '{}' THEN '{}'::text[]
      ELSE preferred_activities::text[]
    END;

-- Step 7: Ensure all required constraints are correct
-- Drop and recreate problematic constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_muscle_mass_kg_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_weight_kg_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_target_weight_kg_check;

-- Add corrected constraints
ALTER TABLE public.profiles ADD CONSTRAINT profiles_muscle_mass_kg_check 
  CHECK (muscle_mass_kg >= 0 AND muscle_mass_kg < 500);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_weight_kg_check 
  CHECK (weight_kg > 0 AND weight_kg < 500);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_target_weight_kg_check 
  CHECK (target_weight_kg > 0 AND target_weight_kg < 500);

-- Step 8: Recreate the daily_activity_summary view
CREATE OR REPLACE VIEW public.daily_activity_summary AS
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
  CASE WHEN COALESCE(SUM(ws.total_duration_minutes), 0) > 0 THEN 'Active' ELSE 'Rest Day' END as activity_status 
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

-- Step 9: Verify the fixes
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
  AND conname LIKE '%check';

-- Step 10: Test the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 11: Verify the view was recreated
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views 
WHERE viewname = 'daily_activity_summary';

-- Step 12: Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database fixes completed successfully!';
  RAISE NOTICE '✅ Foreign key constraints fixed';
  RAISE NOTICE '✅ Data type constraints corrected';
  RAISE NOTICE '✅ Daily activity summary view recreated';
  RAISE NOTICE '✅ Your profiles table should now work properly';
  RAISE NOTICE '✅ Try saving a profile in your app now';
END $$;
