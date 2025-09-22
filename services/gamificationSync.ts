import { supabase } from './supabaseService';

export interface GamificationState {
  points: number;
  level: number;
  streak: number;
  lastActivityDate: string;
  lastLoginDate: string;
  unlockedBadges: string[];
  totalMealsLogged: number;
  totalWorkoutsCompleted: number;
  totalLogins: number;
}

// Map app state -> DB row
export function toDbRecord(userId: string, s: GamificationState) {
  return {
    user_id: userId,
    points: s.points,
    level: s.level,
    streak: s.streak,
    last_activity_date: s.lastActivityDate || null,
    last_login_date: s.lastLoginDate || null,
    unlocked_badges: s.unlockedBadges,
    total_meals_logged: s.totalMealsLogged,
    total_workouts_completed: s.totalWorkoutsCompleted,
    total_logins: s.totalLogins,
    updated_at: new Date().toISOString()
  };
}

// Map DB row -> app state
export function fromDbRecord(r: any): GamificationState {
  return {
    points: r.points ?? 0,
    level: r.level ?? 1,
    streak: r.streak ?? 0,
    lastActivityDate: r.last_activity_date ?? '',
    lastLoginDate: r.last_login_date ?? '',
    unlockedBadges: Array.isArray(r.unlocked_badges) ? r.unlocked_badges : [],
    totalMealsLogged: r.total_meals_logged ?? 0,
    totalWorkoutsCompleted: r.total_workouts_completed ?? 0,
    totalLogins: r.total_logins ?? 0,
  };
}

export async function fetchGamification(userId: string): Promise<GamificationState | null> {
  const { data, error } = await supabase
    .from('gamification_progress')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  if (!data) return null;
  return fromDbRecord(data);
}

export async function upsertGamification(userId: string, s: GamificationState): Promise<void> {
  const row = toDbRecord(userId, s);
  const { error } = await supabase
    .from('gamification_progress')
    .upsert(row, { onConflict: 'user_id' });
  if (error) throw error;
}


