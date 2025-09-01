import React, { useState } from 'react';
import { guidedWorkoutService } from '../services/guidedWorkoutService';

const QuickWorkoutTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testWorkouts = async () => {
    setIsLoading(true);
    setResult('Testing workout database...\n');
    
    try {
      // Test 1: Get workout plans
      console.log('🔍 Testing getWorkoutPlans...');
      const plans = await guidedWorkoutService.getWorkoutPlans();
      setResult(prev => prev + `✅ Found ${plans.length} workout plans\n`);
      
      if (plans.length > 0) {
        const plan = plans[0];
        setResult(prev => prev + `📋 First plan: "${plan.title}" - ${plan.description}\n`);
        
        // Test 2: Get workout days
        console.log('🔍 Testing getWorkoutDays...');
        const days = await guidedWorkoutService.getWorkoutDays(plan.id);
        setResult(prev => prev + `✅ Found ${days.length} workout days for plan\n`);
        
        if (days.length > 0) {
          const day = days[0];
          setResult(prev => prev + `📅 First day: "${day.title}"\n`);
          
          // Test 3: Get day exercises
          console.log('🔍 Testing getWorkoutDayExercises...');
          const exercises = await guidedWorkoutService.getWorkoutDayExercises(day.id);
          setResult(prev => prev + `✅ Found ${exercises.length} exercises for day\n`);
          
          exercises.forEach((ex, index) => {
            const target = ex.exercise.duration_seconds 
              ? `${ex.exercise.duration_seconds}s` 
              : `${ex.exercise.reps} reps`;
            setResult(prev => prev + `  ${index + 1}. ${ex.exercise.name} (${target})\n`);
          });
        }
      }
      
      setResult(prev => prev + '\n🎉 All tests passed! Guided workouts should work now.\n');
      
    } catch (error: any) {
      console.error('❌ Test failed:', error);
      setResult(prev => prev + `❌ Error: ${error.message}\n`);
      
      if (error.message.includes('table') || error.message.includes('relation')) {
        setResult(prev => prev + '\n💡 This error suggests the database tables don\'t exist yet.\n');
        setResult(prev => prev + '📝 Please run the SQL setup script in Supabase:\n');
        setResult(prev => prev + '   1. Go to Supabase Dashboard > SQL Editor\n');
        setResult(prev => prev + '   2. Copy/paste: database/guided-workouts-simple-setup.sql\n');
        setResult(prev => prev + '   3. Click "Run" to execute\n');
        setResult(prev => prev + '   4. Refresh this page and test again\n');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
      <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-3">
        🧪 Quick Workout Test
      </h3>
      
      <button
        onClick={testWorkouts}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 mb-3"
      >
        {isLoading ? '⏳ Testing...' : '🚀 Test Workouts'}
      </button>

      {result && (
        <div className="bg-white dark:bg-gray-800 p-3 rounded border">
          <pre className="text-sm whitespace-pre-wrap font-mono">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default QuickWorkoutTest;