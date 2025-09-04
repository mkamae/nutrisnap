# Google Analytics Implementation

## Overview
NutriSnap uses Google Analytics 4 (GA4) to track user interactions and app performance. The implementation includes both automatic page tracking and custom event tracking for specific user actions.

## Setup

### 1. Google Analytics Code
The Google Analytics tracking code is included in `index.html`:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-DT6TFN7PQH"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-DT6TFN7PQH');
</script>
```

### 2. Analytics Utility Functions
Located in `utils/analytics.ts`, providing helper functions for tracking custom events.

## Tracked Events

### Page Views
- **App Startup**: `app_start` - app_lifecycle
- **Dashboard**: `page_view` - NutriSnap - Dashboard
- **Workout Sessions**: `page_view` - NutriSnap - Workout Sessions
- **Sign Out**: `page_view` - NutriSnap - Sign Out

### User Engagement
- **Workout Session View**: `engagement` - user_interaction - view_workout_session_{category}
- **Image Upload**: `engagement` - user_interaction - upload_meal_image

### Nutrition Events
- **Meal Addition**: `meal` - nutrition - add_{meal_name}

### App Lifecycle
- **App Launch**: `app_start` - app_lifecycle - app_launch

## Usage Examples

### Basic Event Tracking
```typescript
import { trackEvent } from '../utils/analytics';

// Track a custom event
trackEvent('button_click', 'ui_interaction', 'save_button', 1);
```

### Workout Tracking
```typescript
import { trackWorkoutEvent } from '../utils/analytics';

// Track workout completion
trackWorkoutEvent('complete', 'strength', 1800); // 30 minutes
```

### Meal Tracking
```typescript
import { trackMealEvent } from '../utils/analytics';

// Track meal addition
trackMealEvent('add', 'breakfast');
```

### Error Tracking
```typescript
import { trackErrorEvent } from '../utils/analytics';

// Track application errors
trackErrorEvent('api_error', 'Failed to load meals');
```

## Privacy Considerations

- **No Personal Data**: We do not track personal information like names, emails, or specific meal details
- **User Consent**: Analytics are essential for app functionality and improvement
- **Data Retention**: Follows Google Analytics standard data retention policies
- **GDPR Compliance**: Implementation respects user privacy preferences

## Analytics Dashboard

Access your analytics data at: https://analytics.google.com/

### Key Metrics to Monitor
- **User Engagement**: Page views, session duration
- **Feature Usage**: Workout sessions, meal tracking
- **Error Rates**: Application errors and failures
- **User Journey**: Navigation patterns and feature adoption

## Implementation Notes

- Analytics are initialized on app startup
- Events are tracked automatically for key user actions
- Error handling ensures analytics don't break app functionality
- Mobile-friendly tracking for both web and mobile users

## Future Enhancements

- Conversion tracking for premium features
- A/B testing integration
- Custom user journey tracking
- Performance monitoring integration
