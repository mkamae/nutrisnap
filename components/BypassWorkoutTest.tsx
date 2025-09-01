import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';

const BypassWorkoutTest: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDirectQuery = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Testing direct Supabase query...');
      
      // Bypass all service logic - direct query
      const startTime = Date.now();
      
      const { data, error: queryError } = await supabase
        .from('workout_plans')
        .select(`
          id,
          title,
          description,
          duration_minutes,
          total_exercises,
          est_calories,
          user_id,
          created_at
        `)
        .is('user_id', null)
        .limit(10);
      
      const queryTime = Date.now() - startTime;
      
      console.log(`⏱️ Query completed in ${queryTime}ms`);
      
      if (queryError) {
        console.error('❌ Direct query error:', queryError);
        setError(`Direct query failed: ${queryError.message}`);
        return;
      }
      
      console.log('✅ Direct query success:', data);
      setPlans(data || []);
      
      if (!data || data.length === 0) {
        setError('No workout plans found in database. Database may be empty.');
      }
      
    } catch (error: any) {
      console.error('❌ Bypass test error:', error);
      setError(`Test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestPlan = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .insert({
          user_id: null,
          title: `Test Plan ${Date.now()}`,
          description: 'Created by bypass test',
          duration_minutes: 10,
          total_exercises: 2,
          est_calories: 50
        })
        .select()
        .single();

      if (error) {
        setError(`Failed to create test plan: ${error.message}`);
      } else {
        console.log('✅ Test plan created:', data);
        // Refresh the list
        await testDirectQuery();
      }
    } catch (error: any) {
      setError(`Create test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-bold text-blue-800 mb-4">
        🔧 Bypass Service Test
      </h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={testDirectQuery}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Direct Query'}
        </button>
        
        <button
          onClick={createTestPlan}
          disabled={isLoading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Create Test Plan
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded mb-4">
          <div className="text-red-800 font-semibold">Error:</div>
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {plans.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-blue-800">Found {plans.length} workout plans:</h4>
          {plans.map((plan) => (
            <div key={plan.id} className="p-3 bg-white border rounded">
              <div className="font-medium">{plan.title}</div>
              <div className="text-sm text-gray-600">{plan.description}</div>
              <div className="text-xs text-gray-500">
                {plan.duration_minutes}min • {plan.total_exercises} exercises • {plan.est_calories} cal
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && plans.length === 0 && !error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-yellow-800">
            No plans loaded yet. Click "Test Direct Query" to check the database.
          </div>
        </div>
      )}
    </div>
  );
};

export default BypassWorkoutTest;