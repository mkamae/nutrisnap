import { useEffect, useRef, useState } from 'react';

interface WakeLockSentinel {
  release(): Promise<void>;
}

interface Navigator {
  wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  };
}

export const useWakeLock = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check if Wake Lock API is supported
    if ('wakeLock' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const requestWakeLock = async () => {
    if (!isSupported || isActive) return;

    try {
      const wakeLock = await (navigator as Navigator).wakeLock!.request('screen');
      wakeLockRef.current = wakeLock;
      setIsActive(true);

      // Listen for wake lock release
      wakeLock.addEventListener?.('release', () => {
        setIsActive(false);
        wakeLockRef.current = null;
      });

      console.log('Wake lock activated');
    } catch (error) {
      console.error('Failed to activate wake lock:', error);
    }
  };

  const releaseWakeLock = async () => {
    if (!wakeLockRef.current) return;

    try {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsActive(false);
      console.log('Wake lock released');
    } catch (error) {
      console.error('Failed to release wake lock:', error);
    }
  };

  // Auto-release on component unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  // Re-request wake lock when page becomes visible (handles tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, isSupported]);

  return {
    isSupported,
    isActive,
    requestWakeLock,
    releaseWakeLock
  };
};