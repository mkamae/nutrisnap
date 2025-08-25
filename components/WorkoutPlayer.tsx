import React, { useState, useEffect, useRef } from 'react';
import { View, WorkoutPlanWithDays, WorkoutDayWithExercises, ExerciseWithCustomization } from '../types';
import { guidedWorkoutService } from '../services/guidedWorkoutService';
import { PlayIcon, PauseIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon, XIcon } from './icons';

interface WorkoutPlayerProps {
  setCurrentView: (view: View) => void;
  currentUserId?: string;
  planId?: string;
}

const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ 
  setCurrentView, 
  currentUserId,
  planId = 'default' // You can pass a specific plan ID
}) => {
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlanWithDays | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRest, setIsRest] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadWorkoutPlan();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [planId]);

  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleExerciseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, timeRemaining]);

  const loadWorkoutPlan = async () => {
    try {
      setLoading(true);
      // For demo purposes, we'll use a mock plan
      // In production, you'd fetch the actual plan using planId
      const mockPlan: WorkoutPlanWithDays = {
        id: 'demo-plan',
        title: '7-Day Beginner Fitness',
        description: 'Perfect for fitness newcomers',
        duration_minutes: 20,
        total_exercises: 35,
        est_calories: 120,
        difficulty_level: 'beginner',
        category: 'mixed',
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        days: [
          {
            id: 'day-1',
            plan_id: 'demo-plan',
            day_number: 1,
            day_title: 'Upper Body Focus',
            rest_day: false,
            created_at: new Date().toISOString(),
            exercises: [
              {
                id: 'ex-1',
                day_id: 'day-1',
                exercise_id: 'push-ups',
                sort_order: 1,
                custom_reps: 8,
                custom_sets: 3,
                rest_seconds: 60,
                created_at: new Date().toISOString(),
                exercise: {
                  id: 'push-ups',
                  name: 'Push-ups',
                  category: 'strength',
                  reps: 10,
                  sets: 3,
                  instructions: 'Start in plank position, lower body until chest nearly touches ground, then push back up',
                  muscle_groups: ['chest', 'triceps', 'shoulders'],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              },
              {
                id: 'ex-2',
                day_id: 'day-1',
                exercise_id: 'plank',
                sort_order: 2,
                custom_duration_seconds: 30,
                custom_sets: 3,
                rest_seconds: 45,
                created_at: new Date().toISOString(),
                exercise: {
                  id: 'plank',
                  name: 'Plank',
                  category: 'core',
                  duration_seconds: 30,
                  sets: 3,
                  instructions: 'Hold body in straight line from head to heels, engaging core muscles',
                  muscle_groups: ['core', 'shoulders'],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              }
            ]
          }
        ]
      };
      
      setCurrentPlan(mockPlan);
      startExercise();
    } catch (error) {
      console.error('Error loading workout plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const startExercise = () => {
    if (!currentPlan || currentDayIndex >= currentPlan.days.length) return;
    
    const currentDay = currentPlan.days[currentDayIndex];
    if (currentExerciseIndex >= currentDay.exercises.length) return;

    const exercise = currentDay.exercises[currentExerciseIndex];
    const duration = exercise.custom_duration_seconds || exercise.exercise?.duration_seconds || 30;
    
    setTimeRemaining(duration);
    setIsRest(false);
    setIsPlaying(true);
  };

  const handleExerciseComplete = () => {
    if (!currentPlan) return;
    
    const currentDay = currentPlan.days[currentDayIndex];
    const exercise = currentDay.exercises[currentExerciseIndex];
    
    // Mark exercise as completed
    setCompletedExercises(prev => new Set(prev).add(exercise.id));
    
    // Start rest period
    setIsRest(true);
    setTimeRemaining(exercise.rest_seconds || 60);
    
    // Log completion to database
    if (currentUserId && exercise.exercise) {
      guidedWorkoutService.logExerciseCompletion({
        user_id: currentUserId,
        plan_id: currentPlan.id,
        day_id: currentDay.id,
        exercise_id: exercise.exercise.id,
        actual_duration_seconds: exercise.custom_duration_seconds || exercise.exercise.duration_seconds,
        actual_reps: exercise.custom_reps || exercise.exercise.reps,
        actual_sets: exercise.custom_sets || exercise.exercise.sets
      }).catch(console.error);
    }
  };

  const nextExercise = () => {
    if (!currentPlan) return;
    
    const currentDay = currentPlan.days[currentDayIndex];
    
    if (currentExerciseIndex < currentDay.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      startExercise();
    } else if (currentDayIndex < currentPlan.days.length - 1) {
      setCurrentDayIndex(prev => prev + 1);
      setCurrentExerciseIndex(0);
      startExercise();
    } else {
      // Workout complete!
      handleWorkoutComplete();
    }
  };

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      startExercise();
    } else if (currentDayIndex > 0) {
      setCurrentDayIndex(prev => prev - 1);
      const previousDay = currentPlan?.days[currentDayIndex - 1];
      if (previousDay) {
        setCurrentExerciseIndex(previousDay.exercises.length - 1);
        startExercise();
      }
    }
  };

  const handleWorkoutComplete = () => {
    setIsPlaying(false);
    setTimeRemaining(0);
    // You could show a completion modal or navigate to a results page
    alert('Congratulations! Workout completed! 🎉');
    setCurrentView('guided_workouts');
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentExercise = (): ExerciseWithCustomization | null => {
    if (!currentPlan || currentDayIndex >= currentPlan.days.length) return null;
    
    const currentDay = currentPlan.days[currentDayIndex];
    if (currentExerciseIndex >= currentDay.exercises.length) return null;
    
    const dayExercise = currentDay.exercises[currentExerciseIndex];
    if (!dayExercise.exercise) return null;
    
    return {
      ...dayExercise.exercise,
      custom_duration_seconds: dayExercise.custom_duration_seconds,
      custom_reps: dayExercise.custom_reps,
      custom_sets: dayExercise.custom_sets,
      custom_weight_kg: dayExercise.custom_weight_kg,
      rest_seconds: dayExercise.rest_seconds,
      sort_order: dayExercise.sort_order
    };
  };

  const getProgressPercentage = () => {
    if (!currentPlan) return 0;
    
    const totalExercises = currentPlan.days.reduce((sum, day) => sum + day.exercises.length, 0);
    const completed = completedExercises.size;
    
    return Math.round((completed / totalExercises) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-white mt-4 text-lg">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">No workout plan found</p>
          <button
            onClick={() => setCurrentView('guided_workouts')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Workouts
          </button>
        </div>
      </div>
    );
  }

  const currentExercise = getCurrentExercise();
  const currentDay = currentPlan.days[currentDayIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{currentPlan.title}</h1>
            <p className="text-gray-400">Day {currentDayIndex + 1}: {currentDay.day_title}</p>
          </div>
          <button
            onClick={() => setCurrentView('guided_workouts')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Exit Workout
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm text-gray-400">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Workout Area */}
      <div className="max-w-4xl mx-auto p-6">
        {currentExercise ? (
          <div className="text-center">
            {/* Exercise Info */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-4">{currentExercise.name}</h2>
              <div className="flex items-center justify-center space-x-6 text-lg text-gray-300">
                {currentExercise.custom_reps && (
                  <span>Reps: {currentExercise.custom_reps}</span>
                )}
                {currentExercise.custom_sets && (
                  <span>Sets: {currentExercise.custom_sets}</span>
                )}
                {currentExercise.custom_duration_seconds && (
                  <span>Duration: {currentExercise.custom_duration_seconds}s</span>
                )}
              </div>
            </div>

            {/* Timer */}
            <div className="mb-8">
              <div className={`text-8xl font-bold mb-4 ${isRest ? 'text-yellow-400' : 'text-purple-400'}`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xl text-gray-400">
                {isRest ? 'Rest Time' : 'Exercise Time'}
              </div>
            </div>

            {/* Exercise Instructions */}
            {currentExercise.instructions && (
              <div className="mb-8 p-6 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <p className="text-gray-300">{currentExercise.instructions}</p>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <button
                onClick={previousExercise}
                disabled={currentDayIndex === 0 && currentExerciseIndex === 0}
                className="p-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-6 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <PauseIcon className="w-8 h-8" />
                ) : (
                  <PlayIcon className="w-8 h-8" />
                )}
              </button>

              <button
                onClick={nextExercise}
                className="p-4 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
              >
                <ArrowRightIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Exercise Counter */}
            <div className="text-gray-400">
              Exercise {currentExerciseIndex + 1} of {currentDay.exercises.length} • 
              Day {currentDayIndex + 1} of {currentPlan.days.length}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">No more exercises</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {currentPlan.title} • {getProgressPercentage()}% Complete
          </div>
          <div className="flex space-x-2">
            <button
              onClick={previousExercise}
              disabled={currentDayIndex === 0 && currentExerciseIndex === 0}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Previous
            </button>
            <button
              onClick={nextExercise}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPlayer;
