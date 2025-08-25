import React, { useState, useEffect } from 'react';
import { UserProfile, Workout } from '../types';
import { workoutService } from '../services/supabaseService';

interface WorkoutViewProps {
  profile: UserProfile | null;
  workouts: Workout[];
  onWorkoutUpdate: (workouts: Workout[]) => void;
}

const WorkoutView: React.FC<WorkoutViewProps> = ({ 
  profile, 
  workouts, 
  onWorkoutUpdate
}) => {
  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [workoutForm, setWorkoutForm] = useState({
    workout_type: '',
    duration_minutes: 30,
    calories_burned: 150,
    workout_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingWorkout) {
        // Update existing workout
        const updatedWorkout = await workoutService.updateWorkout({
          ...editingWorkout,
          ...workoutForm
        }, profile.user_id);
        
        const updatedWorkouts = workouts.map(w => 
          w.id === updatedWorkout.id ? updatedWorkout : w
        );
        onWorkoutUpdate(updatedWorkouts);
        setEditingWorkout(null);
      } else {
        // Create new workout
        const newWorkout = await workoutService.createWorkout(workoutForm, profile.user_id);
        onWorkoutUpdate([newWorkout, ...workouts]);
      }

      // Reset form
      setWorkoutForm({
        workout_type: '',
        duration_minutes: 30,
        calories_burned: 150,
        workout_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setIsAddingWorkout(false);
    } catch (err: any) {
      console.error('Failed to save workout:', err);
      setError(err.message || 'Failed to save workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (workout: Workout) => {
    setEditingWorkout(workout);
    setWorkoutForm({
      workout_type: workout.workout_type,
      duration_minutes: workout.duration_minutes,
      calories_burned: workout.calories_burned || 0,
      workout_date: workout.workout_date,
      notes: workout.notes || ''
    });
    setIsAddingWorkout(true);
  };

  const handleDelete = async (workoutId: string) => {
    if (!profile?.user_id || !confirm('Are you sure you want to delete this workout?')) return;

    try {
      await workoutService.deleteWorkout(workoutId, profile.user_id);
      const updatedWorkouts = workouts.filter(w => w.id !== workoutId);
      onWorkoutUpdate(updatedWorkouts);
    } catch (err: any) {
      console.error('Failed to delete workout:', err);
      setError(err.message || 'Failed to delete workout');
    }
  };

  const handleCancel = () => {
    setIsAddingWorkout(false);
    setEditingWorkout(null);
    setWorkoutForm({
      workout_type: '',
      duration_minutes: 30,
      calories_burned: 150,
      workout_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setError(null);
  };

  const todayWorkouts = workouts.filter(w => w.workout_date === new Date().toISOString().split('T')[0]);
  const totalCaloriesBurned = todayWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
  const totalMinutes = todayWorkouts.reduce((sum, w) => sum + w.duration_minutes, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workouts</h2>
          <p className="text-gray-600 dark:text-gray-400">Track your fitness activities</p>
        </div>
        <button
          onClick={() => setIsAddingWorkout(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add Workout
        </button>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Workouts</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{todayWorkouts.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Minutes</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalMinutes}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Calories Burned</h3>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalCaloriesBurned}</p>
        </div>
      </div>

      {/* Add/Edit Workout Form */}
      {isAddingWorkout && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingWorkout ? 'Edit Workout' : 'Add New Workout'}
          </h3>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Workout Type
                </label>
                <input
                  type="text"
                  value={workoutForm.workout_type}
                  onChange={(e) => setWorkoutForm({...workoutForm, workout_type: e.target.value})}
                  placeholder="e.g., Running, Weight Training, Yoga"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={workoutForm.workout_date}
                  onChange={(e) => setWorkoutForm({...workoutForm, workout_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={workoutForm.duration_minutes}
                  onChange={(e) => setWorkoutForm({...workoutForm, duration_minutes: parseInt(e.target.value)})}
                  min="1"
                  max="480"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calories Burned
                </label>
                <input
                  type="number"
                  value={workoutForm.calories_burned}
                  onChange={(e) => setWorkoutForm({...workoutForm, calories_burned: parseInt(e.target.value)})}
                  min="0"
                  max="2000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={workoutForm.notes}
                onChange={(e) => setWorkoutForm({...workoutForm, notes: e.target.value})}
                placeholder="Any additional notes about your workout..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isSubmitting ? 'Saving...' : (editingWorkout ? 'Update Workout' : 'Save Workout')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workout History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Workouts</h3>
        </div>
        
        {workouts.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>No workouts recorded yet. Start by adding your first workout!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {workouts.map((workout) => (
              <div key={workout.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {workout.workout_type}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(workout.workout_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Duration: {workout.duration_minutes} min</span>
                      {workout.calories_burned && (
                        <span>Calories: {workout.calories_burned}</span>
                      )}
                    </div>
                    {workout.notes && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {workout.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(workout)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1 rounded text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(workout.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 px-3 py-1 rounded text-sm font-medium"
                    >
                      Delete
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

export default WorkoutView;
