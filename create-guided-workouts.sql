-- Guided Workout System Database Schema
-- This creates a complete workout planning and guided exercise system

-- 1. Workout Plans Table
CREATE TABLE IF NOT EXISTS workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    total_exercises INTEGER,
    est_calories INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    category TEXT CHECK (category IN ('strength', 'cardio', 'flexibility', 'mixed', 'hiit', 'yoga')),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Workout Days Table
CREATE TABLE IF NOT EXISTS workout_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    day_title TEXT,
    rest_day BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Exercises Table
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT CHECK (category IN ('strength', 'cardio', 'flexibility', 'balance', 'core')),
    duration_seconds INTEGER,
    reps INTEGER,
    sets INTEGER,
    weight_kg INTEGER,
    image_url TEXT,
    gif_url TEXT,
    instructions TEXT,
    muscle_groups TEXT[],
    equipment_needed TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Workout Day Exercises (Linking Table)
CREATE TABLE IF NOT EXISTS workout_day_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID REFERENCES workout_days(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    custom_duration_seconds INTEGER,
    custom_reps INTEGER,
    custom_sets INTEGER,
    custom_weight_kg INTEGER,
    rest_seconds INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Workout Progress
CREATE TABLE IF NOT EXISTS user_workout_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
    day_id UUID REFERENCES workout_days(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    actual_duration_seconds INTEGER,
    actual_reps INTEGER,
    actual_sets INTEGER,
    actual_weight_kg INTEGER,
    notes TEXT
);

-- Enable Row Level Security
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_day_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workout_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_plans
CREATE POLICY "Users can view public workout plans" ON workout_plans
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own workout plans" ON workout_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout plans" ON workout_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout plans" ON workout_plans
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for workout_days
CREATE POLICY "Users can view days of accessible plans" ON workout_days
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workout_plans 
            WHERE workout_plans.id = workout_days.plan_id 
            AND (workout_plans.is_public = true OR workout_plans.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage days of their own plans" ON workout_days
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workout_plans 
            WHERE workout_plans.id = workout_days.plan_id 
            AND workout_plans.user_id = auth.uid()
        )
    );

-- RLS Policies for exercises (public read, admin write)
CREATE POLICY "Anyone can view exercises" ON exercises
    FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can create exercises" ON exercises
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update exercises" ON exercises
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for workout_day_exercises
CREATE POLICY "Users can view exercises of accessible days" ON workout_day_exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workout_days wd
            JOIN workout_plans wp ON wd.plan_id = wp.id
            WHERE wd.id = workout_day_exercises.day_id
            AND (wp.is_public = true OR wp.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage exercises of their own days" ON workout_day_exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workout_days wd
            JOIN workout_plans wp ON wd.plan_id = wp.id
            WHERE wd.id = workout_day_exercises.day_id
            AND wp.user_id = auth.uid()
        )
    );

