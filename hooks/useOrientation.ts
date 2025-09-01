import { useState, useEffect } from 'react';

type OrientationType = 'portrait' | 'landscape';

interface OrientationState {
  orientation: OrientationType;
  angle: number;
  isPortrait: boolean;
  isLandscape: boolean;
}

export const useOrientation = () => {
  const [orientation, setOrientation] = useState<OrientationState>(() => {
    const angle = window.screen?.orientation?.angle || 0;
    const isLandscape = Math.abs(angle) === 90;
    
    return {
      orientation: isLandscape ? 'landscape' : 'portrait',
      angle,
      isPortrait: !isLandscape,
      isLandscape
    };
  });

  useEffect(() => {
    const updateOrientation = () => {
      const angle = window.screen?.orientation?.angle || 0;
      const isLandscape = Math.abs(angle) === 90;
      
      setOrientation({
        orientation: isLandscape ? 'landscape' : 'portrait',
        angle,
        isPortrait: !isLandscape,
        isLandscape
      });
    };

    // Listen for orientation changes
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', updateOrientation);
    } else {
      // Fallback for older browsers
      window.addEventListener('orientationchange', updateOrientation);
      window.addEventListener('resize', updateOrientation);
    }

    return () => {
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', updateOrientation);
      } else {
        window.removeEventListener('orientationchange', updateOrientation);
        window.removeEventListener('resize', updateOrientation);
      }
    };
  }, []);

  return orientation;
};