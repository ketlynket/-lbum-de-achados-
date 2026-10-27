import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FindItem } from '../types/item';

const ITEMS_KEY = '@album-de-achados/items-v1';

export async function loadItems(): Promise<FindItem[]> {
  const raw = await AsyncStorage.getItem(ITEMS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FindItem[]) : [];
  } catch {
    return [];
  }
}

export async function saveItems(items: FindItem[]): Promise<void> {
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}
