import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface FocusCardProps {
  onSelect: (option: string) => void;
  message?: string;
}

export function FocusCard({ onSelect, message }: FocusCardProps) {
  const options = [
    { title: "Networking Playbooks", subtitle: "Learn proven frameworks", emoji: "📚", enabled: true },
    { title: "Craft Your Message", subtitle: "Get the right response", emoji: "✍️", enabled: true },
    { title: "Relationship Radar", subtitle: "Never lose touch", emoji: "📡", enabled: false },
    { title: "Follow-Up", subtitle: "Post-meeting actions", emoji: "📮", enabled: false }
  ];

  return (
    <View className="max-w-[85%] items-start mb-2 border bg-[#F6F4FF] border-[#DADADA] rounded-xl px-5 py-3">
      <Text className="text-lg font-semibold mb-3">
        {message ? message : "Welcome to Zirkl Global Chat! How can I assist you today?"}
      </Text>

      <View className="flex-row flex-wrap justify-between">
        {options.map((opt, index) => {
          const cardClasses = opt.enabled
            ? "bg-white border border-gray-300"
            : "bg-gray-50 border border-gray-200 opacity-50";

          return (
            <TouchableOpacity
              key={index}
              onPress={() => onSelect(options[index].title)}
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
