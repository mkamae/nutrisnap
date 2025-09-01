// Setup script for guided workouts
// Run this in your browser console or as a Node.js script

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://adxtkbhtezlzuydrzmcx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeHRrYmh0ZXpsenV5ZHJ6bWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzc0NjIsImV4cCI6MjA3MDkxMzQ2Mn0.IEQZLSHdJ8nyz8-Hc8wxgHhPHu7slcL3vkeFSBjKsx0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupGuidedWorkouts() {
  console.log('🚀 Setting up guided workouts...');
  
  try {
    // 1. Create exercises first
    console.log('📝 Creating exercises...');
    
    const exercises = [
      {
        name: 'Push-ups',
        category: 'strength',
        reps: 10,
        duration_seconds: null,
        instructions: 'Start in a plank position with hands shoulder-width apart. Lower your body until your chest nearly touches the floor, then push back up to starting position.',
        gif_url: 'https://media.giphy.com/media/ZD8ZjehSsLDZQRoJxW/giphy.gif'
      },
      {
        name: 'Squats',
        category: 'strength',
        reps: 15,
        duration_seconds: null,
        instructions: 'Stand with feet shoulder-width apart. Lower your body as if sitting back into a chair, keeping your chest up and knees behind your toes. Return to standing.',
        gif_url: 'https://media.giphy.com/media/1qfDU4MJv9xoGtRKvh/giphy.gif'
      },
      {
        name: 'Plank',
        category: 'core',
        reps: null,
        duration_seconds: 30,
        instructions: 'Start in a push-up position but rest on your forearms. Keep your body in a straight line from head to heels. Hold this position.',
        gif_url: 'https://media.giphy.com/media/3o6fJ5LANL0x31R1Ic/giphy.gif'
      },
      {
        name: 'Jumping Jacks',
        category: 'cardio',
        reps: null,
        duration_seconds: 30,
        instructions: 'Stand with feet together and arms at your sides. Jump while spreading your legs shoulder-width apart and raising your arms overhead. Jump back to starting position.',
        gif_url: 'https://media.giphy.com/media/3o6fJeWZrlAIyN1EKQ/giphy.gif'
      },
      {
        name: 'Burpees',
        category: 'cardio',
        reps: 5,
        duration_seconds: null,
        instructions: 'Start standing, drop into a squat with hands on floor, jump feet back into plank, do a push-up, jump feet back to squat, then jump up with arms overhead.',
        gif_url: 'https://media.giphy.com/media/3oKHWBy6GFcLdEhH2w/giphy.gif'
      }
    ];
    
    for (const exercise of exercises) {
      const { data, error } = await supabase
        .from('exercises')
        .upsert(exercise, { onConflict: 'name' })
        .select();
      
      if (error) {
        console.error(`❌ Error creating exercise ${exercise.name}:`, error);
      } else {
        console.log(`✅ Created exercise: ${exercise.name}`);
      }
    }
    
    // 2. Create workout plans
    console.log('📋 Creating workout plans...');
    
    const workoutPlans = [
      {
        user_id: null, // Default plan
        title: 'Beginner Full Body',
        description: 'Perfect for fitness beginners! A gentle introduction to exercise targeting all major muscle groups.',
        duration_minutes: 15,
        total_exercises: 4,
        est_calories: 120
      },
      {
        user_id: null, // Default plan
        title: '7-Minute HIIT Blast',
        description: 'High-intensity interval training that delivers maximum results in minimal time.',
        duration_minutes: 7,
        total_exercises: 3,
        est_calories: 80
      }
    ];
    
    const createdPlans = [];
    for (const plan of workoutPlans) {
      const { data, error } = await supabase
        .from('workout_plans')
        .upsert(plan, { onConflict: 'title' })
        .select();
      
      if (error) {
        console.error(`❌ Error creating plan ${plan.title}:`, error);
      } else {
        console.log(`✅ Created plan: ${plan.title}`);
        createdPlans.push(data[0]);
      }
    }
    
    // 3. Create workout days
    console.log('📅 Creating workout days...');
    
    for (const plan of createdPlans) {
      const { data, error } = await supabase
        .from('workout_days')
        .upsert({
          plan_id: plan.id,
          day_number: 1,
          title: 'Day 1'
        }, { onConflict: 'plan_id,day_number' })
        .select();
      
      if (error) {
        console.error(`❌ Error creating day for plan ${plan.title}:`, error);
      } else {
        console.log(`✅ Created day for plan: ${plan.title}`);
        
        // 4. Add exercises to days
        if (plan.title === 'Beginner Full Body') {
          const exerciseNames = ['Jumping Jacks', 'Push-ups', 'Squats', 'Plank'];
          await addExercisesToDay(data[0].id, exerciseNames);
        } else if (plan.title === '7-Minute HIIT Blast') {
          const exerciseNames = ['Burpees', 'Jumping Jacks', 'Push-ups'];
          await addExercisesToDay(data[0].id, exerciseNames);
        }
      }
    }
    
    console.log('🎉 Guided workouts setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

async function addExercisesToDay(dayId, exerciseNames) {
  console.log(`🏋️ Adding exercises to day ${dayId}:`, exerciseNames);
  
  for (let i = 0; i < exerciseNames.length; i++) {
    const exerciseName = exerciseNames[i];
    
    // Get exercise ID
    const { data: exercises, error: exerciseError } = await supabase
      .from('exercises')
      .select('id')
      .eq('name', exerciseName)
      .single();
    
    if (exerciseError) {
      console.error(`❌ Error finding exercise ${exerciseName}:`, exerciseError);
      continue;
    }
    
    // Add to day
    const { error: assignError } = await supabase
      .from('workout_day_exercises')
      .upsert({
        day_id: dayId,
        exercise_id: exercises.id,
        sort_order: i + 1
      }, { onConflict: 'day_id,exercise_id' });
    
    if (assignError) {
      console.error(`❌ Error assigning exercise ${exerciseName}:`, assignError);
    } else {
      console.log(`✅ Added exercise: ${exerciseName}`);
    }
  }
}

// Run the setup
setupGuidedWorkouts();