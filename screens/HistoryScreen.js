import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cardShadow, theme } from '../styles/theme';
import { clearScanHistory, loadScanHistory } from '../utils/scanHistory';

const VERDICT_META = {
  low: { label: 'Low concern', icon: 'checkmark-circle-outline', color: theme.accent, background: theme.accentSoft },
  medium: { label: 'Medium concern', icon: 'alert-circle-outline', color: theme.warning, background: theme.warningSoft },
  high: { label: 'High concern', icon: 'alert-circle-outline', color: theme.danger, background: theme.dangerSoft },
};

const OJK_META = {
  legal: { label: 'Verified with OJK', color: theme.accent },
  similar: { label: 'Similar name, not exact match', color: theme.warning },
  not_found: { label: 'Not found in OJK list', color: theme.warning },
};

export default function HistoryScreen({ onBack }) {
  const [history, setHistory] = useState([]);

  const refreshHistory = useCallback(async () => {
    const entries = await loadScanHistory();
    setHistory(entries.sort((first, second) => second.timestamp - first.timestamp));
  }, []);

  React.useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  function confirmClearHistory() {
    Alert.alert(
      'Clear scan history?',
      'This removes all saved scan metadata from this device. Images are not stored here.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: async () => {
            await clearScanHistory();
            setHistory([]);
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.titleGroup}>
          <Image source={require('../assets/branding/qerity-icon.png')} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>Scan History</Text>
        </View>
        <TouchableOpacity onPress={confirmClearHistory} accessibilityRole="button" accessibilityLabel="Clear all history">
          <View style={styles.clearButtonContent}>
            <Ionicons name="trash-outline" size={17} color={theme.danger} />
            <Text style={styles.clearText}>Clear all</Text>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item, index) => `${item.timestamp}-${item.hash}-${index}`}
        renderItem={({ item }) => <HistoryItem item={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, history.length === 0 && styles.emptyListContent]}
        ListEmptyComponent={<EmptyState />}
        ListFooterComponent={<Text style={styles.privacyNote}>History is stored only on this device. No images are saved, only scan metadata.</Text>}
      />
    </View>
  );
}

function HistoryItem({ item }) {
  const verdict = VERDICT_META[item.verdictLevel] || VERDICT_META.medium;
  const ojk = item.legalityStatus ? OJK_META[item.legalityStatus] : null;

  return (
    <View style={styles.card}>
      <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
      <View style={[styles.verdictBadge, { backgroundColor: verdict.background }]}>
        <Ionicons name={verdict.icon} size={17} color={verdict.color} />
        <Text style={[styles.verdictText, { color: verdict.color }]}>{verdict.label}</Text>
      </View>
      {item.lenderName && ojk && (
        <View style={styles.lenderRow}>
          <Text style={styles.lenderName}>{item.lenderName}</Text>
          <Text style={[styles.ojkBadge, { color: ojk.color }]}>{ojk.label}</Text>
        </View>
      )}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="time-outline" size={64} color={theme.accent} />
      <Text style={styles.emptyTitle}>No scan history yet</Text>
      <Text style={styles.emptyBody}>Checks you choose to save will appear here.</Text>
    </View>
  );
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const styles = StyleSheet.create({
  container: { backgroundColor: theme.background, flex: 1, paddingHorizontal: 20 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  back: { color: theme.accent, fontSize: 14 },
  titleGroup: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  headerLogo: { borderRadius: 7, height: 26, width: 26 },
  headerTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
  clearButtonContent: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  clearText: { color: theme.danger, fontSize: 13, fontWeight: '600' },
  listContent: { paddingBottom: 28 },
  emptyListContent: { flexGrow: 1 },
  card: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
    ...cardShadow,
  },
  timestamp: { color: theme.textSecondary, fontSize: 12, marginBottom: 12 },
  verdictBadge: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: 999, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  verdictText: { fontSize: 13, fontWeight: '700' },
  lenderRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  lenderName: { color: theme.textPrimary, flexShrink: 1, fontSize: 13, fontWeight: '600' },
  ojkBadge: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 999, borderWidth: 1, fontSize: 11, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5 },
  emptyState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  emptyTitle: { color: theme.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 18 },
  emptyBody: { color: theme.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
  privacyNote: { color: theme.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 12, textAlign: 'center' },
});
