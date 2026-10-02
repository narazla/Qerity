import AsyncStorage from '@react-native-async-storage/async-storage';

export const SCAN_HISTORY_KEY = '@qerity/scan-history';

export async function saveScanHistory(entry) {
  const rawHistory = await AsyncStorage.getItem(SCAN_HISTORY_KEY);
  const history = rawHistory ? JSON.parse(rawHistory) : [];
  const nextHistory = [...history, entry];
  await AsyncStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(nextHistory));
}

export async function loadScanHistory() {
  const rawHistory = await AsyncStorage.getItem(SCAN_HISTORY_KEY);
  const history = rawHistory ? JSON.parse(rawHistory) : [];
  return Array.isArray(history) ? history : [];
}

export async function clearScanHistory() {
  await AsyncStorage.removeItem(SCAN_HISTORY_KEY);
}
