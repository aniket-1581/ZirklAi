import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Keyboard,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";
import { Message, Option } from "../types";

import { ImageIcons } from "@/utils/ImageIcons";
import { getGender } from "gender-detection-from-name";

// Hook + API
import { CalendarEventResponse, createCalendarEvents } from "@/api/calendar";
import { useAuth } from "@/context/AuthContext";
import { useRoundRobinAssignment } from "@/hooks/useRoundRobinAssignment";
import { useCalendar } from "../hooks/useCalendar";


interface MessageListProps {
  messages: Message[];
  isWaitingForResponse: boolean;
  onOptionSelect: (option: string | Option) => void;
  flatListRef: React.RefObject<FlatList<Message> | null>;
  currentStep: string;
  user: string;
  events: CalendarEventResponse[];
}

export default function GlobalMessageList({
  messages,
  isWaitingForResponse,
  onOptionSelect,
  flatListRef,
  currentStep,
  user,
  events,
}: MessageListProps) {
  const { token } = useAuth();
  const { createDeviceEvent } = useCalendar();

  // Smooth keyboard adjust
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Copy tracking
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {}
  );

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
  
  const femaleRR = useRoundRobinAssignment(femalePool, "global_avatar_female");
  const maleRR = useRoundRobinAssignment(malePool, "global_avatar_male");

  // Clipboard copy
  const handleCopy = (text: string, key: string) => {
    Clipboard.setStringAsync(text);
    setCopiedStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(
      () => setCopiedStates((prev) => ({ ...prev, [key]: false })),
      2000
    );
  };

  // Share handler
  const handleShare = (text: string) => {
    Share.share({ message: text });
  };

  // Calendar event creator (same logic you had)
  const handleCreateCalendarEvent = useCallback(
    async (message: Message) => {
      if (!message.start_time) return;
      try {
        const messageTs = new Date(message.start_time).toISOString();
        const existing = events.find(
          (e) =>
            e.notes === message.content &&
            e.startDate &&
            new Date(e.startDate).toISOString() === messageTs
        );
        if (existing) {
          Toast.show({
            type: "info",
            text1: "Event Already Exists",
          });
          return;
        }

        const startDate = new Date(message.start_time);
        const endDate = new Date(startDate.getTime() + 3600000);

        const title = message.contact_name
          ? `[Zirkl Ai] Reminder for ${message.contact_name}`
          : `[Zirkl Ai]`;

        await createCalendarEvents(
          {
            calendar_events: [
              {
                title,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                location: "remote",
                notes: message.content,
                timeZone: "Asia/Kolkata",
                contact_name: message.contact_name,
              },
            ],
          },
          token as string
        );

        await createDeviceEvent({
          title,
          startDate,
          endDate,
          location: "remote",
          notes: message.content,
          reminders: [10, 30],
        });

        Toast.show({
          type: "success",
          text1: "Event Created Successfully",
        });
      } catch (err: any) {
        console.log(err);
        Toast.show({
          type: "error",
          text1: "Failed to create event",
        });
      }
    },
    [token, events]
  );

  // Keyboard events
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardVisible(true)
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardVisible(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // 🟣 CHATGPT/WHATSAPP STYLE LIST = reversed + inverted
  const reversedMessages = useMemo(
    () => [...messages].reverse(),
    [messages]
  );

  // --------- MESSAGE RENDERING (unchanged from your version) ---------

  const renderFormattedText = useCallback((text: string) => {
    const headerRegex = /(### .*?)(?=\n|$)/g;
    const parts = text.split(headerRegex);

    return (
      <View className="flex-col">
        {parts.map((part, index) => {
          if (part.startsWith("### "))
            return (
              <Text
                key={index}
                className="text-white text-lg font-bold mb-2 mt-1 leading-6"
              >
                {part.slice(4).trim()}
              </Text>
            );

          if (part.includes("**")) {
            const boldParts = part.split(/(\*\*.*?\*\*)/g);
            return (
              <Text key={index} className="text-white text-base leading-5">
                {boldParts.map((bp, i) =>
                  bp.startsWith("**") && bp.endsWith("**") ? (
                    <Text key={i} className="font-bold text-white">
                      {bp.slice(2, -2)}
                    </Text>
                  ) : (
                    bp
                  )
                )}
              </Text>
            );
          }

          return (
            <Text key={index} className="text-white text-base leading-5 mb-1">
              {part}
            </Text>
          );
        })}
      </View>
    );
  }, []);

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isUser = item.role === "user";
    // const time12 = formatUtcToIstTime(item.timestamp);
    const isAssistant = item.role === "assistant";
    const content = item.content || "";

    const gender = getGender(user.split(" ")[0], "en");
    const randomUserIcon =
      gender === "male" ? ImageIcons.MaleAvatar : ImageIcons.FemaleAvatar;

    // --- Parsing Logic ---
    let isComplexAssistantMessage = false;
    if (isAssistant && typeof content === "string") {
      let introText = "";
      let reminderText = "";
      let suggestionMessages: string[] = [];
      let suggestionOnly: string[] = [];
      let adviceOrTips: string[] = [];

      // Regex to split by "For..." or "Coach Tip:". It looks for one or more newlines.
      const adviceSplitRegex = /\n+(?=For |Coach Tip:)/g;
      const contentParts = content.split(adviceSplitRegex);
      let mainContent = contentParts[0];
      adviceOrTips = contentParts.slice(1).map((p) => p.trim());

      // Regex for numbered lists (handles single or double newlines) and message groups
      const numberedListRegex = /\n+(?=\d+\.\s)/g;
      const messageGroupRegex = /(?=Message \d+:)/g;

      if (mainContent.match(messageGroupRegex)) {
        suggestionMessages = mainContent
          .split(messageGroupRegex)
          .filter((msg: string) => msg.trim());
        reminderText =
          suggestionMessages.find((msg) =>
            msg.startsWith("Perfect! I'll remind you")
          ) || "";
        suggestionOnly = suggestionMessages.filter(
          (msg) =>
            msg.startsWith("Message 1:") ||
            msg.startsWith("Message 2:") ||
            msg.startsWith("Message 3:")
        );
        isComplexAssistantMessage = true;
      } else if (mainContent.match(numberedListRegex)) {
        const numberedListParts = mainContent.split(numberedListRegex);
        introText = numberedListParts[0].trim();
        suggestionMessages = numberedListParts
          .slice(1)
          .map((p: string) => p.trim());
        isComplexAssistantMessage = true;
      } else {
        introText = mainContent.trim();
      }

      // If we found any special formatting, use the complex renderer
      if (isComplexAssistantMessage || adviceOrTips.length > 0) {
        return (
          <View className={`flex-row mb-4`}>
            <Image source={ImageIcons.Assistant} className="w-10 h-10 mr-2" />
            <View className="flex-col items-start mb-4">
              {introText && (
                <View className="w-80 self-start border bg-[#5248A0] border-white/15 rounded-2xl px-6 py-4 mb-4">
                  <View className="mb-2">{renderFormattedText(introText)}</View>
                </View>
              )}
              {reminderText && (
                <View className="w-80 self-start border bg-[#5248A0] border-white/15 rounded-2xl px-6 py-4 mb-4">
                  <View className="mb-2">
                    {renderFormattedText(reminderText)}
                  </View>
                </View>
              )}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingRight: 16, // Add side padding to prevent clipping
                  columnGap: 10,         // Consistent gap between cards
                }}
                snapToAlignment="start"
                decelerationRate="fast"
                overScrollMode="never"
              >
                {suggestionOnly.map((msg: string, idx: number) => {
                  const copyKey = `msg-${index}-${idx}`;
                  const isCopied = copiedStates[copyKey];
                  const trimmedMsg = msg.trim();

                  return (
                    <View
                      key={idx}
                      style={{
                        marginRight: idx === suggestionOnly.length - 1 ? 36 : 0, // right padding for last card
                      }}
                      className="flex-row w-80 items-center mb-4 border bg-[#5248A0] border-white/15 rounded-2xl px-6 py-4"
                    >
                      <View className="mb-2 flex-1 pr-8">
                        {renderFormattedText(trimmedMsg)}
                      </View>

                      {(trimmedMsg.includes("Message 1:") ||
                        trimmedMsg.includes("Message 2:") ||
                        trimmedMsg.includes("Message 3:")) && (
                        <View className="absolute right-2 top-2 flex-row gap-4">
                          <TouchableOpacity onPress={() => handleCopy(trimmedMsg, copyKey)}>
                            <MaterialIcons
                              name={isCopied ? "check" : "content-copy"}
                              size={18}
                              color={isCopied ? "#10B981" : "#9CA3AF"}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleShare(trimmedMsg.split(`Message ${idx + 1}:`)[1])}
                          >
                            <MaterialIcons name="share" size={18} color="#9CA3AF" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {adviceOrTips.map((tip: string, idx: number) => {
                const trimmedTip = tip.trim();
                return (
                  <View
                    key={`tip-${idx}`}
                    className="w-full flex-col items-start mb-4"
                  >
                    <View className="w-80 flex-row items-start border bg-black/10 border-white/15 rounded-2xl px-6 py-4">
                      <View style={{ flex: 1 }} className="mb-2">
                        {renderFormattedText(trimmedTip)}
                      </View>
                    </View>

                    {/* Calendar button for coach tips with start_time */}
                    {item.start_time && !events.find(event => event.startDate === item.start_time) && (
                        <TouchableOpacity
                          className="mt-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 self-start"
                          onPress={() => handleCreateCalendarEvent(item)}
                        >
                          <View className="flex-row items-center">
                            <MaterialIcons
                              name="event"
                              size={14}
                              color="#3B82F6"
                            />
                            <Text className="text-blue-600 text-sm font-medium ml-1">
                              Add to Calendar
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      }
    }

    // --- Fallback and other message type rendering ---
    if (isAssistant && item.options && item?.type?.startsWith("flow")) {
      return (
        <View className={`flex-row items-start mb-4`}>
          <Image source={ImageIcons.Assistant} className="w-10 h-10 mr-2" />
          <View className="w-80 border bg-[#5248A0] border-white/15 rounded-xl px-6 py-3">
            <Text className="text-white text-base mb-3">
              {item.content
                ? item.content
                : "Welcome to Zirkl Assistant! How can I assist you today?"}
            </Text>

            <View className="flex-row flex-wrap justify-between">
              {item?.options?.map((opt: any, index: number) => {
                const cardClasses = opt.enabled
                  ? "bg-black/10 border border-white/15"
                  : "bg-gray-50 border border-white/15 opacity-50";

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => onOptionSelect(opt)}
                    disabled={!opt.enabled}
                    className={`w-[48%] mb-3 rounded-xl p-3 ${cardClasses}`}
                  >
                    <Text className="text-2xl">{opt.emoji}</Text>
                    <Text className="text-white font-semibold text-base">
                      {opt.title}
                    </Text>
                    <Text className="text-xs text-white">{opt.subtitle}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* <Text className='text-white text-xs text-right mt-2'>{time12}</Text> */}
          </View>
        </View>
      );
    } else if (
      isAssistant &&
      item.options &&
      (item.type === "option" || item.type === "confirmation")
    ) {
      return (
        <View className={`flex-row items-start`}>
          <Image source={ImageIcons.Assistant} className="w-10 h-10 mr-2" />
          <View className="flex-col items-start mb-4 gap-4">
            <View className="w-80 border bg-black/15 border-white/15 rounded-xl px-6 py-3">
              <Text className="text-white text-base mb-3">
                {item.content
                  ? item.content
                  : "Welcome to Zirkl Assistant! How can I assist you today?"}
              </Text>
              {/* <Text className='text-white text-xs text-right'>{time12}</Text> */}
            </View>
            <View className="flex-row w-full flex-wrap justify-start">
              {item?.options?.map((opt: any, index: number) => {
                const gender = getGender(opt.name.split(" ")[0], "en");
                const avatarImage = gender === "male" ? maleRR.assign(opt.id) : femaleRR.assign(opt.id);
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => onOptionSelect(opt)}
                    className="w-[40%] rounded-xl p-3 mr-5 mb-4 bg-[#5248A0] border border-white/15 items-center"
                  >
                    {/* Avatar/Image */}
                    <Image
                      source={avatarImage}
                      className="w-6 h-6 rounded-full mb-2"
                    />

                    {/* Name (centered) */}
                    <Text className="font-semibold text-xs text-center text-white mb-1">
                      {opt.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      );
    } else {
      // Normal single message (user or assistant)
      return (
        <View
          className={`flex-row ${isUser ? "flex-row-reverse" : "flex-row"} items-start mb-4`}
        >
          {isUser ? (
            <Image
              source={randomUserIcon}
              className="w-10 h-10 ml-2 rounded-full"
            />
          ) : (
            <Image
              source={ImageIcons.Assistant}
              className="w-10 h-10 mr-2 rounded-full"
            />
          )}
          <View
            className={`w-80 text-white ${isUser ? "bg-[#C6BFFF]/10" : "bg-[#5248A0]"} border border-white/10 rounded-2xl px-6 py-4`}
          >
            <View className="mb-2">
              <Text className={`text-white text-base leading-5`}>
                {item.content}
              </Text>
            </View>

            {/* Calendar button for messages with start_time */}
            {isAssistant &&
              item.start_time &&
              events.find(event => {
                const eventDate = event.startDate ? new Date(event.startDate).toISOString().split('Z')[0] : null;
                const itemDate = item.start_time ? new Date(item.start_time).toISOString().split('+')[0] : null;
                return eventDate !== itemDate;
              }) && (
                <TouchableOpacity
                  className="absolute right-2 top-2 bg-blue-50 border border-white/10 rounded-full p-1.5"
                  onPress={() => handleCreateCalendarEvent(item)}
                >
                  <MaterialIcons name="event" size={14} color="#3B82F6" />
                </TouchableOpacity>
              )}

            {/* <Text className='text-gray-500 text-xs text-right mt-1'>{time12}</Text> */}
          </View>
          {item.options && (
            <View className="flex mt-3 gap-2">
              {item.options.map(
                (option: string | Option, optionIndex: number) => {
                  const optionText =
                    typeof option === "string" ? option : option.text;
                  return (
                    <TouchableOpacity
                      key={`option-${index}-${optionIndex}-${optionText}`}
                      onPress={() => onOptionSelect(option)}
                      disabled={
                        isWaitingForResponse || item.next_step !== currentStep
                      }
                      className={`bg-[#5248A0] rounded-lg px-6 py-3 ${isWaitingForResponse ? "opacity-50" : ""}`}
                    >
                      <Text className="text-white text-start font-medium">
                        {optionText}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          )}
        </View>
      );
    }
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({
        offset: 0, // inverted list => 0 means bottom
        animated: false,
        });
      });
      return () => {};
  }, []);

  // final return — this is the optimized FlatList
  return (
    <FlatList
      ref={flatListRef}
      data={reversedMessages}
      inverted
      keyExtractor={(_, i) => i.toString()}
      renderItem={renderMessage}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: isKeyboardVisible ? 120 : 40,
        paddingBottom: 40,
      }}
      initialNumToRender={12}
      windowSize={10}
      maxToRenderPerBatch={10}
      removeClippedSubviews={true}
    />
  );
}
