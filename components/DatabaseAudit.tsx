import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';

interface AuditResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

const DatabaseAudit: React.FC = () => {
  const [results, setResults] = useState<AuditResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runDatabaseSetup = async () => {
    setIsLoading(true);
    setResults([]);
    const auditResults: AuditResult[] = [];

    // This would typically call a backend endpoint to run the setup script
    // For now, we'll show instructions
    auditResults.push({
      test: 'Database Setup',
      status: 'warning',
      message: 'To run database setup, copy the ensure-database-setup.sql script and run it in your Supabase SQL Editor',
      details: {
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy the contents of database/migrations/ensure-database-setup.sql',
          '4. Paste and run the script',
          '5. Re-run this audit to verify setup'
        ]
      }
    });

    setResults(auditResults);
    setIsLoading(false);
  };

  const runMealsTableFix = async () => {
    setIsLoading(true);
    setResults([]);
    const auditResults: AuditResult[] = [];

    auditResults.push({
      test: 'Meals Table Fix',
      status: 'warning',
      message: 'To fix the meals table user_id error, run the fix-meals-table.sql script',
      details: {
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy the contents of database/migrations/fix-meals-table.sql',
          '4. Paste and run the script',
          '5. This will add missing columns and fix the user_id issue',
          '6. Re-run this audit to verify the fix'
        ],
        error: 'ERROR: 42703: column "user_id" does not exist'
      }
    });

    setResults(auditResults);
    setIsLoading(false);
  };

  const runAudit = async () => {
    setIsLoading(true);
    setResults([]);
    const auditResults: AuditResult[] = [];

    // Test 1: Basic Connection
    try {
      console.log('🔍 Testing basic Supabase connection...');
      const { data, error } = await supabase.from('meals').select('count').limit(1);
      
      if (error) {
        auditResults.push({
          test: 'Basic Connection',
          status: 'error',
          message: `Connection failed: ${error.message}`,
          details: error
        });
      } else {
        auditResults.push({
          test: 'Basic Connection',
          status: 'success',
          message: 'Successfully connected to Supabase'
        });
      }
    } catch (err: any) {
      auditResults.push({
        test: 'Basic Connection',
        status: 'error',
        message: `Connection error: ${err.message}`,
        details: err
      });
    }

    // Test 2: Check if tables exist
    const tables = ['meals', 'workout_plans', 'workout_days', 'workout_day_exercises', 'workout_completions', 'user_profiles'];
    
    for (const table of tables) {
      try {
        console.log(`🔍 Checking table: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        
        if (error) {
          auditResults.push({
            test: `Table: ${table}`,
            status: 'error',
            message: `Table access failed: ${error.message}`,
            details: error
          });
        } else {
          auditResults.push({
            test: `Table: ${table}`,
            status: 'success',
            message: `Table accessible, ${data?.length || 0} records found`
          });
        }
      } catch (err: any) {
        auditResults.push({
          test: `Table: ${table}`,
          status: 'error',
          message: `Table error: ${err.message}`,
          details: err
        });
      }
    }

    // Test 3: Check RLS policies
    try {
      console.log('🔍 Checking RLS policies...');
      const { data, error } = await supabase.rpc('get_rls_policies');
      
      if (error) {
        auditResults.push({
          test: 'RLS Policies',
          status: 'warning',
          message: `Could not check RLS policies: ${error.message}`,
          details: error
        });
      } else {
        auditResults.push({
          test: 'RLS Policies',
          status: 'success',
          message: `RLS policies accessible, ${data?.length || 0} policies found`
        });
      }
    } catch (err: any) {
      auditResults.push({
        test: 'RLS Policies',
        status: 'warning',
        message: `RLS check error: ${err.message}`,
        details: err
      });
    }

    // Test 4: Check authentication
    try {
      console.log('🔍 Checking authentication...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        auditResults.push({
          test: 'Authentication',
          status: 'error',
          message: `Auth error: ${error.message}`,
          details: error
        });
      } else if (user) {
        auditResults.push({
          test: 'Authentication',
          status: 'success',
          message: `User authenticated: ${user.email}`,
          details: { userId: user.id, email: user.email }
        });
      } else {
        auditResults.push({
          test: 'Authentication',
          status: 'warning',
          message: 'No user authenticated'
        });
      }
    } catch (err: any) {
      auditResults.push({
        test: 'Authentication',
        status: 'error',
        message: `Auth check error: ${err.message}`,
        details: err
      });
    }

    // Test 5: Check specific queries that are failing
    try {
      console.log('🔍 Testing specific failing queries...');
      
      // Test meals query
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select('id, mealname, calories')
        .limit(5);
      
      if (mealsError) {
        auditResults.push({
          test: 'Meals Query',
          status: 'error',
          message: `Meals query failed: ${mealsError.message}`,
          details: mealsError
        });
      } else {
        auditResults.push({
          test: 'Meals Query',
          status: 'success',
          message: `Meals query successful, ${mealsData?.length || 0} records`
        });
      }

      // Test workout plans query
      const { data: plansData, error: plansError } = await supabase
        .from('workout_plans')
        .select('id, title, description')
        .limit(5);
      
      if (plansError) {
        auditResults.push({
          test: 'Workout Plans Query',
          status: 'error',
          message: `Workout plans query failed: ${plansError.message}`,
          details: plansError
        });
      } else {
        auditResults.push({
          test: 'Workout Plans Query',
          status: 'success',
          message: `Workout plans query successful, ${plansData?.length || 0} records`
        });
      }

    } catch (err: any) {
      auditResults.push({
        test: 'Specific Queries',
        status: 'error',
        message: `Query test error: ${err.message}`,
        details: err
      });
    }

    setResults(auditResults);
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🔍 Supabase Database Audit
          </h1>
          
          <div className="mb-6 flex gap-4 flex-wrap">
            <button
              onClick={runAudit}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Running Audit...' : 'Run Database Audit'}
            </button>
            <button
              onClick={runDatabaseSetup}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Setting Up...' : 'Run Database Setup'}
            </button>
            <button
              onClick={runMealsTableFix}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Fixing...' : 'Fix Meals Table'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Audit Results
              </h2>
              
              {results.map((result, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {getStatusIcon(result.status)} {result.test}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(result.status)}`}>
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {result.message}
                  </p>
                  
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Troubleshooting Tips
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Column "user_id" does not exist:</strong> Run the "Fix Meals Table" button above</li>
              <li>• Check if your Supabase project is active and not paused</li>
              <li>• Verify your environment variables are correct</li>
              <li>• Check if RLS policies are blocking access</li>
              <li>• Ensure your database tables exist and have proper schema</li>
              <li>• Check Supabase dashboard for any service issues</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseAudit;
