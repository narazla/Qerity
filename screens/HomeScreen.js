import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen({ onImagePicked, onCheckLender, onShowAbout }) {
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
          <LinearGradient
            colors={['#8b7cf6', '#5fe3d3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoSmall}
          >
            <Text style={styles.logoSmallLetter}>Q</Text>
          </LinearGradient>
          <Text style={styles.brand}>Qerity</Text>
        </View>
        <TouchableOpacity onPress={onShowAbout}>
          <Text style={styles.aboutLink}>How it Works</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>CONTENT VERIFICATION</Text>
        <Text style={styles.title}>
          Before trusting a transfer receipt or loan testimonial,{' '}
          <Text style={{ color: '#5fe3d3' }}>check it first.</Text>
        </Text>
        <Text style={styles.desc}>
          Qerity examines suspicious images through multiple layers of
          analysis to spot signs of manual manipulation.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Lender app/company name (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Danamas, PT Amartha Mikro Fintek"
          placeholderTextColor="#5a5f6d"
          value={entityName}
          onChangeText={setEntityName}
        />
        <Text style={styles.inputHint}>
          If the content mentions a specific entity, enter it here to check its legality with OJK.
        </Text>
        <TouchableOpacity
          style={styles.lenderOnlyBtn}
          onPress={() => onCheckLender(entityName)}
          disabled={entityName.trim().length < 3}
          activeOpacity={0.85}
        >
          <Text style={styles.lenderOnlyText}>Check lender with OJK only</Text>
        </TouchableOpacity>
      </View>

      {busy ? (
        <ActivityIndicator size="large" color="#5fe3d3" style={{ marginTop: 24 }} />
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => pickFrom('camera')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>📷  Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => pickFrom('library')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>🖼️  Upload from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c12',
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
  logoSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoSmallLetter: { fontSize: 14, fontWeight: '700', color: '#0a0c12' },
  brand: { fontSize: 16, fontWeight: '700', color: '#e8e9ee' },
  aboutLink: { fontSize: 13, color: '#7b8095', textDecorationLine: 'underline' },

  hero: { marginTop: 12 },
  eyebrow: {
    fontSize: 11,
    color: '#5fe3d3',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#e8e9ee',
    lineHeight: 34,
  },
  desc: {
    fontSize: 14,
    color: '#9aa0ab',
    marginTop: 14,
    lineHeight: 21,
  },

  inputGroup: { marginTop: 28 },
  inputLabel: { color: '#9aa0ab', fontSize: 13, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: '#12151f',
    borderWidth: 1,
    borderColor: '#2a2f3d',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#e8e9ee',
    fontSize: 14,
  },
  inputHint: { color: '#5a5f6d', fontSize: 11, marginTop: 6, lineHeight: 15 },
  lenderOnlyBtn: {
    borderWidth: 1,
    borderColor: '#5fe3d3',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  lenderOnlyText: { color: '#5fe3d3', fontSize: 13, fontWeight: '600' },

  actions: { marginTop: 24 },
  primaryBtn: {
    backgroundColor: '#5fe3d3',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#0a0c12' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#2a2f3d',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: '#e8e9ee' },
});