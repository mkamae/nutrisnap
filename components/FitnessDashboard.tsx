import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, WorkoutSession } from '../types';
import { googleFitnessService, GoogleFitnessData, FitnessGoals } from '../services/googleFitnessService';

interface FitnessDashboardProps {
  profile: UserProfile | null;
  workoutSessions: WorkoutSession[];
  onSyncWorkouts: (workouts: WorkoutSession[]) => void;
}

const FitnessDashboard: React.FC<FitnessDashboardProps> = ({ 
  profile, 
  workoutSessions, 
  onSyncWorkouts 
}) => {
  const [fitnessData, setFitnessData] = useState<GoogleFitnessData | null>(null);
  const [fitnessGoals, setFitnessGoals] = useState<FitnessGoals | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'sleep' | 'insights'>('overview');

  // Initialize Google Fitness service
  useEffect(() => {
    const initFitness = async () => {
      try {
        const initialized = await googleFitnessService.initialize();
        if (initialized) {
          setIsConnected(true);
          await loadFitnessData();
          if (profile) {
            const goals = await googleFitnessService.getFitnessGoals(profile);
            setFitnessGoals(goals);
          }
        }
      } catch (err) {
        console.error('Failed to initialize fitness service:', err);
        setError('Failed to connect to Google Fitness');
      }
    };

    initFitness();
  }, [profile]);

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
  }

  // Connect to Google Fitness
  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await googleFitnessService.authenticate();
      if (success) {
        setIsConnected(true);
        await loadFitnessData();
        if (profile) {
          const goals = await googleFitnessService.getFitnessGoals(profile);
          setFitnessGoals(goals);
        }
      } else {
        setError('Failed to authenticate with Google Fitness');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync workouts from Google Fitness
  const handleSyncWorkouts = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const syncedWorkouts = await googleFitnessService.syncWorkouts();
      onSyncWorkouts(syncedWorkouts);
      setError(null);
    } catch (err: any) {
      console.error('Failed to sync workouts:', err);
      setError(err.message || 'Failed to sync workouts');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate progress percentages
  const progressData = useMemo(() => {
    if (!fitnessData || !fitnessGoals) return null;

    const stepsProgress = Math.min((fitnessData.steps / fitnessGoals.dailySteps) * 100, 100);
    const caloriesProgress = Math.min((fitnessData.calories / fitnessGoals.dailyCalories) * 100, 100);
    const sleepProgress = fitnessData.sleep.length > 0 
      ? Math.min((fitnessData.sleep[0].duration / (fitnessGoals.sleepGoal * 60)) * 100, 100)
      : 0;

    return {
      steps: stepsProgress,
      calories: caloriesProgress,
      sleep: sleepProgress
    };
  }, [fitnessData, fitnessGoals]);

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return workoutSessions
      .filter(session => new Date(session.sessionDate) >= weekStart)
      .reduce((acc, session) => ({
        totalWorkouts: acc.totalWorkouts + 1,
        totalCalories: acc.totalCalories + (session.caloriesBurned || 0),
        totalMinutes: acc.totalMinutes + (session.totalDurationMinutes || 0)
      }), { totalWorkouts: 0, totalCalories: 0, totalMinutes: 0 });
  }, [workoutSessions]);

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
            {googleFitnessService.getAuthStatus().isInitialized 
              ? 'Connect Google Fitness' 
              : 'Google Fitness Not Configured'
            }
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {googleFitnessService.getAuthStatus().isInitialized 
              ? 'Sync your fitness data from Google Fit, Wear OS, and other fitness apps'
              : 'To use Google Fitness features, you need to configure your API credentials. Check the README for setup instructions.'
            }
          </p>
          {googleFitnessService.getAuthStatus().isInitialized ? (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {isLoading ? 'Connecting...' : 'Connect Google Fitness'}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Required environment variables:
              </p>
                              <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                  <p>• VITE_GOOGLE_CLIENT_ID</p>
                  <p>• VITE_GOOGLE_FIT_API_KEY</p>
                </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fitness Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">Your health and fitness overview</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadFitnessData}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={handleSyncWorkouts}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {isLoading ? 'Syncing...' : 'Sync Workouts'}
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
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'activity', label: 'Activity', icon: '🏃' },
            { id: 'sleep', label: 'Sleep', icon: '😴' },
            { id: 'insights', label: 'Insights', icon: '💡' }
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading fitness data...</p>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && fitnessData && (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Daily Progress */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Steps */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Steps</h3>
                    <span className="text-2xl">👟</span>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {fitnessData.steps.toLocaleString()}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      of {fitnessGoals?.dailySteps.toLocaleString()} goal
                    </p>
                  </div>
                  {progressData && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressData.steps}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {Math.round(progressData.steps)}% complete
                      </p>
                    </div>
                  )}
                </div>

                {/* Calories Burned */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Calories</h3>
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {Math.round(fitnessData.calories)}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      of {fitnessGoals?.dailyCalories} goal
                    </p>
                  </div>
                  {progressData && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressData.calories}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {Math.round(progressData.calories)}% complete
                      </p>
                    </div>
                  )}
                </div>

                {/* Distance */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distance</h3>
                    <span className="text-2xl">📍</span>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {(fitnessData.distance / 1000).toFixed(2)}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">km today</p>
                  </div>
                </div>
              </div>

              {/* Weekly Summary */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">This Week</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {weeklyStats.totalWorkouts}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Workouts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {weeklyStats.totalCalories}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Calories Burned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {weeklyStats.totalMinutes}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Active Minutes</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              {/* Heart Rate */}
              {fitnessData.heartRate.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Heart Rate</h3>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {Math.round(fitnessData.heartRate.reduce((a, b) => a + b, 0) / fitnessData.heartRate.length)}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Average BPM today</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Min</p>
                      <p className="font-semibold">{Math.min(...fitnessData.heartRate)} BPM</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Max</p>
                      <p className="font-semibold">{Math.max(...fitnessData.heartRate)} BPM</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Workouts */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Workouts</h3>
                {fitnessData.workouts.length > 0 ? (
                  <div className="space-y-3">
                    {fitnessData.workouts.slice(0, 5).map(workout => (
                      <div key={workout.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{workout.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {workout.duration} min • {workout.calories} cal
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(workout.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No workouts recorded today
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Sleep Tab */}
          {activeTab === 'sleep' && (
            <div className="space-y-6">
              {fitnessData.sleep.length > 0 ? (
                fitnessData.sleep.map((sleep, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sleep Session</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {Math.round(sleep.duration / 60)}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">Hours</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {Math.round(sleep.duration)}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">Minutes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {Math.round((sleep.duration / (fitnessGoals?.sleepGoal || 8 * 60)) * 100)}%
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">of Goal</p>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                      <p>Start: {new Date(sleep.startTime).toLocaleTimeString()}</p>
                      <p>End: {new Date(sleep.endTime).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                  <p className="text-gray-500 dark:text-gray-400">No sleep data available today</p>
                </div>
              )}
            </div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* Recommendations */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Insights</h3>
                <div className="space-y-3">
                  {progressData && progressData.steps < 50 && (
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-blue-600 dark:text-blue-400">💡</span>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        You're below your step goal. Try taking a walk or using the stairs more today!
                      </p>
                    </div>
                  )}
                  
                  {progressData && progressData.calories > 80 && (
                    <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-green-600 dark:text-green-400">🎉</span>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Great job! You're exceeding your calorie burn goal today.
                      </p>
                    </div>
                  )}

                  {fitnessData.heartRate.length > 0 && (
                    <div className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <span className="text-purple-600 dark:text-purple-400">❤️</span>
                      <p className="text-sm text-purple-800 dark:text-purple-200">
                        Your heart rate data shows good cardiovascular activity today.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Goals Progress */}
              {fitnessGoals && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Goal Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Daily Steps</span>
                        <span>{fitnessData.steps} / {fitnessGoals.dailySteps}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((fitnessData.steps / fitnessGoals.dailySteps) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Weekly Workouts</span>
                        <span>{weeklyStats.totalWorkouts} / {fitnessGoals.weeklyWorkouts}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((weeklyStats.totalWorkouts / fitnessGoals.weeklyWorkouts) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FitnessDashboard;
