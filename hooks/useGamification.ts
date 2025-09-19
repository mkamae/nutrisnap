import { useState, useEffect, useCallback } from 'react';
import { GamificationData, GamificationEvent } from '../types/gamification';
import { gamificationService } from '../services/gamificationService';

export const useGamification = () => {
  const [data, setData] = useState<GamificationData>(gamificationService.getDefaultData());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const gamificationData = gamificationService.loadData();
      setData(gamificationData);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const awardMealPoints = useCallback((): GamificationEvent => {
    const event = gamificationService.awardMealPoints();
    const newBadges = gamificationService.checkBadgeUnlocks();
    loadData();
    return { ...event, badgeUnlocked: newBadges[0] };
  }, []);

  const awardWorkoutPoints = useCallback((): GamificationEvent => {
    const event = gamificationService.awardWorkoutPoints();
    const newBadges = gamificationService.checkBadgeUnlocks();
    loadData();
    return { ...event, badgeUnlocked: newBadges[0] };
  }, []);

  const getCurrentLevel = useCallback(() => {
    return gamificationService.getLevelInfo(data.level);
  }, [data.level]);

  const getProgress = useCallback(() => {
    return gamificationService.calculateProgress(data.points, data.level);
  }, [data.points, data.level]);

  const getUnlockedBadges = useCallback(() => {
    const badges = gamificationService.getBadges();
    return badges.filter(badge => data.unlockedBadges.includes(badge.id));
  }, [data.unlockedBadges]);

  return {
    data,
    isLoading,
    awardMealPoints,
    awardWorkoutPoints,
    getCurrentLevel,
    getProgress,
    getUnlockedBadges,
    refreshData: loadData,
  };
};
