import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

export default function HomeScreen({ onImagePicked, onCheckLender, onShowAbout, onShowHistory }) {
  const [busy, setBusy] = useState(false);
  const [entityName, setEntityName] = useState('');

  async function pickFrom(source) {
    try {
      setBusy(true);
      let permission;
      if (source === 'camera') {
        permission = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
      if (!permission.granted) {
        Alert.alert('Permission required', 'The app needs access permission to continue.');
        setBusy(false);
        return;
      }

      const options = {
        exif: true,
        base64: true,
        quality: 0.85,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      };

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);

      setBusy(false);
      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImagePicked(result.assets[0], entityName);
      }
    } catch (e) {
      setBusy(false);
      Alert.alert('Something went wrong', String(e.message || e));
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image source={require('../assets/branding/qerity-icon.png')} style={styles.logoSmall} />
          <Text style={styles.brand}>Qerity</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onShowHistory} style={styles.historyButton} accessibilityRole="button" accessibilityLabel="Open scan history">
            <Ionicons name="time-outline" size={20} color={theme.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onShowAbout}>
            <Text style={styles.aboutLink}>How it Works</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>CONTENT VERIFICATION</Text>
        <Text style={styles.title}>
          Before trusting a loan ad, testimonial, or transfer receipt,{' '}
          <Text style={styles.titleAccent}>check it first.</Text>
        </Text>
        <Text style={styles.desc}>
          Qerity examines suspicious loan content through multiple layers of analysis to spot signs of manipulation.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Lender app/company name (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Danamas, PT Amartha Mikro Fintek"
          placeholderTextColor={theme.textSecondary}
          value={entityName}
          onChangeText={setEntityName}
        />
        <Text style={styles.inputHint}>
          If the content mentions a specific entity, enter it here to check its legality with OJK.
        </Text>
        <TouchableOpacity
          style={styles.lenderOnlyBtn}
          onPress={() => onCheckLender(entityName)}
          activeOpacity={0.85}
        >
          <Text style={styles.lenderOnlyText}>Check lender with OJK only</Text>
        </TouchableOpacity>
      </View>

      {busy ? (
        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => pickFrom('camera')}
            activeOpacity={0.85}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="camera-outline" size={18} color={theme.surface} />
              <Text style={styles.primaryBtnText}>Take Photo</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => pickFrom('library')}
            activeOpacity={0.85}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="image-outline" size={18} color={theme.accent} />
              <Text style={styles.secondaryBtnText}>Upload from Gallery</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  historyButton: { padding: 3 },
  logoSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 8,
  },
  brand: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  aboutLink: { fontSize: 13, color: theme.accent, textDecorationLine: 'underline' },

  hero: { marginTop: 12 },
  eyebrow: {
    fontSize: 11,
    color: theme.accent,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textPrimary,
    lineHeight: 34,
  },
  titleAccent: { color: theme.accent },
  desc: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 14,
    lineHeight: 21,
  },

  inputGroup: { marginTop: 28 },
  inputLabel: { color: theme.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.textPrimary,
    fontSize: 14,
  },
  inputHint: { color: theme.textSecondary, fontSize: 11, marginTop: 6, lineHeight: 15 },
  lenderOnlyBtn: {
    borderWidth: 1,
    borderColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  lenderOnlyText: { color: theme.accent, fontSize: 13, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 32 },
  primaryBtn: {
    flex: 1,
    backgroundColor: theme.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: theme.surface, marginLeft: 7 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: theme.accent, marginLeft: 7 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});