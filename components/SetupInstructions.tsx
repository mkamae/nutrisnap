import React, { useState } from 'react';

const SetupInstructions: React.FC = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <h3 className="text-xl font-bold text-blue-800 mb-4">
        🚀 Quick Setup Guide
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h4 className="font-semibold text-blue-800">Go to Supabase SQL Editor</h4>
            <p className="text-blue-700 text-sm">
              Open your Supabase dashboard → SQL Editor
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <h4 className="font-semibold text-blue-800">Run the Setup Script</h4>
            <p className="text-blue-700 text-sm mb-2">
              Copy and paste this SQL script:
            </p>
            <div className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
              <pre>{`-- MINIMAL GUIDED WORKOUTS SETUP
DELETE FROM workout_day_exercises;
DELETE FROM workout_days;
DELETE FROM workout_plans WHERE user_id IS NULL;
DELETE FROM exercises;

INSERT INTO exercises (name, category, duration_seconds, reps, instructions) VALUES
('Push-ups', 'strength', NULL, 10, 'Basic push-up exercise'),
('Squats', 'strength', NULL, 15, 'Basic squat exercise'),
('Plank', 'core', 30, NULL, 'Hold plank position'),
('Jumping Jacks', 'cardio', 30, NULL, 'Basic cardio exercise');

INSERT INTO workout_plans (user_id, title, description, duration_minutes, total_exercises, est_calories) 
VALUES (NULL, 'Beginner Workout', 'Simple beginner workout plan', 15, 4, 120);

INSERT INTO workout_days (plan_id, day_number, title)
SELECT id, 1, 'Day 1' FROM workout_plans WHERE title = 'Beginner Workout' AND user_id IS NULL;

INSERT INTO workout_day_exercises (day_id, exercise_id, sort_order)
SELECT wd.id, e.id, ROW_NUMBER() OVER (ORDER BY e.name)
FROM workout_days wd
JOIN workout_plans wp ON wd.plan_id = wp.id
CROSS JOIN exercises e
WHERE wp.title = 'Beginner Workout' AND wp.user_id IS NULL;`}</pre>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            3
          </div>
          <div>
            <h4 className="font-semibold text-blue-800">Refresh This Page</h4>
            <p className="text-blue-700 text-sm">
              After running the script, refresh this page to see your workout plans.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800 mb-2">Alternative: Use the Test Components</h4>
        <p className="text-yellow-700 text-sm">
          If you can't access Supabase SQL Editor, try using the "Create Test Plan" button in the Bypass Service Test below.
        </p>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};

export default SetupInstructions;