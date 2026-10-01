import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
        <LinearGradient
          colors={['#8b7cf6', '#5fe3d3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoCircle}
        >
          <Text style={styles.logoLetter}>Q</Text>
        </LinearGradient>
        <Text style={styles.appName}>Qerity</Text>
        <Text style={styles.tagline}>Check first, before you trust</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c12',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoLetter: {
    fontSize: 40,
    fontWeight: '700',
    color: '#0a0c12',
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#e8e9ee',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: '#7b8095',
    marginTop: 6,
    fontFamily: undefined,
  },
});