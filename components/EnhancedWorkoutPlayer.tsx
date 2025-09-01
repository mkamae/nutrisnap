import React, { useState, useEffect } from 'react';
import { DemoWorkout, Exercise, WorkoutSession, ExerciseLog } from '../types';
import { workoutSessionService, exerciseLogService, exerciseService } from '../services/supabaseService';
import LoadingSpinner from './LoadingSpinner';

interface EnhancedWorkoutPlayerProps {
  workout: DemoWorkout;
  currentUserId: string;
  onWorkoutComplete: (session: WorkoutSession) => void;
  onExit: () => void;
}

const EnhancedWorkoutPlayer: React.FC<EnhancedWorkoutPlayerProps> = ({
  workout,
  currentUserId,
  onWorkoutComplete,
  onExit
}) => {
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [relatedExercises, setRelatedExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    initializeWorkout();
    loadRelatedExercises();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTimeLeft > 0) {
      interval = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTimeLeft]);

  const initializeWorkout = async () => {
    try {
      setIsLoading(true);
      const session = await workoutSessionService.startWorkoutSession(
        currentUserId,
        undefined,
        workout.id
      );
      setCurrentSession(session);
      setWorkoutStartTime(new Date());
    } catch (error) {
      console.error('Error starting workout session:', error);
      alert('Failed to start workout session');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelatedExercises = async () => {
    try {
      const exercises = await exerciseService.getExercisesByCategory(workout.category);
      const related = exercises.filter(ex => 
        ex.name.toLowerCase().includes(workout.name.toLowerCase()) ||
        workout.name.toLowerCase().includes(ex.name.toLowerCase())
      );
      setRelatedExercises(related);
    } catch (error) {
      console.error('Error loading related exercises:', error);
    }
  };

  const completeRep = () => {
    if (!workout.reps) return;
    
    const newRep = currentRep + 1;
    setCurrentRep(newRep);

    if (newRep >= workout.reps) {
      // Set completed
      completeSet();
    }
  };

  const completeSet = () => {
    if (!workout.sets) return;

    const newSet = currentSet + 1;
    setCurrentSet(newSet);
    setCurrentRep(0);

    if (newSet <= workout.sets) {
      // Start rest period between sets
      startRest(60); // 60 seconds rest
    } else {
      // Workout completed
      completeWorkout();
    }
  };

  const startRest = (seconds: number) => {
    setIsResting(true);
    setRestTimeLeft(seconds);
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimeLeft(0);
  };

  const completeWorkout = async () => {
    if (!currentSession) return;

    try {
      setIsLoading(true);
      
      const endTime = new Date();
      const durationSeconds = Math.floor((endTime.getTime() - workoutStartTime.getTime()) / 1000);
      const estimatedCalories = Math.round(durationSeconds * 0.1); // Rough estimate

      // Log the exercise completion
      if (workout.reps && workout.sets) {
        await exerciseLogService.logExercise({
          session_id: currentSession.id,
          demo_workout_id: workout.id,
          sets_completed: workout.sets,
          reps_completed: workout.reps * workout.sets,
          duration_seconds: durationSeconds,
          notes: `Completed ${workout.name}`
        });
      }

      // Complete the session
      const completedSession = await workoutSessionService.completeWorkoutSession(
        currentSession.id,
        durationSeconds,
        estimatedCalories,
        `Completed ${workout.name} - ${workout.sets} sets of ${workout.reps} reps`
      );

      onWorkoutComplete(completedSession);
    } catch (error) {
      console.error('Error completing workout:', error);
      alert('Failed to save workout completion');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWorkoutProgress = (): number => {
    if (!workout.sets || !workout.reps) return 0;
    const totalReps = workout.sets * workout.reps;
    const completedReps = (currentSet - 1) * workout.reps + currentRep;
    return Math.min((completedReps / totalReps) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Rest Screen
  if (isResting) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Rest Time
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Take a break before the next set
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="text-8xl font-bold text-blue-500 mb-4">
            {formatTime(restTimeLeft)}
          </div>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Set {currentSet} of {workout.sets} completed!
          </p>

          <div className="space-y-4">
            <button
              onClick={skipRest}
              className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Skip Rest & Continue
            </button>
            
            <button
              onClick={onExit}
              className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Exit Workout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Workout Screen
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          ← Exit Workout
        </button>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {formatTime(Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000))}
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {workout.name}
        </h1>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getWorkoutProgress()}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        {/* Current Set/Rep Display */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-blue-500 mb-2">
            Set {currentSet}/{workout.sets}
          </div>
          {workout.reps && (
            <div className="text-2xl text-gray-700 dark:text-gray-300">
              Rep {currentRep}/{workout.reps}
            </div>
          )}
        </div>

        {/* Instructions */}
        {workout.instructions && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Instructions:
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {workout.instructions}
            </p>
          </div>
        )}

        {/* Exercise Image/GIF */}
        {relatedExercises.length > 0 && relatedExercises[0].image_url && (
          <div className="mb-6">
            <img
              src={relatedExercises[0].image_url}
              alt={workout.name}
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {workout.reps ? (
            <button
              onClick={completeRep}
              className="w-full px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-lg"
            >
              Complete Rep ({currentRep + 1}/{workout.reps})
            </button>
          ) : (
            <button
              onClick={completeSet}
              className="w-full px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-lg"
            >
              Complete Set ({currentSet}/{workout.sets})
            </button>
          )}

          <button
            onClick={() => startRest(30)}
            className="w-full px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
          >
            Take a 30s Break
          </button>

          <button
            onClick={completeWorkout}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Finish Workout Early
          </button>
        </div>
      </div>

      {/* Muscle Groups */}
      {workout.muscle_groups && workout.muscle_groups.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Target Muscles
          </h3>
          <div className="flex flex-wrap gap-2">
            {workout.muscle_groups.map(muscle => (
              <span 
                key={muscle}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedWorkoutPlayer;