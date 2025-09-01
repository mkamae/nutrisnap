import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';

const DatabaseDebug: React.FC = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('workout_plans')
        .select('count')
        .limit(1);

      // Get table counts
      const { data: planCount, error: planError } = await supabase
        .from('workout_plans')
        .select('*', { count: 'exact', head: true });

      const { data: exerciseCount, error: exerciseError } = await supabase
        .from('exercises')
        .select('*', { count: 'exact', head: true });

      const { data: dayCount, error: dayError } = await supabase
        .from('workout_days')
        .select('*', { count: 'exact', head: true });

      // Get sample data
      const { data: samplePlans, error: sampleError } = await supabase
        .from('workout_plans')
        .select('*')
        .limit(5);

      setResults({
        connection: connectionError ? `Error: ${connectionError.message}` : 'Connected successfully',
        planCount: planError ? `Error: ${planError.message}` : planCount?.length || 0,
        exerciseCount: exerciseError ? `Error: ${exerciseError.message}` : exerciseCount?.length || 0,
        dayCount: dayError ? `Error: ${dayError.message}` : dayCount?.length || 0,
        samplePlans: sampleError ? `Error: ${sampleError.message}` : samplePlans,
        errors: {
          connection: connectionError,
          plans: planError,
          exercises: exerciseError,
          days: dayError,
          sample: sampleError
        }
      });
    } catch (error: any) {
      setResults({
        error: `Unexpected error: ${error.message}`,
        fullError: error
      });
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Database Debug Tool
      </h2>
      
      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? 'Testing...' : 'Test Database Connection'}
      </button>

      {results && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Connection Status</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">{results.connection}</p>
          </div>

          {results.planCount !== undefined && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Table Counts</h3>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>Workout Plans: {results.planCount}</li>
                <li>Exercises: {results.exerciseCount}</li>
                <li>Workout Days: {results.dayCount}</li>
              </ul>
            </div>
          )}

          {results.samplePlans && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Sample Workout Plans</h3>
              <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto">
                {JSON.stringify(results.samplePlans, null, 2)}
              </pre>
            </div>
          )}

          {results.errors && Object.values(results.errors).some(e => e) && (
            <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-red-900 dark:text-red-100">Errors</h3>
              <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto">
                {JSON.stringify(results.errors, null, 2)}
              </pre>
            </div>
          )}

          {results.error && (
            <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-red-900 dark:text-red-100">Unexpected Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{results.error}</p>
              {results.fullError && (
                <pre className="text-xs text-red-700 dark:text-red-300 mt-2 overflow-auto">
                  {JSON.stringify(results.fullError, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseDebug;