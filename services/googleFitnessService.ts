import { WorkoutSession, UserProfile } from '../types';

// Google Fitness API Types
export interface GoogleFitnessData {
  steps: number;
  calories: number;
  distance: number;
  heartRate: number[];
  sleep: SleepData[];
  workouts: GoogleWorkout[];
  weight: WeightData[];
  nutrition: NutritionData[];
}

export interface SleepData {
  startTime: string;
  endTime: string;
  duration: number;
  sleepStages: SleepStage[];
}

export interface SleepStage {
  stage: 'light' | 'deep' | 'rem' | 'awake';
  startTime: string;
  endTime: string;
  duration: number;
}

export interface GoogleWorkout {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  calories: number;
  activityType: string;
  distance?: number;
  steps?: number;
  heartRate?: number[];
}

export interface WeightData {
  weight: number;
  timestamp: string;
  source: string;
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
  mealType: string;
}

export interface FitnessGoals {
  dailySteps: number;
  dailyCalories: number;
  weeklyWorkouts: number;
  sleepGoal: number;
}

class GoogleFitnessService {
  private clientId: string;
  private apiKey: string;
  private accessToken: string | null = null;
  private isInitialized = false;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    this.apiKey = import.meta.env.VITE_GOOGLE_FIT_API_KEY || '';
  }

  // Initialize Google Fitness API
  async initialize(): Promise<boolean> {
    try {
      if (!this.clientId || !this.apiKey) {
        console.warn('Google Fitness API credentials not configured. Google Fitness features will be disabled.');
        console.warn('To enable Google Fitness, set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_FIT_API_KEY in your .env file');
        return false;
      }

      // Load Google API client
      await this.loadGoogleAPI();
      
      // Check if user is already authenticated
      const token = await this.getStoredToken();
      if (token) {
        this.accessToken = token;
        this.isInitialized = true;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to initialize Google Fitness API:', error);
      return false;
    }
  }

  // Load Google API client
  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', () => {
          window.gapi.client.init({
            clientId: this.clientId,
            scope: [
              'https://www.googleapis.com/auth/fitness.activity.read',
              'https://www.googleapis.com/auth/fitness.body.read',
              'https://www.googleapis.com/auth/fitness.heart_rate.read',
              'https://www.googleapis.com/auth/fitness.location.read',
              'https://www.googleapis.com/auth/fitness.nutrition.read',
              'https://www.googleapis.com/auth/fitness.sleep.read',
              'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
              'https://www.googleapis.com/auth/fitness.temperature.read',
              'https://www.googleapis.com/auth/fitness.blood_pressure.read',
              'https://www.googleapis.com/auth/fitness.body_temperature.read',
              'https://www.googleapis.com/auth/fitness.reproductive_health.read'
            ].join(' ')
          }).then(() => {
            resolve();
          }).catch(reject);
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Authenticate user
  async authenticate(): Promise<boolean> {
    try {
      if (!window.gapi) {
        await this.loadGoogleAPI();
      }

      const auth2 = window.gapi.auth2.getAuthInstance();
      if (!auth2.isSignedIn.get()) {
        const user = await auth2.signIn();
        this.accessToken = user.getAuthResponse().access_token;
        this.storeToken(this.accessToken);
        this.isInitialized = true;
        return true;
      } else {
        const user = auth2.currentUser.get();
        this.accessToken = user.getAuthResponse().access_token;
        this.storeToken(this.accessToken);
        this.isInitialized = true;
        return true;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      if (window.gapi && window.gapi.auth2) {
        const auth2 = window.gapi.auth2.getAuthInstance();
        await auth2.signOut();
      }
      this.accessToken = null;
      this.isInitialized = false;
      this.removeStoredToken();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  // Get today's fitness data
  async getTodayFitnessData(): Promise<GoogleFitnessData> {
    if (!this.isInitialized || !this.accessToken) {
      throw new Error('Google Fitness API not initialized');
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [steps, calories, distance, heartRate, sleep, workouts, weight, nutrition] = await Promise.all([
      this.getSteps(startOfDay, endOfDay),
      this.getCalories(startOfDay, endOfDay),
      this.getDistance(startOfDay, endOfDay),
      this.getHeartRate(startOfDay, endOfDay),
      this.getSleep(startOfDay, endOfDay),
      this.getWorkouts(startOfDay, endOfDay),
      this.getWeight(startOfDay, endOfDay),
      this.getNutrition(startOfDay, endOfDay)
    ]);

    return {
      steps,
      calories,
      distance,
      heartRate,
      sleep,
      workouts,
      weight,
      nutrition
    };
  }

  // Get steps for a time range
  private async getSteps(startTime: Date, endTime: Date): Promise<number> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            aggregateBy: [{
              dataTypeName: 'com.google.step_count.delta',
              dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
            }],
            bucketByTime: {
              durationMillis: endTime.getTime() - startTime.getTime()
            },
            startTimeMillis: startTime.getTime(),
            endTimeMillis: endTime.getTime()
          })
        }
      );

      const data = await response.json();
      return data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0;
    } catch (error) {
      console.error('Failed to get steps:', error);
      return 0;
    }
  }

  // Get calories for a time range
  private async getCalories(startTime: Date, endTime: Date): Promise<number> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            aggregateBy: [{
              dataTypeName: 'com.google.calories.expended',
              dataSourceId: 'derived:com.google.calories.expended:com.google.android.gms:from_activities'
            }],
            bucketByTime: {
              durationMillis: endTime.getTime() - startTime.getTime()
            },
            startTimeMillis: startTime.getTime(),
            endTimeMillis: endTime.getTime()
          })
        }
      );

      const data = await response.json();
      return data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal || 0;
    } catch (error) {
      console.error('Failed to get calories:', error);
      return 0;
    }
  }

  // Get distance for a time range
  private async getDistance(startTime: Date, endTime: Date): Promise<number> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            aggregateBy: [{
              dataTypeName: 'com.google.distance.delta',
              dataSourceId: 'derived:com.google.distance.delta:com.google.android.gms:from_activities'
            }],
            bucketByTime: {
              durationMillis: endTime.getTime() - startTime.getTime()
            },
            startTimeMillis: startTime.getTime(),
            endTimeMillis: endTime.getTime()
          })
        }
      );

      const data = await response.json();
      return data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal || 0;
    } catch (error) {
      console.error('Failed to get distance:', error);
      return 0;
    }
  }

  // Get heart rate for a time range
  private async getHeartRate(startTime: Date, endTime: Date): Promise<number[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm/datasets/${startTime.getTime()}-${endTime.getTime()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const data = await response.json();
      return data.point?.map((p: any) => p.value[0].fpVal) || [];
    } catch (error) {
      console.error('Failed to get heart rate:', error);
      return [];
    }
  }

  // Get sleep data for a time range
  private async getSleep(startTime: Date, endTime: Date): Promise<SleepData[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.sleep.segment:com.google.android.gms:merged/datasets/${startTime.getTime()}-${endTime.getTime()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const data = await response.json();
      return data.point?.map((p: any) => ({
        startTime: new Date(parseInt(p.startTimeNanos) / 1000000).toISOString(),
        endTime: new Date(parseInt(p.endTimeNanos) / 1000000).toISOString(),
        duration: (parseInt(p.endTimeNanos) - parseInt(p.startTimeNanos)) / 1000000 / 1000 / 60, // minutes
        sleepStages: p.value[0].intVal === 1 ? [{ stage: 'sleep', startTime: p.startTimeNanos, endTime: p.endTimeNanos, duration: 0 }] : []
      })) || [];
    } catch (error) {
      console.error('Failed to get sleep data:', error);
      return [];
    }
  }

  // Get workouts for a time range
  private async getWorkouts(startTime: Date, endTime: Date): Promise<GoogleWorkout[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const data = await response.json();
      return data.session?.map((s: any) => ({
        id: s.id,
        name: s.name || s.activityType,
        startTime: new Date(parseInt(s.startTimeMillis)).toISOString(),
        endTime: new Date(parseInt(s.endTimeMillis)).toISOString(),
        duration: (parseInt(s.endTimeMillis) - parseInt(s.startTimeMillis)) / 1000 / 60, // minutes
        calories: s.calories || 0,
        activityType: s.activityType,
        distance: s.distance || undefined,
        steps: s.steps || undefined
      })) || [];
    } catch (error) {
      console.error('Failed to get workouts:', error);
      return [];
    }
  }

  // Get weight data for a time range
  private async getWeight(startTime: Date, endTime: Date): Promise<WeightData[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.weight:com.google.android.gms:merge_weight/datasets/${startTime.getTime()}-${endTime.getTime()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const data = await response.json();
      return data.point?.map((p: any) => ({
        weight: p.value[0].fpVal,
        timestamp: new Date(parseInt(p.startTimeNanos) / 1000000).toISOString(),
        source: p.dataSourceId
      })) || [];
    } catch (error) {
      console.error('Failed to get weight data:', error);
      return [];
    }
  }

  // Get nutrition data for a time range
  private async getNutrition(startTime: Date, endTime: Date): Promise<NutritionData[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.nutrition:com.google.android.gms:aggregated/datasets/${startTime.getTime()}-${endTime.getTime()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      const data = await response.json();
      return data.point?.map((p: any) => ({
        calories: p.value.find((v: any) => v.name === 'calories')?.fpVal || 0,
        protein: p.value.find((v: any) => v.name === 'protein')?.fpVal || 0,
        carbs: p.value.find((v: any) => v.name === 'carbs.total')?.fpVal || 0,
        fat: p.value.find((v: any) => v.name === 'fat.total')?.fpVal || 0,
        timestamp: new Date(parseInt(p.startTimeNanos) / 1000000).toISOString(),
        mealType: 'unknown'
      })) || [];
    } catch (error) {
      console.error('Failed to get nutrition data:', error);
      return [];
    }
  }

  // Sync Google Fitness workouts with local app
  async syncWorkouts(): Promise<WorkoutSession[]> {
    try {
      const fitnessData = await this.getTodayFitnessData();
      
      return fitnessData.workouts.map(workout => ({
        id: workout.id,
        userId: '', // Will be set by parent component
        routineId: undefined,
        sessionDate: workout.startTime.split('T')[0],
        startTime: workout.startTime,
        endTime: workout.endTime,
        totalDurationMinutes: workout.duration,
        caloriesBurned: workout.calories,
        notes: `${workout.name} (${workout.activityType})`
      }));
    } catch (error) {
      console.error('Failed to sync workouts:', error);
      return [];
    }
  }

  // Get fitness goals and recommendations
  async getFitnessGoals(profile: UserProfile): Promise<FitnessGoals> {
    // Calculate personalized goals based on user profile
    const baseSteps = 10000;
    const baseCalories = profile.dailyCalorieGoal || 2500;
    const baseWorkouts = profile.activityLevel === 'very_active' ? 6 : 
                        profile.activityLevel === 'active' ? 5 :
                        profile.activityLevel === 'moderate' ? 4 :
                        profile.activityLevel === 'light' ? 3 : 2;
    const baseSleep = 8; // hours

    return {
      dailySteps: baseSteps,
      dailyCalories: baseCalories,
      weeklyWorkouts: baseWorkouts,
      sleepGoal: baseSleep
    };
  }

  // Get fitness insights and trends
  async getFitnessInsights(days: number = 7): Promise<any> {
    try {
      const insights = [];
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const [steps, calories, distance] = await Promise.all([
          this.getSteps(dayStart, dayEnd),
          this.getCalories(dayStart, dayEnd),
          this.getDistance(dayStart, dayEnd)
        ]);

        insights.push({
          date: date.toISOString().split('T')[0],
          steps,
          calories,
          distance
        });
      }

      return insights;
    } catch (error) {
      console.error('Failed to get fitness insights:', error);
      return [];
    }
  }

  // Private helper methods for token storage
  private storeToken(token: string): void {
    localStorage.setItem('google_fitness_token', token);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('google_fitness_token');
  }

  private removeStoredToken(): void {
    localStorage.removeItem('google_fitness_token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isInitialized && !!this.accessToken;
  }

  // Get authentication status
  getAuthStatus(): { isInitialized: boolean; isAuthenticated: boolean } {
    return {
      isInitialized: this.isInitialized,
      isAuthenticated: this.isAuthenticated()
    };
  }
}

// Create and export singleton instance
export const googleFitnessService = new GoogleFitnessService();

// Add types to window object for Google API
declare global {
  interface Window {
    gapi: any;
  }
}
