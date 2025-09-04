// Google Analytics utility functions
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Track page views
export const trackPageView = (page_title: string, page_location?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title,
      page_location: page_location || window.location.href,
    });
  }
};

// Track custom events
export const trackEvent = (
  event_name: string,
  event_category: string,
  event_label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event_name, {
      event_category,
      event_label,
      value,
    });
  }
};

// Track workout events
export const trackWorkoutEvent = (action: string, workout_type: string, duration?: number) => {
  trackEvent('workout', 'fitness', `${action}_${workout_type}`, duration);
};

// Track meal events
export const trackMealEvent = (action: string, meal_type: string) => {
  trackEvent('meal', 'nutrition', `${action}_${meal_type}`);
};

// Track user engagement events
export const trackEngagementEvent = (action: string, feature: string) => {
  trackEvent('engagement', 'user_interaction', `${action}_${feature}`);
};

// Track error events
export const trackErrorEvent = (error_type: string, error_message: string) => {
  trackEvent('error', 'app_error', `${error_type}_${error_message}`);
};

// Track conversion events
export const trackConversionEvent = (conversion_type: string, value?: number) => {
  trackEvent('conversion', 'user_action', conversion_type, value);
};

// Initialize analytics (called on app startup)
export const initializeAnalytics = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Track app startup
    trackEvent('app_start', 'app_lifecycle', 'app_launch');
    
    // Track initial page view
    trackPageView('NutriSnap - Home', window.location.href);
  }
};
