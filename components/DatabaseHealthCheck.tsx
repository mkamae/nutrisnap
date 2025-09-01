import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';

const DatabaseHealthCheck: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runHealthCheck = async () => {
    setIsChecking(true);
    const healthResults: any = {};
    
    try {
      // Test 1: Basic connection
      console.log('Testing basic connection...');
      const startTime = Date.now();
      const { data: connectionTest, error: connectionError } = await supabase
        .from('workout_plans')
        .select('count')
        .limit(1);
      
      const connectionTime = Date.now() - startTime;
      
      healthResults.connection = {
        success: !connectionError,
        error: connectionError?.message,
        responseTime: connectionTime
      };

      // Test 2: Check if tables have data
      if (!connectionError) {
        console.log('Checking table data...');
        
        const { data: plans } = await supabase.from('workout_plans').select('*').is('user_id', null);
        const { data: exercises } = await supabase.from('exercises').select('*');
        const { data: days } = await supabase.from('workout_days').select('*');
        const { data: dayExercises } = await supabase.from('workout_day_exercises').select('*');
        
        healthResults.data = {
          workout_plans: plans?.length || 0,
          exercises: exercises?.length || 0,
          workout_days: days?.length || 0,
          workout_day_exercises: dayExercises?.length || 0
        };
      }

      // Test 3: Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      healthResults.auth = {
        authenticated: !!user,
        userId: user?.id
      };

      // Test 4: Test RLS policies
      if (!connectionError) {
        console.log('Testing RLS policies...');
        const { data: publicPlans, error: rlsError } = await supabase
          .from('workout_plans')
          .select('*')
          .is('user_id', null);
        
        healthResults.rls = {
          success: !rlsError,
          error: rlsError?.message,
          canAccessPublicPlans: !!publicPlans && publicPlans.length > 0
        };
      }

    } catch (error: any) {
      healthResults.generalError = error.message;
    }
    
    setResults(healthResults);
    setIsChecking(false);
  };

  const setupDatabase = async () => {
    try {
      setIsChecking(true);
      
      // Run the setup SQL commands
      console.log('Setting up database...');
      
      // This would ideally run the SQL setup, but we'll provide instructions instead
      alert('Please run the SQL script "guided-workouts-complete-fix.sql" in your Supabase SQL editor to set up the database.');
      
    } catch (error) {
      console.error('Setup error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        🏥 Database Health Check
      </h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={runHealthCheck}
          disabled={isChecking}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Run Health Check'}
        </button>
        
        <button
          onClick={setupDatabase}
          disabled={isChecking}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Setup Instructions
        </button>
      </div>

      {results && (
        <div className="space-y-4">
          {/* Connection Test */}
          <div className="p-3 border rounded">
            <h4 className="font-semibold">Connection Test</h4>
            <div className={results.connection?.success ? 'text-green-600' : 'text-red-600'}>
              {results.connection?.success ? '✅' : '❌'} 
              {results.connection?.success 
                ? `Connected (${results.connection.responseTime}ms)` 
                : `Failed: ${results.connection?.error}`
              }
            </div>
          </div>

          {/* Data Check */}
          {results.data && (
            <div className="p-3 border rounded">
              <h4 className="font-semibold">Data Check</h4>
              <div className="text-sm space-y-1">
                <div>Workout Plans: {results.data.workout_plans}</div>
                <div>Exercises: {results.data.exercises}</div>
                <div>Workout Days: {results.data.workout_days}</div>
                <div>Day Exercises: {results.data.workout_day_exercises}</div>
              </div>
              {Object.values(results.data).every((count: any) => count === 0) && (
                <div className="text-red-600 mt-2">
                  ⚠️ No data found - database needs to be set up
                </div>
              )}
            </div>
          )}

          {/* Auth Check */}
          <div className="p-3 border rounded">
            <h4 className="font-semibold">Authentication</h4>
            <div className={results.auth?.authenticated ? 'text-green-600' : 'text-yellow-600'}>
              {results.auth?.authenticated ? '✅' : '⚠️'} 
              {results.auth?.authenticated 
                ? `Logged in as ${results.auth.userId}` 
                : 'Not authenticated'
              }
            </div>
          </div>

          {/* RLS Check */}
          {results.rls && (
            <div className="p-3 border rounded">
              <h4 className="font-semibold">Row Level Security</h4>
              <div className={results.rls?.success ? 'text-green-600' : 'text-red-600'}>
                {results.rls?.success ? '✅' : '❌'} 
                {results.rls?.success 
                  ? `RLS working, can access public plans: ${results.rls.canAccessPublicPlans}` 
                  : `RLS Error: ${results.rls?.error}`
                }
              </div>
            </div>
          )}

          {/* General Error */}
          {results.generalError && (
            <div className="p-3 border border-red-200 bg-red-50 rounded">
              <h4 className="font-semibold text-red-800">General Error</h4>
              <div className="text-red-600">{results.generalError}</div>
            </div>
          )}

          {/* Recommendations */}
          <div className="p-3 border border-blue-200 bg-blue-50 rounded">
            <h4 className="font-semibold text-blue-800">Recommendations</h4>
            <div className="text-blue-700 text-sm space-y-1">
              {!results.connection?.success && (
                <div>• Check your internet connection and Supabase credentials</div>
              )}
              {results.data && Object.values(results.data).every((count: any) => count === 0) && (
                <div>• Run the database setup SQL script to populate data</div>
              )}
              {results.rls && !results.rls.success && (
                <div>• Check RLS policies in Supabase dashboard</div>
              )}
              {!results.auth?.authenticated && (
                <div>• Make sure you are logged in to the app</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseHealthCheck;