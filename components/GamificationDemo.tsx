import React, { useState, useEffect } from 'react';
import { gamificationService } from '../services/gamificationService';
import { GamificationData } from '../types/gamification';

const GamificationDemo: React.FC = () => {
  const [data, setData] = useState<GamificationData>(gamificationService.getDefaultData());
  const [showNotification, setShowNotification] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const gamificationData = gamificationService.loadData();
    setData(gamificationData);
  };

  const handleMealLogged = () => {
    const event = gamificationService.awardMealPoints();
    const newBadges = gamificationService.checkBadgeUnlocks();
    
    loadData();
    
    if (event.levelUp) {
      setShowNotification('🎉 Level Up!');
      setTimeout(() => setShowNotification(null), 3000);
    }
    
    if (newBadges.length > 0) {
      setShowNotification(`🏆 Badge Unlocked: ${newBadges[0]}`);
      setTimeout(() => setShowNotification(null), 3000);
    }
  };

  const handleWorkoutCompleted = () => {
    const event = gamificationService.awardWorkoutPoints();
    const newBadges = gamificationService.checkBadgeUnlocks();
    
    loadData();
    
    if (event.levelUp) {
      setShowNotification('🎉 Level Up!');
      setTimeout(() => setShowNotification(null), 3000);
    }
    
    if (newBadges.length > 0) {
      setShowNotification(`🏆 Badge Unlocked: ${newBadges[0]}`);
      setTimeout(() => setShowNotification(null), 3000);
    }
  };

  const currentLevel = gamificationService.getLevelInfo(data.level);
  const progress = gamificationService.calculateProgress(data.points, data.level);
  const badges = gamificationService.getBadges();
  const unlockedBadges = badges.filter(badge => data.unlockedBadges.includes(badge.id));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          {showNotification}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎮 NutriSnap Gamification Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test the gamification system - works completely offline!
          </p>
        </div>

        {/* Gamification Panel */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md border border-blue-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
              <span className="text-3xl mr-3">🎮</span>
              Your Progress
            </h2>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Points</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {data.points}
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{currentLevel.emoji}</span>
                <div>
                  <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                    Level {data.level} - {currentLevel.title}
                  </span>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {data.points - ((data.level - 1) * 100)} / 100 points to next level
                  </div>
                </div>
              </div>
              <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {data.streak}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.totalMealsLogged}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Meals</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {data.totalWorkoutsCompleted}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Workouts</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {unlockedBadges.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Badges</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={handleMealLogged}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg text-lg font-medium transition-colors flex items-center justify-center"
            >
              <span className="text-xl mr-2">🍽️</span>
              Log Meal (+10 pts)
            </button>
            <button
              onClick={handleWorkoutCompleted}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg text-lg font-medium transition-colors flex items-center justify-center"
            >
              <span className="text-xl mr-2">💪</span>
              Complete Workout (+20 pts)
            </button>
          </div>

          {/* Badges Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Badges ({unlockedBadges.length}/{badges.length})
            </h3>
            <div className="grid grid-cols-7 gap-3">
              {badges.map(badge => {
                const isUnlocked = data.unlockedBadges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`text-center p-3 rounded-lg transition-all ${
                      isUnlocked
                        ? 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 border border-yellow-300 dark:border-yellow-700'
                        : 'bg-gray-100 dark:bg-gray-700 opacity-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{badge.emoji}</div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {badge.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {badge.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            🎯 How to Test
          </h3>
          <div className="space-y-3 text-gray-600 dark:text-gray-400">
            <p>• Click "Log Meal" to simulate logging a meal (+10 points)</p>
            <p>• Click "Complete Workout" to simulate finishing a workout (+20 points)</p>
            <p>• Watch your level progress bar fill up</p>
            <p>• Unlock badges by reaching certain milestones</p>
            <p>• Your progress is saved in localStorage and persists across page refreshes</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationDemo;
