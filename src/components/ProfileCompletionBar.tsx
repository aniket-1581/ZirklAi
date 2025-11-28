import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export const ProfileCompletionBar = ({ progress = 0 }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View className="absolute top-0 left-0 right-0 h-3 bg-[#2F2A63] rounded-full overflow-hidden w-full">
      <Animated.View
        style={{
          width: widthInterpolate,
        }}
        className="h-full bg-[#D6CFFE] rounded-full"
      />
    </View>
  );
};
