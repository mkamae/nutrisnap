
import React from 'react';
import { View } from '../types';
import HomeIcon from './icons/HomeIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import UserCircleIcon from './icons/UserCircleIcon';

interface BottomNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    {
      id: 'dashboard' as View,
      label: 'Dashboard',
      icon: HomeIcon,
      color: 'text-blue-600'
    },
    {
      id: 'add_meal' as View,
      label: 'Add Meal',
      icon: PlusCircleIcon,
      color: 'text-green-600'
    },
    {
      id: 'workouts' as View,
      label: 'Workouts',
      icon: ChartBarIcon,
      color: 'text-purple-600'
    },
    {
      id: 'profile' as View,
      label: 'Profile',
      icon: UserCircleIcon,
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${
                isActive 
                  ? `${item.color} dark:text-white` 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
