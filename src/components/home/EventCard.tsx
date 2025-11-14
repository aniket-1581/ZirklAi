import React, { useState } from "react";
import { ImageIcons } from "@/utils/ImageIcons";
import { formatUtcToIstTime } from "@/utils/date";
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  ScrollView,
  Modal,
  Share,
  Alert,
} from "react-native";
import { getGender } from "gender-detection-from-name";
import * as Clipboard from "expo-clipboard";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";

interface EventCardProps {
  items: any[];
  type: "combined";
  renderItem?: (item: any, index: number) => React.ReactNode;
  emptyMessage?: string;
  handleDeleteNudge?: (nudgeId: string) => Promise<void>;
}

export default function EventCard({
  items,
  type,
  renderItem,
  emptyMessage = "No items available",
  handleDeleteNudge,
}: EventCardProps) {
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { token } = useAuth();

  const handleDelete = (nudgeId: string) => {
    if (!token) return;

    Alert.alert(
      "Delete Follow-Up",
      "Are you sure you want to delete this follow-up?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await handleDeleteNudge?.(nudgeId);
              setPopupVisible(false);
            } catch (error) {
              console.error("Failed to delete nudge:", error);
            }
          },
        },
      ]
    );
  };


  const defaultRenderItem = (item: any, index: number) => {
    if (type === "combined") {
      const itemType = item.type;
      const gender = getGender(
        itemType === "followup"
          ? item.title.split("for ")[1]?.split(" ")[0] || ""
          : item.contact_name?.split(" ")[0] || "",
        "en"
      );

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

      const randomCardImage =
        itemType === "followup"
          ? [ImageIcons.Calendar, ImageIcons.Calendar2][
              Math.floor(Math.random() * 2)
            ]
          : [ImageIcons.FollowUp, ImageIcons.FollowUp2][
              Math.floor(Math.random() * 2)
            ];

      const displayName =
        itemType === "followup"
          ? item.title.split("for ")[1] || "Unknown"
          : item.contact_name || "Unknown";

      const message =
        itemType === "followup"
          ? `${new Date(item.startDate).toDateString()} ${formatUtcToIstTime(item.startDate)}`
          : item.message?.slice(0, 40) || "No message";

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
            <Image
              source={randomCardImage}
              className="w-[230px] h-[149px] rounded-xl"
            />
            <View className="flex flex-row gap-2 items-center">
              <Image
                source={
                  gender === "male" ? randomMaleUserIcon : randomFemaleUserIcon
                }
                className="w-10 h-10 rounded-full"
              />
              <View className="flex flex-col">
                <Text className="text-sm font-medium text-start text-white">
                  {displayName}
                </Text>
                <Text className="text-[10px] text-start text-white">
                  {message}
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
          items.map((item, index) =>
            renderItem
              ? renderItem(item, index)
              : defaultRenderItem(item, index)
          )
        )}
      </ScrollView>

      <Modal
        visible={popupVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPopupVisible(false)}
        statusBarTranslucent={true}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-[#5248A0] m-5 rounded-2xl p-6 w-96 relative">
            {/* Close button */}
            <View className="flex-row gap-5 absolute top-6 right-6 z-50">
              {selectedItem?.type === "nudge" && (
                <TouchableOpacity
                  className=""
                  onPress={() => handleDelete(selectedItem._id)}
                >
                  <MaterialIcons name="delete" size={22} color="red" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className=""
                onPress={() => setPopupVisible(false)}
              >
                <Feather name="x" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {selectedItem?.type === "followup" ? (
              selectedItem.title.startsWith("Follow Up") ? (
                <Text className="text-lg font-bold text-white mb-4">Micro-journal Action</Text>
              ) : (
                <Text className="text-lg font-bold text-white mb-4">Follow Up</Text>
              )
            ) : (
              selectedItem?.state_name === 'StayConnectedNudgeState' ? (
                <Text className="text-lg font-bold text-white mb-4">Stay Connected</Text>
              ) : (
                <Text className="text-lg font-bold text-white mb-4">Message</Text>
              )
            )}

            {/* FOLLOWUP TYPE */}
            {selectedItem && selectedItem.type === "followup" && (
              <ScrollView className="max-h-[70vh]">
                <View className="mb-4">
                  <Text className="text-white mb-2">
                    <Text className="font-semibold">Title:</Text>{" "}
                    {selectedItem.title.split("[Zirkl Ai]")[1] ||
                      selectedItem.title}
                  </Text>
                  <Text className="text-white mb-2">
                    <Text className="font-semibold">Date:</Text>{" "}
                    {new Date(selectedItem.startDate).toLocaleDateString()}
                  </Text>
                  <Text className="text-white mb-4">
                    <Text className="font-semibold">Time:</Text>{" "}
                    {formatUtcToIstTime(selectedItem.startDate)}
                  </Text>

                  {/* 🟣 Detect and render messages dynamically */}
                  {selectedItem.notes &&
                    (() => {
                      const notes = selectedItem.notes.trim();
                      // Extract Coach Tip and remove it from main notes text
                      const coachTipMatch = notes.match(/Coach Tip:\s*([\s\S]*)/i);
                      const coachTip = coachTipMatch ? coachTipMatch[1].trim() : null;
                      const mainNotes = coachTipMatch
                        ? notes.replace(coachTipMatch[0], "").trim()
                        : notes;
                      // Detect "Message 1:", "Message 2:", etc.
                      const messageMatches = mainNotes.match(/Message\s\d+:/g);

                      // CASE 1️⃣: Multiple messages
                      if (messageMatches && messageMatches.length > 0) {
                        const messages = mainNotes
                          .split(/Message\s\d+:/)
                          .slice(1)
                          .map((msg: string) => msg.trim());

                        return (
                          <>
                            {messages.map((msg: string, idx: number) => (
                              <View
                                key={idx}
                                className="bg-[#655BC5] rounded-xl p-4 mb-3"
                              >
                                <View className="flex-row justify-between items-start">
                                  <Text className="text-white text-sm flex-1">
                                    <Text className="font-semibold">
                                      Message {idx + 1}:
                                    </Text>{" "}
                                    {msg}
                                  </Text>
                                  <View className="flex-row ml-2">
                                    {/* Copy */}
                                    <TouchableOpacity
                                      onPress={async () => {
                                        await Clipboard.setStringAsync(msg);
                                      }}
                                      className="mr-3"
                                    >
                                      <Feather
                                        name="copy"
                                        size={18}
                                        color="white"
                                      />
                                    </TouchableOpacity>
                                    {/* Share */}
                                    <TouchableOpacity
                                      onPress={async () => {
                                        const shareText = msg;
                                        await Share.share({
                                          message: shareText,
                                        });
                                      }}
                                    >
                                      <Feather
                                        name="share-2"
                                        size={18}
                                        color="white"
                                      />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              </View>
                            ))}

                            {coachTip && (
                              <View className="mt-3 border-t border-white/20 pt-3">
                                <Text className="text-white text-sm">
                                  <Text className="font-semibold">
                                    Coach Tip:
                                  </Text>{" "}
                                  {coachTip}
                                </Text>
                              </View>
                            )}
                          </>
                        );
                      }

                      // CASE 2️⃣: Single note (no "Message X" markers)
                      return (
                        <View className="bg-[#655BC5] rounded-xl p-4">
                          <View className="flex-row justify-between items-start">
                            <Text className="text-white text-sm flex-1">
                              {notes}
                            </Text>
                            {!selectedItem.title.startsWith("Follow Up") && (
                              <View className="flex-row ml-2">
                                <TouchableOpacity
                                  onPress={async () => {
                                    await Clipboard.setStringAsync(notes);
                                  }}
                                  className="mr-3"
                                >
                                  <Feather name="copy" size={18} color="white" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={async () => {
                                    const shareText = `${selectedItem.title}\n${new Date(
                                      selectedItem.startDate
                                    ).toLocaleDateString()} ${formatUtcToIstTime(
                                      selectedItem.startDate
                                    )}\n${notes}`;
                                    await Share.share({ message: shareText });
                                  }}
                                >
                                  <Feather
                                    name="share-2"
                                    size={18}
                                    color="white"
                                  />
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })()}
                </View>
              </ScrollView>
            )}

            {/* NUDGE TYPE */}
            {selectedItem && selectedItem.type === "nudge" && (
              <View className="mb-4">
                <Text className="text-white mb-2">
                  <Text className="font-semibold">Contact:</Text>{" "}
                  {selectedItem.contact_name}
                </Text>

                <View className="bg-[#655BC5] rounded-xl p-4">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-white text-sm flex-1">
                      {selectedItem.message}
                    </Text>

                    <View className="flex-row ml-2">
                      <TouchableOpacity
                        onPress={async () => {
                          await Clipboard.setStringAsync(selectedItem.message);
                        }}
                        className="mr-3"
                      >
                        <Feather name="copy" size={18} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => {
                          await Share.share({ message: selectedItem.message });
                        }}
                      >
                        <Feather name="share-2" size={18} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
