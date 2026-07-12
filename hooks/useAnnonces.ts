import { Platform } from 'react-native';
import { LOTS, type Lot } from '@/constants/mockData';

const KEY = '@aviconnect_annonces';

export async function getAnnonces(): Promise<Lot[]> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = localStorage.getItem(KEY);
    } else {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      raw = await AsyncStorage.getItem(KEY);
    }
    const saved: Lot[] = raw ? JSON.parse(raw) : [];
    // Combine mock data + annonces publiées par les utilisateurs
    const allIds = new Set(LOTS.map((l) => l.id));
    const newOnes = saved.filter((l) => !allIds.has(l.id));
    return [...newOnes, ...LOTS];
  } catch {
    return LOTS;
  }
}

export async function saveAnnonce(annonce: Lot): Promise<void> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = localStorage.getItem(KEY);
    } else {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      raw = await AsyncStorage.getItem(KEY);
    }
    const saved: Lot[] = raw ? JSON.parse(raw) : [];
    saved.unshift(annonce);
    const json = JSON.stringify(saved);
    if (Platform.OS === 'web') {
      localStorage.setItem(KEY, json);
    } else {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(KEY, json);
    }
  } catch {}
}

export function genId(): number {
  return Date.now();
}
