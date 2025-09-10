import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';

const SIZE = 80; // increased size for a more "orb" feel

const COLORS = {
  primary: 'rgba(147, 51, 234, 1)', // vibrant purple
  secondary: 'rgba(99, 102, 241, 1)', // indigo-purple
  accent: 'rgba(168, 85, 247, 1)', // bright purple
  highlight: 'rgba(196, 181, 253, 1)', // light purple highlight
  blend1: 'rgba(147, 197, 253, 1)', // soft blue
};

export default function CrystalSphereButton({ onPress }: { onPress?: () => void }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Interpolations
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <View style={styles.wrapper}>

        {/* Sphere */}
        <Animated.View style={[styles.container, { transform: [{ rotate: rotation }] }]}>
          <LinearGradient
            colors={['#93c5fd', '#6366f1', '#a855f7']}
            style={styles.innerGradient}
          />
          {/* Shine highlight */}
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'transparent']}
            style={styles.highlight}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 0.8, y: 0.8 }}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  glow: {
    position: 'absolute',
    width: SIZE * 1.3,
    height: SIZE * 1.3,
    borderRadius: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: SIZE * 2,
  },
  container: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderColor: "rgba(147, 51, 234, 0.3)",
    borderWidth: 2,

    elevation: 8,
  },
  innerGradient: {
    width: SIZE * 2,
    height: SIZE * 2,
    borderRadius: SIZE,
    position: 'absolute',
    top: -SIZE / 2,
    left: -SIZE / 2,
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIZE / 2,
  },
});
