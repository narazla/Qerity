import AsyncStorage from '@react-native-async-storage/async-storage';
import { OJK_LEGAL_LIST } from '../data/ojkLegalList';
import { KNOWN_SCAM_HASHES } from '../data/knownScamHashes';
import { DATA_PACK_PUBLIC_KEY_BASE64 } from '../data/publicKey';
import { verifyPack } from './verifyPack';

export const DATA_PACK_BASE_URL = 'https://raw.githubusercontent.com/narazla/Qerity/main/publish';
const ACTIVE_PACK_KEY = '@qerity/data-pack';
const HIGHEST_SEEN_VERSION_KEY = '@qerity/data-pack-highest-seen-version';
const LAST_CHECK_KEY = '@qerity/data-pack-last-check';
const AUTO_UPDATE_KEY = '@qerity/auto-update-enabled';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

const bundledData = {
  ojk: OJK_LEGAL_LIST,
  scamHashes: KNOWN_SCAM_HASHES,
  meta: {
    source: 'bundled',
    version: 0,
    issuedAt: null,
    snapshotDate: '2026-07-04',
    isExpired: false,
  },
};

let activeData = bundledData;

export function getActiveData() {
  return activeData;
}

function packToActiveData(pack) {
  return {
    ojk: pack.ojk,
    scamHashes: pack.scamHashes,
    meta: {
      source: 'updated',
      version: pack.version,
      issuedAt: pack.issuedAt,
      snapshotDate: pack.source.snapshotDate,
      isExpired: Date.now() >= Date.parse(pack.expiresAt),
    },
  };
}

async function fetchText(url) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = setTimeout(() => controller?.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, controller ? { signal: controller.signal } : undefined);
    if (!response.ok) throw new Error(`http_${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function hydrateDataPack() {
  try {
    const cached = await AsyncStorage.getItem(ACTIVE_PACK_KEY);
    if (cached) {
      const stored = JSON.parse(cached);
      const result = verifyPack(stored.rawJsonText, stored.signatureBase64, DATA_PACK_PUBLIC_KEY_BASE64);
      if (result.ok) activeData = packToActiveData(result.pack);
    }
  } catch {
    activeData = bundledData;
  }
  return activeData;
}

export async function checkForUpdate() {
  try {
    const enabled = await AsyncStorage.getItem(AUTO_UPDATE_KEY);
    if (enabled === 'false') return { ok: false, reason: 'disabled' };

    const [rawJsonText, signatureBase64] = await Promise.all([
      fetchText(`${DATA_PACK_BASE_URL}/datapack.json`),
      fetchText(`${DATA_PACK_BASE_URL}/datapack.sig`),
    ]);
    const activeVersion = activeData.meta.version;
    const highestSeenVersion = Number(await AsyncStorage.getItem(HIGHEST_SEEN_VERSION_KEY)) || 0;
    const result = verifyPack(rawJsonText, signatureBase64.trim(), DATA_PACK_PUBLIC_KEY_BASE64, {
      currentVersion: Math.max(activeVersion, highestSeenVersion),
    });
    if (!result.ok) return result;

    await AsyncStorage.setItem(ACTIVE_PACK_KEY, JSON.stringify({ rawJsonText, signatureBase64: signatureBase64.trim() }));
    await AsyncStorage.setItem(HIGHEST_SEEN_VERSION_KEY, String(result.pack.version));
    activeData = packToActiveData(result.pack);
    return result;
  } catch (error) {
    return { ok: false, reason: error.name === 'AbortError' ? 'timeout' : 'request_failed' };
  }
}

export async function initializeDataPack() {
  await hydrateDataPack();
  try {
    const enabled = await AsyncStorage.getItem(AUTO_UPDATE_KEY);
    if (enabled === null) await AsyncStorage.setItem(AUTO_UPDATE_KEY, 'true');
    if (enabled === 'false') return;
    const lastCheck = Number(await AsyncStorage.getItem(LAST_CHECK_KEY)) || 0;
    if (Date.now() - lastCheck < CHECK_INTERVAL_MS) return;
    await AsyncStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
    await checkForUpdate();
  } catch {
    // Bundled data remains active when initialization fails.
  }
}

export async function setAutoUpdateEnabled(enabled) {
  await AsyncStorage.setItem(AUTO_UPDATE_KEY, enabled ? 'true' : 'false');
}

export async function getAutoUpdateEnabled() {
  return (await AsyncStorage.getItem(AUTO_UPDATE_KEY)) !== 'false';
}
