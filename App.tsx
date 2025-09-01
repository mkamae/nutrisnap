import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabaseService';
import { mealService } from './services/supabaseService';
import { workoutService } from './services/supabaseService';
import { MealEntry, Workout } from './types';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import AddMealView from './components/AddMealView';
import ProfileView from './components/ProfileView';
import WorkoutView from './components/WorkoutView';
import BottomNav from './components/BottomNav';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🔍 Initializing app...');
        const user = await supabase.auth.getUser();
        console.log('👤 Current user:', user.data.user ? user.data.user.id : 'No user');
        
        if (user.data.user) {
          setCurrentUserId(user.data.user.id);
          setIsAuthenticated(true);
          await loadUserData(user.data.user.id);
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
          setIsAuthenticated(true);
          await loadUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUserId(null);
          setIsAuthenticated(false);
          setMealEntries([]);
          setWorkouts([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      console.log('📊 Loading user data for:', userId);
      
      // Load meals
      console.log('🍽️ Loading meals...');
      const meals = await mealService.getMeals(userId);
      setMealEntries(meals);
      console.log('✅ Meals loaded:', meals.length);
      
      // Load workouts
      console.log('💪 Loading workouts...');
      const userWorkouts = await workoutService.getWorkouts(userId);
      setWorkouts(userWorkouts);
      console.log('✅ Workouts loaded:', userWorkouts.length);
      
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



  const addMealEntry = async (meal: Omit<MealEntry, 'id' | 'created_at'>) => {
    console.log('=== ADD MEAL ENTRY DEBUG ===');
    console.log('Received meal data:', meal);
    console.log('Current user ID:', currentUserId);
    
    if (!currentUserId) {
      console.error('No authenticated user found');
      throw new Error('No authenticated user found');
    }

    try {
      console.log('Calling mealService.addMeal...');
      const savedMeal = await mealService.addMeal(meal, currentUserId);
      console.log('Meal saved successfully:', savedMeal);
      
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

      console.log('Mapped meal:', mappedMeal);
      console.log('Updating meal entries state...');
      
      setMealEntries(prev => {
        const newEntries = [mappedMeal, ...prev];
        console.log('New meal entries:', newEntries);
        return newEntries;
      });
      
      console.log('Meal entry added successfully!');
      
      // Navigate back to dashboard after successful meal addition
      window.history.back();
      
    } catch (error) {
      console.error('Error saving meal:', error);
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
      // Navigation will be handled by router
    } catch (error) {
      console.error('Error logging workout:', error);
      throw error;
    }
  };

  // Calculate today's entries and totals
  const todaysEntries = React.useMemo(() => {
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
  const todaysWorkoutCalories = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return workouts
      .filter(workout => {
        // Handle both date strings and Date objects
        if (typeof workout.workout_date === 'string') {
          return workout.workout_date.includes(today) || workout.workout_date.split('T')[0] === today;
        }
        return false;
      })
      .reduce((total, workout) => total + (workout.calories_burned || 0), 0);
  }, [workouts]);

  // Calculate net calories (consumed - burned)
  const netCalories = todaysEntries.totals.calories - todaysWorkoutCalories;
  const caloriesLeft = 2500 - netCalories; // Default daily calorie goal

  // Debug logging
  console.log('🔍 APP STATE DEBUG:', {
    isLoading,
    isAuthenticated,
    currentUserId,
    userProfile: null, // Removed userProfile
    mealEntriesCount: mealEntries.length,
    workoutsCount: workouts.length
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

  // Show auth view for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AuthView onLogin={handleLogin} />
      </div>
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
            {/* UI/UX CLEANUP: Simplified routing - only core features */}
            <Route 
              path="/" 
              element={
                <DashboardView
                  entries={todaysEntries.entries}
                  profile={null}
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
                  onConfirm={addMealEntry}
                  onCancel={() => window.history.back()}
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
              path="/workouts" 
              element={
                <WorkoutView
                  currentUserId={currentUserId}
                  workouts={workouts}
                  onWorkoutUpdate={setWorkouts}
                />
              } 
            />
            
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