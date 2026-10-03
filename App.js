import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';

import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import ResultScreen from './screens/ResultScreen';
import AboutScreen from './screens/AboutScreen';
import LenderScreen from './screens/LenderScreen';
import HistoryScreen from './screens/HistoryScreen';
import { theme } from './styles/theme';
import { initializeDataPack } from './utils/dataPack';

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [imageAsset, setImageAsset] = useState(null);
  const [entityName, setEntityName] = useState('');

  useEffect(() => {
    initializeDataPack();
    const timer = setTimeout(() => setScreen('home'), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      {screen === 'splash' && <SplashScreen />}
      {screen === 'home' && (
        <HomeScreen
          onImagePicked={(asset, entity) => {
            setImageAsset(asset);
            setEntityName(entity);
            setScreen('result');
          }}
          onCheckLender={(entity) => {
            setImageAsset(null);
            setEntityName(entity);
            setScreen('lender');
          }}
          onShowAbout={() => setScreen('about')}
          onShowHistory={() => setScreen('history')}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          asset={imageAsset}
          entityName={entityName}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'about' && <AboutScreen onBack={() => setScreen('home')} />}
      {screen === 'lender' && (
        <LenderScreen
          entityName={entityName}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'history' && <HistoryScreen onBack={() => setScreen('home')} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.background,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0,
  },
});