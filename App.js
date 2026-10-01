import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';

import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import ResultScreen from './screens/ResultScreen';
import AboutScreen from './screens/AboutScreen';

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [imageAsset, setImageAsset] = useState(null);
  const [entityName, setEntityName] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setScreen('home'), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
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
            setScreen('result');
          }}
          onShowAbout={() => setScreen('about')}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0c12',
  },
});