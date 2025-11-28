import React, { useEffect } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  amplitude: number;
  width: number;
  height: number;
}

export default function WaveAnimation({ amplitude, width, height }: Props) {
  const phase = useSharedValue(0);

  const a1 = useSharedValue(0); // big
  const a2 = useSharedValue(0); // medium
  const a3 = useSharedValue(0); // small

  useEffect(() => {
    // continuous animation
    phase.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.linear }),
      -1,
      false
    );

    a1.value = withTiming(amplitude * 1.5, { duration: 300 });
    a2.value = withTiming(amplitude * 1, { duration: 350 });
    a3.value = withTiming(amplitude * 0.5, { duration: 400 });
  }, [amplitude]);

  /**
   * Create wave for LEFT / CENTER / RIGHT with controlled overlap
   */
  const createWave = (ampShared: any, position: "left" | "center" | "right") =>
    useAnimatedProps(() => {
      "worklet";

      const midY = height / 2;

      // Overlap system:
      // Each wave width = totalWidth * 0.75 (bigger than section width → overlap)
      const waveWidth = width * 0.10;

      let leftOffset = 2;

      if (position === "left") leftOffset = width * 0.40;
      if (position === "center") leftOffset = width * 0.45; // overlap 50%
      if (position === "right") leftOffset = width * 0.50; // overlap 50%

      const right = leftOffset + waveWidth;

      // amplitude scaling
      const A = ampShared.value * (height * 0.45);
      const t = phase.value * Math.PI * 2;
      const wobble = Math.sin(t) * 0.4 + 0.6;

      const p1 = leftOffset + waveWidth * 0.25;
      const p2 = leftOffset + waveWidth * 0.5;
      const p3 = leftOffset + waveWidth * 0.75;

      const top1 = midY - A * wobble;
      const top2 = midY - A;
      const top3 = midY - A * wobble;

      const bottom1 = midY + A * wobble;
      const bottom2 = midY + A;
      const bottom3 = midY + A * wobble;

      let d = "";
      d += `M ${leftOffset} ${midY}`;
      d += ` C ${p1} ${top1}, ${p2} ${top2}, ${p3} ${top3}`;
      d += ` S ${right} ${midY}, ${right} ${midY}`;

      // mirrored bottom
      d += ` C ${p3} ${bottom3}, ${p2} ${bottom2}, ${p1} ${bottom1}`;
      d += ` S ${leftOffset} ${midY}, ${leftOffset} ${midY} Z`;

      return { d };
    });
  
  const waveLeft = createWave(a1, "left");
  const waveCenter = createWave(a2, "center");
  const waveRight = createWave(a3, "right");

  return (
    <View>
      <Svg width={width} height={height}>
        <Path
          d={`M 0 ${height/2} L ${width} ${height/2}`}
          stroke="rgba(230,125,200,0.60)"
          strokeWidth="2"
        />
        <AnimatedPath
          animatedProps={waveLeft}
          fill="rgba(150,138,238,0.60)"
        />
        <AnimatedPath
          animatedProps={waveCenter}
          fill="rgba(228,185,228,0.60)"
        />
        <AnimatedPath
          animatedProps={waveRight}
          fill="rgba(230,125,200,0.60)"
        />
      </Svg>
    </View>
  );
}
