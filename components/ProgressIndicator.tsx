import React from 'react';

interface ProgressIndicatorProps {
  currentIndex: number;
  totalExercises: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentIndex, totalExercises }) => {
  const progressPercentage = ((currentIndex + 1) / totalExercises) * 100;

  return (
    <div className="bg-gray-800 px-6 py-4">
      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Exercise {currentIndex + 1} of {totalExercises}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Exercise Dots */}
      <div className="flex justify-center space-x-2">
        {Array.from({ length: totalExercises }, (_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index < currentIndex 
                ? 'bg-green-500' 
                : index === currentIndex 
                ? 'bg-blue-500' 
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;