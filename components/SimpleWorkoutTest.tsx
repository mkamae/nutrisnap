import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';

const SimpleWorkoutTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const results: any = {};
    
    try {
      console.log('🧪 Running simple workout tests...');
      
      // Test 1: Direct table query
      console.log('Test 1: Direct workout_plans query');
      const { data: plans, error: plansError } = await supabase
        .from('workout_plans')
        .select('*');
      
      results.plans = {
        success: !plansError,
        error: plansError?.message,
        count: plans?.length || 0,
        data: plans?.slice(0, 2) // First 2 plans for debugging
      };
      
      // Test 2: Direct exercises query
      console.log('Test 2: Direct exercises query');
      const { data: exercises, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .limit(3);
      
      results.exercises = {
        success: !exercisesError,
        error: exercisesError?.message,
        count: exercises?.length || 0,
        data: exercises
      };
      
      // Test 3: Auth check
      console.log('Test 3: Auth check');
      const { data: { user } } = await supabase.auth.getUser();
      results.auth = {
        authenticated: !!user,
        userId: user?.id || null
      };
      
      // Test 4: RLS test - try with and without user context
      console.log('Test 4: RLS test');
      const { data: plansWithRLS, error: rlsError } = await supabase
        .from('workout_plans')
        .select('*')
        .is('user_id', null); // Only default plans
      
      results.rls = {
        success: !rlsError,
        error: rlsError?.message,
        count: plansWithRLS?.length || 0
      };
      
    } catch (error: any) {
      results.generalError = error.message;
    }
    
    console.log('🔍 Test results:', results);
    setTestResults(results);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-blue-100 rounded-lg">
        <h3 className="font-bold text-blue-800">Running Database Tests...</h3>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mt-2"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h3 className="font-bold text-gray-800 mb-4">🧪 Database Test Results</h3>
      
      <div className="space-y-4">
        {/* Plans Test */}
        <div className="p-3 bg-white rounded border">
          <h4 className="font-semibold">Workout Plans Test:</h4>
          <p className={testResults.plans?.success ? 'text-green-600' : 'text-red-600'}>
            {testResults.plans?.success ? '✅' : '❌'} 
            {testResults.plans?.success 
              ? `Found ${testResults.plans.count} plans` 
              : `Error: ${testResults.plans?.error}`
            }
          </p>
          {testResults.plans?.data && (
            <pre className="text-xs bg-gray-50 p-2 mt-2 rounded overflow-auto">
              {JSON.stringify(testResults.plans.data, null, 2)}
            </pre>
          )}
        </div>

        {/* Exercises Test */}
        <div className="p-3 bg-white rounded border">
          <h4 className="font-semibold">Exercises Test:</h4>
          <p className={testResults.exercises?.success ? 'text-green-600' : 'text-red-600'}>
            {testResults.exercises?.success ? '✅' : '❌'} 
            {testResults.exercises?.success 
              ? `Found ${testResults.exercises.count} exercises` 
              : `Error: ${testResults.exercises?.error}`
            }
          </p>
        </div>

        {/* Auth Test */}
        <div className="p-3 bg-white rounded border">
          <h4 className="font-semibold">Authentication Test:</h4>
          <p className={testResults.auth?.authenticated ? 'text-green-600' : 'text-yellow-600'}>
            {testResults.auth?.authenticated ? '✅' : '⚠️'} 
            {testResults.auth?.authenticated 
              ? `User authenticated: ${testResults.auth.userId}` 
              : 'No user authenticated'
            }
          </p>
        </div>

        {/* RLS Test */}
        <div className="p-3 bg-white rounded border">
          <h4 className="font-semibold">RLS (Row Level Security) Test:</h4>
          <p className={testResults.rls?.success ? 'text-green-600' : 'text-red-600'}>
            {testResults.rls?.success ? '✅' : '❌'} 
            {testResults.rls?.success 
              ? `RLS working, found ${testResults.rls.count} default plans` 
              : `RLS Error: ${testResults.rls?.error}`
            }
          </p>
        </div>

        {/* General Error */}
        {testResults.generalError && (
          <div className="p-3 bg-red-50 rounded border border-red-200">
            <h4 className="font-semibold text-red-800">General Error:</h4>
            <p className="text-red-600">{testResults.generalError}</p>
          </div>
        )}
      </div>

      <button 
        onClick={runTests}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Re-run Tests
      </button>
    </div>
  );
};

export default SimpleWorkoutTest;