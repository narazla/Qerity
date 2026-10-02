import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { theme } from '../styles/theme';

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.badge,
          { opacity, transform: [{ scale }] },
        ]}
      >
        <Image source={require('../assets/branding/qerity-icon.png')} style={styles.logoCircle} />
        <Text style={styles.appName}>Qerity</Text>
        <Text style={styles.tagline}>Check first, before you trust</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 24,
    marginBottom: 18,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 6,
    fontFamily: undefined,
  },
});