# Google Fitness API Integration Setup

This guide will help you set up Google Fitness API integration for your NutriSnap application.

## Prerequisites

- Google Cloud Console account
- NutriSnap application running locally or deployed

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make sure billing is enabled for the project

### 1.2 Enable APIs
1. Go to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - **Google Fitness API**
   - **Google+ API** (if not already enabled)

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Select "Web application" as the application type
4. Configure the OAuth consent screen if prompted
5. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `http://localhost:5174` (development)
   - `https://yourdomain.com` (production)
6. Add authorized redirect URIs:
   - `http://localhost:5173` (development)
   - `http://localhost:5174` (development)
   - `https://yourdomain.com` (production)
7. Click "Create"
8. Copy the **Client ID** - you'll need this for your environment variables

### 1.4 Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the **API Key** - you'll need this for your environment variables

## Step 2: Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://adxtkbhtezlzuydrzmcx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeHRrYmh0ZXpsenV5ZHJ6bWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzc0NjIsImV4cCI6MjA3MDkxMzQ2Mn0.IEQZLSHdJ8nyz8-Hc8wxgHhPHu7slcL3vkeFSBjKsx0

# Gemini AI Configuration
VITE_GEMINI_API_KEY=AIzaSyD1F8_nwp5dz9KG3RtHe12iHYNjvwSKizs

# Google Fitness API Configuration
VITE_GOOGLE_CLIENT_ID=854458799280-ag7ojs30mgtc0m0bser0tqm6nn3o8d7a.apps.googleusercontent.com
VITE_GOOGLE_FIT_API_KEY=AIzaSyD1F8_nwp5dz9KG3RtHe12iHYNjvwSKizs
```

**Note**: For this project, the Google API Key is the same as the Gemini API Key. This is a simplified configuration that works for both services.

## Step 3: OAuth Consent Screen Configuration

### 3.1 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "NutriSnap"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes for Google Fitness:
   - `https://www.googleapis.com/auth/fitness.activity.read`
   - `https://www.googleapis.com/auth/fitness.body.read`
   - `https://www.googleapis.com/auth/fitness.heart_rate.read`
   - `https://www.googleapis.com/auth/fitness.location.read`
   - `https://www.googleapis.com/auth/fitness.nutrition.read`
   - `https://www.googleapis.com/auth/fitness.sleep.read`
   - `https://www.googleapis.com/auth/fitness.oxygen_saturation.read`
   - `https://www.googleapis.com/auth/fitness.temperature.read`
   - `https://www.googleapis.com/auth/fitness.blood_pressure.read`
   - `https://www.googleapis.com/auth/fitness.body_temperature.read`
   - `https://www.googleapis.com/auth/fitness.reproductive_health.read`

### 3.2 Test Users (Development)
1. Add your email as a test user
2. Add any other test users who will be using the app
3. Note: In development, only test users can access the app

## Step 4: Application Features

Once configured, your NutriSnap app will have access to:

### 4.1 Fitness Dashboard
- **Overview Tab**: Daily steps, calories burned, distance, and progress tracking
- **Activity Tab**: Heart rate data, recent workouts, and activity insights
- **Sleep Tab**: Sleep duration and quality tracking
- **Insights Tab**: Personalized recommendations and goal progress

### 4.2 Enhanced Workout Tracking
- **Overview**: Today's workout summary and weekly progress
- **History**: Complete workout history and performance tracking
- **Routines**: Custom workout routine management
- **Sync**: Automatic Google Fitness workout synchronization

### 4.3 Enhanced Activity View
- **Summary**: Comprehensive activity and nutrition balance
- **Trends**: 7-day activity trends and patterns
- **Goals**: Progress tracking and goal management
- **Comparison**: Time-based activity comparisons and insights

## Step 5: Testing the Integration

### 5.1 Local Development
1. Start your development server: `npm run dev`
2. Navigate to the Fitness tab in your app
3. Click "Connect Google Fitness"
4. Sign in with your Google account
5. Grant the necessary permissions
6. Verify that fitness data is being displayed

### 5.2 Data Sources
The integration will pull data from:
- Google Fit app
- Wear OS devices
- Android devices with Google Fit
- iOS devices with Google Fit (if connected)
- Other fitness apps that sync with Google Fit

## Step 6: Troubleshooting

### 6.1 Common Issues

**"Google Fitness API not initialized"**
- Check that environment variables are set correctly
- Verify that the Google Fitness API is enabled in your project
- Ensure OAuth consent screen is properly configured

**"Authentication failed"**
- Check that your OAuth client ID is correct
- Verify that your domain is in the authorized origins
- Ensure you're using a test user account (in development)

**"No fitness data available"**
- Make sure you have fitness data in Google Fit
- Check that the necessary permissions were granted
- Verify that your device is syncing with Google Fit

### 6.2 Debug Information
- Check browser console for detailed error messages
- Verify network requests in browser developer tools
- Check Google Cloud Console for API usage and errors

## Step 7: Production Deployment

### 7.1 Update OAuth Settings
1. Add your production domain to authorized origins
2. Add your production domain to redirect URIs
3. Update environment variables with production values

### 7.2 Security Considerations
- Never commit `.env` files to version control
- Use environment variables in your hosting platform
- Consider implementing additional security measures for production

## Step 8: Advanced Configuration

### 8.1 Custom Scopes
You can modify the requested scopes in `services/googleFitnessService.ts`:

```typescript
scope: [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  // Add or remove scopes as needed
].join(' ')
```

### 8.2 Data Filtering
Customize data retrieval in the service methods:

```typescript
// Example: Get data for a specific date range
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');
const monthlyData = await googleFitnessService.getFitnessData(startDate, endDate);
```

## Support and Resources

- [Google Fitness API Documentation](https://developers.google.com/fit/rest)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [Google Fit Developer Guide](https://developers.google.com/fit/android/get-started)

## Notes

- The Google Fitness API has rate limits and quotas
- Some data may not be available depending on the user's device and settings
- The integration requires user consent and active Google Fit usage
- Data synchronization may have delays depending on the data source

For additional support or questions, please refer to the Google Fitness API documentation or create an issue in the project repository.
