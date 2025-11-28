import { ImageIcons } from "@/utils/ImageIcons";
import React from "react";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";

interface NetworkIntroProps {
    step: number;
    title: string;
    description: string;
    onClose: () => void;
    quote?: string;
    quoteAuthor?: string;
}

export default function NetworkIntro({ step, title, description, onClose, quote, quoteAuthor }: NetworkIntroProps) {

  return (
    <ImageBackground
      source={step === 3 ? ImageIcons.networkingStep3 : step === 4 ? ImageIcons.networkingStep4 : ImageIcons.networkingStep5}
      resizeMode="cover"
      className="flex-1 bg-[#3A327B] justify-between"
    >
      <View className="flex-1 items-center justify-start px-6 pt-24">
        <Text className="text-white text-2xl font-medium text-center mb-8">
          {title}
        </Text>
        <Text className="text-[#C7C2ED] text-base text-center leading-6">
          {description}
        </Text>

        {quote && (
            <View className="bg-black/15 mt-10 px-6 py-10 w-full rounded-md">
                <Text className="text-white text-base font-medium text-center">
                    {quote}
                </Text>
                <Text className="text-white text-base font-medium text-center mt-4">
                    {quoteAuthor}
                </Text>
            </View>
        )}
      </View>

      <View className="px-6 pb-10">
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.9}
          className="bg-white rounded-full py-4"
        >
          <Text className="text-[#3A327B] text-center font-semibold text-base">
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}
