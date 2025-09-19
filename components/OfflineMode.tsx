import React from 'react';

const OfflineMode: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
        <div className="text-6xl mb-4">🎮</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          NutriSnap Offline Mode
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Supabase connection is currently unavailable, but you can still use the gamification features!
        </p>
        
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              ✅ Available Features:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Gamification system (points, badges, levels)</li>
              <li>• Local data storage</li>
              <li>• Progress tracking</li>
              <li>• Achievement system</li>
            </ul>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-600 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
              ⚠️ Limited Features:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Meal logging (requires Supabase)</li>
              <li>• Workout tracking (requires Supabase)</li>
              <li>• User authentication</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            🔄 Retry Connection
          </button>
          <button
            onClick={() => {
              // Navigate to gamification demo
              window.location.hash = '#gamification-demo';
              window.location.reload();
            }}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            🎮 Try Gamification Demo
          </button>
          <button
            onClick={() => {
              // Navigate to database audit
              window.location.hash = '#database-audit';
              window.location.reload();
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            🔍 Run Database Audit
          </button>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Your gamification progress is saved locally and will sync when connection is restored.
        </p>
      </div>
    </div>
  );
};

export default OfflineMode;
