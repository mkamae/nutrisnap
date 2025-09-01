// QUICK FIX FOR GUIDED WORKOUTS
// Copy and paste this into your browser console on the app page

console.log('🚀 Starting Guided Workouts Quick Fix...');

// Get Supabase client from the window (if available)
const getSupabaseClient = () => {
  // Try to get from window or create new one
  if (window.supabase) {
    return window.supabase;
  }
  
  // If not available, we'll need to use the app's instance
  console.log('⚠️ Supabase client not found on window. Please run this from the app console.');
  return null;
};

const quickFix = async () => {
  try {
    // This assumes you're running it from the app where supabase is available
    const supabaseUrl = 'https://adxtkbhtezlzuydrzmcx.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeHRrYmh0ZXpsenV5ZHJ6bWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzc0NjIsImV4cCI6MjA3MDkxMzQ2Mn0.IEQZLSHdJ8nyz8-Hc8wxgHhPHu7slcL3vkeFSBjKsx0';
    
    // Create Supabase client
    const { createClient } = window.supabase || await import('https://cdn.skypack.dev/@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔍 Testing connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('workout_plans')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError);
      return;
    }
    
    console.log('✅ Connection successful');
    
    // Check if we have data
    const { data: plans, error: plansError } = await supabase
      .from('workout_plans')
      .select('*')
      .is('user_id', null);
    
    if (plansError) {
      console.error('❌ Error checking plans:', plansError);
      return;
    }
    
    console.log('📊 Found', plans?.length || 0, 'workout plans');
    
    if (!plans || plans.length === 0) {
      console.log('📝 No plans found, creating sample data...');
      
      // Create a simple workout plan
      const { data: newPlan, error: planError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: null,
          title: 'Quick Fix Workout',
          description: 'A simple workout to test the system',
          duration_minutes: 10,
          total_exercises: 2,
          est_calories: 50
        })
        .select()
        .single();
      
      if (planError) {
        console.error('❌ Error creating plan:', planError);
        return;
      }
      
      console.log('✅ Created workout plan:', newPlan.title);
      
      // Create some exercises
      const exercises = [
        {
          name: 'Test Push-ups',
          category: 'strength',
          reps: 10,
          instructions: 'Basic push-ups for testing'
        },
        {
          name: 'Test Squats',
          category: 'strength',
          reps: 15,
          instructions: 'Basic squats for testing'
        }
      ];
      
      for (const exercise of exercises) {
        const { error: exerciseError } = await supabase
          .from('exercises')
          .upsert(exercise, { onConflict: 'name' });
        
        if (!exerciseError) {
          console.log('✅ Created exercise:', exercise.name);
        }
      }
      
      // Create workout day
      const { data: newDay, error: dayError } = await supabase
        .from('workout_days')
        .insert({
          plan_id: newPlan.id,
          day_number: 1,
          title: 'Test Day'
        })
        .select()
        .single();
      
      if (!dayError) {
        console.log('✅ Created workout day');
        
        // Add exercises to day
        const { data: exerciseList } = await supabase
          .from('exercises')
          .select('*')
          .in('name', ['Test Push-ups', 'Test Squats']);
        
        if (exerciseList) {
          for (let i = 0; i < exerciseList.length; i++) {
            await supabase
              .from('workout_day_exercises')
              .insert({
                day_id: newDay.id,
                exercise_id: exerciseList[i].id,
                sort_order: i + 1
              });
          }
          console.log('✅ Added exercises to day');
        }
      }
    }
    
    console.log('🎉 Quick fix completed! Try refreshing the guided workouts page.');
    
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
    console.log('💡 Try running the SQL script in Supabase instead.');
  }
};

// Run the quick fix
quickFix();