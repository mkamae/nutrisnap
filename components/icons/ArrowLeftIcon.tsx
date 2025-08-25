import React from 'react';

interface IconProps {
  className?: string;
}

const ArrowLeftIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M15 19l-7-7 7-7" 
    />
  </svg>
);

export default ArrowLeftIcon;
