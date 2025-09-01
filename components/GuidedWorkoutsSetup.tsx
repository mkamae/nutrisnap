import React, { useState } from 'react';

const GuidedWorkoutsSetup: React.FC = () => {
  const [showScript, setShowScript] = useState(false);

  const setupScript = `-- GUIDED WORKOUTS COMPLETE SETUP
-- Copy and paste this entire script into Supabase SQL Editor

-- Create tables
CREATE TABLE IF NOT EXISTS exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text NOT NULL,
    duration_seconds integer,
    reps integer,
    instructions text,
    gif_url text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    duration_minutes integer NOT NULL,
    total_exercises integer NOT NULL,
    est_calories integer,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_days (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id uuid REFERENCES workout_plans(id) ON DELETE CASCADE,
    day_number integer NOT NULL,
    title text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_day_exercises (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id uuid REFERENCES workout_days(id) ON DELETE CASCADE,
    exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
    sort_order integer NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_completions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id uuid REFERENCES workout_plans(id) ON DELETE CASCADE,
    day_id uuid REFERENCES workout_days(id) ON DELETE CASCADE,
    duration_minutes integer,
    exercises_completed integer,
    total_exercises integer,
    completed_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_day_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view all exercises" ON exercises FOR SELECT USING (true);
CREATE POLICY "Public can view all workout plans" ON workout_plans FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create plans" ON workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view all workout days" ON workout_days FOR SELECT USING (true);
CREATE POLICY "Public can view all workout day exercises" ON workout_day_exercises FOR SELECT USING (true);
CREATE POLICY "Users can view their own completions" ON workout_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own completions" ON workout_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert sample data
DELETE FROM workout_day_exercises;
DELETE FROM workout_days;
DELETE FROM workout_plans WHERE user_id IS NULL;
DELETE FROM exercises;

INSERT INTO exercises (name, category, duration_seconds, reps, instructions) VALUES
('Push-ups', 'strength', NULL, 10, 'Start in a plank position with hands shoulder-width apart. Lower your body until your chest nearly touches the floor, then push back up.'),
('Squats', 'strength', NULL, 15, 'Stand with feet shoulder-width apart. Lower your body as if sitting back into a chair, keeping your chest up and knees behind your toes.'),
('Plank', 'core', 30, NULL, 'Start in a push-up position but rest on your forearms. Keep your body in a straight line from head to heels.'),
('Jumping Jacks', 'cardio', 30, NULL, 'Stand with feet together and arms at your sides. Jump while spreading your legs shoulder-width apart and raising your arms overhead.');

INSERT INTO workout_plans (user_id, title, description, duration_minutes, total_exercises, est_calories) VALUES
(NULL, 'Beginner Full Body', 'Perfect for fitness beginners! A gentle introduction to exercise targeting all major muscle groups.', 15, 4, 120),
(NULL, '7-Minute HIIT Blast', 'High-intensity interval training that delivers maximum results in minimal time.', 7, 4, 80);

INSERT INTO workout_days (plan_id, day_number, title)
SELECT id, 1, 'Full Body Basics' FROM workout_plans WHERE title = 'Beginner Full Body' AND user_id IS NULL
UNION ALL
SELECT id, 1, 'HIIT Circuit' FROM workout_plans WHERE title = '7-Minute HIIT Blast' AND user_id IS NULL;

INSERT INTO workout_day_exercises (day_id, exercise_id, sort_order)
SELECT wd.id, e.id, 
  CASE e.name 
    WHEN 'Jumping Jacks' THEN 1
    WHEN 'Push-ups' THEN 2
    WHEN 'Squats' THEN 3
    WHEN 'Plank' THEN 4
  END
FROM workout_days wd
JOIN workout_plans wp ON wd.plan_id = wp.id
CROSS JOIN exercises e
WHERE wp.title = 'Beginner Full Body' AND wp.user_id IS NULL;

SELECT 'Setup complete!' as status, 
       (SELECT count(*) FROM workout_plans WHERE user_id IS NULL) as plans,
       (SELECT count(*) FROM exercises) as exercises;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(setupScript);
      alert('Setup script copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy. Please select and copy manually.');
    }
  };

  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-bold text-blue-800 mb-4">
        🛠️ Guided Workouts Setup
      </h3>
      
      <div className="space-y-4">
        <p className="text-blue-700">
          To enable guided workouts, you need to set up the database tables and sample data.
        </p>
        
        <button
          onClick={() => setShowScript(!showScript)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showScript ? 'Hide Setup Script' : 'Show Setup Script'}
        </button>
        
        {showScript && (
          <div className="space-y-4">
            <div className="bg-white border border-blue-200 rounded p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Setup Instructions:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to the "SQL Editor" section</li>
                <li>Create a new query</li>
                <li>Copy and paste the script below</li>
                <li>Click "Run" to execute the script</li>
                <li>Refresh this page to see the workout plans</li>
              </ol>
            </div>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">SQL Setup Script:</span>
                <button
                  onClick={copyToClipboard}
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                >
                  Copy Script
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-xs">{setupScript}</pre>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <h5 className="font-semibold text-green-800 mb-1">What this script does:</h5>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Creates all necessary database tables</li>
                <li>• Sets up Row Level Security (RLS) policies</li>
                <li>• Adds sample exercises and workout plans</li>
                <li>• Creates a complete workout structure</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidedWorkoutsSetup;