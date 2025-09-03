
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  PlusCircleIcon, 
  ChartBarIcon, 
  UserCircleIcon 
} from './icons';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items
  const navItems = [
    {
      id: '/',
      label: 'Dashboard',
      icon: HomeIcon,
      color: 'text-blue-600'
    },
    {
      id: '/add-meal',
      label: 'Add Meal',
      icon: PlusCircleIcon,
      color: 'text-green-600'
    },
    {
      id: '/guided-workouts',
      label: 'Workouts',
      icon: ChartBarIcon,
      color: 'text-purple-600'
    },
    {
      id: '/profile',
      label: 'Profile',
      icon: UserCircleIcon,
      color: 'text-gray-600'
    }
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center py-3 px-2 flex-1 transition-all duration-200 ${
                isActive 
                  ? `${item.color} bg-gray-50 dark:bg-gray-700` 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? item.color : ''}`} />
              <span className={`text-xs font-medium ${isActive ? item.color : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
