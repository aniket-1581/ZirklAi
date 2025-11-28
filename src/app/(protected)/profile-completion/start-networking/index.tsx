import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { useAuth } from "@/context/AuthContext";
import { getStepData, setStartNetworking } from "@/api/profile";
import { ImageIcons } from "@/utils/ImageIcons";
import { ProfileCompletionBar } from "@/components/ProfileCompletionBar";

export default function StartNetworking() {
  const confettiRef = useRef<any>(null);
  const { profileSetupStatus, token, getProfileSetupStatus } = useAuth();
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);

  const handleStartNetworking = async () => {
    const res = await setStartNetworking(token!);
    if (res) {
      await getProfileSetupStatus();
    }
  };

  useEffect(() => {
    const fetchStepData = async () => {
      try {
        const res = await getStepData(
          token!,
          profileSetupStatus?.next_step as number
        );
        setCompletionPercentage(res.completion_percentage);
        console.log(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStepData();
  }, [profileSetupStatus, token]);

  return (
    <View className="flex-1 bg-[#3A327B]">
      <ProfileCompletionBar progress={completionPercentage} />
      <View className="flex-1 pt-24 px-6 justify-evenly">
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
        <Text className="text-white text-3xl font-bold text-center mb-2 leading-10">
          Hooray! {"\n"}You&apos;re all set!
        </Text>

        {/* Celebration emoji */}
        <View className="flex gap-10 items-center justify-center mb-6">
          <Image
            source={ImageIcons.CelebrationEmoji}
            width={140}
            height={140}
          />
          {/* Subtitle */}
          <Text className="text-[#C7C2ED] text-center text-base mb-8">
            Your networking system is ready{"\n"}to launch!
          </Text>
        </View>


        {/* Feature badges */}
        <View className="flex-row flex-wrap justify-center gap-3 mb-10">
          {["AI-Powered", "Smart Reminders", "Network Insights"].map(
            (feature, index) => (
              <View key={index} className="bg-[#564CA7] px-4 py-2 rounded-full">
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
