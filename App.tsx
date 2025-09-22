import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, mealService, workoutSessionService, userProfileService } from './services/supabaseService';
import { MealEntry, WorkoutSession, UserProfile } from './types';
import { initializeAnalytics, trackPageView } from './utils/analytics';
import { gamificationService } from './services/gamificationService';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import LandingPage from './components/LandingPage';
import AddMealView from './components/AddMealView';
import ProfileView from './components/ProfileView';
import GuidedWorkoutsView from './components/GuidedWorkoutsView';
import WorkoutPlanDetail from './components/WorkoutPlanDetail';
import WorkoutPlayer from './components/WorkoutPlayer';
import ReportsView from './components/ReportsView';
import BottomNav from './components/BottomNav';
import ScanNutritionView from './components/ScanNutritionView';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');


  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🔍 Initializing app...');
        
        // Initialize Google Analytics
        initializeAnalytics();
        
        const user = await supabase.auth.getUser();
        console.log('👤 Current user:', user.data.user ? user.data.user.id : 'No user');
        
        if (user.data.user) {
          setCurrentUserId(user.data.user.id);
          setUserEmail(user.data.user.email || 'Guest');
          setIsAuthenticated(true);
          await loadUserData(user.data.user.id, user.data.user.email);
        } else {
          setUserEmail('Guest');
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
    
    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⚠️ App initialization timeout, forcing loading to false');
      setIsLoading(false);
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, []);

  // Auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setCurrentUserId(session.user.id);
          setUserEmail(session.user.email || 'Guest');
          setIsAuthenticated(true);
          await loadUserData(session.user.id, session.user.email);
          // Track sign in
          trackPageView('NutriSnap - Dashboard', window.location.href);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUserId(null);
          setUserEmail('Guest');
          setIsAuthenticated(false);
          setUserProfile(null);
          setMealEntries([]);
          setWorkoutSessions([]);
          // Track sign out
          trackPageView('NutriSnap - Sign Out', window.location.href);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string, email?: string) => {
    try {
      console.log('📊 Loading user data for:', userId);
      
      // Load user profile
      console.log('👤 Loading user profile...');
      const profile = await userProfileService.getOrCreateUserProfile(userId, email);
      setUserProfile(profile);
      console.log('✅ User profile loaded:', profile.name);
      
      // Load meals
      console.log('🍽️ Loading meals...');
      const meals = await mealService.getMeals(userId);
      setMealEntries(meals);
      console.log('✅ Meals loaded:', meals.length);
      
      // Load workout sessions
      console.log('💪 Loading workout sessions...');
      const sessions = await workoutSessionService.getWorkoutSessions(userId);
      setWorkoutSessions(sessions);
      console.log('✅ Workout sessions loaded:', sessions.length);
      
      console.log('🎉 User data loading completed');
      
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  };

  const handleLogin = async (email: string, password: string, isSignUp: boolean) => {
    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data.user) {
        setCurrentUserId(result.data.user.id);
        setUserEmail(result.data.user.email || 'Guest');
        setIsAuthenticated(true);
        await loadUserData(result.data.user.id);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Auth state change listener will handle clearing the state
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };



  const addMealEntry = (meal: MealEntry) => {
    console.log('=== ADD MEAL ENTRY ===');
    console.log('Received meal data:', meal);
    
    setMealEntries(prev => {
      const newEntries = [meal, ...prev];
      console.log('New meal entries:', newEntries);
      return newEntries;
    });
    
    // Award gamification points for meal logging
    try {
      gamificationService.awardMealPoints();
      gamificationService.checkBadgeUnlocks();
      console.log('🎮 Gamification points awarded for meal logging');
    } catch (error) {
      console.error('Error awarding gamification points:', error);
    }
    
    console.log('Meal entry added successfully!');
  };

  const handleWorkoutComplete = (session: WorkoutSession) => {
    console.log('=== WORKOUT COMPLETED ===');
    console.log('Completed session:', session);
    
    setWorkoutSessions(prev => {
      const newSessions = [session, ...prev];
      console.log('New workout sessions:', newSessions);
      return newSessions;
    });
    
    // Award gamification points for workout completion
    try {
      gamificationService.awardWorkoutPoints();
      gamificationService.checkBadgeUnlocks();
      console.log('🎮 Gamification points awarded for workout completion');
    } catch (error) {
      console.error('Error awarding gamification points:', error);
    }
    
    console.log('Workout session added successfully!');
  };

  // Calculate today's entries and totals
  const todaysEntries = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    console.log('Today\'s date:', today);
    console.log('All meal entries:', mealEntries);
    
    const entries = mealEntries.filter(entry => {
      return entry.date === today;
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
  const todaysWorkoutCalories = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return workoutSessions
      .filter(session => {
        const sessionDate = session.started_at.split('T')[0];
        return sessionDate === today && session.completed_at; // Only completed sessions
      })
      .reduce((total, session) => total + (session.calories_burned || 0), 0);
  }, [workoutSessions]);

  // Calculate net calories (consumed - burned)
  const netCalories = todaysEntries.totals.calories - todaysWorkoutCalories;
  const caloriesLeft = 2500 - netCalories; // Default daily calorie goal

  // Debug logging
  console.log('🔍 APP STATE DEBUG:', {
    isLoading,
    isAuthenticated,
    currentUserId,
    mealEntriesCount: mealEntries.length,
    workoutSessionsCount: workoutSessions.length
  });

  // Force loading to false if stuck
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log('⚠️ Force setting loading to false due to timeout');
        setIsLoading(false);
      }, 8000); // 8 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

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


  // Public landing page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthView onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  // Users go straight to dashboard after authentication
  console.log('Auth check:', { isAuthenticated, currentUserId });

  // Main authenticated app with routing
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="pb-20">
          <Routes>
            {/* Authenticated routes */}
            <Route 
              path="/" 
              element={
                <DashboardView
                  entries={todaysEntries.entries}
                  profile={userProfile}
                  userEmail={userEmail}
                  workoutCalories={todaysWorkoutCalories}
                  netCalories={netCalories}
                  caloriesLeft={caloriesLeft}
                />
              } 
            />
            <Route 
              path="/add-meal" 
              element={
                <AddMealView
                  currentUserId={currentUserId}
                  onCancel={() => {}}
                  onConfirm={async (meal) => {
                    if (!currentUserId) return;
                    const saved = await mealService.createMeal(meal, currentUserId);
                    addMealEntry(saved);
                  }}
                />
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProfileView
                  onLogout={handleLogout}
                />
              } 
            />
            <Route 
              path="/guided-workouts" 
              element={
                <GuidedWorkoutsView
                  currentUserId={currentUserId}
                />
              } 
            />
            <Route 
              path="/guided-workouts/plan/:planId" 
              element={
                <WorkoutPlanDetail
                  currentUserId={currentUserId}
                />
              } 
            />
            <Route 
              path="/guided-workouts/player/:planId/:dayId" 
              element={
                <WorkoutPlayer
                  currentUserId={currentUserId}
                />
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ReportsView
                  currentUserId={currentUserId}
                />
              } 
            />
            <Route path="/scan" element={<ScanNutritionView />} />
            
            {/* Catch all route - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;