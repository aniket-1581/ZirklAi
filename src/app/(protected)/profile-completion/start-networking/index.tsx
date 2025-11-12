import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ConfettiCannon from "react-native-confetti-cannon";
import { useAuth } from "@/context/AuthContext";
import { setStartNetworking } from "@/api/profile";
import Toast from "react-native-toast-message";
import { ImageIcons } from "@/utils/ImageIcons";

export default function StartNetworking() {
  const confettiRef = useRef<any>(null);
  const { token, getProfileSetupStatus } = useAuth();

  const handleStartNetworking = async () => {
    const res = await setStartNetworking(token!);
    if (res) {
      await getProfileSetupStatus();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Your networking system is ready to launch!",
      });
    }
  };

  return (
    <View className="flex-1 bg-[#3A327B]">
      <View className="flex-1 pt-24 px-6 bg-[#3A327B] rounded-3xl items-center justify-center">
        {/* Confetti animation */}
        <ConfettiCannon
          ref={confettiRef}
          count={150}
          origin={{ x: 200, y: 0 }}
          fadeOut
          explosionSpeed={3000}
          fallSpeed={2500}
        />

        {/* Title */}
        <Text className="text-white text-2xl font-bold text-center mb-2">
          Hooray! You’re all set!
        </Text>

        {/* Celebration emoji */}
        <View className="flex items-center justify-center mb-6">
          <Image source={ImageIcons.CelebrationEmoji} width={140} height={140} />
        </View>

        {/* Subtitle */}
        <Text className="text-[#C7C2ED] text-center text-base mb-8">
          Your networking system is ready to launch!
        </Text>

        {/* Feature badges */}
        <View className="flex-row flex-wrap justify-center gap-3 mb-10">
          {["AI-Powered", "Smart Reminders", "Network Insights"].map(
            (feature, index) => (
              <View
                key={index}
                className="bg-[#564CA7] px-4 py-2 rounded-full"
              >
                <Text className="text-white font-medium text-sm">
                  {feature}
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* Start Networking button */}
      <View className="px-6 pb-10">
        <TouchableOpacity
          activeOpacity={0.8}
          className="bg-white rounded-full py-4 px-10 w-full"
          onPress={handleStartNetworking}
        >
          <Text className="text-[#3A327B] text-center font-semibold text-base">
            Start Networking
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
