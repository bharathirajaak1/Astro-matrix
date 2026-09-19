import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoiceReflection {
  id: string;
  date: string; // YYYY-MM-DD
  affirmationText: string;
  recordingUri: string;
  duration: number; // in seconds
  createdAt: number; // timestamp
}

const STORAGE_KEY = '@astro_matrix_voice_reflections';
const MAX_RECORDINGS = 30;

export async function getAllReflections(): Promise<VoiceReflection[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: VoiceReflection[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to load voice reflections:', error);
    return [];
  }
}

export async function getReflectionByDate(date: string): Promise<VoiceReflection | null> {
  try {
    const all = await getAllReflections();
    return all.find((item) => item.date === date) || null;
  } catch (error) {
    console.warn(`Failed to fetch reflection for ${date}:`, error);
    return null;
  }
}

export async function saveReflection(
  reflection: Omit<VoiceReflection, 'id' | 'createdAt'>
): Promise<VoiceReflection> {
  const all = await getAllReflections();

  const newEntry: VoiceReflection = {
    ...reflection,
    id: `voice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
  };

  // Replace if existing for same date, otherwise prepend
  const filtered = all.filter((item) => item.date !== reflection.date);
  let updated = [newEntry, ...filtered];

  // Enforce 30-entry rolling window: remove oldest if storage limit exceeded
  if (updated.length > MAX_RECORDINGS) {
    updated = updated.slice(0, MAX_RECORDINGS);
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save reflection to AsyncStorage:', error);
  }

  return newEntry;
}

export async function deleteReflection(id: string): Promise<VoiceReflection[]> {
  try {
    const all = await getAllReflections();
    const updated = all.filter((item) => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.warn('Failed to delete reflection:', error);
    return [];
  }
}