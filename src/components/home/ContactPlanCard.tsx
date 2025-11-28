import React, { useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { getGender } from "gender-detection-from-name";
import { ImageIcons } from "@/utils/ImageIcons";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { createNote } from "@/api/notes";
import { Contact } from "@/types";
import { useRoundRobinAssignment } from "@/hooks/useRoundRobinAssignment";

interface ContactPlanCardProps {
  item: any;
}

export default function ContactPlanCard({ item }: ContactPlanCardProps) {
  const router = useRouter();
  const { token } = useAuth();

  // ----- STABLE AVATAR ASSIGNMENT (NON-REPEATING, FIXED) -----

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

  const femaleRR = useRoundRobinAssignment(femaleUserIcon, "contact_avatar_female");
  const maleRR = useRoundRobinAssignment(maleUserIcon, "contact_avatar_male");

  useEffect(() => {
    femaleRR.load();
    maleRR.load();
  }, []);

  const handleSelectContact = async (contact: Contact) => {
    try {
      const contactData = {
        contact_id: contact.id,
        contact_name: contact.name,
        goal: "",
      };
      const res = await createNote(token as string, [contactData]);
      if (res) {
        router.push(`/(protected)/(tabs)/chats/${res[0].id as string}`);
      }
    } catch (err) {
      console.error("Failed to start chat:", err);
    }
  };

  const defaultRenderItem = (item: any, index: number) => {
    const gender = getGender(item.name.split(" ")[0], "en");

    const randomUserIcon = gender === "male" ? maleRR.assign(item.id) : femaleRR.assign(item.id);
    return (
      <View key={index} className="items-center mr-5">
        <View className="flex flex-1 w-40 h-auto bg-white/10 p-4 rounded-xl gap-2 items-center justify-between">
          <Image source={randomUserIcon} className="w-14 h-14 rounded-full" />
          <Text className="text-white font-semibold text-sm text-center">
            {item.name}
          </Text>
          <TouchableOpacity
            className="flex-row gap-1 w-full bg-white/30 rounded-lg p-2 items-center"
            onPress={() => handleSelectContact(item)}
          >
            <Feather name="message-circle" size={14} color="white" />
            <Text className="text-white font-semibold text-sm">Reach Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {item.length === 0 ? (
          <View className="w-full h-32 justify-center items-center">
            <Text className="text-gray-600">No contacts available</Text>
          </View>
        ) : (
          item.map((item: any, index: number) => defaultRenderItem(item, index))
        )}
      </ScrollView>
    </>
  );
}
