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
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildElaHtml } from '../assets/elaHtml';
import { checkLegality } from '../utils/checkLegality';
import { KNOWN_SCAM_HASHES } from '../data/knownScamHashes';
import { cardShadow, theme } from '../styles/theme';
import { saveScanHistory } from '../utils/scanHistory';

const STEPS = [
  { key: 'exif', label: 'Checking image metadata' },
  { key: 'dup', label: 'Checking similarity/duplication' },
  { key: 'legal', label: 'Checking entity legality with OJK' },
  { key: 'ela', label: 'Checking for signs of editing' },
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
  const [saveFeedback, setSaveFeedback] = useState(null);
  const saveFeedbackTimerRef = useRef(null);
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
    if (saveFeedbackTimerRef.current) clearTimeout(saveFeedbackTimerRef.current);
    if (!nextValue) {
      setSaveHistory(false);
      setSaveFeedback(null);
      return;
    }
    if (!analysis || !analysis.hash) {
      setSaveFeedback('Hash is not available yet');
      return;
    }
    try {
      await storeHash(analysis.hash);
      await saveScanHistory({
        hash: analysis.hash,
        timestamp: Date.now(),
        verdictLevel,
        lenderName: entityName && entityName.trim() ? entityName.trim() : null,
        legalityStatus: ['legal', 'similar', 'not_found'].includes(legalityResult.status)
          ? legalityResult.status
          : null,
      });
      setSaveHistory(true);
      setSaveFeedback('Saved');
      saveFeedbackTimerRef.current = setTimeout(() => setSaveFeedback(null), 1800);
    } catch (error) {
      setSaveHistory(false);
      setSaveFeedback('Could not save');
    }
  }

  const elaFinding = analysis && {
    text: analysis.avgDiff >= ELA_AVG_DIFF_THRESHOLD || analysis.changedPixelPercent >= ELA_CHANGED_PIXEL_PERCENT_THRESHOLD
      ? "Part of this image may have been edited or pasted in. This isn't certain, just a signal worth noting."
      : 'We did not find a strong sign of image editing in this check.',
    risk: analysis.avgDiff >= ELA_AVG_DIFF_THRESHOLD || analysis.changedPixelPercent >= ELA_CHANGED_PIXEL_PERCENT_THRESHOLD,
  };

  const legalityFinding = (() => {
    if (legalityResult.status === 'legal') {
      return {
        text: `"${legalityResult.match.app}" (${legalityResult.match.company}) appears in this OJK list.`,
        risk: false,
      };
    }
    if (legalityResult.status === 'similar') {
      return {
        text: `"${entityName}" is similar to "${legalityResult.match.app}", but the names do not match exactly.`,
        risk: true,
      };
    }
    if (legalityResult.status === 'not_found') {
      return {
        text: `"${entityName}" was not found in our limited OJK list.`,
        risk: true,
      };
    }
    return null;
  })();

  const duplicateFinding = duplicateResult && {
    text: duplicateResult.match
      ? `This image looks similar to ${duplicateResult.source === 'history' ? 'one of your previous scans' : 'a bundled scam example'}.`
      : 'We did not find a match in our limited database. This does not prove the image is genuine.',
    risk: Boolean(duplicateResult.match),
  };
  const riskCount = [exifFindings, [elaFinding], [legalityFinding], [duplicateFinding]]
    .flat().filter(Boolean).filter((finding) => finding.risk).length;
  const errorCount = Object.values(statuses).filter((status) => status === 'error' || status === 'unavailable').length;
  const doneCount = Object.values(statuses).filter((status) => status === 'done').length;
  const terminal = Object.values(statuses).every((status) => ['done', 'error', 'skipped', 'unavailable'].includes(status));
  const verdictLevel = riskCount > 1 ? 'high' : riskCount === 1 || errorCount > 0 ? 'medium' : 'low';
  const signalFindings = [
    ...exifFindings,
    elaFinding,
    duplicateFinding,
    exifFindings.length === 0
      ? { text: 'No editing-software information was found in the image file.', risk: false }
      : null,
    errorCount > 0
      ? { text: 'One or more checks could not be completed. Review this result with caution.', risk: true, error: true }
      : null,
  ].filter(Boolean);
  const verdictCopy = {
    high: { title: 'High concern', description: 'Multiple suspicious signals found' },
    medium: { title: 'Medium concern', description: 'A signal needs closer review' },
    low: { title: 'Low concern', description: 'No suspicious signals found in completed checks' },
  }[verdictLevel];
  const showLegalityCard = ['legal', 'similar', 'not_found'].includes(legalityResult.status);
  const legalityBadge = {
    legal: 'Verified with OJK',
    similar: 'Similar name, not exact match',
    not_found: 'Not found in OJK list',
  }[legalityResult.status];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.titleGroup}>
          <Image source={require('../assets/branding/qerity-icon.png')} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>Analysis Result</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {asset && <Image source={{ uri: asset.uri }} style={styles.preview} />}

      <View style={styles.webviewCard}>
        <Text style={styles.cardLabel}>Image editing check</Text>
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
        <Text style={styles.webviewCaption}>Highlighted areas may indicate editing. This check is less effective for PNG files or images screenshotted repeatedly.</Text>
      </View>

      <View style={styles.stepsCard}>
        {STEPS.map((s) => {
          const status = statuses[s.key];
          return (
            <View style={styles.stepRow} key={s.key}>
              <View style={[styles.stepDot, status === 'done' && styles.stepDotDone, status === 'error' && styles.stepDotError]}>
                {status === 'running' && <ActivityIndicator size="small" color={theme.accent} />}
                {status === 'done' && <Ionicons name="checkmark" size={13} color={theme.accent} />}
                {status === 'error' && <Ionicons name="alert-circle-outline" size={14} color={theme.danger} />}
              </View>
              <Text style={[styles.stepLabel, status === 'done' && styles.stepLabelDone]}>
                {status === 'done' ? s.label : `${s.label} — ${status}`}
              </Text>
            </View>
          );
        })}
      </View>

      {duplicateResult && <TouchableOpacity style={styles.historyToggle} onPress={() => toggleHistory(!saveHistory)}>
        <View style={styles.historyToggleContent}>
          <Ionicons name={saveHistory ? 'checkbox-outline' : 'square-outline'} size={18} color={theme.accent} />
          <Text style={styles.historyToggleText}>Save this hash to local scan history</Text>
          {saveFeedback && <Text style={styles.saveFeedback}>{saveFeedback}</Text>}
        </View>
      </TouchableOpacity>}

      {showLegalityCard && (
        <View style={[styles.legalityCard, legalityResult.status === 'legal' ? styles.legalityLegal : legalityResult.status === 'not_found' ? styles.legalityDanger : styles.legalityWarning]}>
          <View style={styles.legalityHeader}>
            <View style={styles.legalityTitleGroup}>
              <Ionicons name="business-outline" size={20} color={legalityResult.status === 'legal' ? theme.accent : legalityResult.status === 'not_found' ? theme.danger : theme.warning} />
              <Text style={styles.legalityTitle}>Lender legality</Text>
            </View>
            <Text style={[styles.legalityBadge, legalityResult.status === 'legal' ? styles.legalityBadgeLegal : legalityResult.status === 'not_found' ? styles.legalityBadgeDanger : styles.legalityBadgeWarning]}>
              {legalityBadge}
            </Text>
          </View>
          <Text style={styles.legalityText}>{legalityFinding.text}</Text>
        </View>
      )}

      {terminal && (
        <View style={[styles.verdict, verdictLevel === 'high' ? styles.verdictHigh : verdictLevel === 'medium' ? styles.verdictMedium : styles.verdictLow]}>
          <View style={styles.verdictHeading}>
            <Ionicons
              name={verdictLevel === 'low' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
              size={22}
              color={verdictLevel === 'high' ? theme.danger : verdictLevel === 'medium' ? theme.warning : theme.accent}
            />
            <View>
              <Text style={styles.verdictTitle}>{verdictCopy.title}</Text>
              <Text style={styles.verdictDescription}>{verdictCopy.description}</Text>
            </View>
          </View>
          <View style={styles.verdictDivider} />
          <Text style={styles.completedCount}>{doneCount} of 4 checks completed</Text>
          <View style={styles.signalList}>
            {signalFindings.map((finding, index) => (
              <View style={styles.signalRow} key={`${finding.text}-${index}`}>
                <Ionicons
                  name={finding.error ? 'close-circle-outline' : finding.risk ? 'alert-circle-outline' : 'information-circle-outline'}
                  size={18}
                  color={finding.error || finding.risk ? theme.warning : theme.accent}
                />
                <Text style={styles.signalText}>{finding.text}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.disclaimer}>Always confirm directly with OJK before transferring money.</Text>
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
  container: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  back: { color: theme.accent, fontSize: 14 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { width: 26, height: 26, borderRadius: 7 },
  headerTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },

  preview: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginTop: 8,
    backgroundColor: theme.surface,
  },

  webviewCard: {
    marginTop: 16,
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    ...cardShadow,
  },
  cardLabel: { color: theme.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  webviewBox: { height: 220, borderRadius: 10, overflow: 'hidden' },
  webviewCaption: { color: theme.textSecondary, fontSize: 11, marginTop: 8, textAlign: 'center' },
  unavailable: { color: theme.warning, fontSize: 13, textAlign: 'center', padding: 24 },

  stepsCard: {
    marginTop: 16,
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    ...cardShadow,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepDotDone: { backgroundColor: theme.accentSoft, borderColor: theme.accent },
  stepDotError: { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
  stepCheck: { color: theme.accent, fontSize: 12, fontWeight: '700' },
  stepError: { color: theme.danger, fontSize: 12, fontWeight: '700' },
  stepLabel: { color: theme.textSecondary, fontSize: 13 },
  stepLabelDone: { color: theme.textPrimary },

  verdict: { marginTop: 16, borderRadius: 14, padding: 16, borderWidth: 1, ...cardShadow },
  verdictLow: { backgroundColor: theme.accentSoft, borderColor: theme.accent },
  verdictMedium: { backgroundColor: theme.warningSoft, borderColor: theme.warning },
  verdictHigh: { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
  verdictHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  historyToggle: { marginTop: 16, paddingVertical: 10 },
  historyToggleContent: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  historyToggleText: { color: theme.accent, fontSize: 13 },
  saveFeedback: { color: theme.accent, fontSize: 12, fontWeight: '600', marginLeft: 'auto' },
  verdictTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
  verdictDescription: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
  verdictDivider: { backgroundColor: theme.border, height: 1, marginBottom: 12, marginTop: 2 },
  completedCount: { color: theme.textSecondary, fontSize: 12, marginBottom: 8 },
  signalList: { gap: 9 },
  signalRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  signalText: { color: theme.textPrimary, flex: 1, fontSize: 13, lineHeight: 19 },
  legalityCard: { borderRadius: 14, borderWidth: 1, marginTop: 16, padding: 16, ...cardShadow },
  legalityLegal: { backgroundColor: theme.accentSoft, borderColor: theme.accent },
  legalityWarning: { backgroundColor: theme.warningSoft, borderColor: theme.warning },
  legalityDanger: { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
  legalityHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  legalityTitleGroup: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  legalityTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
  legalityBadge: { borderRadius: 999, fontSize: 11, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5 },
  legalityBadgeLegal: { backgroundColor: theme.surface, color: theme.accent },
  legalityBadgeWarning: { backgroundColor: theme.surface, color: theme.warning },
  legalityBadgeDanger: { backgroundColor: theme.surface, color: theme.danger },
  legalityText: { color: theme.textPrimary, fontSize: 13, lineHeight: 19, marginTop: 10 },
  disclaimer: { color: theme.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 14 },
});