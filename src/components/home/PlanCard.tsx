import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { getGender } from 'gender-detection-from-name';
import { ImageIcons } from "@/utils/ImageIcons";
import { useRouter } from "expo-router";

interface PlanCardProps {
  item: any;
}

export default function PlanCard({
  item,
}: PlanCardProps) {
    const router = useRouter();
    const gender = getGender(item.contact_name.split(" ")[0], 'en');
    console.log(item)
    const femaleUserIcon = [
        ImageIcons.GirlImage,
        ImageIcons.GirlImage2,
        ImageIcons.GirlImage3,
        ImageIcons.GirlImage4,
      ];
      const maleUserIcon = [
        ImageIcons.BoyImage,
        ImageIcons.BoyImage2,
        ImageIcons.BoyImage3,
      ];    
      const randomFemaleUserIcon = femaleUserIcon[Math.floor(Math.random() * femaleUserIcon.length)];
      const randomMaleUserIcon = maleUserIcon[Math.floor(Math.random() * maleUserIcon.length)];
      const randomUserIcon = gender === 'male' ? randomMaleUserIcon : randomFemaleUserIcon;
  return (
    <TouchableOpacity className="bg-black/20 flex-row items-center rounded-xl p-4 mb-4" onPress={() => router.push(`/(protected)/(tabs)/chats/${item.id}`)}>
      <Image source={randomUserIcon} className="w-14 h-14 rounded-full mr-3" />
      <View className="flex-1">
        <Text className="text-white font-semibold text-base mb-1">
          {item.contact_name}
        </Text>
        <Text className="text-white/80 text-sm">NousTek Labs</Text>
        <Text className="text-white/60 text-xs mt-1">
          25-40 | AI & ML
        </Text>
      </View>
    </TouchableOpacity>
  );
}
