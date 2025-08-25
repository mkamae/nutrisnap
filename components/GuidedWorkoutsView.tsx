import React, { useState, useEffect } from 'react';
import { WorkoutPlan, View } from '../types';
import { guidedWorkoutService } from '../services/guidedWorkoutService';
import { ChartBarIcon, ClockIcon, FireIcon, StarIcon, PlayIcon } from './icons';

interface GuidedWorkoutsViewProps {
  setCurrentView: (view: View) => void;
  currentUserId?: string;
}

const GuidedWorkoutsView: React.FC<GuidedWorkoutsViewProps> = ({ 
  setCurrentView, 
  currentUserId 
}) => {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    loadWorkoutPlans();
  }, []);

  const loadWorkoutPlans = async () => {
    try {
      setLoading(true);
      const plans = await guidedWorkoutService.getPublicWorkoutPlans();
      setWorkoutPlans(plans);
    } catch (error) {
      console.error('Error loading workout plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength': return '💪';
      case 'cardio': return '❤️';
      case 'flexibility': return '🧘';
      case 'mixed': return '⚡';
      case 'hiit': return '🔥';
      case 'yoga': return '🧘‍♀️';
      default: return '🏃';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength': return 'bg-blue-100 text-blue-800';
      case 'cardio': return 'bg-red-100 text-red-800';
      case 'flexibility': return 'bg-purple-100 text-purple-800';
      case 'mixed': return 'bg-indigo-100 text-indigo-800';
      case 'hiit': return 'bg-orange-100 text-orange-800';
      case 'yoga': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPlans = workoutPlans.filter(plan => {
    const categoryMatch = selectedCategory === 'all' || plan.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || plan.difficulty_level === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const categories = ['all', 'strength', 'cardio', 'flexibility', 'mixed', 'hiit', 'yoga'];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Guided Workouts
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Choose from our curated workout plans or create your own
              </p>
            </div>
            <button
              onClick={() => setCurrentView('workouts')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              My Workouts
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🏃‍♂️</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No workout plans found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your filters or check back later for new plans.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Plan Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {plan.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {plan.description}
                      </p>
                    </div>
                    <span className={`text-2xl`}>
                      {getCategoryIcon(plan.category || 'mixed')}
                    </span>
                  </div>

                  {/* Plan Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <ClockIcon className="w-4 h-4 mr-2 text-purple-500" />
                      {plan.duration_minutes || 'N/A'} min
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <ChartBarIcon className="w-4 h-4 mr-2 text-purple-500" />
                      {plan.total_exercises || 'N/A'} exercises
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <FireIcon className="w-4 h-4 mr-2 text-purple-500" />
                      {plan.est_calories || 'N/A'} cal
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <StarIcon className="w-4 h-4 mr-2 text-purple-500" />
                      {plan.difficulty_level || 'N/A'}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(plan.category || 'mixed')}`}>
                      {plan.category?.charAt(0).toUpperCase() + plan.category?.slice(1) || 'Mixed'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(plan.difficulty_level || 'beginner')}`}>
                      {plan.difficulty_level?.charAt(0).toUpperCase() + plan.difficulty_level?.slice(1) || 'Beginner'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Navigate to plan details
                        setCurrentView('workout_player');
                        // You could also pass the plan ID as a parameter
                      }}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                    >
                      <PlayIcon className="w-4 h-4 mr-2" />
                      Start Now
                    </button>
                    <button
                      onClick={() => {
                        // Navigate to plan details view
                        // setCurrentView('plan_details');
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidedWorkoutsView;
