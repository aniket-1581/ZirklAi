import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  KeyboardEventListener,
  Platform,
  View,
  ViewStyle,
  StyleProp
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface KeyboardLayoutProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * A layout wrapper that:
 * - Uses SafeAreaView for proper insets
 * - Applies KeyboardAvoidingView for iOS
 * - Adds bottom margin automatically on Android when keyboard is hidden
 */
export default function KeyboardLayout({ children, style }: KeyboardLayoutProps) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", handleKeyboardShow);
    const hideSub = Keyboard.addListener("keyboardDidHide", handleKeyboardHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleKeyboardShow: KeyboardEventListener = () => {
    setIsKeyboardVisible(true);
  };

  const handleKeyboardHide: KeyboardEventListener = () => {
    setIsKeyboardVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={[{ flex: 1 }, style]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : isKeyboardVisible ? 10 : -76}
      >
        <View
          style={{
            flex: 1,
            marginBottom:
              Platform.OS === "ios" ? 0 : (isKeyboardVisible ? 0 : 20),
          }}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
