import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';
import { guidedWorkoutService } from '../services/guidedWorkoutService';

const GuidedWorkoutsDebugger: React.FC = () => {
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      // Test 1: Check if tables exist
      console.log('🔍 Checking if tables exist...');
      try {
        const { data: exercisesCheck } = await supabase.from('exercises').select('count').limit(1);
        diagnostics.tests.exercises_table = { exists: true, accessible: true };
      } catch (error: any) {
        diagnostics.tests.exercises_table = { exists: false, error: error.message };
      }

      try {
        const { data: plansCheck } = await supabase.from('workout_plans').select('count').limit(1);
        diagnostics.tests.workout_plans_table = { exists: true, accessible: true };
      } catch (error: any) {
        diagnostics.tests.workout_plans_table = { exists: false, error: error.message };
      }

      // Test 2: Count records
      console.log('🔍 Counting records...');
      try {
        const { data: exercises, count: exerciseCount } = await supabase
          .from('exercises')
          .select('*', { count: 'exact' });
        diagnostics.tests.exercises_data = { 
          count: exerciseCount, 
          sample: exercises?.slice(0, 3).map(e => e.name) 
        };
      } catch (error: any) {
        diagnostics.tests.exercises_data = { error: error.message };
      }

      try {
        const { data: plans, count: planCount } = await supabase
          .from('workout_plans')
          .select('*', { count: 'exact' })
          .is('user_id', null);
        diagnostics.tests.workout_plans_data = { 
          count: planCount, 
          sample: plans?.map(p => p.title) 
        };
      } catch (error: any) {
        diagnostics.tests.workout_plans_data = { error: error.message };
      }

      // Test 3: Check RLS policies
      console.log('🔍 Testing RLS policies...');
      try {
        const { data: publicPlans } = await supabase
          .from('workout_plans')
          .select('id, title')
          .is('user_id', null)
          .limit(5);
        diagnostics.tests.rls_policies = { 
          can_read_public_plans: true, 
          plans_found: publicPlans?.length || 0 
        };
      } catch (error: any) {
        diagnostics.tests.rls_policies = { error: error.message };
      }

      // Test 4: Check relationships
      console.log('🔍 Testing table relationships...');
      try {
        const { data: daysWithPlans } = await supabase
          .from('workout_days')
          .select(`
            id,
            title,
            workout_plan:workout_plans(title)
          `)
          .limit(3);
        diagnostics.tests.relationships = { 
          workout_days_with_plans: daysWithPlans?.length || 0,
          sample: daysWithPlans?.map(d => ({ day: d.title, plan: d.workout_plan?.title }))
        };
      } catch (error: any) {
        diagnostics.tests.relationships = { error: error.message };
      }

      // Test 5: Full service test
      console.log('🔍 Testing guidedWorkoutService...');
      try {
        const plans = await guidedWorkoutService.getWorkoutPlans();
        diagnostics.tests.service_test = { 
          success: true, 
          plans_returned: plans.length,
          plan_titles: plans.map(p => p.title)
        };
      } catch (error: any) {
        diagnostics.tests.service_test = { error: error.message };
      }

    } catch (error: any) {
      diagnostics.error = error.message;
    }

    setResults(diagnostics);
    setIsLoading(false);
  };

  const runDatabaseSetup = async () => {
    setIsLoading(true);
    try {
      console.log('🔧 Running database setup...');
      
      // This would ideally run the SQL script, but we can't do that from the frontend
      // Instead, we'll provide instructions
      alert(`To set up the database:
      
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of: database/guided-workouts-tables-and-data.sql
4. Click "Run" to execute the script
5. Come back here and click "Run Diagnostics" to verify

The script will create all necessary tables and insert sample workout data.`);
      
    } catch (error: any) {
      console.error('Setup error:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        🔧 Guided Workouts Debugger
      </h2>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={runDiagnostics}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </button>
        
        <button
          onClick={runDatabaseSetup}
          disabled={isLoading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 ml-4"
        >
          Database Setup Instructions
        </button>
      </div>

      {results && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Diagnostic Results
          </h3>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Quick Summary:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>
                ✅ Tables exist: {results.tests.exercises_table?.exists && results.tests.workout_plans_table?.exists ? 'Yes' : 'No'}
              </li>
              <li>
                📊 Workout plans: {results.tests.workout_plans_data?.count || 0} found
              </li>
              <li>
                🏃 Exercises: {results.tests.exercises_data?.count || 0} found
              </li>
              <li>
                🔒 RLS working: {results.tests.rls_policies?.can_read_public_plans ? 'Yes' : 'No'}
              </li>
              <li>
                🔧 Service working: {results.tests.service_test?.success ? 'Yes' : 'No'}
              </li>
            </ul>
          </div>

          {/* Recommendations */}
          <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Recommendations:
            </h4>
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              {!results.tests.exercises_table?.exists && (
                <p>❌ Tables don't exist - run the database setup script</p>
              )}
              {results.tests.exercises_table?.exists && (results.tests.workout_plans_data?.count || 0) === 0 && (
                <p>⚠️ Tables exist but no data - run the database setup script to add sample workouts</p>
              )}
              {(results.tests.workout_plans_data?.count || 0) > 0 && !results.tests.service_test?.success && (
                <p>🔧 Data exists but service failing - check console for errors</p>
              )}
              {results.tests.service_test?.success && (
                <p>✅ Everything looks good! Workouts should be loading properly.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidedWorkoutsDebugger;