import React, { useState } from 'react';
import { UserProfile } from '../types';

interface OnboardingViewProps {
  onComplete: (profile: UserProfile) => void;
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



  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };



  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    console.log('handleComplete called, profile:', profile);
    console.log('canProceed result:', canProceed());
    const completeProfile = profile as UserProfile;
    onComplete(completeProfile);
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
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  handleProfileChange('age', value);
                }
              }}
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
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  handleProfileChange('weightKg', value);
                }
              }}
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
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  handleProfileChange('heightCm', value);
                }
              }}
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
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  handleProfileChange('targetWeightKg', value);
                }
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              step="0.1"
              min="30"
              max="300"
            />
          </div>
        )}

        {profile.primaryGoal === 'gain_weight' && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Weight (kg)
            </label>
            <input
              type="number"
              value={profile.targetWeightKg || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  handleProfileChange('targetWeightKg', value);
                }
              }}
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
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value)) {
                handleProfileChange('dailyCalorieGoal', value);
              }
            }}
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



  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      default:
        return renderStep1();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        const step1Valid = !!(profile.name && profile.age && profile.weightKg && profile.heightCm);
        console.log('Step 1 validation:', { name: !!profile.name, age: !!profile.age, weightKg: !!profile.weightKg, heightCm: !!profile.heightCm, valid: step1Valid });
        return step1Valid;
      case 2:
        const step2Valid = !!(profile.primaryGoal && profile.activityLevel && profile.dailyCalorieGoal);
        console.log('Step 2 validation:', { primaryGoal: !!profile.primaryGoal, activityLevel: !!profile.activityLevel, dailyCalorieGoal: !!profile.dailyCalorieGoal, valid: step2Valid });
        return step2Valid;
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
            <span className="text-sm text-gray-600 dark:text-gray-400">Step {currentStep} of 2</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round((currentStep / 2) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 2) * 100}%` }}
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
            {currentStep < 2 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <>
                {/* Debug info for step 2 */}
                <div className="text-xs text-gray-500 mb-2">
                  Debug: primaryGoal={profile.primaryGoal || 'missing'}, activityLevel={profile.activityLevel || 'missing'}, dailyCalorieGoal={profile.dailyCalorieGoal || 'missing'}
                </div>
                <button
                  onClick={handleComplete}
                  disabled={!canProceed()}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ opacity: canProceed() ? 1 : 0.5 }}
                >
                  Complete Setup {!canProceed() ? '(Disabled)' : ''}
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
