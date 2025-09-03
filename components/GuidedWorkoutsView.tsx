import React, { useState, useEffect } from 'react';
import { DemoWorkout } from '../types';
import { demoWorkoutService } from '../services/supabaseService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface GuidedWorkoutsViewProps {
  currentUserId: string | null;
}

const GuidedWorkoutsView: React.FC<GuidedWorkoutsViewProps> = ({ currentUserId }) => {
  const [workouts, setWorkouts] = useState<DemoWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Loading programmed workouts...');
      
      const data = await demoWorkoutService.getDemoWorkouts();
      console.log('✅ Loaded workouts:', data);
      setWorkouts(data);
      
    } catch (err: any) {
      console.error('❌ Error loading workouts:', err);
      setError(err.message || 'Failed to load workouts');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingSpinner 
        size="lg" 
        message="Loading programmed workouts..." 
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
            onRetry={loadWorkouts}
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
            Programmed Workouts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ready-to-use workout routines designed for your fitness goals
          </p>
        </div>

        {/* Workouts List */}
        {workouts.length > 0 ? (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {workout.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                        {workout.category}
                      </span>
                      {workout.muscle_groups && workout.muscle_groups.length > 0 && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {workout.muscle_groups.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Exercise Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {workout.sets && (
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{workout.sets} sets</span>
                    </div>
                  )}
                  {workout.reps && (
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="font-medium">{workout.reps} reps</span>
                    </div>
                  )}
                  {workout.duration_seconds && (
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{Math.round(workout.duration_seconds / 60)} min</span>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                {workout.instructions && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Instructions</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {workout.instructions}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No programmed workouts available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Check back later for new workout routines
            </p>
            <button
              onClick={loadWorkouts}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidedWorkoutsView;