import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, WorkoutSession, MealEntry } from '../types';
import { googleFitnessService, GoogleFitnessData } from '../services/googleFitnessService';

interface EnhancedActivityViewProps {
  profile: UserProfile | null;
  workoutSessions: WorkoutSession[];
  mealEntries: MealEntry[];
}

const EnhancedActivityView: React.FC<EnhancedActivityViewProps> = ({
  profile,
  workoutSessions,
  mealEntries
}) => {
  const [fitnessData, setFitnessData] = useState<GoogleFitnessData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'trends' | 'goals' | 'comparison'>('summary');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Initialize Google Fitness connection
  useEffect(() => {
    const initFitness = async () => {
      try {
        const initialized = await googleFitnessService.initialize();
        if (initialized) {
          setIsConnected(true);
          await loadFitnessData();
        }
      } catch (err) {
        console.error('Failed to initialize fitness service:', err);
      }
    };

    initFitness();
  }, []);

  // Load fitness data
  const loadFitnessData = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await googleFitnessService.getTodayFitnessData();
      setFitnessData(data);
    } catch (err: any) {
      console.error('Failed to load fitness data:', err);
      setError(err.message || 'Failed to load fitness data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate activity statistics
  const activityStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 1);

    const filterByDate = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      return (item: any) => new Date(item.sessionDate || item.date) >= date;
    };

    const todayWorkouts = workoutSessions.filter(s => s.sessionDate === today);
    const weekWorkouts = workoutSessions.filter(filterByDate(weekStart));
    const monthWorkouts = workoutSessions.filter(filterByDate(monthStart));

    const todayMeals = mealEntries.filter(m => m.date === today);
    const weekMeals = mealEntries.filter(filterByDate(weekStart));
    const monthMeals = mealEntries.filter(filterByDate(monthStart));

    return {
      today: {
        workouts: {
          count: todayWorkouts.length,
          calories: todayWorkouts.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0),
          minutes: todayWorkouts.reduce((sum, s) => sum + (s.totalDurationMinutes || 0), 0)
        },
        meals: {
          count: todayMeals.length,
          calories: todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
          protein: todayMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
          carbs: todayMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
          fat: todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0)
        }
      },
      week: {
        workouts: {
          count: weekWorkouts.length,
          calories: weekWorkouts.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0),
          minutes: weekWorkouts.reduce((sum, s) => sum + (s.totalDurationMinutes || 0), 0)
        },
        meals: {
          count: weekMeals.length,
          calories: weekMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
          protein: weekMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
          carbs: weekMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
          fat: weekMeals.reduce((sum, m) => sum + (m.fat || 0), 0)
        }
      },
      month: {
        workouts: {
          count: monthWorkouts.length,
          calories: monthWorkouts.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0),
          minutes: monthWorkouts.reduce((sum, s) => sum + (s.totalDurationMinutes || 0), 0)
        },
        meals: {
          count: monthMeals.length,
          calories: monthMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
          protein: monthMeals.reduce((sum, m) => sum + (m.protein || 0), 0),
          carbs: monthMeals.reduce((sum, m) => sum + (m.carbs || 0), 0),
          fat: monthMeals.reduce((sum, m) => sum + (m.fat || 0), 0)
        }
      }
    };
  }, [workoutSessions, mealEntries]);

  // Calculate net calories and balance
  const nutritionBalance = useMemo(() => {
    if (!profile?.dailyCalorieGoal) return null;

    const currentStats = timeRange === 'today' ? activityStats.today : 
                        timeRange === 'week' ? activityStats.week : 
                        activityStats.month;

    const multiplier = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : 30;
    const dailyGoal = profile.dailyCalorieGoal * multiplier;
    
    const consumed = currentStats.meals.calories;
    const burned = currentStats.workouts.calories;
    const net = consumed - burned;
    const remaining = dailyGoal - net;

    return {
      dailyGoal,
      consumed,
      burned,
      net,
      remaining,
      isOnTrack: net <= dailyGoal,
      deficit: Math.max(0, dailyGoal - net)
    };
  }, [activityStats, profile, timeRange]);

  // Calculate activity trends
  const activityTrends = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayWorkouts = workoutSessions.filter(s => s.sessionDate === date);
      const dayMeals = mealEntries.filter(m => m.date === date);
      
      return {
        date,
        workouts: dayWorkouts.length,
        workoutCalories: dayWorkouts.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0),
        workoutMinutes: dayWorkouts.reduce((sum, s) => sum + (s.totalDurationMinutes || 0), 0),
        meals: dayMeals.length,
        mealCalories: dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0)
      };
    });
  }, [workoutSessions, mealEntries]);

  // Get current stats based on time range
  const currentStats = useMemo(() => {
    switch (timeRange) {
      case 'today':
        return activityStats.today;
      case 'week':
        return activityStats.week;
      case 'month':
        return activityStats.month;
      default:
        return activityStats.today;
    }
  }, [timeRange, activityStats]);

  if (!isConnected) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connect Google Fitness
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get comprehensive activity insights by connecting your Google Fitness account
          </p>
          <button
            onClick={() => googleFitnessService.authenticate()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Connect Google Fitness
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Summary</h2>
          <p className="text-gray-600 dark:text-gray-400">Track your nutrition and fitness balance</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={loadFitnessData}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'summary', label: 'Summary', icon: '📊' },
            { id: 'trends', label: 'Trends', icon: '📈' },
            { id: 'goals', label: 'Goals', icon: '🎯' },
            { id: 'comparison', label: 'Comparison', icon: '⚖️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading activity data...</p>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && (
        <>
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Activity Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Workouts */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Workouts</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {currentStats.workouts.count}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sessions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {currentStats.workouts.calories}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Calories</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {currentStats.workouts.minutes}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Minutes</p>
                    </div>
                  </div>
                </div>

                {/* Nutrition */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nutrition</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {currentStats.meals.count}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Meals</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {currentStats.meals.calories}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Calories</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {currentStats.meals.protein}g
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Protein</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Fitness Data */}
              {fitnessData && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Google Fitness Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {fitnessData.steps.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Steps</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {Math.round(fitnessData.calories)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Calories Burned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {(fitnessData.distance / 1000).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Distance (km)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {fitnessData.heartRate.length > 0 ? Math.round(fitnessData.heartRate.reduce((a, b) => a + b, 0) / fitnessData.heartRate.length) : 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Avg HR (BPM)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nutrition Balance */}
              {nutritionBalance && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Calorie Balance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {nutritionBalance.dailyGoal}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Daily Goal</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {nutritionBalance.consumed}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Consumed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        -{nutritionBalance.burned}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Burned</p>
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${
                        nutritionBalance.isOnTrack ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {nutritionBalance.net}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Net</p>
                    </div>
                  </div>
                  
                  <div className={`mt-4 p-3 rounded-lg ${
                    nutritionBalance.isOnTrack 
                      ? 'bg-green-50 dark:bg-green-900/20' 
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <p className={`text-sm text-center ${
                      nutritionBalance.isOnTrack 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {nutritionBalance.isOnTrack 
                        ? `✅ You're on track! ${nutritionBalance.deficit} calories remaining`
                        : `⚠️ You're over your goal by ${Math.abs(nutritionBalance.deficit)} calories`
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">7-Day Activity Trends</h3>
                <div className="space-y-4">
                  {activityTrends.map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(day.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex items-center space-x-6 text-sm">
                          <span className="text-purple-600 dark:text-purple-400">
                            💪 {day.workouts} workouts
                          </span>
                          <span className="text-red-600 dark:text-red-400">
                            🔥 {day.workoutCalories} cal
                          </span>
                          <span className="text-blue-600 dark:text-blue-400">
                            ⏱️ {day.workoutMinutes} min
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          🍽️ {day.meals} meals
                        </p>
                        <p className="text-orange-600 dark:text-orange-400 font-medium">
                          {day.mealCalories} cal
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              {profile && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Goals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Daily Calorie Goal</h4>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {profile.dailyCalorieGoal}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">calories</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Activity Level</h4>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 capitalize">
                        {profile.activityLevel?.replace('_', ' ')}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">current level</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Tracking */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progress Tracking</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Weekly Workouts</span>
                      <span>{activityStats.week.workouts.count} / 5</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((activityStats.week.workouts.count / 5) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Daily Steps (Google Fitness)</span>
                      <span>{fitnessData?.steps || 0} / 10,000</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(((fitnessData?.steps || 0) / 10000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Tab */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              {/* Time Range Comparison */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Today</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Workouts: <span className="font-semibold text-purple-600">{activityStats.today.workouts.count}</span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Calories: <span className="font-semibold text-red-600">{activityStats.today.workouts.calories}</span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Meals: <span className="font-semibold text-green-600">{activityStats.today.meals.count}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">This Week</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Workouts: <span className="font-semibold text-purple-600">{activityStats.week.workouts.count}</span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Calories: <span className="font-semibold text-red-600">{activityStats.week.workouts.calories}</span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Meals: <span className="font-semibold text-green-600">{activityStats.week.meals.count}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">This Month</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Workouts: <span className="font-semibold text-purple-600">{activityStats.month.workouts.count}</span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Calories: <span className="font-semibold text-red-600">{activityStats.month.workouts.calories}</span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Meals: <span className="font-semibold text-green-600">{activityStats.month.meals.count}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Insights</h3>
                <div className="space-y-3">
                  {activityStats.week.workouts.count >= 5 && (
                    <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-green-600 dark:text-green-400">🎉</span>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Great job! You've met your weekly workout goal of 5 sessions.
                      </p>
                    </div>
                  )}
                  
                  {nutritionBalance && nutritionBalance.isOnTrack && (
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-blue-600 dark:text-blue-400">💡</span>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        You're maintaining a good balance between nutrition and activity.
                      </p>
                    </div>
                  )}
                  
                  {fitnessData && fitnessData.steps < 5000 && (
                    <div className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <span className="text-orange-600 dark:text-orange-400">🚶</span>
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        Try to increase your daily steps. Consider taking a walk or using the stairs more.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedActivityView;
