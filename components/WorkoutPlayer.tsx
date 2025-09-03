import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkoutPlan, WorkoutDay, WorkoutDayExercise, Exercise, WorkoutPlayerState } from '../types';
import { guidedWorkoutService } from '../services/guidedWorkoutService';
import ExerciseTimer from './ExerciseTimer';
import PlayerControls from './PlayerControls';
import ProgressIndicator from './ProgressIndicator';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { useWakeLock } from '../hooks/useWakeLock';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import { useOrientation } from '../hooks/useOrientation';

interface WorkoutPlayerProps {
  currentUserId: string | null;
}

const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ currentUserId }) => {
  const { planId, dayId } = useParams<{ planId: string; dayId: string }>();
  const navigate = useNavigate();
  
  const [playerState, setPlayerState] = useState<WorkoutPlayerState | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [day, setDay] = useState<WorkoutDay | null>(null);
  const [exercises, setExercises] = useState<(WorkoutDayExercise & { exercise: Exercise })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStartOverlay, setShowStartOverlay] = useState(true);

  // Mobile optimizations
  const { requestWakeLock, releaseWakeLock, isSupported: wakeLockSupported } = useWakeLock();
  const orientation = useOrientation();
  
  // Swipe gesture handling
  const swipeRef = useSwipeGestures({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious,
  }, {
    threshold: 75,
    preventScroll: true
  });

  // Load workout data
  useEffect(() => {
    if (planId && dayId) {
      loadWorkoutData();
    }
  }, [planId, dayId]);

  // Request wake lock when workout starts
  useEffect(() => {
    if (playerState && !isLoading && !error && wakeLockSupported) {
      requestWakeLock();
    }
    
    return () => {
      releaseWakeLock();
    };
  }, [playerState, isLoading, error, wakeLockSupported, requestWakeLock, releaseWakeLock]);

  const loadWorkoutData = async () => {
    if (!planId || !dayId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load plan, day, and exercises
      const [planData, dayExercises] = await Promise.all([
        guidedWorkoutService.getWorkoutPlan(planId),
        guidedWorkoutService.getWorkoutDayExercises(dayId)
      ]);
      
      setPlan(planData);
      setExercises(dayExercises);
      
      // Find the specific day
      const days = await guidedWorkoutService.getWorkoutDays(planId);
      const currentDay = days.find(d => d.id === dayId);
      setDay(currentDay || null);
      
      // Initialize player state
      setPlayerState({
        planId,
        dayId,
        exercises: dayExercises,
        currentExerciseIndex: 0,
        isPlaying: false,
        isPaused: false,
        startTime: new Date()
      });
      
    } catch (err: any) {
      console.error('Error loading workout data:', err);
      setError(err.message || 'Failed to load workout data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = useCallback(() => {
    if (!playerState) return;
    setPlayerState(prev => prev ? { ...prev, isPlaying: true, isPaused: false } : null);
    setShowStartOverlay(false);
  }, [playerState]);

  const handlePause = useCallback(() => {
    if (!playerState) return;
    setPlayerState(prev => prev ? { ...prev, isPlaying: false, isPaused: true } : null);
  }, [playerState]);

  const handleNext = useCallback(() => {
    if (!playerState || !exercises.length) return;
    
    const nextIndex = playerState.currentExerciseIndex + 1;
    if (nextIndex < exercises.length) {
      setPlayerState(prev => prev ? { 
        ...prev, 
        currentExerciseIndex: nextIndex,
        isPlaying: false,
        isPaused: false 
      } : null);
    } else {
      // Workout complete
      handleWorkoutComplete();
    }
  }, [playerState, exercises]);

  const handlePrevious = useCallback(() => {
    if (!playerState) return;
    
    const prevIndex = playerState.currentExerciseIndex - 1;
    if (prevIndex >= 0) {
      setPlayerState(prev => prev ? { 
        ...prev, 
        currentExerciseIndex: prevIndex,
        isPlaying: false,
        isPaused: false 
      } : null);
    }
  }, [playerState]);

  const handleWorkoutComplete = async () => {
    if (!playerState || !currentUserId || !plan || !day) return;
    
    try {
      const duration = Math.round((new Date().getTime() - playerState.startTime.getTime()) / 60000);
      
      await guidedWorkoutService.recordWorkoutCompletion({
        user_id: currentUserId,
        plan_id: planId!,
        day_id: dayId!,
        duration_minutes: duration,
        exercises_completed: exercises.length,
        total_exercises: exercises.length
      });
      
      // Navigate to completion screen or back to plan
      navigate(`/guided-workouts/plan/${planId}`, { 
        state: { completedDay: day.day_number } 
      });
      
    } catch (error) {
      console.error('Error recording workout completion:', error);
      // Still navigate back even if recording fails
      navigate(`/guided-workouts/plan/${planId}`);
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit this workout? Your progress will not be saved.')) {
      navigate(`/guided-workouts/plan/${planId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <LoadingSpinner 
          size="lg" 
          message="Loading workout..." 
          fullScreen 
        />
      </div>
    );
  }

  if (error || !playerState || !plan || !day) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage
            title="Workout Loading Error"
            message={error || 'Workout not found. Please try again or select a different workout.'}
            onRetry={loadWorkoutData}
            onDismiss={() => navigate('/guided-workouts')}
          />
        </div>
      </div>
    );
  }

  const currentExercise = exercises[playerState.currentExerciseIndex];

  return (
    <div 
      ref={swipeRef}
      className={`workout-player no-bounce mobile-fullscreen min-h-screen bg-gray-900 text-white flex flex-col ${
        orientation.isLandscape ? 'landscape-mode' : 'portrait-mode'
      }`}
    >
      {/* Header */}
      <div className="workout-header bg-gray-800 p-4 flex items-center justify-between">
        <button 
          onClick={handleExit}
          className="touch-button text-gray-400 hover:text-white tap-target"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold">{plan.title}</h1>
          <p className="text-sm text-gray-400">Day {day.day_number}: {day.title}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {day.workout_type ? `${day.workout_type} • ` : ''}
            {day.total_duration_minutes ? `${day.total_duration_minutes} min total` : ''}
          </p>
          {wakeLockSupported && (
            <p className="text-xs text-green-400 mt-1">Screen will stay awake</p>
          )}
        </div>
        <div className="w-6" /> {/* Spacer */}
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator 
        currentIndex={playerState.currentExerciseIndex}
        totalExercises={exercises.length}
      />

      {/* Main Exercise Display */}
      <div className="exercise-display flex-1 flex flex-col items-center justify-center p-6 relative">
        {showStartOverlay && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10 p-6">
            <h2 className="text-2xl font-bold mb-4">Ready to start?</h2>
            <p className="text-gray-300 mb-6 text-center max-w-md">Follow each step. Timed exercises will run automatically. Swipe or tap Next to proceed.</p>
            <button onClick={handlePlay} className="btn-primary px-8 py-3 text-lg">START</button>
          </div>
        )}
        {currentExercise && (
          <>
            {/* Exercise Info */}
            <div className="exercise-info text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{currentExercise.exercise.name}</h2>
              <p className="text-xl text-gray-300 mb-4">
                {currentExercise.exercise.duration_seconds 
                  ? `${currentExercise.exercise.duration_seconds} seconds`
                  : `${currentExercise.exercise.reps} reps`
                }
              </p>
              {day?.sections && day.sections.length > 0 && (
                <p className="text-sm text-gray-400">
                  Sections: {day.sections.map(s => `${s.title} (${s.duration_minutes}m)`).join(' • ')}
                </p>
              )}
              <p className="text-gray-400 max-w-md">
                {currentExercise.exercise.instructions}
              </p>
            </div>

            {/* Exercise Visual */}
            <div className="exercise-visual w-64 h-64 bg-gray-800 rounded-lg mb-8 flex items-center justify-center overflow-hidden">
              {currentExercise.exercise.gif_url ? (
                <img 
                  src={currentExercise.exercise.gif_url} 
                  alt={currentExercise.exercise.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`text-center ${currentExercise.exercise.gif_url ? 'hidden' : ''}`}>
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-gray-500 text-sm">Exercise Demo</p>
              </div>
            </div>

            {/* Timer (for timed exercises) */}
            {currentExercise.exercise.duration_seconds && (
              <ExerciseTimer 
                duration={currentExercise.exercise.duration_seconds}
                isPlaying={playerState.isPlaying}
                onComplete={handleNext}
              />
            )}
          </>
        )}
      </div>

      {/* Player Controls */}
      <PlayerControls 
        isPlaying={playerState.isPlaying}
        isPaused={playerState.isPaused}
        canGoBack={playerState.currentExerciseIndex > 0}
        canGoNext={playerState.currentExerciseIndex < exercises.length - 1}
        isLastExercise={playerState.currentExerciseIndex === exercises.length - 1}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onComplete={handleWorkoutComplete}
      />
    </div>
  );
};

export default WorkoutPlayer;