import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface FocusCardProps {
  onSelect: (option: string) => void;
  message?: {
    content: string;
    options: { title: string; subtitle: string; emoji: string; enabled: boolean }[];
  };
}

export function FocusCard({ onSelect, message }: FocusCardProps) {
  console.log("FocusCard message:", message);
  return (
    <View className="max-w-[85%] items-start mb-2 border bg-[#F6F4FF] border-[#DADADA] rounded-xl px-5 py-3">
      <Text className="text-lg font-semibold mb-3">
        {message ? message.content : "Welcome to Zirkl Global Chat! How can I assist you today?"}
      </Text>

      <View className="flex-row flex-wrap justify-between">
        {message?.options?.map((opt, index) => {
          const cardClasses = opt.enabled
            ? "bg-white border border-gray-300"
            : "bg-gray-50 border border-gray-200 opacity-50";

          return (
            <TouchableOpacity
              key={index}
              onPress={() => onSelect(opt.title)}
              disabled={!opt.enabled}
              className={`w-[48%] mb-3 rounded-xl p-3 ${cardClasses}`}
            >
              <Text className="text-2xl">{opt.emoji}</Text>
              <Text className="font-semibold text-base">{opt.title}</Text>
              <Text className="text-xs text-gray-500">{opt.subtitle}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
