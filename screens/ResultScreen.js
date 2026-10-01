import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildElaHtml } from '../assets/elaHtml';
import { checkLegality } from '../utils/checkLegality';
import { DATA_SNAPSHOT_DATE } from '../data/ojkLegalList';
import { KNOWN_SCAM_HASHES } from '../data/knownScamHashes';

const STEPS = [
  { key: 'exif', label: 'Checking image metadata' },
  { key: 'dup', label: 'Checking similarity/duplication' },
  { key: 'legal', label: 'Checking entity legality with OJK' },
  { key: 'ela', label: 'Analyzing edited areas (ELA)' },
];
const ANALYSIS_TIMEOUT_MS = 12000;
const ELA_AVG_DIFF_THRESHOLD = 15; // Heuristic; calibrate from real test images.
const ELA_CHANGED_PIXEL_PERCENT_THRESHOLD = 5; // Heuristic; calibrate from real test images.
const DUPLICATE_HAMMING_THRESHOLD = 10; // Heuristic out of 64 bits; calibrate from real image pairs.
const HISTORY_KEY = '@qerity/scan-hashes';

export default function ResultScreen({ asset, entityName, onBack }) {
  const [statuses, setStatuses] = useState({ exif: 'running', dup: 'running', legal: 'running', ela: 'running' });
  const [analysis, setAnalysis] = useState(null);
  const [duplicateResult, setDuplicateResult] = useState(null);
  const [saveHistory, setSaveHistory] = useState(false);
  const [elaHtml] = useState(() =>
    asset && asset.base64 ? buildElaHtml(`data:image/jpeg;base64,${asset.base64}`) : null
  );
  const timeoutRef = useRef(null);

  const exifFindings = analyzeExif(asset && asset.exif);
  const legalityResult = checkLegality(entityName);

  useEffect(() => {
    setStatuses((current) => ({
      ...current,
      exif: asset ? 'done' : 'unavailable',
      legal: legalityResult.status === 'skipped' ? 'skipped' : 'done',
    }));
    if (!elaHtml) {
      setStatuses((current) => ({ ...current, dup: 'unavailable', ela: 'unavailable' }));
      return undefined;
    }
    timeoutRef.current = setTimeout(() => {
      setStatuses((current) => ({
        ...current,
        dup: current.dup === 'running' ? 'error' : current.dup,
        ela: current.ela === 'running' ? 'error' : current.ela,
      }));
    }, ANALYSIS_TIMEOUT_MS);
    return () => clearTimeout(timeoutRef.current);
  }, [elaHtml, legalityResult.status]);

  useEffect(() => {
    if (!analysis || !analysis.hash || statuses.dup !== 'running') return undefined;
    compareAndStoreHash(analysis.hash).then((result) => {
      setDuplicateResult(result);
      setStatuses((current) => ({ ...current, dup: 'done' }));
    }).catch(() => setStatuses((current) => ({ ...current, dup: 'error' })));
    return undefined;
  }, [analysis, statuses.dup]);

  async function toggleHistory(nextValue) {
    setSaveHistory(nextValue);
    if (nextValue && analysis && analysis.hash) await storeHash(analysis.hash);
  }

  const elaFinding = analysis && {
    text: analysis.avgDiff >= ELA_AVG_DIFF_THRESHOLD || analysis.changedPixelPercent >= ELA_CHANGED_PIXEL_PERCENT_THRESHOLD
      ? 'Some areas show inconsistent compression. This can indicate editing, but ELA is not conclusive.'
      : 'No strong compression inconsistency crossed the current ELA thresholds.',
    risk: analysis.avgDiff >= ELA_AVG_DIFF_THRESHOLD || analysis.changedPixelPercent >= ELA_CHANGED_PIXEL_PERCENT_THRESHOLD,
  };

  const legalityFinding = (() => {
    if (legalityResult.status === 'legal') {
      return {
        text: `Exact name match: "${legalityResult.match.app}" (${legalityResult.match.company}) appears in this OJK snapshot. Re-verify directly with OJK.`,
        risk: false,
      };
    }
    if (legalityResult.status === 'similar') {
      return {
        text: `"${entityName}" is similar to "${legalityResult.match.app}" but is not an exact match. Be careful of imitation names.`,
        risk: true,
      };
    }
    if (legalityResult.status === 'not_found') {
      return {
        text: `"${entityName}" was not found in our limited OJK list. This is not proof of illegality; verify directly with OJK (WhatsApp: 081-157-157-157).`,
        risk: true,
      };
    }
    return null;
  })();

  const duplicateFinding = duplicateResult && {
    text: duplicateResult.match
      ? `A similar image was found in ${duplicateResult.source === 'history' ? 'your previous scan history' : 'the bundled scam examples'} (Hamming distance: ${duplicateResult.distance}/64).`
      : 'No match was found in our limited database. This is not proof that the image is genuine.',
    risk: Boolean(duplicateResult.match),
  };
  const riskCount = [exifFindings, [elaFinding], [legalityFinding], [duplicateFinding]]
    .flat().filter(Boolean).filter((finding) => finding.risk).length;
  const errorCount = Object.values(statuses).filter((status) => status === 'error' || status === 'unavailable').length;
  const doneCount = Object.values(statuses).filter((status) => status === 'done').length;
  const terminal = Object.values(statuses).every((status) => ['done', 'error', 'skipped', 'unavailable'].includes(status));
  const verdictLevel = riskCount > 1 ? 'high' : riskCount === 1 || errorCount > 0 ? 'medium' : 'low';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis Result</Text>
        <View style={{ width: 60 }} />
      </View>

      {asset && <Image source={{ uri: asset.uri }} style={styles.preview} />}

      <View style={styles.webviewCard}>
        <Text style={styles.cardLabel}>Error Level Analysis</Text>
        <View style={styles.webviewBox}>
          {elaHtml ? <WebView
              originWhitelist={['*']}
              source={{ html: elaHtml }}
              onMessage={(e) => {
                try {
                  const data = JSON.parse(e.nativeEvent.data);
                  if (data.type === 'analysis_done') {
                    setAnalysis(data);
                    setStatuses((current) => ({ ...current, ela: 'done' }));
                  }
                  if (data.type === 'ela_error') setStatuses((current) => ({ ...current, ela: 'error', dup: 'error' }));
                } catch (err) {
                  setStatuses((current) => ({ ...current, ela: 'error', dup: 'error' }));
                }
              }}
              style={{ backgroundColor: 'transparent' }}
            /> : <Text style={styles.unavailable}>Image data is unavailable for analysis.</Text>}
        </View>
        <Text style={styles.webviewCaption}>Bright areas may indicate editing. ELA is less effective for PNG files or images screenshotted repeatedly.</Text>
      </View>

      <View style={styles.stepsCard}>
        {STEPS.map((s) => {
          const status = statuses[s.key];
          return (
            <View style={styles.stepRow} key={s.key}>
              <View style={[styles.stepDot, status === 'done' && styles.stepDotDone, status === 'error' && styles.stepDotError]}>
                {status === 'running' && <ActivityIndicator size="small" color="#5fe3d3" />}
                {status === 'done' && <Text style={styles.stepCheck}>✓</Text>}
                {status === 'error' && <Text style={styles.stepError}>!</Text>}
              </View>
              <Text style={[styles.stepLabel, status === 'done' && styles.stepLabelDone]}>
                {s.label} — {status}
              </Text>
            </View>
          );
        })}
      </View>

      {duplicateResult && <TouchableOpacity style={styles.historyToggle} onPress={() => toggleHistory(!saveHistory)}>
        <Text style={styles.historyToggleText}>{saveHistory ? '☑' : '☐'} Save this hash to local scan history</Text>
      </TouchableOpacity>}

      {terminal && (
        <View style={[styles.verdict, verdictLevel === 'high' ? styles.verdictHigh : verdictLevel === 'medium' ? styles.verdictMedium : styles.verdictLow]}>
          <Text style={styles.verdictTitle}>
            {verdictLevel === 'high' ? 'High concern: multiple suspicious signals' : verdictLevel === 'medium' ? 'Medium concern: review the signals carefully' : 'Low concern from the completed checks'}
          </Text>
          <Text style={styles.reason}>{doneCount} dari 4 pemeriksaan selesai.</Text>
          {verdictLevel === 'low' && <Text style={styles.reason}>Tidak ditemukan tanda manipulasi dari pemeriksaan ini, tetap verifikasi ke OJK.</Text>}

          {exifFindings.map((f, idx) => (
            <Text key={'ex' + idx} style={styles.reason}>• {f.text}</Text>
          ))}
          {elaFinding && <Text style={styles.reason}>• {elaFinding.text}</Text>}
          {duplicateFinding && <Text style={styles.reason}>• {duplicateFinding.text}</Text>}
          {legalityFinding && <Text style={styles.reason}>• {legalityFinding.text}</Text>}
          {exifFindings.length === 0 && <Text style={styles.reason}>• No EXIF software signal was found; missing EXIF is neutral.</Text>}
          {errorCount > 0 && <Text style={styles.reason}>• One or more checks could not be analyzed. Do not treat this result as confirmation.</Text>}

          {legalityResult.status !== 'skipped' && (
            <Text style={styles.disclaimer}>
              {DATA_SNAPSHOT_DATE} — always re-verify at ojk.go.id.
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

async function compareAndStoreHash(hash) {
  const rawHistory = await AsyncStorage.getItem(HISTORY_KEY);
  const history = rawHistory ? JSON.parse(rawHistory) : [];
  const sources = [
    ...history.map((item) => ({ ...item, source: 'history' })),
    ...KNOWN_SCAM_HASHES.map((item) => ({ ...item, source: 'known' })),
  ];
  const match = sources
    .map((item) => ({ ...item, distance: hammingDistance(hash, item.hash) }))
    .filter((item) => item.distance <= DUPLICATE_HAMMING_THRESHOLD)
    .sort((a, b) => a.distance - b.distance)[0];
  return { match, distance: match ? match.distance : null, source: match ? match.source : null };
}

async function storeHash(hash) {
  const rawHistory = await AsyncStorage.getItem(HISTORY_KEY);
  const history = rawHistory ? JSON.parse(rawHistory) : [];
  if (!history.some((item) => item.hash === hash)) {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([...history, { hash, createdAt: new Date().toISOString() }].slice(-100)));
  }
}

function hammingDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  return Array.from(a).reduce((distance, bit, index) => distance + (bit !== b[index] ? 1 : 0), 0);
}

function analyzeExif(exif) {
  const findings = [];
  const software = exif && (exif.Software || exif.software || (exif.TIFF && (exif.TIFF.Software || exif.TIFF.software)) || (exif.Exif && (exif.Exif.Software || exif.Exif.software)));
  if (software) {
    findings.push({
      text: `Software metadata detected: ${software}. This is a suspicious signal, not proof of manipulation.`,
      risk: true,
    });
  }
  return findings;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0c12', paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  back: { color: '#5fe3d3', fontSize: 14 },
  headerTitle: { color: '#e8e9ee', fontSize: 15, fontWeight: '700' },

  preview: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginTop: 8,
    backgroundColor: '#12151f',
  },

  webviewCard: {
    marginTop: 16,
    backgroundColor: '#12151f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#232838',
    padding: 12,
  },
  cardLabel: { color: '#7b8095', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  webviewBox: { height: 220, borderRadius: 10, overflow: 'hidden' },
  webviewCaption: { color: '#7b8095', fontSize: 11, marginTop: 8, textAlign: 'center' },
  unavailable: { color: '#d99a55', fontSize: 13, textAlign: 'center', padding: 24 },

  stepsCard: {
    marginTop: 16,
    backgroundColor: '#12151f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#232838',
    padding: 16,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3a3f4b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepDotDone: { backgroundColor: '#5fe3d3', borderColor: '#5fe3d3' },
  stepDotError: { backgroundColor: '#5a2730', borderColor: '#d16c6c' },
  stepCheck: { color: '#0a0c12', fontSize: 12, fontWeight: '700' },
  stepError: { color: '#ffd2d2', fontSize: 12, fontWeight: '700' },
  stepLabel: { color: '#5a5f6d', fontSize: 13 },
  stepLabelDone: { color: '#e8e9ee' },

  verdict: { marginTop: 16, borderRadius: 14, padding: 16, borderWidth: 1 },
  verdictLow: { backgroundColor: '#123a24', borderColor: '#2e7d4f' },
  verdictMedium: { backgroundColor: '#3a321d', borderColor: '#b28a39' },
  verdictHigh: { backgroundColor: '#3a1d1d', borderColor: '#a13b3b' },
  historyToggle: { marginTop: 16, paddingVertical: 10 },
  historyToggleText: { color: '#5fe3d3', fontSize: 13 },
  verdictTitle: { color: '#e8e9ee', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  reason: { color: '#cfd3da', fontSize: 13, lineHeight: 20, marginBottom: 4 },
  disclaimer: { color: '#7b8095', fontSize: 11, marginTop: 10, lineHeight: 16 },
});