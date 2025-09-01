import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkoutPlan } from '../types';
import { guidedWorkoutService } from '../services/guidedWorkoutService';
import WorkoutHistory from './WorkoutHistory';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import GuidedWorkoutsDebugger from './GuidedWorkoutsDebugger';
import QuickWorkoutTest from './QuickWorkoutTest';

interface GuidedWorkoutsViewProps {
  currentUserId: string | null;
}

const GuidedWorkoutsView: React.FC<GuidedWorkoutsViewProps> = ({ currentUserId }) => {
  const navigate = useNavigate();
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);

  useEffect(() => {
    loadWorkoutPlans();
  }, [currentUserId]);

  const loadWorkoutPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Loading workout plans for user:', currentUserId);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000);
      });
      
      const plansPromise = guidedWorkoutService.getWorkoutPlans(currentUserId || undefined);
      
      const plans = await Promise.race([plansPromise, timeoutPromise]);
      console.log('✅ Loaded workout plans:', plans);
      setWorkoutPlans(plans);
      
      // If no plans found, show setup instructions
      if (plans.length === 0) {
        setShowSetupInstructions(true);
      }
      
    } catch (err: any) {
      console.error('❌ Error loading workout plans:', err);
      setError(err.message || 'Failed to load workout plans');
      setShowSetupInstructions(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback workout plans if database is empty
  const fallbackPlans: WorkoutPlan[] = [
    {
      id: 'fallback-1',
      user_id: null,
      title: 'Quick Start Workout',
      description: 'A simple 10-minute workout to get you started',
      duration_minutes: 10,
      total_exercises: 4,
      est_calories: 80,
      created_at: new Date().toISOString()
    },
    {
      id: 'fallback-2',
      user_id: null,
      title: 'Bodyweight Basics',
      description: 'No equipment needed - just your body weight',
      duration_minutes: 15,
      total_exercises: 5,
      est_calories: 120,
      created_at: new Date().toISOString()
    }
  ];

  const handlePlanClick = (planId: string) => {
    // For fallback plans, show a message
    if (planId.startsWith('fallback-')) {
      alert('This is a demo plan. Please set up the database to access full workout functionality.');
      return;
    }
    
    navigate(`/guided-workouts/plan/${planId}`);
  };

  if (isLoading) {
    return (
      <LoadingSpinner 
        size="lg" 
        message="Loading workout plans..." 
        fullScreen 
      />
    );
  }

  if (error && !showSetupInstructions) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage
            title="Error Loading Workouts"
            message={error}
            onRetry={loadWorkoutPlans}
          />
        </div>
      </div>
    );
  }

  const plansToShow = workoutPlans.length > 0 ? workoutPlans : fallbackPlans;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Guided Workouts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose from professionally designed workout plans or create your own
          </p>
        </div>

        {/* Quick Test Panel */}
        <div className="mb-6">
          <QuickWorkoutTest />
        </div>

        {/* Debug Panel */}
        <div className="mb-6">
          <GuidedWorkoutsDebugger />
        </div>

        {/* Setup Instructions (if needed) */}
        {showSetupInstructions && (
          <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-bold text-yellow-800 mb-4">
              🛠️ Database Setup Required
            </h3>
            <p className="text-yellow-700 mb-4">
              It looks like the guided workouts database tables haven't been set up yet. 
              {workoutPlans.length === 0 ? ' Showing demo plans below.' : ''}
            </p>
            <div className="space-y-2">
              <p className="text-sm text-yellow-600">
                <strong>To set up guided workouts:</strong>
              </p>
              <ol className="list-decimal list-inside text-sm text-yellow-600 space-y-1">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to the SQL Editor</li>
                <li>Run the script: <code>database/guided-workouts-tables-and-data.sql</code></li>
                <li>Refresh this page</li>
              </ol>
            </div>
            <button
              onClick={() => setShowSetupInstructions(false)}
              className="mt-4 text-sm text-yellow-600 hover:text-yellow-800 underline"
            >
              Hide instructions
            </button>
          </div>
        )}

        {/* Workout History */}
        <div className="mb-8">
          <WorkoutHistory currentUserId={currentUserId} />
        </div>

        {/* Workout Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plansToShow.map((plan) => (
            <div
              key={plan.id}
              onClick={() => handlePlanClick(plan.id)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {plan.title}
                  </h3>
                  {plan.id.startsWith('fallback-') && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Demo
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  {plan.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {plan.duration_minutes} min
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {plan.est_calories} cal
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {plan.total_exercises} exercises
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State (if no plans and no fallback) */}
        {plansToShow.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No workout plans available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Set up the database to access guided workouts
            </p>
            <button
              onClick={() => setShowSetupInstructions(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Show Setup Instructions
            </button>
          </div>
        )}

        {/* Retry Button */}
        {error && (
          <div className="text-center mt-6">
            <button
              onClick={loadWorkoutPlans}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Retry Loading
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidedWorkoutsView;