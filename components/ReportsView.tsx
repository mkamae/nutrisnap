import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { MealEntry, WorkoutSession } from '../types';
import { mealService, workoutSessionService } from '../services/supabaseService';
import { gamificationService } from '../services/gamificationService';
import GamificationSummary from './gamification/GamificationSummary';

interface ReportsViewProps {
  currentUserId: string | null;
}

interface DailyData {
  date: string;
  meals: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  workoutCalories: number;
}

const ReportsView: React.FC<ReportsViewProps> = ({ currentUserId }) => {
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [gamificationData, setGamificationData] = useState(gamificationService.getDefaultData());

  useEffect(() => {
    if (currentUserId) {
      loadReportsData();
    }
    // Load gamification data
    setGamificationData(gamificationService.loadData());
  }, [currentUserId, selectedPeriod]);

  const loadReportsData = async () => {
    if (!currentUserId) return;

    try {
      setIsLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      if (selectedPeriod === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else {
        startDate.setDate(endDate.getDate() - 30);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch meals and workout sessions with error handling
      let meals: MealEntry[] = [];
      let workoutSessions: WorkoutSession[] = [];

      try {
        meals = await mealService.getMealsByDateRange(currentUserId, startDateStr, endDateStr);
        console.log('Supabase meals query result:', meals);
      } catch (error: any) {
        console.error('Error loading meals for reports:', error?.message || error);
      }

      try {
        workoutSessions = await workoutSessionService.getWorkoutSessions(currentUserId);
        console.log('Supabase workout_sessions query result:', workoutSessions);
      } catch (error: any) {
        console.error('Error loading workout sessions for reports:', error?.message || error);
      }

      // Group data by date
      const dataMap = new Map<string, DailyData>();

      // Initialize all dates in range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dataMap.set(dateStr, {
          date: dateStr,
          meals: 0,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          workoutCalories: 0
        });
      }

      // Process meals
      meals.forEach(meal => {
        const dateStr = meal.date;
        if (dataMap.has(dateStr)) {
          const dayData = dataMap.get(dateStr)!;
          dayData.meals += 1;
          dayData.calories += meal.calories;
          dayData.protein += meal.protein;
          dayData.carbs += meal.carbs;
          dayData.fat += meal.fat;
        }
      });

      // Process workout sessions
      workoutSessions.forEach(session => {
        if (session.completed_at) {
          const sessionDate = session.started_at.split('T')[0];
          if (dataMap.has(sessionDate)) {
            const dayData = dataMap.get(sessionDate)!;
            dayData.workoutCalories += session.calories_burned || 0;
          }
        }
      });

      // Convert to array and sort by date
      const data = Array.from(dataMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setDailyData(data);
    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTodaySummary = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayData = dailyData.find(d => d.date === today);
    
    if (!todayData) {
      return {
        meals: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        workoutCalories: 0
      };
    }
    
    return todayData;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const todaySummary = getTodaySummary();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Progress Reports
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your nutrition and fitness progress
        </p>
      </div>

      {/* Gamification Summary */}
      <GamificationSummary data={gamificationData} />

      {/* Period Selector */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setSelectedPeriod('week')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedPeriod === 'week'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setSelectedPeriod('month')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedPeriod === 'month'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Last 30 Days
        </button>
      </div>

      {/* Today's Summary */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-center">Today's Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">Meals Logged</p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {todaySummary.meals}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/50 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">Calories</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">
              {todaySummary.calories}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/50 rounded-lg">
            <p className="text-sm text-purple-600 dark:text-purple-400">Protein</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {todaySummary.protein}g
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/50 rounded-lg">
            <p className="text-sm text-orange-600 dark:text-orange-400">Workout Calories</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {todaySummary.workoutCalories}
            </p>
          </div>
        </div>
        
        {/* Daily Summary Message */}
        <div className="mt-6 text-center">
          <p className="text-lg text-gray-700 dark:text-gray-300">
            {todaySummary.meals === 0 
              ? "No meals logged yet today. Start tracking your nutrition!"
              : `You logged ${todaySummary.meals} meal${todaySummary.meals > 1 ? 's' : ''} today.`
            }
          </p>
        </div>
      </div>

      {/* Charts */}
      {dailyData.length > 0 && (
        <>
          {/* Meals Chart */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-center">Meals Logged Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value) => [value, 'Meals']}
                />
                <Bar dataKey="meals" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Calories Chart */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-center">Calories Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value, name) => [
                    value, 
                    name === 'calories' ? 'Calories Consumed' : 'Calories Burned'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="workoutCalories" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Macros Chart */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-center">Macronutrients Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                />
                <Bar dataKey="protein" stackId="macros" fill="#34D399" />
                <Bar dataKey="carbs" stackId="macros" fill="#60A5FA" />
                <Bar dataKey="fat" stackId="macros" fill="#FBBF24" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* No Data Message */}
      {dailyData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Start logging meals to see your progress reports!
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
