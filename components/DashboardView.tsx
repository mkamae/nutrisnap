import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MealEntry } from '../types';
import MealDebugInfo from './MealDebugInfo';
import MealFlowTester from './MealFlowTester';

interface DashboardViewProps {
  entries: MealEntry[];
  profile: null; // No longer used, kept for compatibility
  workoutCalories?: number;
  netCalories?: number;
  caloriesLeft?: number;
  allMealEntries?: MealEntry[]; // For debugging
  currentUserId?: string | null; // For debugging
  onMealAdded?: (meal: MealEntry) => void; // For testing
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
  entries, 
  profile, 
  workoutCalories = 0,
  netCalories = 0,
  caloriesLeft = 0,
  allMealEntries = [],
  currentUserId = null,
  onMealAdded
}) => {
  const navigate = useNavigate();
  // Default daily calorie goal since profiles are no longer managed
  const defaultDailyCalorieGoal = 2500;

  const totals = entries.reduce((acc, entry) => ({
    calories: acc.calories + (entry.calories || 0),
    protein: acc.protein + (entry.protein || 0),
    carbs: acc.carbs + (entry.carbs || 0),
    fat: acc.fat + (entry.fat || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const macroData = [
    { name: 'Protein', value: totals.protein, color: '#34D399' },
    { name: 'Carbs', value: totals.carbs, color: '#60A5FA' },
    { name: 'Fat', value: totals.fat, color: '#FBBF24' },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Debug Info - Remove in production */}
      <MealDebugInfo 
        mealEntries={allMealEntries}
        todaysEntries={entries}
        currentUserId={currentUserId}
      />
      
      {/* Meal Flow Tester - Remove in production */}
      {onMealAdded && (
        <MealFlowTester 
          currentUserId={currentUserId}
          onMealAdded={onMealAdded}
        />
      )}
      
      {/* Welcome Header */}
      <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, User!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Let's track your nutrition and fitness today
        </p>
      </div>

      {/* Calories Overview */}
      <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <p className="text-gray-500 dark:text-gray-400">Calories Remaining</p>
        <div className="flex justify-center items-baseline space-x-2 mt-2">
          <span className="text-4xl font-extrabold text-green-500">
            {Math.max(0, caloriesLeft)}
          </span>
          <span className="text-lg text-gray-600 dark:text-gray-300">
            / {defaultDailyCalorieGoal} kcal
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Consumed: {totals.calories} | Burned: {workoutCalories} | Net: {netCalories}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Meals Today</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {entries.length}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Workout Minutes</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {workoutCalories > 0 ? 'Active' : 'Rest'}
          </p>
        </div>
      </div>

      {/* Macros Chart */}
      {totals.calories > 0 && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-center">Today's Macros</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-300">Protein</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {totals.protein}g
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">Carbs</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totals.carbs}g
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-300">Fat</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {totals.fat}g
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Meals */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold mb-3">Today's Meals</h3>
        {entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <img 
                  src={entry.imageUrl} 
                  alt={entry.mealName} 
                  className="w-16 h-16 rounded-lg object-cover mr-4" 
                />
                <div className="flex-1">
                  <p className="font-bold">{entry.mealName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {entry.calories} kcal • {entry.portionSize}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No meals logged yet today.
            </p>
            <button 
              onClick={() => navigate('/add-meal')} 
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Add your first meal
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
                      onClick={() => navigate('/add-meal')}
          className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md transition-colors"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🍽️</div>
            <p className="font-semibold">Add Meal</p>
          </div>
        </button>
        
        <button
                      onClick={() => navigate('/workouts')}
          className="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl shadow-md transition-colors"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">💪</div>
            <p className="font-semibold">Track Workout</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default DashboardView;
