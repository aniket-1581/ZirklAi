import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
} from "react-native";
import { getGender } from "gender-detection-from-name";
import { ImageIcons } from "@/utils/ImageIcons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { formatUtcToIstTime } from "@/utils/date";
import * as Clipboard from "expo-clipboard";

interface PlanCardProps {
  item: any;
}

export default function PlanCard({ item }: PlanCardProps) {
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const gender = getGender(item.contact_name || item.title.split('for ')[1], "en");
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
    <>
      <TouchableOpacity
        onPress={() => {
          setSelectedItem(item);
          setPopupVisible(true);
        }}
      >
        <View className="bg-black/15 flex-row items-center rounded-xl p-4 mb-4 border border-white/15">
          <Image
            source={randomUserIcon}
            className="w-14 h-14 rounded-full mr-3"
          />
          <View className="flex flex-wrap">
            <Text className="text-white font-semibold text-base mb-1">
              {item.contact_name || item.title.split('for ')[1]}
            </Text>
            <View className="py-1 px-2 bg-[#655BC5] rounded-lg flex items-center">
              {item.type === "nudge" ? (
                <Text className="text-white/80 text-sm">Follow Up</Text>
              ) : (
                <Text className="text-white/80 text-sm">Meeting Scheduled</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={popupVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPopupVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-[#5248A0] m-5 rounded-2xl p-6 w-96 relative">
            {/* Close button */}
            <TouchableOpacity
              className="absolute top-6 right-6 z-50"
              onPress={() => setPopupVisible(false)}
            >
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>

            {selectedItem?.type === "followup" ? (
              selectedItem.title.startsWith("Follow Up") ? (
                <Text className="text-lg font-bold text-white mb-4">
                  Micro-journal Action
                </Text>
              ) : (
                <Text className="text-lg font-bold text-white mb-4">
                  Follow Up
                </Text>
              )
            ) : selectedItem?.state_name === "StayConnectedNudgeState" ? (
              <Text className="text-lg font-bold text-white mb-4">
                Stay Connected
              </Text>
            ) : (
              <Text className="text-lg font-bold text-white mb-4">Message</Text>
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
