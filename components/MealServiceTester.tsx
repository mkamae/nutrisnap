import React, { useState } from 'react';
import { supabase, mealService } from '../services/supabaseService';
import { MealEntry } from '../types';

const MealServiceTester: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);

  const runMealServiceTests = async () => {
    setIsRunning(true);
    const results: any = {};
    
    try {
      console.log('🧪 Running meal service tests...');
      
      // Test 1: Check if meals table exists
      console.log('Test 1: Check meals table');
      try {
        const { data: tableCheck, error: tableError } = await supabase
          .from('meals')
          .select('count')
          .limit(1);
        
        results.tableExists = {
          success: !tableError,
          error: tableError?.message
        };
      } catch (err: any) {
        results.tableExists = { success: false, error: err.message };
      }

      // Test 2: Check authentication
      console.log('Test 2: Check authentication');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      results.auth = {
        authenticated: !!user,
        userId: user?.id,
        error: authError?.message
      };

      // Test 3: Test direct insert to meals table
      console.log('Test 3: Direct insert test');
      if (user) {
        try {
          const testMealData = {
            mealname: 'Test Meal Direct',
            portionsize: '1 serving',
            imageurl: 'data:image/png;base64,test',
            calories: 100,
            protein: 10,
            carbs: 15,
            fat: 5,
            date: new Date().toISOString().split('T')[0],
            user_id: user.id
          };

          const { data: directInsert, error: directError } = await supabase
            .from('meals')
            .insert([testMealData])
            .select()
            .single();

          results.directInsert = {
            success: !directError,
            error: directError?.message,
            data: directInsert
          };

          // Clean up the test meal
          if (directInsert) {
            await supabase.from('meals').delete().eq('id', directInsert.id);
          }
        } catch (err: any) {
          results.directInsert = { success: false, error: err.message };
        }
      } else {
        results.directInsert = { success: false, error: 'No user authenticated' };
      }

      // Test 4: Test mealService.addMeal
      console.log('Test 4: mealService.addMeal test');
      if (user) {
        try {
          const testMeal: Omit<MealEntry, 'id' | 'created_at'> = {
            mealName: 'Test Meal Service',
            portionSize: '1 serving',
            imageUrl: 'data:image/png;base64,test',
            calories: 200,
            protein: 20,
            carbs: 25,
            fat: 10,
            date: new Date().toISOString().split('T')[0]
          };

          const savedMeal = await mealService.addMeal(testMeal, user.id);
          
          results.mealService = {
            success: true,
            data: savedMeal
          };

          // Clean up the test meal
          if (savedMeal) {
            await supabase.from('meals').delete().eq('id', savedMeal.id);
          }
        } catch (err: any) {
          results.mealService = { success: false, error: err.message };
        }
      } else {
        results.mealService = { success: false, error: 'No user authenticated' };
      }

      // Test 5: Check RLS policies
      console.log('Test 5: Check RLS policies');
      try {
        const { data: rlsTest, error: rlsError } = await supabase
          .from('meals')
          .select('*')
          .limit(1);
        
        results.rlsPolicies = {
          success: !rlsError,
          error: rlsError?.message,
          canRead: !!rlsTest
        };
      } catch (err: any) {
        results.rlsPolicies = { success: false, error: err.message };
      }

      // Test 6: Check existing meals count
      console.log('Test 6: Check existing meals');
      if (user) {
        try {
          const { data: existingMeals, error: existingError } = await supabase
            .from('meals')
            .select('*')
            .eq('user_id', user.id);
          
          results.existingMeals = {
            success: !existingError,
            error: existingError?.message,
            count: existingMeals?.length || 0
          };
        } catch (err: any) {
          results.existingMeals = { success: false, error: err.message };
        }
      }

    } catch (error: any) {
      results.generalError = error.message;
    }
    
    console.log('🔍 Meal service test results:', results);
    setTestResults(results);
    setIsRunning(false);
  };

  const createMealsTable = async () => {
    setIsRunning(true);
    try {
      // This would need to be run in Supabase SQL editor
      const sqlScript = `
-- Create meals table if it doesn't exist
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  mealname text NOT NULL,
  portionsize text NOT NULL,
  imageurl text,
  calories integer NOT NULL CHECK (calories >= 0),
  protein numeric NOT NULL CHECK (protein >= 0),
  carbs numeric NOT NULL CHECK (carbs >= 0),
  fat numeric NOT NULL CHECK (fat >= 0),
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own meals" 
  ON meals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals" 
  ON meals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals" 
  ON meals FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals" 
  ON meals FOR DELETE 
  USING (auth.uid() = user_id);
      `;

      alert(`Please run this SQL in Supabase SQL Editor:\n\n${sqlScript}`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg">
      <h3 className="text-lg font-bold text-orange-800 mb-4">
        🍽️ Meal Service Tester
      </h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={runMealServiceTests}
          disabled={isRunning}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
        >
          {isRunning ? 'Testing...' : 'Test Meal Service'}
        </button>
        
        <button
          onClick={createMealsTable}
          disabled={isRunning}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          Setup Meals Table
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-3">
          {Object.entries(testResults).map(([testName, result]: [string, any]) => (
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
                {result.authenticated !== undefined && (
                  <div>Authenticated: {result.authenticated ? 'Yes' : 'No'}</div>
                )}
                {result.userId && (
                  <div className="text-xs">User ID: {result.userId}</div>
                )}
                {result.count !== undefined && (
                  <div>Count: {result.count}</div>
                )}
                {result.canRead !== undefined && (
                  <div>Can Read: {result.canRead ? 'Yes' : 'No'}</div>
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

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-semibold text-blue-800">Common Issues:</h4>
        <ul className="text-sm text-blue-700 mt-1 space-y-1">
          <li>• Meals table doesn't exist or has wrong structure</li>
          <li>• RLS policies are blocking inserts</li>
          <li>• User not authenticated properly</li>
          <li>• Column name mismatches (mealname vs meal_name)</li>
        </ul>
      </div>
    </div>
  );
};

export default MealServiceTester;