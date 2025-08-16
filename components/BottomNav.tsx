
import React from 'react';
import { View } from '../types';
import HomeIcon from './icons/HomeIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import UserCircleIcon from './icons/UserCircleIcon';


interface BottomNavProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { view: 'dashboard' as View, label: 'Home', icon: HomeIcon },
    { view: 'add_meal' as View, label: 'Add Meal', icon: PlusCircleIcon },
    { view: 'progress' as View, label: 'Progress', icon: ChartBarIcon },
    { view: 'profile' as View, label: 'Profile', icon: UserCircleIcon },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg md:hidden">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => setCurrentView(item.view)}
              className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${
                isActive ? 'text-green-500' : 'text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400'
              }`}
            >
              <Icon className={`h-6 w-6 ${item.view === 'add_meal' ? 'h-8 w-8 -mt-1' : ''}`} />
              <span className={`text-xs mt-1 ${item.view === 'add_meal' ? 'hidden' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
