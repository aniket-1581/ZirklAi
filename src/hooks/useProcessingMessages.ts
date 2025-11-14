import { useEffect, useState } from "react";
import {
  useSharedValue,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  useAnimatedStyle
} from "react-native-reanimated";

export function useProcessingMessages(
  isProcessing: boolean,
  messages: string[]
) {
  const fade = useSharedValue(1);
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));
  const [processingMessage, setProcessingMessage] = useState<string>("");

  useEffect(() => {
    if (isProcessing) {
      let i = 0;
      setProcessingMessage(messages[i]);

      const interval = setInterval(() => {
        fade.value = 0;
        setTimeout(() => {
          i = (i + 1) % messages.length;
          setProcessingMessage(messages[i]);
          fade.value = withTiming(1, { duration: 600 });
        }, 400);
      }, 3500);

      fade.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1500, easing: Easing.ease }),
          withTiming(1, { duration: 1500, easing: Easing.ease })
        ),
        -1,
        true
      );

      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  return { processingMessage, fadeStyle };
}