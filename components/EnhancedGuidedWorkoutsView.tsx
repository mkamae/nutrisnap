import React, { useState, useEffect } from 'react';
import { DemoWorkout, Exercise, WorkoutSession } from '../types';
import { demoWorkoutService, exerciseService, workoutSessionService } from '../services/supabaseService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface EnhancedGuidedWorkoutsViewProps {
    currentUserId: string | null;
    onWorkoutComplete?: (session: WorkoutSession) => void;
}

const EnhancedGuidedWorkoutsView: React.FC<EnhancedGuidedWorkoutsViewProps> = ({
    currentUserId,
    onWorkoutComplete
}) => {
    const [demoWorkouts, setDemoWorkouts] = useState<DemoWorkout[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [selectedWorkout, setSelectedWorkout] = useState<DemoWorkout | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);

    useEffect(() => {
        loadWorkoutData();
    }, []);

    const loadWorkoutData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [workoutsData, exercisesData] = await Promise.all([
                demoWorkoutService.getDemoWorkouts(),
                exerciseService.getExercises()
            ]);

            setDemoWorkouts(workoutsData);
            setExercises(exercisesData);
        } catch (err: any) {
            console.error('Error loading workout data:', err);
            setError(err.message || 'Failed to load workout data');
        } finally {
            setIsLoading(false);
        }
    };

    const categories = ['all', ...Array.from(new Set(demoWorkouts.map(w => w.category)))];
    const filteredWorkouts = selectedCategory === 'all'
        ? demoWorkouts
        : demoWorkouts.filter(w => w.category === selectedCategory);

    const handleWorkoutSelect = (workout: DemoWorkout) => {
        setSelectedWorkout(workout);
    };

    const startWorkout = async (workout: DemoWorkout) => {
        if (!currentUserId) {
            alert('Please log in to start workouts');
            return;
        }

        try {
            const session = await workoutSessionService.startWorkoutSession(
                currentUserId,
                undefined,
                workout.id
            );

            setCurrentSession(session);
            setIsWorkoutActive(true);
            setSelectedWorkout(workout);
        } catch (err: any) {
            console.error('Error starting workout:', err);
            alert('Failed to start workout. Please try again.');
        }
    };

    const completeWorkout = async () => {
        if (!currentSession || !selectedWorkout) return;

        try {
            const duration = selectedWorkout.duration_seconds || 300; // Default 5 minutes
            const calories = Math.round(duration * 0.1); // Rough estimate

            const completedSession = await workoutSessionService.completeWorkoutSession(
                currentSession.id,
                duration,
                calories,
                `Completed ${selectedWorkout.name}`
            );

            if (onWorkoutComplete) {
                onWorkoutComplete(completedSession);
            }

            setIsWorkoutActive(false);
            setCurrentSession(null);
            setSelectedWorkout(null);

            alert(`Workout completed! You burned approximately ${calories} calories.`);
        } catch (err: any) {
            console.error('Error completing workout:', err);
            alert('Failed to complete workout. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <ErrorMessage message={error} />
                <button
                    onClick={loadWorkoutData}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Workout Detail View
    if (selectedWorkout && !isWorkoutActive) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setSelectedWorkout(null)}
                        className="flex items-center text-blue-500 hover:text-blue-600"
                    >
                        ← Back to Workouts
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                {selectedWorkout.name}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedWorkout.category === 'strength' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                selectedWorkout.category === 'cardio' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                    selectedWorkout.category === 'core' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                }`}>
                                {selectedWorkout.category}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {selectedWorkout.reps && (
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {selectedWorkout.reps}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Reps</div>
                            </div>
                        )}
                        {selectedWorkout.sets && (
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {selectedWorkout.sets}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Sets</div>
                            </div>
                        )}
                        {selectedWorkout.duration_seconds && (
                            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {Math.round(selectedWorkout.duration_seconds / 60)}m
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
                            </div>
                        )}
                    </div>

                    {selectedWorkout.instructions && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Instructions
                            </h3>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {selectedWorkout.instructions}
                            </p>
                        </div>
                    )}

                    {selectedWorkout.muscle_groups && selectedWorkout.muscle_groups.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Target Muscles
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {selectedWorkout.muscle_groups.map(muscle => (
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

                    <button
                        onClick={() => startWorkout(selectedWorkout)}
                        disabled={!currentUserId}
                        className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
                    >
                        {currentUserId ? 'Start Workout' : 'Login to Start Workout'}
                    </button>
                </div>
            </div>
        );
    }

    // Active Workout View
    if (isWorkoutActive && selectedWorkout) {
        return (
            <div className="max-w-2xl mx-auto p-6 space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Workout in Progress
                    </h1>
                    <h2 className="text-xl text-gray-700 dark:text-gray-300">
                        {selectedWorkout.name}
                    </h2>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                    <div className="mb-6">
                        <div className="text-6xl font-bold text-green-500 mb-2">
                            💪
                        </div>
                        <p className="text-lg text-gray-700 dark:text-gray-300">
                            Follow the instructions and complete your workout!
                        </p>
                    </div>

                    {selectedWorkout.instructions && (
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-gray-700 dark:text-gray-300">
                                {selectedWorkout.instructions}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {selectedWorkout.reps && (
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {selectedWorkout.reps}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Reps per set</div>
                            </div>
                        )}
                        {selectedWorkout.sets && (
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {selectedWorkout.sets}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Total sets</div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={completeWorkout}
                        className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-lg"
                    >
                        Complete Workout
                    </button>
                </div>
            </div>
        );
    }

    // Main Workouts List View
    return (
        <div className="p-4 space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Guided Workouts
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Choose from our collection of proven exercises with step-by-step guidance
                </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                ))}
            </div>

            {/* Workouts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkouts.map(workout => (
                    <div
                        key={workout.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleWorkoutSelect(workout)}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {workout.name}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${workout.category === 'strength' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                    workout.category === 'cardio' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                        workout.category === 'core' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                    }`}>
                                    {workout.category}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                {workout.reps && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Reps:</span>
                                        <span className="font-medium">{workout.reps}</span>
                                    </div>
                                )}
                                {workout.sets && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Sets:</span>
                                        <span className="font-medium">{workout.sets}</span>
                                    </div>
                                )}
                                {workout.duration_seconds && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                                        <span className="font-medium">{Math.round(workout.duration_seconds / 60)}m</span>
                                    </div>
                                )}
                            </div>

                            {workout.muscle_groups && workout.muscle_groups.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Targets:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {workout.muscle_groups.slice(0, 3).map(muscle => (
                                            <span
                                                key={muscle}
                                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                                            >
                                                {muscle}
                                            </span>
                                        ))}
                                        {workout.muscle_groups.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                                                +{workout.muscle_groups.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    startWorkout(workout);
                                }}
                                disabled={!currentUserId}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                {currentUserId ? 'Start Workout' : 'Login to Start'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredWorkouts.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                        No workouts found in this category.
                    </p>
                </div>
            )}
        </div>
    );
};

export default EnhancedGuidedWorkoutsView;