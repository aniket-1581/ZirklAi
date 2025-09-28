import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  TextInput,
  Image,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import Toast from "react-native-toast-message";
import { ImageIcons } from "@/utils/ImageIcons";
import KeyboardLayout from "@/components/KeyboardAvoidingLayout";

const OtpScreen = () => {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithOtp } = useAuth();

  useEffect(() => {
    inputsRef.current[0]?.focus(); // Auto-focus first input
  }, []);

  const handleChange = async (text: string, index: number) => {
    if (/^\d$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      // Auto move to next input
      if (index < 5) {
        inputsRef.current[index + 1]?.focus();
      }

      // Auto submit when all 6 digits are filled
      if (index === 5 && newOtp.every((digit) => digit !== "")) {
        await handleVerify(newOtp.join(""));
      }
    } else if (text === "") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    setError(null);
    const otpCode = code || otp.join("");
    if (!otpCode || otpCode.length !== 6) {
      setError("OTP is required.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginWithOtp(phoneNumber, otpCode);
      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Login Successful",
        });
      } else {
        setError(result.error || "Invalid OTP");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!phoneNumber) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Missing phone number</Text>
      </SafeAreaView>
    );
  }

  return (
    <ImageBackground
      source={ImageIcons.OnboardingScreen}
      resizeMode="cover"
      style={styles.background}
    >
      <KeyboardLayout>
        <SafeAreaView style={styles.safeArea}>
          <Image source={ImageIcons.Logo} style={styles.logo} />
          <Text style={styles.title}>Enter verification code</Text>

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputsRef.current[index] = ref;
                }}
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                editable={!isLoading}
              />
            ))}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </SafeAreaView>
      </KeyboardLayout>
    </ImageBackground>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
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
    marginBottom: 24,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 10,
    marginBottom: 20,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4B5563", // gray-600
    textAlign: "center",
    fontSize: 20,
    color: "#000",
    backgroundColor: "white",
  },
  errorText: {
    color: "red",
    marginTop: 8,
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
