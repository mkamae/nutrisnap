-- Quick fix for muscle_mass_kg constraint issue
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the problematic constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_muscle_mass_kg_check;

-- Step 2: Add the corrected constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_muscle_mass_kg_check 
  CHECK (muscle_mass_kg >= 0 AND muscle_mass_kg < 500);

-- Step 3: Verify the constraint was added
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
  AND conname = 'profiles_muscle_mass_kg_check';

-- Step 4: Test with a sample value
-- This should work now:
-- INSERT INTO public.profiles (user_id, name, age, weight_kg, height_cm, activity_level, daily_calorie_goal, muscle_mass_kg) 
-- VALUES (gen_random_uuid(), 'Test User', 25, 70.0, 170, 'moderate', 2000, 0);
