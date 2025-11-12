import React from "react";
import { View, Text, Image } from "react-native";
import { getGender } from 'gender-detection-from-name';
import { ImageIcons } from "@/utils/ImageIcons";

interface PlanCardProps {
  item: any;
}

export default function PlanCard({
  item,
}: PlanCardProps) {
    const gender = getGender(item.contact_name.split(" ")[0], 'en');
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
    <View className="bg-black/20 flex-row items-center rounded-xl p-4 mb-4 border border-white/15">
      <Image source={randomUserIcon} className="w-14 h-14 rounded-full mr-3" />
      <View className="flex-1">
        <Text className="text-white font-semibold text-base mb-1">
          {item.contact_name}
        </Text>
        {item.company && (
          <Text className="text-white/80 text-sm">{item.company}</Text>
        )}
        {item.age_group && item.profession && (
          <Text className="text-white/60 text-xs mt-1">
            {item.age_group} | {item.profession}
          </Text>
        )}
      </View>
    </View>
  );
}
