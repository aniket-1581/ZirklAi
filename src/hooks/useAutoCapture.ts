import { useEffect, useState, useRef } from "react";
import { Platform } from "react-native";

// Custom hook for auto-capture logic
export function useAutoCapture(cameraRef, onCardCaptured) {
  const [autoCaptureStatus, setStatus] = useState("idle"); // "idle", "detecting", "capturing"
  const [rectangle, setRectangle] = useState(null); // { x, y, width, height }
  const detectionTimer = useRef(null);

  // Simulate rectangle detection using brightness or aspect ratio heuristics
  const detectRectangle = async (photo) => {
    // Ideally, use react-native-rectangle-scanner (Expo-only), or simple size/aspect heuristics
    // For demo: Assume detection if aspectRatio ~1.7 (card), brightness mid-range
    // In production: Replace with true rectangle detection

    const aspectRatio = photo.width / photo.height;
    if (aspectRatio > 1.5 && aspectRatio < 2.2) {
      // Simulate a rectangle in center of image
      return {
        x: photo.width * 0.1,
        y: photo.height * 0.25,
        width: photo.width * 0.8,
        height: photo.height * 0.5,
      };
    }
    return null;
  };

  useEffect(() => {
    let intervalId;

    const analyzeFrame = async () => {
      if (!cameraRef.current) return;
      try {
        // Take a quick picture (low quality, no saving)
        const photo = await cameraRef.current.takePictureAsync({
          skipProcessing: true,
          quality: 0.3,
        });
        const detectedRect = await detectRectangle(photo);

        if (detectedRect) {
          setRectangle(detectedRect);
          if (autoCaptureStatus !== "detecting") setStatus("detecting");

          // If detected for ~1 second, auto-capture!
          if (!detectionTimer.current) {
            detectionTimer.current = setTimeout(async () => {
              setStatus("capturing");
              detectionTimer.current = null;
              setRectangle(null);

              // Take a full-quality picture
              const fullPhoto = await cameraRef.current.takePictureAsync({
                quality: 0.9,
              });

              await onCardCaptured(fullPhoto.uri, detectedRect);
              setStatus("idle");
            }, 1000); // 1 second confirmation
          }
        } else {
          setRectangle(null);
          setStatus("idle");
          if (detectionTimer.current) {
            clearTimeout(detectionTimer.current);
            detectionTimer.current = null;
          }
        }
      } catch (e) {
        // fail silently
      }
    };

    // Poll every ~500ms
    intervalId = setInterval(analyzeFrame, 500);
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (detectionTimer.current) clearTimeout(detectionTimer.current);
    };
  }, [cameraRef, onCardCaptured, autoCaptureStatus]);

  // Only needed for expo-camera triggers, not react-native-camera
  const onCameraReady = () => {};

  return { autoCaptureStatus, rectangle, onCameraReady };
}