-- RLS Policies for user_workout_progress
CREATE POLICY "Users can only access their own progress" ON user_workout_progress
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_category ON workout_plans(category);
CREATE INDEX IF NOT EXISTS idx_workout_plans_difficulty ON workout_plans(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_workout_plans_public ON workout_plans(is_public);

CREATE INDEX IF NOT EXISTS idx_workout_days_plan_id ON workout_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_days_number ON workout_days(day_number);

CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON exercises USING GIN(muscle_groups);

CREATE INDEX IF NOT EXISTS idx_workout_day_exercises_day_id ON workout_day_exercises(day_id);
CREATE INDEX IF NOT EXISTS idx_workout_day_exercises_sort_order ON workout_day_exercises(sort_order);

CREATE INDEX IF NOT EXISTS idx_user_workout_progress_user_id ON user_workout_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_workout_progress_plan_id ON user_workout_progress(plan_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_workout_plans_updated_at 
    BEFORE UPDATE ON workout_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at 
    BEFORE UPDATE ON exercises 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON workout_plans TO authenticated;
GRANT ALL ON workout_days TO authenticated;
GRANT ALL ON exercises TO authenticated;
GRANT ALL ON workout_day_exercises TO authenticated;
GRANT ALL ON user_workout_progress TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Insert some default exercises
INSERT INTO exercises (name, category, duration_seconds, reps, sets, instructions, muscle_groups) VALUES
('Push-ups', 'strength', NULL, 10, 3, 'Start in plank position, lower body until chest nearly touches ground, then push back up', ARRAY['chest', 'triceps', 'shoulders']),
('Squats', 'strength', NULL, 15, 3, 'Stand with feet shoulder-width apart, lower body as if sitting back into a chair, then stand back up', ARRAY['quadriceps', 'glutes', 'hamstrings']),
('Plank', 'core', 30, NULL, 3, 'Hold body in straight line from head to heels, engaging core muscles', ARRAY['core', 'shoulders']),
('Jumping Jacks', 'cardio', 60, NULL, 3, 'Jump while raising arms overhead and spreading legs, then return to starting position', ARRAY['full_body']),
('Lunges', 'strength', NULL, 10, 3, 'Step forward with one leg, lower body until both knees are bent at 90 degrees', ARRAY['quadriceps', 'glutes', 'hamstrings']),
('Burpees', 'cardio', NULL, 8, 3, 'Combine squat, push-up, and jump in one fluid movement', ARRAY['full_body']),
('Mountain Climbers', 'cardio', 45, NULL, 3, 'In plank position, alternate bringing knees toward chest in running motion', ARRAY['core', 'shoulders', 'cardio']),
('Wall Sit', 'strength', 30, NULL, 3, 'Sit against wall with thighs parallel to ground, hold position', ARRAY['quadriceps', 'glutes']),
('Arm Circles', 'flexibility', 30, NULL, 2, 'Stand with arms extended, make small circles forward then backward', ARRAY['shoulders', 'chest']),
('High Knees', 'cardio', 45, NULL, 3, 'Run in place, bringing knees up toward chest', ARRAY['quadriceps', 'core', 'cardio']);

-- Insert some default workout plans
INSERT INTO workout_plans (title, description, duration_minutes, total_exercises, est_calories, difficulty_level, category, is_public) VALUES
('7-Day Beginner Fitness', 'Perfect for fitness newcomers. Build strength and endurance gradually over a week.', 20, 35, 120, 'beginner', 'mixed', true),
('Quick HIIT Blast', 'High-intensity interval training for maximum calorie burn in minimal time.', 15, 8, 150, 'intermediate', 'hiit', true),
('Core Crusher', 'Focus on building a strong, stable core with targeted exercises.', 25, 12, 100, 'beginner', 'strength', true),
('Cardio Kickstart', 'Get your heart pumping with this energetic cardio workout.', 30, 10, 200, 'beginner', 'cardio', true),
('Strength Builder', 'Build muscle and increase strength with progressive resistance training.', 40, 15, 180, 'intermediate', 'strength', true);

-- Insert workout days for the 7-Day Beginner Fitness plan
INSERT INTO workout_days (plan_id, day_number, day_title) VALUES
((SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness'), 1, 'Upper Body Focus'),
((SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness'), 2, 'Lower Body Focus'),
((SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness'), 3, 'Core & Cardio'),
((SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness'), 4, 'Rest Day'),
((SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness'), 5, 'Full Body'),
((SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness'), 6, 'Flexibility & Balance'),
((SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness'), 7, 'Active Recovery');

-- Insert exercises for Day 1 (Upper Body Focus)
INSERT INTO workout_day_exercises (day_id, exercise_id, sort_order, custom_reps, custom_sets, rest_seconds) VALUES
((SELECT id FROM workout_days WHERE day_number = 1 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Push-ups'), 1, 8, 3, 60),
((SELECT id FROM workout_days WHERE day_number = 1 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Arm Circles'), 2, NULL, 2, 30),
((SELECT id FROM workout_days WHERE day_number = 1 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Plank'), 3, NULL, 3, 45);

-- Insert exercises for Day 2 (Lower Body Focus)
INSERT INTO workout_day_exercises (day_id, exercise_id, sort_order, custom_reps, custom_sets, rest_seconds) VALUES
((SELECT id FROM workout_days WHERE day_number = 2 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Squats'), 1, 12, 3, 60),
((SELECT id FROM workout_days WHERE day_number = 2 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Lunges'), 2, 10, 3, 60),
((SELECT id FROM workout_days WHERE day_number = 2 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Wall Sit'), 3, NULL, 3, 45);

-- Insert exercises for Day 3 (Core & Cardio)
INSERT INTO workout_day_exercises (day_id, exercise_id, sort_order, custom_reps, custom_sets, rest_seconds) VALUES
((SELECT id FROM workout_days WHERE day_number = 3 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Plank'), 1, NULL, 3, 45),
((SELECT id FROM workout_days WHERE day_number = 3 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Jumping Jacks'), 2, NULL, 3, 30),
((SELECT id FROM workout_days WHERE day_number = 3 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Mountain Climbers'), 3, NULL, 3, 45);

-- Insert exercises for Day 5 (Full Body)
INSERT INTO workout_day_exercises (day_id, exercise_id, sort_order, custom_reps, custom_sets, rest_seconds) VALUES
((SELECT id FROM workout_days WHERE day_number = 5 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Burpees'), 1, 6, 3, 90),
((SELECT id FROM workout_days WHERE day_number = 5 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Squats'), 2, 10, 3, 60),
((SELECT id FROM workout_days WHERE day_number = 5 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Push-ups'), 3, 6, 3, 60),
((SELECT id FROM workout_days WHERE day_number = 5 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Plank'), 4, NULL, 3, 45);

-- Insert exercises for Day 6 (Flexibility & Balance)
INSERT INTO workout_day_exercises (day_id, exercise_id, sort_order, custom_reps, custom_sets, rest_seconds) VALUES
((SELECT id FROM workout_days WHERE day_number = 6 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Arm Circles'), 1, NULL, 2, 30),
((SELECT id FROM workout_days WHERE day_number = 6 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Wall Sit'), 2, NULL, 2, 45);

-- Insert exercises for Day 7 (Active Recovery)
INSERT INTO workout_day_exercises (day_id, exercise_id, sort_order, custom_reps, custom_sets, rest_seconds) VALUES
((SELECT id FROM workout_days WHERE day_number = 7 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'High Knees'), 1, NULL, 2, 30),
((SELECT id FROM workout_days WHERE day_number = 7 AND plan_id = (SELECT id FROM workout_plans WHERE title = '7-Day Beginner Fitness')), 
 (SELECT id FROM exercises WHERE name = 'Arm Circles'), 2, NULL, 2, 30);

-- Update the total_exercises count for the 7-Day plan
UPDATE workout_plans 
SET total_exercises = (
    SELECT COUNT(*) 
    FROM workout_day_exercises wde
    JOIN workout_days wd ON wde.day_id = wd.id
    WHERE wd.plan_id = workout_plans.id
)
WHERE title = '7-Day Beginner Fitness';
