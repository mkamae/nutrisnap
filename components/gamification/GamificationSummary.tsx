import React from 'react';
import { GamificationData } from '../../types/gamification';
import { gamificationService } from '../../services/gamificationService';

interface GamificationSummaryProps {
  data: GamificationData;
}

const GamificationSummary: React.FC<GamificationSummaryProps> = ({ data }) => {
  const currentLevel = gamificationService.getLevelInfo(data.level);
  const progress = gamificationService.calculateProgress(data.points, data.level);
  const badges = gamificationService.getBadges();
  const unlockedBadges = badges.filter(badge => data.unlockedBadges.includes(badge.id));

  return (
    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md border border-indigo-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
        <span className="text-2xl mr-2">🏆</span>
        Achievement Summary
      </h3>

      {/* Level and Points */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-2xl mb-1">{currentLevel.emoji}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {data.level}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {currentLevel.title}
          </div>
        </div>
        <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-2xl mb-1">⭐</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Points</div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
            {data.points}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(progress)}% to next level
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {data.streak}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Day Streak</div>
        </div>
        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {data.totalMealsLogged}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Meals</div>
        </div>
        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {data.totalWorkoutsCompleted}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Workouts</div>
        </div>
        <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {data.totalLogins}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Logins</div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Badges Earned
          </h4>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {unlockedBadges.length}/{badges.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {unlockedBadges.map(badge => (
            <div
              key={badge.id}
              className="flex items-center px-2 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 rounded-full border border-yellow-300 dark:border-yellow-700"
            >
              <span className="text-sm mr-1">{badge.emoji}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {badge.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamificationSummary;
