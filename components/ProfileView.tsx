import React from 'react';
import { supabase } from '../services/supabaseService';

interface ProfileViewProps {
  onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onLogout }) => {
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      console.log('=== PROFILE VIEW DEBUG ===');
      console.log('Fetching user from Supabase...');
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('Supabase auth response:', { user, error });
        
        if (error) {
          console.error('Error fetching user:', error);
          setUserEmail(null);
        } else if (user) {
          console.log('User found:', user.email);
          setUserEmail(user.email);
        } else {
          console.log('No user found');
          setUserEmail(null);
        }
      } catch (error) {
        console.error('Error in fetchUser:', error);
        setUserEmail(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        onLogout();
      }
    } catch (error) {
      console.error('Error in handleLogout:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Not logged in</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile</h1>
        
        <div className="space-y-6">
          {/* User Email */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Logged in as:</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white break-all">
              {userEmail}
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 
                     text-white font-medium py-3 px-4 rounded-lg transition-colors 
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 
                     disabled:cursor-not-allowed"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
