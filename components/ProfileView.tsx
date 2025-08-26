import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface ProfileViewProps {
  profile: UserProfile | null;
  onLogout: () => void;
  onProfileUpdate: (profile: UserProfile) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onLogout, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(!profile); // Start editing if no profile
  const [editProfile, setEditProfile] = useState<UserProfile>(profile || {
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

  // Update editProfile when profile prop changes (e.g., after successful update)
  useEffect(() => {
    setEditProfile(profile);
  }, [profile]);

  const handleSave = async () => {
    try {
      console.log('=== PROFILE VIEW SAVE DEBUG ===');
      console.log('Saving profile:', editProfile);
      console.log('Current profile prop:', profile);
      
      // Update the profile using the callback
      await onProfileUpdate(editProfile);
      console.log('Profile update completed');
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      // Don't close editing mode if there was an error
    }
  };

  const handleCancel = () => {
    setEditProfile(profile);
    setIsEditing(false);
  };

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setEditProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your personal information and goals</p>
        </div>

        {/* Profile Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {editProfile.name ? editProfile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile ? (profile.name || 'User') : 'Set Up Your Profile'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {profile ? 'Your personal profile' : 'Create your profile to get started'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isEditing ? 'Cancel' : (profile ? 'Edit' : 'Create Profile')}
            </button>
          </div>

          {isEditing ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editProfile.name || ''}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    value={editProfile.age || ''}
                    onChange={(e) => handleProfileChange('age', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Age"
                    min="13"
                    max="120"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    value={editProfile.weightKg || ''}
                    onChange={(e) => handleProfileChange('weightKg', parseFloat(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Weight"
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
                    value={editProfile.heightCm || ''}
                    onChange={(e) => handleProfileChange('heightCm', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Height"
                    min="100"
                    max="250"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Activity Level *
                  </label>
                  <select
                    value={editProfile.activityLevel || 'moderate'}
                    onChange={(e) => handleProfileChange('activityLevel', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    Daily Calorie Goal *
                  </label>
                  <input
                    type="number"
                    value={editProfile.dailyCalorieGoal || ''}
                    onChange={(e) => handleProfileChange('dailyCalorieGoal', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Calories"
                    min="1200"
                    max="5000"
                    step="50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Goal
                  </label>
                  <select
                    value={editProfile.primaryGoal || 'maintain_weight'}
                    onChange={(e) => handleProfileChange('primaryGoal', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="lose_weight">Lose Weight</option>
                    <option value="gain_weight">Gain Weight</option>
                    <option value="maintain_weight">Maintain Weight</option>
                    <option value="build_muscle">Build Muscle</option>
                    <option value="improve_fitness">Improve Fitness</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fitness Experience
                  </label>
                  <select
                    value={editProfile.fitnessExperience || 'beginner'}
                    onChange={(e) => handleProfileChange('fitnessExperience', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner (0-6 months)</option>
                    <option value="intermediate">Intermediate (6 months - 2 years)</option>
                    <option value="advanced">Advanced (2+ years)</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="font-medium">{profile.name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Age</p>
                    <p className="font-medium">{profile.age || 'Not set'} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Weight</p>
                    <p className="font-medium">{profile.weightKg || 'Not set'} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Height</p>
                    <p className="font-medium">{profile.heightCm || 'Not set'} cm</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Fitness Goals</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Activity Level</p>
                    <p className="font-medium capitalize">
                      {profile.activityLevel ? profile.activityLevel.replace('_', ' ') : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Primary Goal</p>
                    <p className="font-medium capitalize">
                      {profile.primaryGoal ? profile.primaryGoal.replace('_', ' ') : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fitness Experience</p>
                    <p className="font-medium capitalize">
                      {profile.fitnessExperience || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Daily Goal Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Daily Calorie Goal</h3>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-500">
              {profile.dailyCalorieGoal || 0}
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-400">kcal</p>
          </div>
        </div>

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={onLogout}
            className="w-full max-w-md py-3 px-6 border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors duration-200 font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
