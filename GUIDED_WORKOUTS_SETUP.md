# 🏃‍♂️ Guided Workouts Setup Guide

## Overview
This guide will help you set up the new Guided Workouts feature in your NutriSnap application. The system includes workout plans, exercise tracking, and an interactive workout player.

## 🗄️ Database Setup

### 1. Run the SQL Script
Execute the `create-guided-workouts.sql` file in your Supabase SQL editor:

```sql
-- Copy and paste the contents of create-guided-workouts.sql
-- This will create all necessary tables and sample data
```

### 2. Tables Created
- `workout_plans` - Stores workout plans (public and user-created)
- `workout_days` - Breaks plans into daily workouts
- `exercises` - Exercise library with instructions and metadata
- `workout_day_exercises` - Links exercises to specific days
- `user_workout_progress` - Tracks user completion and performance

### 3. Sample Data Included
- 10 default exercises (Push-ups, Squats, Plank, etc.)
- 5 workout plans (7-Day Beginner Fitness, HIIT Blast, etc.)
- Complete workout structure for the 7-Day Beginner plan

## 🚀 Features Implemented

### 1. Guided Workouts Browser (`GuidedWorkoutsView`)
- Browse public workout plans
- Filter by category and difficulty
- View plan details (duration, exercises, calories)
- Start workouts directly

### 2. Interactive Workout Player (`WorkoutPlayer`)
- Step-by-step exercise guidance
- Timer for duration-based exercises
- Rest periods between exercises
- Progress tracking
- Navigation controls (previous/next)

### 3. Workout Management
- Create custom workout plans
- Add exercises to days
- Track completion and progress
- View workout history

## 🎯 How to Use

### For Users
1. **Browse Workouts**: Navigate to "Guided" in the bottom navigation
2. **Select a Plan**: Choose from available workout plans
3. **Start Workout**: Click "Start Now" to begin the guided session
4. **Follow Along**: Use the workout player to complete exercises
5. **Track Progress**: View completion status and workout history

### For Developers
1. **Add New Exercises**: Insert into the `exercises` table
2. **Create Workout Plans**: Use the `guidedWorkoutService`
3. **Customize UI**: Modify components in `components/` directory
4. **Extend Features**: Add new workout types or tracking metrics

## 🔧 Technical Details

### Components
- `GuidedWorkoutsView.tsx` - Main workout browser
- `WorkoutPlayer.tsx` - Interactive workout session
- `guidedWorkoutService.ts` - Backend service layer

### Services
- `guidedWorkoutService` - Handles all workout operations
- Database operations for plans, days, exercises, and progress
- User authentication and progress tracking

### State Management
- Workout plans and exercises loaded from Supabase
- Current workout session state in WorkoutPlayer
- Progress tracking and completion logging

## 🎨 Customization

### Adding New Exercise Categories
1. Update the `category` field in the `exercises` table
2. Modify the category filter in `GuidedWorkoutsView`
3. Add appropriate icons and colors

### Creating Custom Workout Plans
1. Use the `guidedWorkoutService.createWorkoutPlan()` method
2. Add workout days with `guidedWorkoutService.createWorkoutDay()`
3. Link exercises using `guidedWorkoutService.addExerciseToDay()`

### Styling and UI
- All components use Tailwind CSS
- Responsive design for mobile and desktop
- Dark mode support included
- Customizable color schemes and themes

## 🚨 Troubleshooting

### Common Issues
1. **Build Errors**: Ensure all icon components are created
2. **Database Errors**: Check Supabase RLS policies
3. **Type Errors**: Verify TypeScript interfaces match database schema

### Performance Tips
- Use database indexes for large exercise libraries
- Implement pagination for workout plan browsing
- Cache frequently accessed workout data

## 🔮 Future Enhancements

### Planned Features
- Video demonstrations for exercises
- Social sharing of workout plans
- Advanced progress analytics
- Integration with fitness trackers
- AI-powered workout recommendations

### Customization Options
- Personal workout plan creation
- Exercise substitution suggestions
- Difficulty progression tracking
- Workout scheduling and reminders

## 📱 Mobile Optimization

The guided workout system is fully responsive and optimized for mobile devices:
- Touch-friendly controls
- Large, readable text and buttons
- Optimized layout for small screens
- Gesture support for navigation

## 🎉 Getting Started

1. **Run the SQL script** in your Supabase dashboard
2. **Test the feature** by navigating to "Guided" in your app
3. **Try a workout** by selecting a plan and clicking "Start Now"
4. **Customize** by adding your own exercises or workout plans

---

**Need Help?** Check the component files for detailed implementation or create an issue in your project repository.
