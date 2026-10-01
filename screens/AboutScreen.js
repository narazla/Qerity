import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { buildTensorHtml } from '../assets/tensorHtml';

export default function AboutScreen({ onBack }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How it Works</Text>
        <View style={{ width: 60 }} />
      </View>
      <WebView
        originWhitelist={['*']}
        source={{ html: buildTensorHtml() }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0c12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  back: { color: '#5fe3d3', fontSize: 14 },
  headerTitle: { color: '#e8e9ee', fontSize: 15, fontWeight: '700' },
  webview: { flex: 1, backgroundColor: '#0a0c12' },
});