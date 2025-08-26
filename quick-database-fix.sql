-- Quick and Safe Database Fix for NutriSnap
-- Run this in your Supabase SQL Editor to fix the muscle_mass_kg constraint issue

-- Step 1: Check current constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
  AND conname LIKE '%muscle_mass%';

-- Step 2: Drop the problematic constraint (if it exists)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_muscle_mass_kg_check;

-- Step 3: Add the corrected constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_muscle_mass_kg_check 
  CHECK (muscle_mass_kg >= 0 AND muscle_mass_kg < 500);

-- Step 4: Verify the new constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
  AND conname = 'profiles_muscle_mass_kg_check';

-- Step 5: Test that the table is working
-- This should return the table structure without errors
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Muscle mass constraint fixed successfully!';
  RAISE NOTICE '✅ Your profiles table should now accept muscle_mass_kg = 0';
  RAISE NOTICE '✅ Try saving a profile in your app now';
END $$;
