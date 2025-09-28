import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  style?: ViewStyle;
};

export const GradientBorderButton = ({
  title,
  onPress,
  isLoading,
  style,
}: Props) => {
  return (
    <LinearGradient
      colors={["#D165F6", "#C14AF0", "#7B5FFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradientBorder, style]} // ✅ use style, not className
    >
      <TouchableOpacity
        onPress={onPress}
        style={styles.button}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBorder: {
    padding: 2,
    marginTop: 24,
    borderRadius: 9999,
  },
  button: {
    backgroundColor: "white",
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
  },
});
