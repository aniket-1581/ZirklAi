import { GradientBorderButton } from "@/components/GradientBorderButton";
import { useAuth } from "@/context/AuthContext";
import { ImageIcons } from "@/utils/ImageIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import KeyboardLayout from "@/components/KeyboardAvoidingLayout";

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace("/(protected)/(tabs)/home");
    }
  }, [user, router]);

  const handleContinue = async () => {
    setError(null);
    if (!phoneNumber) {
      setError("Phone number is required.");
      return;
    }
    setIsLoading(true);
    try {
      await login(phoneNumber);
    } catch (err: any) {
      setError(err.message || "Failed to request OTP");
      Toast.show({
        type: "error",
        text1: "OTP Error",
        text2: err.message || "Failed to request OTP",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
      source={ImageIcons.OnboardingScreen}
      resizeMode="cover"
      style={styles.background}
    >
      <KeyboardLayout>
        {/* Logo */}
        <Image source={ImageIcons.Logo} style={styles.logo} />

        {/* Title */}
        <Text style={styles.title}>Sign in with mobile number</Text>

        {/* Input box */}
        <View style={styles.inputRow}>
          <View style={styles.countryCode}>
            <Text style={styles.flag}>🇮🇳</Text>
            <Text style={styles.code}>+91</Text>
          </View>
          <TextInput
            placeholder="8009877658"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            style={styles.textInput}
            maxLength={10}
            autoFocus
          />
        </View>

        {/* Error */}
        {error && <Text style={styles.error}>{error}</Text>}

        {/* Submit button */}
        <View style={styles.buttonWrapper}>
          <GradientBorderButton
            title={isLoading ? "Requesting..." : "Get Verification Code"}
            onPress={handleContinue}
            isLoading={isLoading}
          />
        </View>
      </KeyboardLayout>
    </ImageBackground>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  logo: {
    width: 128,
    height: 128,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "400",
    color: "#000",
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
  },
  flag: {
    fontSize: 20,
    marginRight: 6,
  },
  code: {
    fontSize: 18,
    fontWeight: "600",
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    color: "#000",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  error: {
    color: "red",
    marginTop: 8,
    fontSize: 16,
  },
  buttonWrapper: {
    marginTop: "auto",
    marginBottom: 24,
  },
});
