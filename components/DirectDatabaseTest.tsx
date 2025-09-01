import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';

const DirectDatabaseTest: React.FC = () => {
  const [results, setResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);

  const runDirectTest = async () => {
    setIsRunning(true);
    const testResults: any = {};
    
    try {
      console.log('🧪 Starting direct database tests...');
      
      // Test 1: Most basic query possible
      console.log('Test 1: Basic connection test');
      const start1 = Date.now();
      try {
        const { data, error } = await Promise.race([
          supabase.from('workout_plans').select('id').limit(1),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
        
        testResults.basicConnection = {
          success: !error,
          time: Date.now() - start1,
          error: error?.message,
          data: data
        };
      } catch (err: any) {
        testResults.basicConnection = {
          success: false,
          time: Date.now() - start1,
          error: err.message
        };
      }

      // Test 2: Check if RLS is blocking us
      console.log('Test 2: RLS bypass test');
      const start2 = Date.now();
      try {
        // Try to access without any filters
        const { data, error } = await Promise.race([
          supabase.rpc('get_workout_plans_bypass_rls'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
        
        testResults.rlsBypass = {
          success: !error,
          time: Date.now() - start2,
          error: error?.message,
          note: 'This tests if RLS is the issue'
        };
      } catch (err: any) {
        testResults.rlsBypass = {
          success: false,
          time: Date.now() - start2,
          error: err.message,
          note: 'RLS function not available - this is expected'
        };
      }

      // Test 3: Check auth status
      console.log('Test 3: Auth check');
      const start3 = Date.now();
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        testResults.auth = {
          success: !error,
          time: Date.now() - start3,
          authenticated: !!user,
          userId: user?.id,
          error: error?.message
        };
      } catch (err: any) {
        testResults.auth = {
          success: false,
          time: Date.now() - start3,
          error: err.message
        };
      }

      // Test 4: Try different table
      console.log('Test 4: Try exercises table');
      const start4 = Date.now();
      try {
        const { data, error } = await Promise.race([
          supabase.from('exercises').select('id').limit(1),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
        
        testResults.exercisesTable = {
          success: !error,
          time: Date.now() - start4,
          error: error?.message,
          count: data?.length || 0
        };
      } catch (err: any) {
        testResults.exercisesTable = {
          success: false,
          time: Date.now() - start4,
          error: err.message
        };
      }

      // Test 5: Check Supabase URL and key
      testResults.config = {
        url: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
        key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        urlLength: import.meta.env.VITE_SUPABASE_URL?.length || 0,
        keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
      };

    } catch (error: any) {
      testResults.generalError = error.message;
    }
    
    console.log('🔍 Test results:', testResults);
    setResults(testResults);
    setIsRunning(false);
  };

  const createMinimalData = async () => {
    setIsRunning(true);
    try {
      console.log('🔧 Creating minimal test data...');
      
      // Try to insert one simple workout plan
      const { data, error } = await supabase
        .from('workout_plans')
        .insert({
          user_id: null,
          title: 'Test Plan',
          description: 'Minimal test plan',
          duration_minutes: 5,
          total_exercises: 1,
          est_calories: 25
        })
        .select();

      if (error) {
        alert(`Failed to create test data: ${error.message}`);
      } else {
        alert('Test data created successfully! Try refreshing the page.');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
    setIsRunning(false);
  };

  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-bold text-red-800 mb-4">
        🚨 Direct Database Test (Timeout Issue)
      </h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={runDirectTest}
          disabled={isRunning}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isRunning ? 'Testing...' : 'Run Direct Test'}
        </button>
        
        <button
          onClick={createMinimalData}
          disabled={isRunning}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Create Test Data
        </button>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="space-y-3">
          {Object.entries(results).map(([testName, result]: [string, any]) => (
            <div key={testName} className="p-3 bg-white border rounded">
              <h4 className="font-semibold capitalize">{testName.replace(/([A-Z])/g, ' $1')}</h4>
              <div className="text-sm mt-1">
                {result.success !== undefined && (
                  <div className={result.success ? 'text-green-600' : 'text-red-600'}>
                    {result.success ? '✅' : '❌'} 
                    {result.success ? 'Success' : 'Failed'}
                    {result.time && ` (${result.time}ms)`}
                  </div>
                )}
                {result.error && (
                  <div className="text-red-600">Error: {result.error}</div>
                )}
                {result.note && (
                  <div className="text-gray-600 italic">{result.note}</div>
                )}
                {result.authenticated !== undefined && (
                  <div>Authenticated: {result.authenticated ? 'Yes' : 'No'}</div>
                )}
                {result.userId && (
                  <div className="text-xs">User ID: {result.userId}</div>
                )}
                {result.count !== undefined && (
                  <div>Records found: {result.count}</div>
                )}
                {result.url && (
                  <div>
                    <div>Supabase URL: {result.url} ({result.urlLength} chars)</div>
                    <div>Supabase Key: {result.key} ({result.keyLength} chars)</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-semibold text-yellow-800">Quick Fixes to Try:</h4>
        <ul className="text-sm text-yellow-700 mt-1 space-y-1">
          <li>1. Run the SQL script in Supabase: <code>guided-workouts-complete-fix.sql</code></li>
          <li>2. Check RLS policies in Supabase Dashboard → Authentication → Policies</li>
          <li>3. Verify your internet connection</li>
          <li>4. Check Supabase service status</li>
          <li>5. Try creating minimal test data with the button above</li>
        </ul>
      </div>
    </div>
  );
};

export default DirectDatabaseTest;