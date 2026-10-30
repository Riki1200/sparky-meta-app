import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReadingSessionResult } from '../types';

const STORAGE_KEY_SESSIONS = '@Sparky_reading_sessions';
const STORAGE_KEY_STREAK = '@Sparky_reading_streak';

export async function saveReadingSession(session: ReadingSessionResult): Promise<void> {
  try {
    const existing = await getReadingHistory();
    const updated = [session, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));

    // Update streak
    await updateStreak();
  } catch (e) {
    console.warn('Error saving session locally:', e);
  }
}

export async function getReadingHistory(): Promise<ReadingSessionResult[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading session history:', e);
    return [];
  }
}

export async function getReadingStats() {
  const history = await getReadingHistory();
  if (history.length === 0) {
    return {
      totalMinutes: 0,
      totalWords: 0,
      avgAccuracy: 0,
      streakDays: 1,
      sessionsCount: 0,
      avgWpm: 0,
    };
  }

  const totalWords = history.reduce((acc, s) => acc + s.totalWords, 0);
  const totalSeconds = history.reduce((acc, s) => acc + s.durationSeconds, 0);
  const avgAccuracy = Math.round(
    history.reduce((acc, s) => acc + s.accuracyPercent, 0) / history.length
  );
  const avgWpm = Math.round(
    history.reduce((acc, s) => acc + s.wordsPerMinute, 0) / history.length
  );

  let streak = 1;
  try {
    const rawStreak = await AsyncStorage.getItem(STORAGE_KEY_STREAK);
    if (rawStreak) streak = parseInt(rawStreak, 10);
  } catch (e) {
    // fallback
  }

  return {
    totalMinutes: Math.round(totalSeconds / 60) || 1,
    totalWords,
    avgAccuracy,
    streakDays: streak,
    sessionsCount: history.length,
    avgWpm,
  };
}

const STORAGE_KEY_STARS = '@Sparky_reading_stars';

export async function getStarsCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_STARS);
    return raw ? parseInt(raw, 10) : 45; // default 45 welcome stars
  } catch (e) {
    return 45;
  }
}

export async function addStars(amount: number): Promise<number> {
  try {
    const current = await getStarsCount();
    const next = current + amount;
    await AsyncStorage.setItem(STORAGE_KEY_STARS, String(next));
    return next;
  } catch (e) {
    return 45;
  }
}

const STORAGE_KEY_LAST_READ_DAY = '@Sparky_last_read_day';

// Streak counts consecutive calendar days with at least one session, not sessions
async function updateStreak() {
  try {
    const today = new Date().toDateString();
    const lastDay = await AsyncStorage.getItem(STORAGE_KEY_LAST_READ_DAY);
    if (lastDay === today) return;

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    const raw = await AsyncStorage.getItem(STORAGE_KEY_STREAK);
    const current = raw ? parseInt(raw, 10) : 0;
    const next = lastDay === yesterday ? current + 1 : 1;

    await AsyncStorage.setItem(STORAGE_KEY_STREAK, String(next));
    await AsyncStorage.setItem(STORAGE_KEY_LAST_READ_DAY, today);
  } catch (e) {
    // ignore
  }
}

const STORAGE_KEY_ONBOARDING = '@Sparky_onboarding_completed';
const STORAGE_KEY_USER_PROFILE = '@Sparky_user_profile';

export interface UserProfile {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  dailyGoalMinutes: number;
  avatar: string;
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ONBOARDING);
    return raw === 'true';
  } catch (e) {
    return false;
  }
}

export async function setOnboardingCompleted(completed: boolean = true): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_ONBOARDING, completed ? 'true' : 'false');
  } catch (e) {
    console.warn('Error setting onboarding completed:', e);
  }
}

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_USER_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return {
    name: 'Young Reader',
    level: 'intermediate',
    dailyGoalMinutes: 10,
    avatar: 'star',
  };
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const current = await getUserProfile();
  const updated: UserProfile = { ...current, ...profile };
  try {
    await AsyncStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving user profile:', e);
  }
  return updated;
}


const STORAGE_KEY_CLOUD_VOICE_CONSENT = '@Sparky_cloud_voice_consent';

// Parent permission to send child audio to Meta Muse Voice Transcribe (off by default)
export async function getCloudVoiceConsent(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY_CLOUD_VOICE_CONSENT)) === 'true';
  } catch (e) {
    return false;
  }
}

export async function setCloudVoiceConsent(allowed: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_CLOUD_VOICE_CONSENT, allowed ? 'true' : 'false');
  } catch (e) {
    console.warn('Error saving cloud voice consent:', e);
  }
}

const STORAGE_KEY_CLOUD_VISION_CONSENT = '@Sparky_cloud_vision_consent';

// Parent permission to send book page photos to Meta Muse Spark for reading (off by default)
export async function getCloudVisionConsent(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY_CLOUD_VISION_CONSENT)) === 'true';
  } catch (e) {
    return false;
  }
}

export async function setCloudVisionConsent(allowed: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_CLOUD_VISION_CONSENT, allowed ? 'true' : 'false');
  } catch (e) {
    console.warn('Error saving cloud vision consent:', e);
  }
}
