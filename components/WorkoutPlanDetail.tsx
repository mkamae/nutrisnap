import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkoutPlan, WorkoutDay, WorkoutDayExercise, Exercise } from '../types';
import { guidedWorkoutService } from '../services/guidedWorkoutService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface WorkoutPlanDetailProps {
  currentUserId: string | null;
}

const WorkoutPlanDetail: React.FC<WorkoutPlanDetailProps> = ({ currentUserId }) => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [dayExercises, setDayExercises] = useState<{ [dayId: string]: (WorkoutDayExercise & { exercise: Exercise })[] }>({});
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (planId) {
      loadPlanDetails();
    }
  }, [planId]);

  const loadPlanDetails = async () => {
    if (!planId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load plan details
      const planData = await guidedWorkoutService.getWorkoutPlan(planId);
      setPlan(planData);
      
      // Load workout days
      const daysData = await guidedWorkoutService.getWorkoutDays(planId);
      setDays(daysData);
      
      // Load exercises for each day
      const exercisesData: { [dayId: string]: (WorkoutDayExercise & { exercise: Exercise })[] } = {};
      for (const day of daysData) {
        const exercises = await guidedWorkoutService.getWorkoutDayExercises(day.id);
        exercisesData[day.id] = exercises;
      }
      setDayExercises(exercisesData);
      
      // Auto-expand first day
      if (daysData.length > 0) {
        setExpandedDay(daysData[0].id);
      }
      
    } catch (err: any) {
      console.error('Error loading plan details:', err);
      setError(err.message || 'Failed to load plan details');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (dayId: string) => {
    setExpandedDay(expandedDay === dayId ? null : dayId);
  };

  const handleStartDay = (dayId: string, dayNumber: number) => {
    navigate(`/guided-workouts/player/${planId}/${dayId}`);
  };

  if (isLoading) {
    return (
      <LoadingSpinner 
        size="lg" 
        message="Loading workout plan..." 
        fullScreen 
      />
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage
            title="Plan Loading Error"
            message={error || 'Plan not found. Please try again or select a different plan.'}
            onRetry={loadPlanDetails}
            onDismiss={() => navigate('/guided-workouts')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button 
            onClick={() => navigate('/guided-workouts')}
            className="mb-4 flex items-center text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Workouts
          </button>
          
          <h1 className="text-3xl font-bold mb-2">{plan.title}</h1>
          <p className="text-blue-100 mb-6">{plan.description}</p>
          
          {/* Plan Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{plan.duration_minutes}</div>
              <div className="text-sm text-blue-100">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{plan.total_exercises}</div>
              <div className="text-sm text-blue-100">Exercises</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{plan.est_calories}</div>
              <div className="text-sm text-blue-100">Calories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Days */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Workout Days</h2>
        
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {/* Day Header */}
              <button
                onClick={() => toggleDay(day.id)}
                className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Day {day.day_number}: {day.title || 'Workout'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(day.total_duration_minutes || 0) > 0 ? `${day.total_duration_minutes} min • ` : ''}{dayExercises[day.id]?.length || 0} exercises
                    </p>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedDay === day.id ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Day Sections and Exercises */}
              {expandedDay === day.id && (
                <div className="px-6 pb-6">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-6">
                    {/* Sections Overview */}
                    {day.sections && day.sections.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {day.sections.map((section, idx) => (
                          <div key={idx} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{section.type}</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{section.title}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{section.duration_minutes} min • {section.steps.length} steps</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Exercise List */}
                    <div className="grid gap-4">
                      {dayExercises[day.id]?.map((dayExercise, index) => (
                        <ExerciseCard 
                          key={dayExercise.id} 
                          exercise={dayExercise.exercise} 
                          order={index + 1}
                        />
                      ))}
                    </div>

                    {/* Start Day Button */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button 
                        onClick={() => handleStartDay(day.id, day.day_number)}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5" />
                        </svg>
                        Start Day {day.day_number}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Exercise Card Component
interface ExerciseCardProps {
  exercise: Exercise;
  order: number;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, order }) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      {/* Exercise Number */}
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
        {order}
      </div>
      
      {/* Exercise GIF/Image */}
      <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
        {exercise.gif_url && !imageError ? (
          <img 
            src={exercise.gif_url} 
            alt={exercise.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )}
      </div>
      
      {/* Exercise Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          {exercise.name}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {exercise.category} • {exercise.duration_seconds ? `${exercise.duration_seconds}s` : `${exercise.reps} reps`}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {exercise.instructions}
        </p>
      </div>
    </div>
  );
};

export default WorkoutPlanDetail;