import React, { useState } from 'react';
import LogoIcon from './icons/LogoIcon';

interface AuthViewProps {
  onLogin: (email: string, password: string, isSignUp: boolean) => Promise<void>;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [view, setView] = useState<'landing' | 'login' | 'signup'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsLoading(true);
      setError(null);
      try {
        await onLogin(email, password, view === 'signup');
      } catch (err: any) {
        setError(err.message || 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderContent = () => {
    if (view === 'login' || view === 'signup') {
      return (
        <div className="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg animate-fade-in">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {view === 'login' ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {view === 'login' ? 'Sign in to continue your journey.' : 'Start tracking with NutriSnap today.'}
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                {error}
              </div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : (view === 'login' ? 'Sign In' : 'Sign Up')}
              </button>
            </div>
          </form>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {view === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setView(view === 'login' ? 'signup' : 'login')}
              className="font-medium text-green-600 hover:text-green-500"
            >
              {view === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      );
    }
    
    // Landing view
    return (
        <div className="text-center animate-fade-in p-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Snap. Track. <span className="text-green-500">Thrive.</span>
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                Effortlessly understand your meals with a single photo. NutriSnap is your personal AI nutrition coach.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-4">
                <button
                    onClick={() => setView('signup')}
                    className="w-full sm:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                    Get Started
                </button>
                <button
                    onClick={() => setView('login')}
                    className="w-full sm:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 dark:bg-gray-700 dark:text-green-300 dark:hover:bg-gray-600 transition-colors"
                >
                    Sign In
                </button>
            </div>
        </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
        <div className="absolute top-8 flex items-center gap-3">
            <LogoIcon className="h-10 w-10 text-green-500" />
            <span className="text-2xl font-bold text-gray-800 dark:text-white">NutriSnap</span>
        </div>
        {renderContent()}
    </div>
  );
};

export default AuthView;
