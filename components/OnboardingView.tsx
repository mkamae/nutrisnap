import React, { useState } from 'react';
import { UserProfile, WorkoutRoutine, WorkoutExercise } from '../types';

interface OnboardingViewProps {
  onComplete: (profile: UserProfile, workoutRoutine?: WorkoutRoutine) => void;
  onSkip: () => void;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    age: 25,
    gender: 'prefer_not_to_say',
    weightKg: 70,
    heightCm: 170,
    activityLevel: 'moderate',
    dailyCalorieGoal: 2000,
    primaryGoal: 'maintain_weight',
    targetWeightKg: 70,
    weeklyGoal: 'maintain',
    fitnessExperience: 'beginner',
    preferredActivities: []
  });

  const [workoutRoutine, setWorkoutRoutine] = useState<Partial<WorkoutRoutine>>({
    name: 'My Workout Routine',
    description: '',
    frequency: '3x_week',
    customFrequencyDays: 3
  });

  const [exercises, setExercises] = useState<Partial<WorkoutExercise>[]>([
    {
      exerciseName: 'Push-ups',
      sets: 3,
      reps: 10,
      durationMinutes: 5,
      restSeconds: 60,
      orderIndex: 1
    },
    {
      exerciseName: 'Squats',
      sets: 3,
      reps: 15,
      durationMinutes: 5,
      restSeconds: 60,
      orderIndex: 2
    }
  ]);

  const [showWorkoutSetup, setShowWorkoutSetup] = useState(false);

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkoutChange = (field: keyof WorkoutRoutine, value: any) => {
    setWorkoutRoutine(prev => ({ ...prev, [field]: value }));
  };

  const handleExerciseChange = (index: number, field: keyof WorkoutExercise, value: any) => {
    setExercises(prev => prev.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    ));
  };

  const addExercise = () => {
    setExercises(prev => [...prev, {
      exerciseName: '',
      sets: 3,
      reps: 10,
      durationMinutes: 5,
      restSeconds: 60,
      orderIndex: prev.length + 1
    }]);
  };

  const removeExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const completeProfile = profile as UserProfile;
    const completeWorkoutRoutine = showWorkoutSetup ? workoutRoutine as WorkoutRoutine : undefined;
    
    onComplete(completeProfile, completeWorkoutRoutine);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to NutriSnap!</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Let's set up your profile to get started</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What's your name? *
          </label>
          <input
            type="text"
            value={profile.name || ''}
            onChange={(e) => handleProfileChange('name', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter your name"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Age *
            </label>
            <input
              type="number"
              value={profile.age || ''}
              onChange={(e) => handleProfileChange('age', parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="13"
              max="120"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gender
            </label>
            <select
              value={profile.gender || 'prefer_not_to_say'}
              onChange={(e) => handleProfileChange('gender', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="prefer_not_to_say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Weight (kg) *
            </label>
            <input
              type="number"
              value={profile.weightKg || ''}
              onChange={(e) => handleProfileChange('weightKg', parseFloat(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              step="0.1"
              min="30"
              max="300"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Height (cm) *
            </label>
            <input
              type="number"
              value={profile.heightCm || ''}
              onChange={(e) => handleProfileChange('heightCm', parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="100"
              max="250"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Fitness Goals</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Help us understand what you want to achieve</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What's your primary goal? *
          </label>
          <select
            value={profile.primaryGoal || 'maintain_weight'}
            onChange={(e) => handleProfileChange('primaryGoal', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="lose_weight">Lose Weight</option>
            <option value="gain_weight">Gain Weight</option>
            <option value="maintain_weight">Maintain Weight</option>
            <option value="build_muscle">Build Muscle</option>
            <option value="improve_fitness">Improve Fitness</option>
          </select>
        </div>

        {profile.primaryGoal === 'lose_weight' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Weight (kg)
            </label>
            <input
              type="number"
              value={profile.targetWeightKg || ''}
              onChange={(e) => handleProfileChange('targetWeightKg', parseFloat(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              step="0.1"
              min="30"
              max="300"
            />
          </div>
        )}

        {profile.primaryGoal === 'gain_weight' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Weight (kg)
            </label>
            <input
              type="number"
              value={profile.targetWeightKg || ''}
              onChange={(e) => handleProfileChange('targetWeightKg', parseFloat(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              step="0.1"
              min="30"
              max="300"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Weekly Goal
          </label>
          <select
            value={profile.weeklyGoal || 'maintain'}
            onChange={(e) => handleProfileChange('weeklyGoal', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="maintain">Maintain current weight</option>
            <option value="lose_0.5kg">Lose 0.5kg per week</option>
            <option value="lose_1kg">Lose 1kg per week</option>
            <option value="gain_0.5kg">Gain 0.5kg per week</option>
            <option value="gain_1kg">Gain 1kg per week</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Activity Level *
          </label>
          <select
            value={profile.activityLevel || 'moderate'}
            onChange={(e) => handleProfileChange('activityLevel', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          >
            <option value="sedentary">Sedentary (little or no exercise)</option>
            <option value="light">Light (light exercise 1-3 days/week)</option>
            <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
            <option value="active">Active (hard exercise 6-7 days/week)</option>
            <option value="very_active">Very Active (very hard exercise, physical job)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fitness Experience Level
          </label>
          <select
            value={profile.fitnessExperience || 'beginner'}
            onChange={(e) => handleProfileChange('fitnessExperience', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="beginner">Beginner (0-6 months)</option>
            <option value="intermediate">Intermediate (6 months - 2 years)</option>
            <option value="advanced">Advanced (2+ years)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Daily Calorie Goal *
          </label>
          <input
            type="number"
            value={profile.dailyCalorieGoal || ''}
            onChange={(e) => handleProfileChange('dailyCalorieGoal', parseInt(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            min="1200"
            max="5000"
            step="50"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Routine (Optional)</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Set up a workout routine to track your fitness progress</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="setup-workout"
            checked={showWorkoutSetup}
            onChange={(e) => setShowWorkoutSetup(e.target.checked)}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="setup-workout" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            I want to set up a workout routine
          </label>
        </div>

        {showWorkoutSetup && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Routine Name
              </label>
              <input
                type="text"
                value={workoutRoutine.name || ''}
                onChange={(e) => handleWorkoutChange('name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Full Body Workout"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={workoutRoutine.description || ''}
                onChange={(e) => handleWorkoutChange('description', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Describe your workout routine..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency
              </label>
              <select
                value={workoutRoutine.frequency || '3x_week'}
                onChange={(e) => handleWorkoutChange('frequency', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="3x_week">3 times per week</option>
                <option value="4x_week">4 times per week</option>
                <option value="5x_week">5 times per week</option>
                <option value="6x_week">6 times per week</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {workoutRoutine.frequency === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Days per week
                </label>
                <input
                  type="number"
                  value={workoutRoutine.customFrequencyDays || 3}
                  onChange={(e) => handleWorkoutChange('customFrequencyDays', parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min="1"
                  max="7"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Exercises
              </label>
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <div key={index} className="p-3 border border-gray-300 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        value={exercise.exerciseName || ''}
                        onChange={(e) => handleExerciseChange(index, 'exerciseName', e.target.value)}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Exercise name"
                      />
                      <button
                        onClick={() => removeExercise(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <input
                        type="number"
                        value={exercise.sets || ''}
                        onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Sets"
                        min="1"
                      />
                      <input
                        type="number"
                        value={exercise.reps || ''}
                        onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value))}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Reps"
                        min="1"
                      />
                      <input
                        type="number"
                        value={exercise.durationMinutes || ''}
                        onChange={(e) => handleExerciseChange(index, 'durationMinutes', parseInt(e.target.value))}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Min"
                        min="1"
                      />
                      <input
                        type="number"
                        value={exercise.restSeconds || ''}
                        onChange={(e) => handleExerciseChange(index, 'restSeconds', parseInt(e.target.value))}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Rest (s)"
                        min="0"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={addExercise}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
                >
                  + Add Exercise
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return profile.name && profile.age && profile.weightKg && profile.heightCm;
      case 2:
        return profile.primaryGoal && profile.activityLevel && profile.dailyCalorieGoal;
      case 3:
        return true; // Step 3 is optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Step {currentStep} of 3</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round((currentStep / 3) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        {renderCurrentStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>

          <div className="flex space-x-3">
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <>
                <button
                  onClick={onSkip}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!canProceed()}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Complete Setup
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;
