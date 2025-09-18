import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const LoadingIndicator = () => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // infinite repeat
      true // reverse direction
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return <Animated.View className="w-full h-12 bg-[#F6F4FF] rounded-xl" style={animatedStyle} />;
};

export default LoadingIndicator;
