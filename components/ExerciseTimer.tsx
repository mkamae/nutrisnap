import React, { useState, useEffect, useRef } from 'react';

interface ExerciseTimerProps {
  duration: number; // Duration in seconds
  isPlaying: boolean;
  onComplete: () => void;
}

const ExerciseTimer: React.FC<ExerciseTimerProps> = ({ duration, isPlaying, onComplete }) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timer when duration changes (new exercise)
  useEffect(() => {
    setTimeRemaining(duration);
    setIsActive(false);
  }, [duration]);

  // Handle play/pause
  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [isPlaying, timeRemaining]);

  // Timer countdown logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsActive(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeRemaining, onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((duration - timeRemaining) / duration) * 100;

  return (
    <div className="text-center">
      {/* Circular Progress */}
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPercentage / 100)}`}
            className={`transition-all duration-1000 ${
              timeRemaining <= 5 ? 'text-red-500' : 'text-green-500'
            }`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Timer display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold ${
            timeRemaining <= 5 ? 'text-red-500' : 'text-white'
          }`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>

      {/* Status text */}
      <div className="text-sm text-gray-400">
        {timeRemaining === 0 ? (
          <span className="text-green-500 font-semibold">Complete!</span>
        ) : isActive ? (
          <span>Timer running...</span>
        ) : (
          <span>Press play to start</span>
        )}
      </div>
    </div>
  );
};

export default ExerciseTimer;