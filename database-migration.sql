-- =====================================================
-- NutriSnap Database Migration Script
-- =====================================================
-- Run this script in your Supabase SQL Editor to fix:
-- 1. Profile saving issues
-- 2. Daily activity summary view conflicts
-- =====================================================

-- Step 1: Drop and recreate the daily_activity_summary view to avoid conflicts
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

-- Step 2: Verify the profiles table structure
-- Check if your profiles table has the basic required columns
DO $$
BEGIN
  -- Check if profiles table exists and has required columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE EXCEPTION 'Profiles table does not exist. Please run the database setup script first.';
  END IF;
  
  -- Check for required columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_id'
  ) THEN
    RAISE EXCEPTION 'Profiles table is missing user_id column. Please check your schema.';
  END IF;
  
  RAISE NOTICE 'Profiles table structure verified successfully.';
END $$;

-- Step 3: Test profile operations
-- This will help verify that profile saving works
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_profile_id UUID;
BEGIN
  -- Insert a test profile to verify the table works
  INSERT INTO public.profiles (
    user_id, 
    name, 
    age, 
    weight_kg, 
    height_cm, 
    activity_level, 
    daily_calorie_goal
  ) VALUES (
    test_user_id,
    'Test User',
    25,
    70.0,
    170,
    'moderate',
    2000
  ) RETURNING id INTO test_profile_id;
  
  RAISE NOTICE 'Test profile created successfully with ID: %', test_profile_id;
  
  -- Clean up test data
  DELETE FROM public.profiles WHERE id = test_profile_id;
  RAISE NOTICE 'Test profile cleaned up successfully.';
  
  RAISE NOTICE 'Profile operations test completed successfully.';
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Profile operations test failed: %', SQLERRM;
END $$;

-- Step 4: Verify RLS policies are in place
DO $$
BEGIN
  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    RAISE WARNING 'Row Level Security (RLS) is not enabled on profiles table.';
  ELSE
    RAISE NOTICE 'Row Level Security (RLS) is enabled on profiles table.';
  END IF;
  
  -- Check if RLS policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    RAISE WARNING 'No RLS policies found on profiles table. Users may not be able to access their profiles.';
  ELSE
    RAISE NOTICE 'RLS policies found on profiles table.';
  END IF;
END $$;

-- Step 5: Final verification
SELECT 
  'Migration completed successfully!' as status,
  COUNT(*) as profiles_count,
  COUNT(*) FILTER (WHERE user_id IS NOT NULL) as profiles_with_user_id
FROM public.profiles;
