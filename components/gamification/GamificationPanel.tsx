import React, { useState, useEffect } from 'react';
import { GamificationData, Badge, Level } from '../../types/gamification';
import { gamificationService } from '../../services/gamificationService';

interface GamificationPanelProps {
  onMealLogged?: () => void;
  onWorkoutCompleted?: () => void;
}

const GamificationPanel: React.FC<GamificationPanelProps> = ({
  onMealLogged,
  onWorkoutCompleted,
}) => {
  const [data, setData] = useState<GamificationData>(gamificationService.getDefaultData());
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showBadgeNotification, setShowBadgeNotification] = useState<string | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = () => {
    const gamificationData = gamificationService.loadData();
    const availableBadges = gamificationService.getBadges();
    
    setData(gamificationData);
    setBadges(availableBadges);
  };

  const handleMealLogged = () => {
    const event = gamificationService.awardMealPoints();
    const newBadges = gamificationService.checkBadgeUnlocks();
    
    loadGamificationData();
    
    if (event.levelUp) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    
    if (newBadges.length > 0) {
      setShowBadgeNotification(newBadges[0]);
      setTimeout(() => setShowBadgeNotification(null), 3000);
    }
    
    onMealLogged?.();
  };

  const handleWorkoutCompleted = () => {
    const event = gamificationService.awardWorkoutPoints();
    const newBadges = gamificationService.checkBadgeUnlocks();
    
    loadGamificationData();
    
    if (event.levelUp) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    
    if (newBadges.length > 0) {
      setShowBadgeNotification(newBadges[0]);
      setTimeout(() => setShowBadgeNotification(null), 3000);
    }
    
    onWorkoutCompleted?.();
  };

  const currentLevel = gamificationService.getLevelInfo(data.level);
  const nextLevel = gamificationService.getLevelInfo(data.level + 1);
  const progress = gamificationService.calculateProgress(data.points, data.level);
  const unlockedBadges = badges.filter(badge => data.unlockedBadges.includes(badge.id));

  return (
    <div className="space-y-4">
      {/* Level Up Notification */}
      {showLevelUp && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          <div className="text-center">
            <div className="text-2xl mb-1">🎉</div>
            <div className="font-bold">Level Up!</div>
            <div className="text-sm">You're now {currentLevel.title} {currentLevel.emoji}</div>
          </div>
        </div>
      )}

      {/* Badge Notification */}
      {showBadgeNotification && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
          <div className="text-center">
            <div className="text-2xl mb-1">
              {badges.find(b => b.id === showBadgeNotification)?.emoji}
            </div>
            <div className="font-bold">Badge Unlocked!</div>
            <div className="text-sm">
              {badges.find(b => b.id === showBadgeNotification)?.name}
            </div>
          </div>
        </div>
      )}

      {/* Main Gamification Panel */}
      <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md border border-blue-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
            <span className="text-2xl mr-2">🎮</span>
            Gamification
          </h3>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Points</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {data.points}
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-lg mr-2">{currentLevel.emoji}</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                Level {data.level} - {currentLevel.title}
              </span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.points - ((data.level - 1) * 100)} / {100} points to next level
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {data.streak}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Day Streak</div>
          </div>
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {data.totalMealsLogged}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Meals</div>
          </div>
          <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {data.totalWorkoutsCompleted}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Workouts</div>
          </div>
        </div>

        {/* Badges Section */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Badges ({unlockedBadges.length}/{badges.length})
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {badges.map(badge => {
              const isUnlocked = data.unlockedBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`text-center p-2 rounded-lg transition-all ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 border border-yellow-300 dark:border-yellow-700'
                      : 'bg-gray-100 dark:bg-gray-700 opacity-50'
                  }`}
                >
                  <div className="text-lg mb-1">{badge.emoji}</div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {badge.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-4">
          <button
            onClick={handleMealLogged}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            🍽️ Log Meal (+10 pts)
          </button>
          <button
            onClick={handleWorkoutCompleted}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            💪 Complete Workout (+20 pts)
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamificationPanel;
