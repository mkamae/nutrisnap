import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, MealEntry, View, Workout } from './types';
import { authService, profileService, mealService, workoutService } from './services/supabaseService';
import { supabase } from './services/supabaseService';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import AddMealView from './components/AddMealView';
import ProfileView from './components/ProfileView';
import OnboardingView from './components/OnboardingView';
import WorkoutView from './components/WorkoutView';
import BottomNav from './components/BottomNav';
import GuidedWorkoutsView from './components/GuidedWorkoutsView';
import WorkoutPlayer from './components/WorkoutPlayer';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoggingWorkout, setIsLoggingWorkout] = useState(false);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🔍 Initializing app...');
        const user = await authService.getCurrentUser();
        console.log('👤 Current user:', user ? user.id : 'No user');
        
        if (user) {
          setCurrentUserId(user.id);
          setIsAuthenticated(true);
          await loadUserData(user.id);
        } else {
          console.log('🚫 No authenticated user found, showing auth view');
        }
      } catch (error) {
        console.error('❌ Error initializing app:', error);
      } finally {
        console.log('✅ App initialization complete, setting loading to false');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setCurrentUserId(session.user.id);
          setIsAuthenticated(true);
          await loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUserId(null);
          setIsAuthenticated(false);
          setUserProfile(null);
          setMealEntries([]);
          setWorkouts([]);
          setHasCompletedOnboarding(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      console.log('Loading user data for:', userId);
      
      // Check localStorage for onboarding completion status
      const onboardingCompleted = localStorage.getItem(`onboarding_completed_${userId}`);
      
      // Load profile
      const profile = await profileService.getProfile(userId);
      if (profile) {
        setUserProfile(profile);
        setHasCompletedOnboarding(true);
        console.log('Profile loaded from database:', profile);
      } else if (onboardingCompleted === 'true') {
        // User has completed onboarding before but profile might be missing
        // This could happen if the database was cleared or there was an error
        console.log('Onboarding completed before but no profile found, setting as completed');
        setHasCompletedOnboarding(true);
      } else {
        console.log('No profile found and no onboarding record, user needs onboarding');
        setHasCompletedOnboarding(false);
      }

      // Load meals
      const meals = await mealService.getMeals(userId);
      setMealEntries(meals);
      console.log('Meals loaded:', meals.length);

      // Load workouts
      const workouts = await workoutService.getWorkouts(userId);
      setWorkouts(workouts);
      console.log('Workouts loaded:', workouts.length);

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogin = async (email: string, password: string, isSignUp: boolean) => {
    try {
      let result;
      if (isSignUp) {
        result = await authService.signUp(email, password);
      } else {
        result = await authService.signIn(email, password);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.user) {
        setCurrentUserId(result.user.id);
        setIsAuthenticated(true);
        await loadUserData(result.user.id);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      // Auth state change listener will handle clearing the state
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    if (!currentUserId) return;

    try {
      // Ensure profile has the correct user_id
      const profileWithUserId = { ...profile, user_id: currentUserId };
      
      // Save profile to database
      const savedProfile = await profileService.upsertProfile(profileWithUserId, currentUserId);
      setUserProfile(savedProfile);
      
      // Note: Workout routine creation removed - using simple workout tracking instead

      // Mark onboarding as completed and persist to localStorage
      setHasCompletedOnboarding(true);
      localStorage.setItem(`onboarding_completed_${currentUserId}`, 'true');
      
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const handleOnboardingSkip = () => {
    setHasCompletedOnboarding(true);
    // Also persist the skip to localStorage
    if (currentUserId) {
      localStorage.setItem(`onboarding_completed_${currentUserId}`, 'true');
    }
    setCurrentView('dashboard');
  };

  const addMealEntry = async (meal: Omit<MealEntry, 'id' | 'created_at'>) => {
    if (!currentUserId) {
      throw new Error('No authenticated user found');
    }

    try {
      const savedMeal = await mealService.addMeal(meal, currentUserId);
      
      // Map the saved meal to the correct format
      const mappedMeal: MealEntry = {
        id: savedMeal.id,
        mealName: savedMeal.mealName,
        portionSize: savedMeal.portionSize,
        imageUrl: savedMeal.imageUrl,
        calories: savedMeal.calories,
        protein: savedMeal.protein,
        carbs: savedMeal.carbs,
        fat: savedMeal.fat,
        date: savedMeal.date,
        user_id: savedMeal.user_id,
        created_at: savedMeal.created_at
      };

      setMealEntries(prev => [mappedMeal, ...prev]);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error saving meal:', error);
      throw error;
    }
  };

  const handleProfileUpdate = async (updatedProfile: UserProfile) => {
    if (!currentUserId) return;

    try {
      console.log('Updating profile:', updatedProfile);
      const savedProfile = await profileService.upsertProfile(updatedProfile, currentUserId);
      console.log('Profile saved to DB:', savedProfile);
      setUserProfile(savedProfile);
      console.log('User profile state updated:', savedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const logWorkout = async (workout: Omit<Workout, 'id' | 'created_at'>) => {
    if (!currentUserId) {
      throw new Error('No authenticated user found');
    }

    try {
      const workoutWithUserId = { ...workout, user_id: currentUserId };
      const savedWorkout = await workoutService.createWorkout(workoutWithUserId, currentUserId);
      setWorkouts(prev => [savedWorkout, ...prev]);
      setIsLoggingWorkout(false);
      setCurrentView('workouts');
    } catch (error) {
      console.error('Error logging workout:', error);
      throw error;
    }
  };

  // Calculate today's entries and totals
  const todaysEntries = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    console.log('Today\'s date:', today);
    console.log('All meal entries:', mealEntries);
    
    const entries = mealEntries.filter(entry => {
      const entryDate = entry.date;
      console.log('Entry date:', entryDate, 'Type:', typeof entryDate);
      
      // Handle both date strings and Date objects
      if (typeof entryDate === 'string') {
        return entryDate.includes(today) || entryDate.split('T')[0] === today;
      }
      return false;
    });
    
    console.log('Filtered today\'s entries:', entries);
    
    const totals = entries.reduce((acc, entry) => ({
      calories: acc.calories + (entry.calories || 0),
      protein: acc.protein + (entry.protein || 0),
      carbs: acc.carbs + (entry.carbs || 0),
      fat: acc.fat + (entry.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    console.log('Today\'s totals:', totals);
    
    return { entries, totals };
  }, [mealEntries]);

  // Calculate workout calories burned today
  const todaysWorkoutCalories = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return workouts
      .filter(workout => workout.workout_date === today)
      .reduce((total, workout) => total + (workout.calories_burned || 0), 0);
  }, [workouts]);

  // Calculate net calories (consumed - burned)
  const netCalories = todaysEntries.totals.calories - todaysWorkoutCalories;
  const caloriesLeft = (userProfile?.dailyCalorieGoal || 2500) - netCalories;

  // Debug logging
  console.log('🔍 APP STATE DEBUG:', {
    isLoading,
    isAuthenticated,
    currentUserId,
    hasCompletedOnboarding,
    currentView,
    userProfile: userProfile?.name,
    mealEntriesCount: mealEntries.length,
    workoutsCount: workouts.length
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading NutriSnap...</p>
        </div>
      </div>
    );
  }

  // Show onboarding for new users
  if (isAuthenticated && !hasCompletedOnboarding) {
    return (
      <OnboardingView
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  // Show auth view for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthView onLogin={handleLogin} />
      </div>
    );
  }

  // Show workout logging view
  if (isLoggingWorkout) {
    return (
      <WorkoutView
        profile={userProfile}
        workouts={workouts}
        onWorkoutUpdate={setWorkouts}
        setCurrentView={setCurrentView}
      />
    );
  }

  // Render main app for authenticated users
  const renderView = () => {
    if (!isAuthenticated || !currentUserId) {
      return <DashboardView entries={[]} profile={null} setCurrentView={setCurrentView} />;
    }

    // Create a wrapper function to match the expected signature
    const handleViewChange = (view: View) => {
      setCurrentView(view);
    };

    switch (currentView) {
      case 'onboarding':
        return (
          <OnboardingView
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        );
      case 'add_meal':
        return (
          <AddMealView
            onConfirm={addMealEntry}
            onCancel={() => setCurrentView('dashboard')}
          />
        );
      case 'profile':
        return (
          <ProfileView
            profile={userProfile!}
            onLogout={handleLogout}
            onProfileUpdate={handleProfileUpdate}
          />
        );
      case 'workouts':
        return (
          <WorkoutView
            profile={userProfile}
            workouts={workouts}
            onWorkoutUpdate={setWorkouts}
            setCurrentView={handleViewChange}
          />
        );
      case 'guided_workouts':
        return (
          <GuidedWorkoutsView
            setCurrentView={handleViewChange}
            currentUserId={currentUserId}
          />
        );
      case 'workout_player':
        return (
          <WorkoutPlayer
            setCurrentView={handleViewChange}
            currentUserId={currentUserId}
          />
        );
      case 'activity':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Activity Summary</h2>
            <p className="text-gray-600 dark:text-gray-400">Activity tracking coming soon...</p>
          </div>
        );
      default:
        return (
          <DashboardView
            entries={todaysEntries.entries}
            profile={userProfile}
            setCurrentView={handleViewChange}
            workoutCalories={todaysWorkoutCalories}
            netCalories={netCalories}
            caloriesLeft={caloriesLeft}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="pb-20">
        {renderView()}
      </div>
      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}

export default App;