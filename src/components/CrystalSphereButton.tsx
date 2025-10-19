import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SIZE = 70;

const COLORS = {
  primary: '#414AFF',
  secondary: '#DE26FF'
};

export default function CrystalSphereButton({ onPress }: { onPress?: () => void }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Continuous rotation
    const rotationLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Subtle pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    rotationLoop.start();
    pulseLoop.start();

    return () => {
      rotationLoop.stop();
      pulseLoop.stop();
    };
  }, [rotateAnim, pulseAnim]);

  // Interpolations
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.touchable}
    >
      <View style={styles.wrapper}>

        {/* Main sphere */}
        <View style={[
          styles.container
        ]}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.innerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Z Brand Letter */}
          <Text style={styles.brandLetter}>Z</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: SIZE + 20,
    height: SIZE + 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderColor: COLORS.secondary,
    borderWidth: 1.5,
    elevation: 12,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  innerGradient: {
    width: SIZE * 1.8,
    height: SIZE * 1.8,
    borderRadius: SIZE,
    position: 'absolute',
    top: -SIZE * 0.4,
    left: -SIZE * 0.4,
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SIZE / 2,
  },
  brandLetter: {
    fontSize: SIZE * 0.45,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    zIndex: 10,
  },
});
