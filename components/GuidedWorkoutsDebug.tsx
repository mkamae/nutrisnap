import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';

const GuidedWorkoutsDebug: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results: any = {};
    
    try {
      // Test 1: Check if tables exist
      console.log('🔍 Testing database tables...');
      
      try {
        const { data: plans, error: plansError } = await supabase
          .from('workout_plans')
          .select('count')
          .limit(1);
        
        results.workout_plans = plansError ? `❌ Error: ${plansError.message}` : '✅ Table exists';
      } catch (error) {
        results.workout_plans = `❌ Table missing or inaccessible: ${error}`;
      }

      try {
        const { data: exercises, error: exercisesError } = await supabase
          .from('exercises')
          .select('count')
          .limit(1);
        
        results.exercises = exercisesError ? `❌ Error: ${exercisesError.message}` : '✅ Table exists';
      } catch (error) {
        results.exercises = `❌ Table missing or inaccessible: ${error}`;
      }

      try {
        const { data: days, error: daysError } = await supabase
          .from('workout_days')
          .select('count')
          .limit(1);
        
        results.workout_days = daysError ? `❌ Error: ${daysError.message}` : '✅ Table exists';
      } catch (error) {
        results.workout_days = `❌ Table missing or inaccessible: ${error}`;
      }

      // Test 2: Check data
      try {
        const { data: planCount, error: countError } = await supabase
          .from('workout_plans')
          .select('*', { count: 'exact' });
        
        results.data_count = countError 
          ? `❌ Error counting plans: ${countError.message}` 
          : `✅ Found ${planCount?.length || 0} workout plans`;
      } catch (error) {
        results.data_count = `❌ Cannot count data: ${error}`;
      }

      // Test 3: Check user authentication
      const { data: { user } } = await supabase.auth.getUser();
      results.auth = user ? `✅ User authenticated: ${user.id}` : '❌ No user authenticated';

      // Test 4: Test service function
      try {
        const { guidedWorkoutService } = await import('../services/guidedWorkoutService');
        const plans = await guidedWorkoutService.getWorkoutPlans();
        results.service = `✅ Service working, returned ${plans.length} plans`;
      } catch (error) {
        results.service = `❌ Service error: ${error}`;
      }

    } catch (error) {
      results.general_error = `❌ General error: ${error}`;
    }

    setDiagnostics(results);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-yellow-100 border border-yellow-400 rounded-lg">
        <h3 className="font-bold text-yellow-800">Running Diagnostics...</h3>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mt-2"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-100 border border-blue-400 rounded-lg">
      <h3 className="font-bold text-blue-800 mb-4">🔍 Guided Workouts Diagnostics</h3>
      
      <div className="space-y-2 text-sm">
        {Object.entries(diagnostics).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
            <span className="ml-2">{value as string}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-blue-300">
        <h4 className="font-semibold text-blue-800 mb-2">Quick Fixes:</h4>
        <ul className="text-sm space-y-1">
          <li>• If tables are missing: Run the SQL migration in Supabase</li>
          <li>• If no data: Check if default workout plans were inserted</li>
          <li>• If auth issues: Make sure you're logged in</li>
          <li>• If service errors: Check browser console for details</li>
        </ul>
      </div>

      <button 
        onClick={runDiagnostics}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Re-run Diagnostics
      </button>
    </div>
  );
};

export default GuidedWorkoutsDebug;