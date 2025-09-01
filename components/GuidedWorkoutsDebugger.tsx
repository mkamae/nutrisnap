import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { guidedWorkoutService } from '../services/guidedWorkoutService';

const GuidedWorkoutsDebugger: React.FC = () => {
  const [debugResults, setDebugResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    runFullDiagnostic();
  }, []);

  const runFullDiagnostic = async () => {
    setIsRunning(true);
    const results: any = {};
    
    try {
      console.log('🔍 Running full guided workouts diagnostic...');
      
      // Test 1: Direct table queries
      console.log('Test 1: Direct table access');
      try {
        const { data: plans, error: plansError } = await supabase
          .from('workout_plans')
          .select('*');
        
        results.directPlans = {
          success: !plansError,
          error: plansError?.message,
          count: plans?.length || 0,
          data: plans?.slice(0, 2)
        };
      } catch (err: any) {
        results.directPlans = { success: false, error: err.message };
      }

      // Test 2: Service method
      console.log('Test 2: Service method');
      try {
        const servicePlans = await guidedWorkoutService.getWorkoutPlans();
        results.servicePlans = {
          success: true,
          count: servicePlans.length,
          data: servicePlans.slice(0, 2)
        };
      } catch (err: any) {
        results.servicePlans = { success: false, error: err.message };
      }

      // Test 3: Check exercises
      console.log('Test 3: Exercises check');
      try {
        const { data: exercises, error: exercisesError } = await supabase
          .from('exercises')
          .select('*');
        
        results.exercises = {
          success: !exercisesError,
          error: exercisesError?.message,
          count: exercises?.length || 0
        };
      } catch (err: any) {
        results.exercises = { success: false, error: err.message };
      }

      // Test 4: Check workout days
      console.log('Test 4: Workout days check');
      try {
        const { data: days, error: daysError } = await supabase
          .from('workout_days')
          .select('*');
        
        results.workoutDays = {
          success: !daysError,
          error: daysError?.message,
          count: days?.length || 0
        };
      } catch (err: any) {
        results.workoutDays = { success: false, error: err.message };
      }

      // Test 5: Check workout day exercises
      console.log('Test 5: Workout day exercises check');
      try {
        const { data: dayExercises, error: dayExercisesError } = await supabase
          .from('workout_day_exercises')
          .select('*');
        
        results.workoutDayExercises = {
          success: !dayExercisesError,
          error: dayExercisesError?.message,
          count: dayExercises?.length || 0
        };
      } catch (err: any) {
        results.workoutDayExercises = { success: false, error: err.message };
      }

      // Test 6: Test complete workout structure
      console.log('Test 6: Complete workout structure');
      try {
        const { data: structure, error: structureError } = await supabase
          .from('workout_plans')
          .select(`
            *,
            workout_days (
              *,
              workout_day_exercises (
                *,
                exercise:exercises (*)
              )
            )
          `)
          .is('user_id', null);
        
        results.completeStructure = {
          success: !structureError,
          error: structureError?.message,
          count: structure?.length || 0,
          hasNestedData: structure?.[0]?.workout_days?.length > 0
        };
      } catch (err: any) {
        results.completeStructure = { success: false, error: err.message };
      }

      // Test 7: Auth check
      const { data: { user } } = await supabase.auth.getUser();
      results.auth = {
        authenticated: !!user,
        userId: user?.id
      };

    } catch (error: any) {
      results.generalError = error.message;
    }
    
    console.log('🔍 Diagnostic results:', results);
    setDebugResults(results);
    setIsRunning(false);
  };

  const fixData = async () => {
    setIsRunning(true);
    try {
      console.log('🔧 Attempting to fix data...');
      
      // Run the minimal setup again
      const setupQueries = [
        // Clear existing data
        supabase.from('workout_day_exercises').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('workout_days').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('workout_plans').delete().is('user_id', null),
        supabase.from('exercises').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      ];

      // Wait for cleanup
      await Promise.all(setupQueries);

      // Insert fresh data
      const { data: exercises } = await supabase
        .from('exercises')
        .insert([
          { name: 'Push-ups', category: 'strength', reps: 10, instructions: 'Basic push-up exercise' },
          { name: 'Squats', category: 'strength', reps: 15, instructions: 'Basic squat exercise' },
          { name: 'Plank', category: 'core', duration_seconds: 30, instructions: 'Hold plank position' },
          { name: 'Jumping Jacks', category: 'cardio', duration_seconds: 30, instructions: 'Basic cardio exercise' }
        ])
        .select();

      const { data: plan } = await supabase
        .from('workout_plans')
        .insert({
          user_id: null,
          title: 'Beginner Workout',
          description: 'Simple beginner workout plan',
          duration_minutes: 15,
          total_exercises: 4,
          est_calories: 120
        })
        .select()
        .single();

      if (plan) {
        const { data: day } = await supabase
          .from('workout_days')
          .insert({
            plan_id: plan.id,
            day_number: 1,
            title: 'Day 1'
          })
          .select()
          .single();

        if (day && exercises) {
          for (let i = 0; i < exercises.length; i++) {
            await supabase
              .from('workout_day_exercises')
              .insert({
                day_id: day.id,
                exercise_id: exercises[i].id,
                sort_order: i + 1
              });
          }
        }
      }

      alert('Data fix completed! Running diagnostic again...');
      await runFullDiagnostic();
      
    } catch (error: any) {
      alert(`Fix failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-bold text-red-800 mb-4">
        🔧 Guided Workouts Debugger
      </h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={runFullDiagnostic}
          disabled={isRunning}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Run Full Diagnostic'}
        </button>
        
        <button
          onClick={fixData}
          disabled={isRunning}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          Fix Data
        </button>
      </div>

      {Object.keys(debugResults).length > 0 && (
        <div className="space-y-3">
          {Object.entries(debugResults).map(([testName, result]: [string, any]) => (
            <div key={testName} className="p-3 bg-white border rounded">
              <h4 className="font-semibold capitalize">{testName.replace(/([A-Z])/g, ' $1')}</h4>
              <div className="text-sm mt-1">
                {result.success !== undefined && (
                  <div className={result.success ? 'text-green-600' : 'text-red-600'}>
                    {result.success ? '✅' : '❌'} 
                    {result.success ? 'Success' : 'Failed'}
                  </div>
                )}
                {result.error && (
                  <div className="text-red-600">Error: {result.error}</div>
                )}
                {result.count !== undefined && (
                  <div>Count: {result.count}</div>
                )}
                {result.authenticated !== undefined && (
                  <div>Authenticated: {result.authenticated ? 'Yes' : 'No'}</div>
                )}
                {result.hasNestedData !== undefined && (
                  <div>Has Nested Data: {result.hasNestedData ? 'Yes' : 'No'}</div>
                )}
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600">View Data</summary>
                    <pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuidedWorkoutsDebugger;