import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkLegality, describeLegality } from '../utils/checkLegality';
import { DATA_SNAPSHOT_DATE } from '../data/ojkLegalList';
import { cardShadow, theme } from '../styles/theme';

export default function LenderScreen({ entityName, onBack }) {
  const result = checkLegality(entityName);
  const status = result.status === 'skipped' || (result.status === 'not_found' && result.reason === 'input_too_short')
    ? 'unknown'
    : result.status;
  const findingText = describeLegality(result, entityName);
  const isLegal = status === 'legal';
  const isNotFound = status === 'not_found';
  const badgeText = {
    legal: 'Verified with OJK',
    similar: 'Similar name, not exact match',
    not_found: 'Not found in OJK list',
    unknown: 'Input too short',
  }[status];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.titleGroup}>
          <Image source={require('../assets/branding/qerity-icon.png')} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>Lender Check</Text>
        </View>
        <View style={styles.headerSpace} />
      </View>

      <View style={[styles.card, isLegal ? styles.cardLegal : isNotFound ? styles.cardDanger : styles.cardWarning]}>
        <View style={styles.cardHeading}>
          <View style={styles.cardTitleGroup}>
            <Ionicons name="business-outline" size={22} color={isLegal ? theme.accent : isNotFound ? theme.danger : theme.warning} />
            <Text style={styles.cardTitle}>Lender name</Text>
          </View>
          <Text style={[styles.badge, isLegal ? styles.badgeLegal : isNotFound ? styles.badgeDanger : styles.badgeWarning]}>
            {badgeText}
          </Text>
        </View>
        <Text style={styles.entityName}>{entityName || 'No lender name entered'}</Text>
        <Text style={styles.finding}>{findingText}</Text>
      </View>

      <Text style={styles.disclaimer}>
        {DATA_SNAPSHOT_DATE} — Always confirm directly with OJK before transferring money.
      </Text>
    </View>
  );
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
  headerSpace: { width: 60 },
  card: { borderRadius: 14, borderWidth: 1, marginTop: 24, padding: 16, ...cardShadow },
  cardLegal: { backgroundColor: theme.accentSoft, borderColor: theme.accent },
  cardWarning: { backgroundColor: theme.warningSoft, borderColor: theme.warning },
  cardDanger: { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
  cardHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cardTitleGroup: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  cardTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: '700' },
  badge: { borderRadius: 999, fontSize: 11, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5 },
  badgeLegal: { backgroundColor: theme.surface, color: theme.accent },
  badgeWarning: { backgroundColor: theme.surface, color: theme.warning },
  badgeDanger: { backgroundColor: theme.surface, color: theme.danger },
  entityName: { color: theme.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 24 },
  finding: { color: theme.textPrimary, fontSize: 14, lineHeight: 21, marginTop: 10 },
  disclaimer: { color: theme.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 14 },
});