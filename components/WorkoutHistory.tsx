import React, { useState, useEffect } from 'react';
import { WorkoutCompletion } from '../types';
import { guidedWorkoutService } from '../services/guidedWorkoutService';

interface WorkoutHistoryProps {
  currentUserId: string | null;
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ currentUserId }) => {
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(7); // Days

  useEffect(() => {
    if (currentUserId) {
      loadWorkoutHistory();
    }
  }, [currentUserId, selectedPeriod]);

  const loadWorkoutHistory = async () => {
    if (!currentUserId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const history = await guidedWorkoutService.getWorkoutHistory(currentUserId, selectedPeriod);
      setCompletions(history);
    } catch (err: any) {
      console.error('Error loading workout history:', err);
      setError(err.message || 'Failed to load workout history');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  // Calculate stats
  const totalWorkouts = completions.length;
  const totalMinutes = completions.reduce((sum, completion) => sum + completion.duration_minutes, 0);
  const totalExercises = completions.reduce((sum, completion) => sum + completion.exercises_completed, 0);
  const averageDuration = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;

  if (!currentUserId) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Workout History
        </h3>
        
        {/* Period Selector */}
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(Number(e.target.value))}
          className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 3 months</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalWorkouts}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Workouts
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {totalMinutes}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Minutes
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {totalExercises}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            Exercises
          </div>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {averageDuration}
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">
            Avg Min
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">Loading history...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={loadWorkoutHistory}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* History List */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {completions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No workouts yet
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Complete your first guided workout to see it here!
              </p>
            </div>
          ) : (
            completions.map((completion) => (
              <div key={completion.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  {/* Completion Icon */}
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  {/* Workout Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {(completion as any).workout_plan?.title || 'Workout'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(completion as any).workout_day?.title || `Day ${(completion as any).workout_day?.day_number || ''}`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDate(completion.completed_at)} at {formatTime(completion.completed_at)}
                    </p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {completion.duration_minutes} min
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {completion.exercises_completed}/{completion.total_exercises} exercises
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default WorkoutHistory;