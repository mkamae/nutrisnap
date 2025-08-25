import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, WorkoutSession, WorkoutRoutine } from '../types';
import { googleFitnessService, GoogleWorkout } from '../services/googleFitnessService';
import { workoutService } from '../services/supabaseService';

interface EnhancedWorkoutViewProps {
  profile: UserProfile | null;
  workoutSessions: WorkoutSession[];
  onWorkoutUpdate: (sessions: WorkoutSession[]) => void;
  setCurrentView: (view: string) => void;
}

const EnhancedWorkoutView: React.FC<EnhancedWorkoutViewProps> = ({
  profile,
  workoutSessions,
  onWorkoutUpdate,
  setCurrentView
}) => {
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false);
  const [googleWorkouts, setGoogleWorkouts] = useState<GoogleWorkout[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'routines' | 'sync'>('overview');
  const [workoutRoutines, setWorkoutRoutines] = useState<WorkoutRoutine[]>([]);
  const [workoutForm, setWorkoutForm] = useState({
    type: '',
    duration: 30,
    calories: 150,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Google Fitness connection
  useEffect(() => {
    const initFitness = async () => {
      try {
        const initialized = await googleFitnessService.initialize();
        if (initialized) {
          setIsConnected(true);
          await loadGoogleWorkouts();
        }
      } catch (err) {
        console.error('Failed to initialize fitness service:', err);
      }
    };

    initFitness();
  }, []);

  // Load workout routines
  useEffect(() => {
    const loadRoutines = async () => {
      if (profile?.user_id) {
        try {
          const routines = await workoutService.getWorkoutRoutines(profile.user_id);
          setWorkoutRoutines(routines);
        } catch (err) {
          console.error('Failed to load workout routines:', err);
        }
      }
    };

    loadRoutines();
  }, [profile]);

  // Load Google Fitness workouts
  const loadGoogleWorkouts = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fitnessData = await googleFitnessService.getTodayFitnessData();
      setGoogleWorkouts(fitnessData.workouts);
    } catch (err: any) {
      console.error('Failed to load Google workouts:', err);
      setError(err.message || 'Failed to load workouts');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync Google Fitness workouts
  const handleSyncWorkouts = async () => {
    if (!isConnected || !profile?.user_id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const syncedWorkouts = await googleFitnessService.syncWorkouts();
      
      // Map Google workouts to local format and save to database
      const mappedWorkouts: Omit<WorkoutSession, 'id' | 'created_at'>[] = syncedWorkouts.map(workout => ({
        userId: profile.user_id,
        routineId: undefined,
        sessionDate: workout.startTime.split('T')[0],
        startTime: workout.startTime,
        endTime: workout.endTime,
        totalDurationMinutes: workout.duration,
        caloriesBurned: workout.calories,
        notes: `${workout.name} (${workout.activityType})`
      }));

      // Save each workout to database
      const savedWorkouts: WorkoutSession[] = [];
      for (const workout of mappedWorkouts) {
        try {
          const saved = await workoutService.logWorkoutSession(workout, profile.user_id);
          savedWorkouts.push(saved);
        } catch (err) {
          console.error('Failed to save workout:', err);
        }
      }

      // Update local state
      const updatedSessions = [...workoutSessions, ...savedWorkouts];
      onWorkoutUpdate(updatedSessions);
      
      // Reload Google workouts
      await loadGoogleWorkouts();
      
      setError(null);
    } catch (err: any) {
      console.error('Failed to sync workouts:', err);
      setError(err.message || 'Failed to sync workouts');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle workout form submission
  const handleSubmitWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newWorkout: Omit<WorkoutSession, 'id' | 'created_at'> = {
        userId: profile.user_id,
        routineId: undefined,
        sessionDate: workoutForm.date,
        startTime: new Date(workoutForm.date).toISOString(),
        endTime: new Date(new Date(workoutForm.date).getTime() + workoutForm.duration * 60000).toISOString(),
        totalDurationMinutes: workoutForm.duration,
        caloriesBurned: workoutForm.calories,
        notes: `${workoutForm.type} workout${workoutForm.notes ? `: ${workoutForm.notes}` : ''}`
      };

      const savedWorkout = await workoutService.logWorkoutSession(newWorkout, profile.user_id);
      
      // Update local state
      const updatedSessions = [...workoutSessions, savedWorkout];
      onWorkoutUpdate(updatedSessions);
      
      // Reset form and close
      setWorkoutForm({
        type: '',
        duration: 30,
        calories: 150,
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setIsLoggingWorkout(false);
      setError(null);
    } catch (err: any) {
      console.error('Failed to save workout:', err);
      setError(err.message || 'Failed to save workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate workout statistics
  const workoutStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    const todaySessions = workoutSessions.filter(s => s.sessionDate === today);
    const weekSessions = workoutSessions.filter(s => new Date(s.sessionDate) >= weekStart);
    
    return {
      today: {
        count: todaySessions.length,
        calories: todaySessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0),
        minutes: todaySessions.reduce((sum, s) => sum + (s.totalDurationMinutes || 0), 0)
      },
      week: {
        count: weekSessions.length,
        calories: weekSessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0),
        minutes: weekSessions.reduce((sum, s) => sum + (s.totalDurationMinutes || 0), 0)
      },
      total: {
        count: workoutSessions.length,
        calories: workoutSessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0),
        minutes: workoutSessions.reduce((sum, s) => sum + (s.totalDurationMinutes || 0), 0)
      }
    };
  }, [workoutSessions]);

  // Calculate calories vs nutrition balance
  const nutritionBalance = useMemo(() => {
    if (!profile?.dailyCalorieGoal) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const todayWorkoutCalories = workoutSessions
      .filter(s => s.sessionDate === today)
      .reduce((sum, s) => sum + (s.caloriesBurned || 0), 0);
    
    return {
      dailyGoal: profile.dailyCalorieGoal,
      workoutCalories: todayWorkoutCalories,
      remaining: profile.dailyCalorieGoal + todayWorkoutCalories
    };
  }, [workoutSessions, profile]);

  if (isLoggingWorkout) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Log Workout</h2>
          <button
            onClick={() => setIsLoggingWorkout(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        {/* Workout logging form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <form onSubmit={handleSubmitWorkout} className="space-y-6">
            {/* Workout Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Workout Type
              </label>
              <select
                value={workoutForm.type}
                onChange={(e) => setWorkoutForm({ ...workoutForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select workout type</option>
                <option value="cardio">Cardio</option>
                <option value="strength">Strength Training</option>
                <option value="flexibility">Flexibility/Yoga</option>
                <option value="sports">Sports</option>
                <option value="walking">Walking</option>
                <option value="running">Running</option>
                <option value="cycling">Cycling</option>
                <option value="swimming">Swimming</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={workoutForm.duration}
                onChange={(e) => setWorkoutForm({ ...workoutForm, duration: parseInt(e.target.value) || 0 })}
                min="1"
                max="480"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="30"
                required
              />
            </div>

            {/* Calories Burned */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Calories Burned
              </label>
              <input
                type="number"
                value={workoutForm.calories}
                onChange={(e) => setWorkoutForm({ ...workoutForm, calories: parseInt(e.target.value) || 0 })}
                min="0"
                max="2000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="150"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={workoutForm.date}
                onChange={(e) => setWorkoutForm({ ...workoutForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={workoutForm.notes}
                onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="How did your workout feel? Any specific exercises?"
              />
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                {isSubmitting ? 'Saving...' : 'Save Workout'}
              </button>
              <button
                type="button"
                onClick={() => setIsLoggingWorkout(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Tracking</h2>
          <p className="text-gray-600 dark:text-gray-400">Monitor your fitness progress and sync with Google Fitness</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsLoggingWorkout(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            + Log Workout
          </button>
          {isConnected && (
            <button
              onClick={handleSyncWorkouts}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isLoading ? 'Syncing...' : 'Sync Google Fitness'}
            </button>
          )}
        </div>
      </div>

      {/* Google Fitness Connection Status */}
      {!isConnected && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-blue-800 dark:text-blue-200 font-medium">Connect Google Fitness</p>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Sync your workouts from Google Fit, Wear OS, and other fitness apps
              </p>
            </div>
            <button
              onClick={() => googleFitnessService.authenticate()}
              className="ml-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Connect
            </button>
          </div>
        </div>
      )}

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
            { id: 'history', label: 'History', icon: '📅' },
            { id: 'routines', label: 'Routines', icon: '💪' },
            { id: 'sync', label: 'Sync', icon: '🔄' }
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading workout data...</p>
        </div>
      )}

      {/* Tab Content */}
      {!isLoading && (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Today's Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💪</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {workoutStats.today.count}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Workouts Today</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {workoutStats.today.calories}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Calories Burned</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {workoutStats.today.minutes}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Active Minutes</p>
                </div>
              </div>

              {/* Weekly Progress */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">This Week</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {workoutStats.week.count}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Total Workouts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {workoutStats.week.calories}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Calories Burned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {workoutStats.week.minutes}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Active Minutes</p>
                  </div>
                </div>
              </div>

              {/* Nutrition Balance */}
              {nutritionBalance && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Balance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {nutritionBalance.dailyGoal}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">Daily Calorie Goal</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        +{nutritionBalance.workoutCalories}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">Workout Bonus</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {nutritionBalance.remaining}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">Total Available</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200 text-center">
                      💡 You can eat {nutritionBalance.workoutCalories} more calories today thanks to your workouts!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Workouts</h3>
                {workoutSessions.length > 0 ? (
                  <div className="space-y-3">
                    {workoutSessions.slice(0, 10).map(session => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {session.notes || 'Workout Session'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {session.sessionDate} • {session.totalDurationMinutes} min
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600 dark:text-red-400">
                            {session.caloriesBurned} cal
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {session.startTime ? new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No workouts logged yet. Start by logging your first workout!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Routines Tab */}
          {activeTab === 'routines' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Workout Routines</h3>
                {workoutRoutines.length > 0 ? (
                  <div className="space-y-3">
                    {workoutRoutines.map(routine => (
                      <div key={routine.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white">{routine.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {routine.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Frequency: {routine.frequency}</span>
                          <span>Active: {routine.isActive ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No workout routines created yet.
                    </p>
                    <button
                      onClick={() => setCurrentView('onboarding')}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Create Routine
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sync Tab */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* Google Fitness Status */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Google Fitness Integration</h3>
                
                {isConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-green-600 dark:text-green-400">✅</span>
                      <p className="text-green-800 dark:text-green-200">
                        Connected to Google Fitness
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Today's Workouts</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {googleWorkouts.length}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Last Sync</p>
                        <p className="text-sm font-medium">
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleSyncWorkouts}
                      disabled={isLoading}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {isLoading ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Connect Google Fitness
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Sync your workouts from Google Fit, Wear OS, and other fitness apps
                    </p>
                    <button
                      onClick={() => googleFitnessService.authenticate()}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Connect Now
                    </button>
                  </div>
                )}
              </div>

              {/* Sync Benefits */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Benefits of Syncing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-green-600 dark:text-green-400">🔄</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Automatic Sync</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Workouts automatically sync from your devices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 dark:text-blue-400">📊</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Comprehensive Data</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Steps, heart rate, sleep, and more
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-600 dark:text-purple-400">🎯</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Better Insights</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get personalized recommendations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-orange-600 dark:text-orange-400">📱</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Multi-Device</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Works with phones, watches, and fitness trackers
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedWorkoutView;
