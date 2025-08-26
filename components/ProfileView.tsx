import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface ProfileViewProps {
  profile: UserProfile | null;
  onLogout: () => void;
  onProfileUpdate: (profile: UserProfile) => Promise<void>;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onLogout, onProfileUpdate }) => {
  // UI/UX CLEANUP: Simplified state management - removed onboarding complexity
  const [isEditing, setIsEditing] = useState(false);
  const [editProfile, setEditProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update editProfile when profile prop changes
  useEffect(() => {
    if (profile) {
      setEditProfile(profile);
      setIsEditing(false);
    }
  }, [profile]);

  const handleEdit = () => {
    if (profile) {
      setEditProfile(profile);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!editProfile) return;
    
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!editProfile.name || !editProfile.age || !editProfile.weightKg || 
          !editProfile.heightCm || !editProfile.activityLevel || !editProfile.dailyCalorieGoal) {
        throw new Error('Please fill in all required fields');
      }
      
      await onProfileUpdate(editProfile);
      setIsEditing(false);
      
    } catch (err) {
      console.error('Error saving profile:', err);
      alert(`Failed to save profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditProfile(profile);
    }
    setIsEditing(false);
  };

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    if (editProfile) {
      setEditProfile(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  // Show loading state if no profile yet
  if (!profile && !isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.name || 'User'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {profile ? 'Your personal profile' : 'Create your profile to get started'}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Content */}
          {isEditing && editProfile ? (
            // Edit Mode - UI/UX CLEANUP: Consistent form styling
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editProfile.name || ''}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 
                             dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Age Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    value={editProfile.age || ''}
                    onChange={(e) => handleProfileChange('age', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 
                             dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="25"
                    min="1"
                    max="150"
                  />
                </div>

                {/* Weight Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editProfile.weightKg || ''}
                    onChange={(e) => handleProfileChange('weightKg', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 
                             dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="70.0"
                    min="1"
                    max="500"
                  />
                </div>

                {/* Height Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Height (cm) *
                  </label>
                  <input
                    type="number"
                    value={editProfile.heightCm || ''}
                    onChange={(e) => handleProfileChange('heightCm', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 
                             dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="170"
                    min="100"
                    max="300"
                  />
                </div>

                {/* Activity Level Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Activity Level *
                  </label>
                  <select
                    value={editProfile.activityLevel || ''}
                    onChange={(e) => handleProfileChange('activityLevel', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 
                             dark:bg-gray-700 dark:text-white transition-colors"
                  >
                    <option value="">Select activity level</option>
                    <option value="sedentary">Sedentary (little or no exercise)</option>
                    <option value="light">Light (light exercise 1-3 days/week)</option>
                    <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
                    <option value="active">Active (hard exercise 6-7 days/week)</option>
                    <option value="very_active">Very Active (very hard exercise, physical job)</option>
                  </select>
                </div>

                {/* Daily Calorie Goal Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Daily Calorie Goal *
                  </label>
                  <input
                    type="number"
                    value={editProfile.dailyCalorieGoal || ''}
                    onChange={(e) => handleProfileChange('dailyCalorieGoal', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 
                             dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="2000"
                    min="1000"
                    max="10000"
                  />
                </div>
              </div>
            </div>
          ) : (
            // View Mode - UI/UX CLEANUP: Clean profile display
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">{profile?.name || 'Not set'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Age</p>
                  <p className="font-medium text-gray-900 dark:text-white">{profile?.age || 'Not set'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Weight</p>
                  <p className="font-medium text-gray-900 dark:text-white">{profile?.weightKg ? `${profile.weightKg} kg` : 'Not set'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Height</p>
                  <p className="font-medium text-gray-900 dark:text-white">{profile?.heightCm ? `${profile.heightCm} cm` : 'Not set'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Activity Level</p>
                  <p className="font-medium text-gray-900 dark:text-white">{profile?.activityLevel || 'Not set'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Daily Calorie Goal</p>
                  <p className="font-medium text-gray-900 dark:text-white">{profile?.dailyCalorieGoal ? `${profile.dailyCalorieGoal} calories` : 'Not set'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button - UI/UX CLEANUP: Consistent button styling */}
        <div className="text-center">
          <button
            onClick={onLogout}
            className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
