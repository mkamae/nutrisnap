import React from 'react';

interface PlayerControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastExercise: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  isPaused,
  canGoBack,
  canGoNext,
  isLastExercise,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onComplete
}) => {
  return (
    <div className="bg-gray-800 p-6">
      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-6 mb-4">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={!canGoBack}
          className={`touch-button tap-target p-3 rounded-full transition-colors ${
            canGoBack 
              ? 'bg-gray-700 hover:bg-gray-600 text-white active:bg-gray-500' 
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="touch-button tap-target p-4 bg-green-600 hover:bg-green-700 active:bg-green-500 rounded-full text-white transition-colors"
        >
          {isPlaying ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next/Complete Button */}
        <button
          onClick={isLastExercise ? onComplete : onNext}
          className="touch-button tap-target p-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-500 rounded-full text-white transition-colors"
        >
          {isLastExercise ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Control Labels */}
      <div className="flex items-center justify-center space-x-12 text-xs text-gray-400">
        <span className={canGoBack ? '' : 'opacity-50'}>Previous</span>
        <span>{isPlaying ? 'Pause' : 'Play'}</span>
        <span>{isLastExercise ? 'Complete' : 'Next'}</span>
      </div>

      {/* Skip Exercise Button and Swipe Instructions */}
      <div className="mt-4 text-center space-y-2">
        <button
          onClick={onNext}
          className="small-tap-target text-sm text-gray-400 hover:text-white active:text-gray-200 transition-colors py-2 px-4"
        >
          Skip Exercise
        </button>
        <p className="text-xs text-gray-500">
          Swipe left/right to navigate exercises
        </p>
      </div>
    </div>
  );
};

export default PlayerControls;