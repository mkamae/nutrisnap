import React, { useState, useEffect } from 'react';
import { DemoWorkout } from '../types';
import { demoWorkoutService } from '../services/supabaseService';
import { trackPageView, trackEngagementEvent } from '../utils/analytics';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface GuidedWorkoutsViewProps {
  currentUserId: string | null;
}

interface WorkoutSession {
  id: string;
  title: string;
  duration: string;
  category: string;
  exercises: DemoWorkout[];
  totalDuration: number;
}

const GuidedWorkoutsView: React.FC<GuidedWorkoutsViewProps> = ({ currentUserId }) => {
  const [workouts, setWorkouts] = useState<DemoWorkout[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkouts();
    // Track page view
    trackPageView('NutriSnap - Workout Sessions', window.location.href);
  }, []);

  const loadWorkouts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Loading programmed workouts...');
      
      const data = await demoWorkoutService.getDemoWorkouts();
      console.log('✅ Loaded workouts:', data);
      setWorkouts(data);
      
      // Group exercises into time-based sessions
      const groupedSessions = createWorkoutSessions(data);
      setSessions(groupedSessions);
      
    } catch (err: any) {
      console.error('❌ Error loading workouts:', err);
      setError(err.message || 'Failed to load workouts');
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkoutSessions = (exercises: DemoWorkout[]): WorkoutSession[] => {
    const sessions: WorkoutSession[] = [];
    
    // Group exercises by category
    const groupedByCategory = exercises.reduce((acc, exercise) => {
      const category = exercise.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(exercise);
      return acc;
    }, {} as Record<string, DemoWorkout[]>);

    // Create sessions for each category
    Object.entries(groupedByCategory).forEach(([category, categoryExercises]) => {
      // Calculate total duration for the session
      const totalDuration = categoryExercises.reduce((total, exercise) => {
        if (exercise.duration_seconds) {
          return total + exercise.duration_seconds;
        }
        // Estimate 30 seconds per rep-based exercise
        if (exercise.reps && exercise.sets) {
          return total + (exercise.reps * exercise.sets * 30);
        }
        return total + 60; // Default 1 minute
      }, 0);

      const durationMinutes = Math.round(totalDuration / 60);
      
      sessions.push({
        id: `session-${category}`,
        title: `${durationMinutes}-min ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        duration: `${durationMinutes} min`,
        category: category,
        exercises: categoryExercises,
        totalDuration: totalDuration
      });
    });

    // Sort sessions by duration (shortest first)
    return sessions.sort((a, b) => a.totalDuration - b.totalDuration);
  };

  const handleSessionClick = (session: WorkoutSession) => {
    setSelectedSession(session);
    // Track workout session view
    trackEngagementEvent('view', `workout_session_${session.category}`);
  };

  const handleBackClick = () => {
    setSelectedSession(null);
  };

  if (isLoading) {
    return (
      <LoadingSpinner 
        size="lg" 
        message="Loading workout sessions..." 
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

  // Show detailed workout plan
  if (selectedSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with back button */}
          <div className="mb-6">
            <button
              onClick={handleBackClick}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Sessions
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {selectedSession.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                {selectedSession.category}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {selectedSession.duration}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {selectedSession.exercises.length} exercises
              </span>
            </div>
          </div>

          {/* Exercise List */}
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {selectedSession.exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium px-2 py-1 rounded mr-3">
                        {index + 1}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {exercise.name}
                      </h3>
                    </div>
                    {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {exercise.muscle_groups.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Exercise Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {exercise.sets && (
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{exercise.sets} sets</span>
                    </div>
                  )}
                  {exercise.reps && (
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="font-medium">{exercise.reps} reps</span>
                    </div>
                  )}
                  {exercise.duration_seconds && (
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{Math.round(exercise.duration_seconds / 60)} min</span>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                {exercise.instructions && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Instructions</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {exercise.instructions}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
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
            Workout Sessions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a time-based workout session designed for your fitness level
          </p>
        </div>

        {/* Sessions Grid */}
        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSessionClick(session)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {session.title}
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                    {session.category}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {session.duration}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {session.exercises.length} exercises
                  </div>
                </div>

                {/* Exercise Preview */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Exercises:</p>
                  <div className="flex flex-wrap gap-1">
                    {session.exercises.slice(0, 3).map((exercise) => (
                      <span
                        key={exercise.id}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                      >
                        {exercise.name}
                      </span>
                    ))}
                    {session.exercises.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                        +{session.exercises.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
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
              Check back later for new workout sessions
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