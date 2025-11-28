import React, { useEffect } from "react";
import { View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { ImageIcons } from "@/utils/ImageIcons";
import { useRoundRobinAssignment } from "@/hooks/useRoundRobinAssignment";
import { getGender } from "gender-detection-from-name";

interface PlanCardProps {
  notesContacts: any[];
  handleChatPress: (contact: any) => void;
}

export default function PlanCard({ notesContacts, handleChatPress }: PlanCardProps) {
  const femaleUserIcon = [
    ImageIcons.GirlImage,
    ImageIcons.GirlImage2,
    ImageIcons.GirlImage3,
    ImageIcons.GirlImage4,
    ImageIcons.WomanImage,
  ];
  const maleUserIcon = [
    ImageIcons.BoyImage,
    ImageIcons.BoyImage2,
    ImageIcons.BoyImage3,
    ImageIcons.MenImage,
  ];

  const femaleRR = useRoundRobinAssignment(
    femaleUserIcon,
    "plan_avatar_female"
  );
  const maleRR = useRoundRobinAssignment(maleUserIcon, "plan_avatar_male");

  const defaultRenderItem = (item: any, index: number) => {
    const gender = getGender(item.contact_name.split(" ")[0], "en");

    const randomUserIcon =
      gender === "male" ? maleRR.assign(item.id) : femaleRR.assign(item.id);
    return (
      <TouchableOpacity
        key={index}
        className="bg-black/20 flex-row items-center rounded-xl p-4 mb-4 border border-white/15"
        onPress={() => handleChatPress(item)}
      >
        <Image
          source={randomUserIcon}
          className="w-14 h-14 rounded-full mr-3"
        />
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
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    femaleRR.load();
    maleRR.load();
  }, [femaleRR, maleRR]);

  return (
    <FlatList
      data={notesContacts}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      renderItem={({ item, index }) => defaultRenderItem(item, index)}
      ListEmptyComponent={<Text className="text-white/70 text-center">No contacts available.</Text>}
      showsVerticalScrollIndicator={false}
    />
  );
}
