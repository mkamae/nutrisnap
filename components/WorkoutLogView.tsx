import React, { useState } from 'react';
import { WorkoutSession } from '../types';

interface WorkoutLogViewProps {
  onLogWorkout: (session: Omit<WorkoutSession, 'id' | 'created_at'>) => void;
  onCancel: () => void;
}

const WorkoutLogView: React.FC<WorkoutLogViewProps> = ({ onLogWorkout, onCancel }) => {
  const [workoutData, setWorkoutData] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    totalDurationMinutes: 30,
    caloriesBurned: 0,
    notes: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setWorkoutData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const session: Omit<WorkoutSession, 'id' | 'created_at'> = {
      userId: '', // This will be set by the parent component
      routineId: undefined,
      sessionDate: workoutData.sessionDate,
      startTime: workoutData.startTime || undefined,
      endTime: workoutData.endTime || undefined,
      totalDurationMinutes: workoutData.totalDurationMinutes,
      caloriesBurned: workoutData.caloriesBurned,
      notes: workoutData.notes || undefined
    };

    onLogWorkout(session);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log Workout</h1>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Workout Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Workout Date
                </label>
                <input
                  type="date"
                  value={workoutData.sessionDate}
                  onChange={(e) => handleInputChange('sessionDate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={workoutData.totalDurationMinutes}
                  onChange={(e) => handleInputChange('totalDurationMinutes', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  max="300"
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
                  value={workoutData.caloriesBurned}
                  onChange={(e) => handleInputChange('caloriesBurned', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                  max="2000"
                  placeholder="Estimated calories burned"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={workoutData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="What exercises did you do? How did it feel?"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Log Workout
          </button>
        </form>
      </div>
    </div>
  );
};

export default WorkoutLogView;
