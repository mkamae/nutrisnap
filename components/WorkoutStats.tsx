import React, { useState, useEffect } from 'react';
import { WorkoutCompletion } from '../types';
import { guidedWorkoutService } from '../services/guidedWorkoutService';

interface WorkoutStatsProps {
  currentUserId: string | null;
}

const WorkoutStats: React.FC<WorkoutStatsProps> = ({ currentUserId }) => {
  const [todayStats, setTodayStats] = useState({
    workoutsCompleted: 0,
    minutesExercised: 0,
    exercisesCompleted: 0
  });
  const [weekStats, setWeekStats] = useState({
    workoutsCompleted: 0,
    totalMinutes: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentUserId) {
      loadStats();
    }
  }, [currentUserId]);

  const loadStats = async () => {
    if (!currentUserId) return;
    
    try {
      setIsLoading(true);
      
      // Get last 7 days of data
      const completions = await guidedWorkoutService.getWorkoutHistory(currentUserId, 7);
      
      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todayCompletions = completions.filter(completion => 
        completion.completed_at.split('T')[0] === today
      );
      
      const todayMinutes = todayCompletions.reduce((sum, c) => sum + c.duration_minutes, 0);
      const todayExercises = todayCompletions.reduce((sum, c) => sum + c.exercises_completed, 0);
      
      setTodayStats({
        workoutsCompleted: todayCompletions.length,
        minutesExercised: todayMinutes,
        exercisesCompleted: todayExercises
      });
      
      // Calculate week stats
      const weekMinutes = completions.reduce((sum, c) => sum + c.duration_minutes, 0);
      
      setWeekStats({
        workoutsCompleted: completions.length,
        totalMinutes: weekMinutes
      });
      
    } catch (error) {
      console.error('Error loading workout stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUserId || isLoading) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Guided Workouts</h3>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Today's Stats */}
        <div>
          <h4 className="text-sm font-medium opacity-90 mb-2">Today</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Workouts:</span>
              <span className="font-semibold">{todayStats.workoutsCompleted}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Minutes:</span>
              <span className="font-semibold">{todayStats.minutesExercised}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Exercises:</span>
              <span className="font-semibold">{todayStats.exercisesCompleted}</span>
            </div>
          </div>
        </div>
        
        {/* Week Stats */}
        <div>
          <h4 className="text-sm font-medium opacity-90 mb-2">This Week</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Workouts:</span>
              <span className="font-semibold">{weekStats.workoutsCompleted}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Min:</span>
              <span className="font-semibold">{weekStats.totalMinutes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Avg/Day:</span>
              <span className="font-semibold">{Math.round(weekStats.totalMinutes / 7)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutStats;