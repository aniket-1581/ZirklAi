import { useAuth } from "@/context/AuthContext";
import { useRoundRobinAssignment } from "@/hooks/useRoundRobinAssignment";
import { ImageIcons } from "@/utils/ImageIcons";
import { formatUtcToIstTime } from "@/utils/date";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { getGender } from "gender-detection-from-name";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  const [unreadItems, setUnreadItems] = useState<{ [key: string]: boolean }>({});
  const STORAGE_KEY = "unread_nudges_followups";

  const { token } = useAuth();

  useEffect(() => {
    const loadUnreadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setUnreadItems(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to load unread state", err);
      }
    };

    loadUnreadState();
  }, []);
  // ---- NEW CODE FOR STABLE NON-REPEATING RANDOM IMAGES ---- //

  const cardImages = [
    ImageIcons.DigitalCalendar,
    ImageIcons.GenericScheduler,
    ImageIcons.MeetingCalendar,
    ImageIcons.ScheduleMeeting,
    ImageIcons.CasualGratitude,
    ImageIcons.GratitudeCollaboration,
    ImageIcons.ThankingAtWork,
    ImageIcons.ThankingPeople,
  ];

  const femalePool = [
    ImageIcons.GirlImage,
    ImageIcons.GirlImage2,
    ImageIcons.GirlImage3,
    ImageIcons.GirlImage4,
    ImageIcons.WomanImage,
  ];

  const malePool = [
    ImageIcons.BoyImage,
    ImageIcons.BoyImage2,
    ImageIcons.BoyImage3,
    ImageIcons.MenImage,
  ];

  const femaleRR = useRoundRobinAssignment(femalePool, "event_avatar_female");
  const maleRR = useRoundRobinAssignment(malePool, "event_avatar_male");
  const cardsRR = useRoundRobinAssignment(cardImages, "event_avatar_card");

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
        itemType === "followup" && item.contact_name?.split(" ")[0],
        "en"
      );

      const avatar = gender === "male"
        ? maleRR.assign(item.id)
        : femaleRR.assign(item.id);
      const cardImg = cardsRR.assign(item.id ? item.id : item._id);

      const displayName =
        itemType === "followup"
          ? item.contact_name || "Unknown"
          : item.contact_name.includes("for")
            ? item.contact_name.split("for ")[1]
            : item.contact_name;

      const message =
        itemType === "followup"
          ? `${new Date(item.startDate).toDateString()} ${formatUtcToIstTime(item.startDate)}`
          : `${new Date(item.created_at).toDateString()} ${formatUtcToIstTime(item.created_at)}`;

      return (
        <TouchableOpacity
          key={index}
          onPress={async () => {
            setSelectedItem(item);
            setPopupVisible(true);

            // Mark as read
            const updated = { ...unreadItems, [item.id]: false };
            setUnreadItems(updated);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          }}

          className="items-center mr-5"
        >
          <View className="flex gap-3 items-start">
            <Image
              source={cardImg}
              className="w-[230px] h-[149px] rounded-xl"
            />
            <View className="flex flex-row gap-2 items-center">
              <View className="relative">
                <Image
                  source={avatar}
                  className="w-10 h-10 rounded-full"
                />

                {unreadItems[item.id] && (
                  <View
                    className="w-3 h-3 bg-red-500 rounded-full absolute top-0 right-0 border border-white"
                  />
                )}
              </View>

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

  useEffect(() => {
    const syncUnreadWithStorage = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        let storedUnread = stored ? JSON.parse(stored) : {};

        let updated = { ...storedUnread };

        // Mark only NEW items as unread
        items.forEach((item) => {
          if (updated[item.id] === undefined) {
            updated[item.id] = true; 
          }
        });

        setUnreadItems(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed updating unread state:", err);
      }
    };

    syncUnreadWithStorage();
  }, [items]);

  useEffect(() => {
    femaleRR.load();
    maleRR.load();
    cardsRR.load();
  }, []);

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
                  <MaterialIcons
                    name="delete-outline"
                    size={22}
                    color="#FF7777"
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className=""
                onPress={() => setPopupVisible(false)}
              >
                <Feather name="x" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {selectedItem?.type === "nudge" ? (
              selectedItem?.state_name === "TopContactsNudgeState" ? (
                <Text className="text-lg font-bold text-white mb-4">
                  Top Contacts
                </Text>
              ) : selectedItem?.state_name === "GratitudeNudgeState" ? (
                <Text className="text-lg font-bold text-white mb-4">
                  Thank You Message
                </Text>
              ) : selectedItem?.state_name === "StayConnectedNudgeState" ? (
                <Text className="text-lg font-bold text-white mb-4">
                  Stay Connected
                </Text>
              ) : (
                <Text className="text-lg font-bold text-white mb-4">
                  Follow Up
                </Text>
              )
            ) : (
              selectedItem?.type === "followup" ? (
                <Text className="text-lg font-bold text-white mb-4">
                  Calendar Follow-up
                </Text>
              ) : (
                <Text className="text-lg font-bold text-white mb-4">
                  Micro Journal Entry
                </Text>
              )
            )}

            {/* FOLLOWUP TYPE */}
            {selectedItem && selectedItem?.type === "followup" && (
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
                      const coachTipMatch = notes.match(
                        /Coach Tip:\s*([\s\S]*)/i
                      );
                      const coachTip = coachTipMatch
                        ? coachTipMatch[1].trim()
                        : null;
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
                                  <Feather
                                    name="copy"
                                    size={18}
                                    color="white"
                                  />
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
            {selectedItem && selectedItem?.type === "nudge" && (
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
