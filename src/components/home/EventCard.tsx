import React, { useState } from "react";
import { ImageIcons } from "@/utils/ImageIcons";
import { formatUtcToIstTime } from "@/utils/date";
import { TouchableOpacity, View, Text, Image, ScrollView, Modal } from "react-native";
import { getGender } from 'gender-detection-from-name';
import * as Clipboard from 'expo-clipboard';
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";

interface EventCardProps {
  items: any[];
  type: 'calendar' | 'followup';
  renderItem?: (item: any, index: number) => React.ReactNode;
  emptyMessage?: string;
  handleDeleteNudge?: (nudgeId: string) => Promise<void>;
}

export default function EventCard({ items, type, renderItem, emptyMessage = "No items available", handleDeleteNudge }: EventCardProps) {
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { token } = useAuth();

  const handleDelete = async (nudgeId: string) => {
    if (!token) return;
    try {
      await handleDeleteNudge?.(nudgeId);
      setPopupVisible(false);
    } catch (error) {
      console.error("Failed to delete nudge:", error);
    }
  };

  const defaultRenderItem = (item: any, index: number) => {
    if (type === 'calendar') {
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
      const firstName = item.title.split("for ")[1].split(" ")[0];
      const cardImage = [ImageIcons.Calendar, ImageIcons.Calendar2];
      const randomFemaleUserIcon = femaleUserIcon[Math.floor(Math.random() * femaleUserIcon.length)];
      const randomMaleUserIcon = maleUserIcon[Math.floor(Math.random() * maleUserIcon.length)];
      const randomCardImage = cardImage[Math.floor(Math.random() * cardImage.length)];
      const startDate = new Date(item.startDate);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayOfWeek = daysOfWeek[startDate.getDay()];

      const gender = getGender(firstName, 'en');

      return (
        <TouchableOpacity
          key={index}
          onPress={() => {
            setSelectedItem(item);
            setPopupVisible(true);
          }}
          className="items-center mr-5"
        >
          <View className="flex gap-3 items-start">
            <Image source={randomCardImage} className="w-[230px] h-[149px] rounded-xl" />
            <View className="flex flex-row gap-2 items-center">
              <View className={`w-10 h-10 items-center justify-center`}>
                <Image
                  source={
                    gender === "male"
                      ? randomMaleUserIcon
                      : randomFemaleUserIcon
                  }
                  className="w-10 h-10 rounded-full"
                />
              </View>
              <View className="flex flex-col">
                <Text className="text-sm font-medium text-start text-white">
                  {item.title.split("for ")[1] || "Unknown"}
                </Text>
                <Text className="text-[10px] text-start text-white">
                  {startDate.toDateString() === today.toDateString()
                    ? `Today ${formatUtcToIstTime(item.startDate)}`
                    : startDate.toDateString() === tomorrow.toDateString()
                      ? `Tomorrow ${formatUtcToIstTime(item.startDate)}`
                      : `${dayOfWeek} ${formatUtcToIstTime(item.startDate)}`}
                  , 1:1 Discussion
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    } else if (type === 'followup') {
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
      const cardImage = [ImageIcons.FollowUp, ImageIcons.FollowUp2];
      const randomFemaleUserIcon = femaleUserIcon[Math.floor(Math.random() * femaleUserIcon.length)];
      const randomMaleUserIcon = maleUserIcon[Math.floor(Math.random() * maleUserIcon.length)];
      const randomCardImage = cardImage[Math.floor(Math.random() * cardImage.length)];
      const gender = getGender(item.contact_name.split(" ")[0], 'en');

      return (
        <TouchableOpacity
          key={index}
          onPress={() => {
            setSelectedItem(item);
            setPopupVisible(true);
          }}
          className="items-center mr-5"
        >
          <View className="flex gap-3 items-start">
            <Image source={randomCardImage} className="w-[230px] h-[149px] rounded-xl" />
            <View className="flex flex-row gap-2 items-center">
              <View className={`w-10 h-10 items-center justify-center`}>
                <Image source={gender === 'male' ? randomMaleUserIcon : randomFemaleUserIcon} className="w-10 h-10 rounded-full" />
              </View>
              <View className="flex flex-col">
                <Text className="text-sm font-medium text-start text-white">
                  {item.contact_name || 'Unknown'}
                </Text>
                <Text className="text-[10px] text-start text-white">
                  {item.message?.slice(0, 30) || 'No message'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.length === 0 ? (
          <View className="w-full h-32 justify-center items-center">
            <Text className="text-gray-600">{emptyMessage}</Text>
          </View>
        ) : (
          items.map((item, index) => renderItem ? renderItem(item, index) : defaultRenderItem(item, index))
        )}
      </ScrollView>

      {/* Popup Modal */}
      <Modal
        visible={popupVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPopupVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-[#5248A0] m-5 rounded-2xl p-6 w-96">
            <TouchableOpacity className="absolute top-6 right-6 z-50" onPress={() => setPopupVisible(false)}>
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-white mb-4">Message</Text>

            {selectedItem && type === 'calendar' && (
              <View className="mb-4">
                <Text className="text-white mb-2">
                  <Text className="font-semibold">Title:</Text> {selectedItem.title}
                </Text>
                <Text className="text-white mb-2">
                  <Text className="font-semibold">Date:</Text> {new Date(selectedItem.startDate).toLocaleDateString()}
                </Text>
                <Text className="text-white mb-2">
                  <Text className="font-semibold">Time:</Text> {formatUtcToIstTime(selectedItem.startDate)}
                </Text>
                {selectedItem.notes && (
                  <Text className="text-white">
                    <Text className="font-semibold">Notes:</Text> {selectedItem.notes}
                  </Text>
                )}
              </View>
            )}

            {selectedItem && type === 'followup' && (
              <View className="mb-4">
                <Text className="text-white mb-2">
                  <Text className="font-semibold">Contact:</Text> {selectedItem.contact_name}
                </Text>
                <Text className="text-white">
                  <Text className="font-semibold">Message:</Text> {selectedItem.message}
                </Text>
              </View>
            )}

            <TouchableOpacity
              className="flex-row gap-2 items-center justify-center py-4 rounded-lg border-t border-gray-200"
              onPress={async () => {
                if (selectedItem) {
                  const textToCopy = type === 'calendar'
                    ? `${selectedItem.title}\n${new Date(selectedItem.startDate).toLocaleDateString()} ${formatUtcToIstTime(selectedItem.startDate)}\n${selectedItem.notes || ''}`
                    : `${selectedItem.contact_name}: ${selectedItem.message}`;

                  await Clipboard.setStringAsync(textToCopy);
                  // You could add a toast notification here
                }
              }}
            >
              <Feather name="copy" size={24} color="white" />
              <Text className="text-white font-semibold">Copy Message</Text>
            </TouchableOpacity>
            {type === 'followup' && (
              <TouchableOpacity
                className="flex-row gap-2 items-center justify-center pt-4 rounded-lg border-t border-gray-200"
                onPress={() => handleDelete(selectedItem._id)}
              >
                <MaterialIcons name="delete" size={24} color="red" />
                <Text className="text-red-500 font-semibold">Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
