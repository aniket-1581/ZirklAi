import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { getGender } from "gender-detection-from-name";
import { ImageIcons } from "@/utils/ImageIcons";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { createNote } from "@/api/notes";
import { Contact } from "@/types";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

interface ContactPlanCardProps {
  item: any;
}

export default function ContactPlanCard({ item }: ContactPlanCardProps) {
  const router = useRouter();
  const { token } = useAuth();

  const handleSelectContact = async (contact: Contact) => {
      try {
        const contactData = {
          contact_id: contact.id,
          contact_name: contact.name,
          goal: ''
        }
        const res = await createNote(token as string, [contactData]);
        if (res) {
            router.push(`/(protected)/(tabs)/chats/${res[0].id as string}`);
        }
      } catch (err) {
        console.error('Failed to start chat:', err);
      }
    };

  const defaultRenderItem = (item: any, index: number) => {
    const gender = getGender(item.name.split(" ")[0], "en");
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
    const randomFemaleUserIcon =
      femaleUserIcon[Math.floor(Math.random() * femaleUserIcon.length)];
    const randomMaleUserIcon =
      maleUserIcon[Math.floor(Math.random() * maleUserIcon.length)];
    const randomUserIcon =
      gender === "male" ? randomMaleUserIcon : randomFemaleUserIcon;
    return (
      <View
        key={index}
        className="items-center mr-5"
      >
        <View className="flex w-40 h-44 bg-white/10 p-4 rounded-xl gap-2 items-center">
            <Image
            source={randomUserIcon}
            className="w-14 h-14 rounded-full"
            />
            <View className="flex-1">
                <Text className="text-white font-semibold text-sm">
                    {item.name}
                </Text>
            </View>
            <TouchableOpacity className="flex-row gap-1 w-full bg-white/30 rounded-lg p-2 items-center" onPress={() => handleSelectContact(item)}>
                <Feather name="message-circle" size={14} color="white" />
                <Text className="text-white font-semibold text-sm">
                    Reach Out
                </Text>
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
