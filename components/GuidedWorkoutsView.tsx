import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkoutPlan } from '../types';
import { guidedWorkoutService } from '../services/guidedWorkoutService';
import WorkoutHistory from './WorkoutHistory';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import DatabaseHealthCheck from './DatabaseHealthCheck';

interface GuidedWorkoutsViewProps {
  currentUserId: string | null;
}

const GuidedWorkoutsView: React.FC<GuidedWorkoutsViewProps> = ({ currentUserId }) => {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setTimeout(() => reject(new Error('Loading timeout - please check your internet connection and database setup')), 8000);
      });
      
      const loadPromise = guidedWorkoutService.getWorkoutPlans(currentUserId || undefined);
      
      const plans = await Promise.race([loadPromise, timeoutPromise]);
      console.log('✅ Loaded workout plans:', plans);
      setWorkoutPlans(plans);
    } catch (err: any) {
      console.error('❌ Error loading workout plans:', err);
      setError(err.message || 'Failed to load workout plans');
    } finally {
      setIsLoading(false);
    }
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

  if (error) {
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

        {/* Workout History */}
        <div className="mb-8">
          <WorkoutHistory currentUserId={currentUserId} />
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Debug Info:</h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Loading: {isLoading ? 'Yes' : 'No'} | 
            Error: {error || 'None'} | 
            Plans Count: {workoutPlans.length} |
            User ID: {currentUserId || 'None'}
          </p>
          {workoutPlans.length > 0 && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
              Plans: {workoutPlans.map(p => p.title).join(', ')}
            </p>
          )}
        </div>

        {/* Database Health Check */}
        <div className="mb-6">
          <DatabaseHealthCheck />
        </div>

        {/* Workout Plans Grid */}
        {workoutPlans.length === 0 ? (
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
              The database might need to be set up. Try the setup button below.
            </p>
            <div className="space-y-2">
              <button
                onClick={loadWorkoutPlans}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2"
              >
                Refresh Plans
              </button>
              <button
                onClick={() => window.open('/setup-database-browser.html', '_blank')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Setup Database
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              If this is your first time, click "Setup Database" to initialize the workout data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workoutPlans.map((plan) => (
              <WorkoutPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Workout Plan Card Component
interface WorkoutPlanCardProps {
  plan: WorkoutPlan;
}

const WorkoutPlanCard: React.FC<WorkoutPlanCardProps> = ({ plan }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/guided-workouts/plan/${plan.id}`);
  };

  const handleStartWorkout = async () => {
    try {
      // Get the first day of this workout plan
      const days = await guidedWorkoutService.getWorkoutDays(plan.id);
      if (days.length > 0) {
        navigate(`/guided-workouts/player/${plan.id}/${days[0].id}`);
      } else {
        // Fallback to details page if no days found
        navigate(`/guided-workouts/plan/${plan.id}`);
      }
    } catch (error) {
      console.error('Error starting workout:', error);
      // Fallback to details page on error
      navigate(`/guided-workouts/plan/${plan.id}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* Plan Image/Preview */}
      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1">
            {plan.title}
          </h3>
          {!plan.user_id && (
            <span className="bg-white bg-opacity-20 text-white text-xs font-medium px-2 py-1 rounded-full">
              Default Plan
            </span>
          )}
        </div>
        {/* Workout Icon */}
        <div className="absolute top-4 right-4">
          <svg className="w-8 h-8 text-white opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      {/* Plan Content */}
      <div className="p-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
          {plan.description}
        </p>

        {/* Plan Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {plan.duration_minutes}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Minutes
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {plan.total_exercises}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Exercises
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {plan.est_calories}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Calories
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button 
            onClick={handleViewDetails}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </button>
          <button 
            onClick={handleStartWorkout}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
            </svg>
            Start Workout
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuidedWorkoutsView;