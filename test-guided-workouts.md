# Guided Workouts Testing Guide

## Prerequisites
1. Make sure you've run the database migration: `database/guided-workouts-final.sql`
2. Your app should be running and you should be logged in

## Testing Steps

### 1. Test Navigation
- [ ] Navigate to the app and check the bottom navigation
- [ ] Click on "Guided" tab - should navigate to `/guided-workouts`
- [ ] Verify you can see the guided workouts page

### 2. Test Workout Plans Display
- [ ] Check if workout plans are loading (should see 3 default plans)
- [ ] Verify plan cards show:
  - Plan title and description
  - Duration, exercises count, and estimated calories
  - "View Details" and "Start Workout" buttons

### 3. Test Plan Details Navigation
- [ ] Click "View Details" on any plan
- [ ] Should navigate to `/guided-workouts/plan/{planId}`
- [ ] Verify you can see:
  - Plan header with stats
  - Expandable workout days
  - Exercise cards with details
  - "Start Day X" buttons

### 4. Test Exercise Display
- [ ] Expand a workout day in the plan details
- [ ] Verify exercises show:
  - Exercise number, name, and category
  - Duration or reps information
  - Exercise instructions
  - GIF placeholder (may not load if URLs are invalid)

### 5. Test Workout Player Navigation
- [ ] Click "Start Workout" button on any plan card
- [ ] Should navigate to `/guided-workouts/player/{planId}/{dayId}`
- [ ] Click "Start Day X" button in plan details
- [ ] Should navigate to the workout player for that specific day

### 6. Test Workout Player Interface
- [ ] Verify workout player shows:
  - Plan title and day information in header
  - Progress indicator showing current exercise
  - Current exercise name, duration/reps, and instructions
  - Exercise GIF or placeholder icon
  - Timer (for timed exercises) with circular progress
  - Player controls (Previous, Play/Pause, Next/Complete)

### 7. Test Workout Player Controls
- [ ] Click Play button - timer should start (for timed exercises)
- [ ] Click Pause button - timer should pause
- [ ] Click Next button - should advance to next exercise
- [ ] Click Previous button - should go back to previous exercise
- [ ] On last exercise, Next button should show "Complete" icon
- [ ] Click Complete - should navigate back to plan details

### 8. Test Workout Completion
- [ ] Complete a full workout (go through all exercises)
- [ ] Should record workout completion in database
- [ ] Should navigate back to plan details page

### 6. Test Back Navigation
- [ ] From plan details, click "Back to Workouts"
- [ ] Should return to the main guided workouts page

## Expected Issues (Normal)
- Exercise GIFs may not load (placeholder icons will show instead)
- Timer only works for timed exercises (duration_seconds), rep-based exercises need manual progression
- Workout completion tracking is implemented but history display is not yet built

## If Something Doesn't Work
1. Check browser console for errors
2. Verify database migration was run successfully
3. Check that you're logged in to the app
4. Verify the guided workouts service is working by checking network requests

## Next Steps
Once basic navigation is working, the next major features to implement are:
1. Interactive workout player (Task 5)
2. Workout completion tracking (Task 6)
3. Custom workout plan builder (Task 7)