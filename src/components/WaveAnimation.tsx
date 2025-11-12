import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import Svg, { Line } from "react-native-svg";

const BAR_COUNT = 100;
const BAR_WIDTH = 2;
const BAR_GAP = 1;
const COLORS = ["#e44039", "#435fb2", "#802b90", "#af3169"];
const NORMAL_HEIGHT_FACTOR = 0.3;

interface WaveAnimationProps {
  height: number;
  width: number;
  isActive: boolean;
}

function getRandomHeight(height: number) {
  return Math.random() * (height * 0.65) + height * 0.3;
}

export default function WaveAnimation({
  height,
  width,
  isActive,
}: WaveAnimationProps) {
  const animatedValues = useRef(
    Array.from(
      { length: BAR_COUNT },
      () => new Animated.Value(getRandomHeight(height))
    )
  ).current;

  // To store currently running animation refs per bar
  const runningAnimations = useRef<(Animated.CompositeAnimation | null)[]>(
    new Array(BAR_COUNT).fill(null)
  );

  // Animate bar with a recursive loop, storing Animations in runningAnimations
  function animateBar(idx: number) {
    const animation = Animated.timing(animatedValues[idx], {
      toValue: getRandomHeight(height),
      duration: 220,
      useNativeDriver: false,
      easing: Easing.linear,
    });

    runningAnimations.current[idx] = animation;

    animation.start(({ finished }) => {
      if (finished && isActive) {
        animateBar(idx);
      } else {
        // Clear animation reference if not finished or isActive false
        runningAnimations.current[idx] = null;
      }
    });
  }

  useEffect(() => {
    if (isActive) {
      // Start animation loops for all bars
      for (let i = 0; i < BAR_COUNT; i++) {
        animateBar(i);
      }
    } else {
      // Stop all ongoing animations
      runningAnimations.current.forEach((anim) => {
        if (anim) anim.stop();
      });

      // Clear all stored animation refs
      runningAnimations.current = new Array(BAR_COUNT).fill(null);

      // Reset bar heights to normal factor smoothly
      const resetAnimations = animatedValues.map((val, idx) =>
        Animated.timing(val, {
          toValue: animatedValues[idx],
          duration: 300,
          useNativeDriver: false,
          easing: Easing.out(Easing.cubic),
        })
      );

      Animated.parallel(resetAnimations).start();
    }
    // Cleanup function to stop animations on unmount or dependencies change
    return () => {
      runningAnimations.current.forEach((anim) => {
        if (anim) anim.stop();
      });
      runningAnimations.current = new Array(BAR_COUNT).fill(null);
    };
  }, [isActive, animatedValues, height]);

  return (
    <View className="flex items-center justify-center w-full">
      <Svg height={height} width={width}>
        {[...Array(BAR_COUNT)].map((_, i) => {
          const x = i * (BAR_WIDTH + BAR_GAP);
          const color = COLORS[i % COLORS.length];
          return (
            <AnimatedLine
              key={i}
              x={x}
              animatedHeight={animatedValues[i]}
              color={color}
              height={height}
            />
          );
        })}
      </Svg>
    </View>
  );
}

function AnimatedLine({
  x,
  animatedHeight,
  color,
  height,
}: {
  x: number;
  animatedHeight: Animated.Value;
  color: string;
  height: number;
}) {
  const y1 = Animated.divide(Animated.subtract(height, animatedHeight), 2);
  const y2 = Animated.add(y1, animatedHeight);

  return (
    <AnimatedLineImpl
      x1={x}
      y1={y1}
      x2={x}
      y2={y2}
      stroke={color}
      strokeWidth={BAR_WIDTH}
      strokeLinecap="round"
      opacity={0.85}
    />
  );
}

const AnimatedLineImpl = Animated.createAnimatedComponent(Line);
