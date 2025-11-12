import { formatUtcToIstTime } from "@/utils/date";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Keyboard,
  Image,
  ScrollView,
  Share,
} from "react-native";
import Toast from "react-native-toast-message";
import { Message, Option } from "../types";
import { useCalendar } from "../hooks/useCalendar";
import { ImageIcons } from "@/utils/ImageIcons";
import { getGender } from "gender-detection-from-name";

interface MessageListProps {
  messages: Message[];
  isWaitingForResponse: boolean;
  onOptionSelect: (option: string | Option) => void;
  flatListRef: React.RefObject<FlatList<Message> | null>;
  currentStep: string;
  user: string;
}

export default function GlobalMessageList({
  messages,
  isWaitingForResponse,
  onOptionSelect,
  flatListRef,
  currentStep,
  user,
}: MessageListProps) {
  const { createDeviceEvent, events } = useCalendar();
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [createdEventIds, setCreatedEventIds] = useState<Set<string>>(
    new Set()
  );
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const handleCopy = (text: string, key: string) => {
    Clipboard.setStringAsync(text);
    setCopiedStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: false }));
    }, 3000);
  };

  const handleShare = (text: string) => {
    Share.share({
      message: text,
    });
  };

  const extractContactName = (content: string): string => {
    // Look for patterns like "Hi [Name]," or "Hello [Name]," or just "[Name],"
    const namePatterns = [
      /Hi\s+([^,]+),/i,
      /Hello\s+([^,]+),/i,
      /Dear\s+([^,]+),/i,
      /^([^,\n]+),/m, // Name at the start of a line followed by comma
    ];

    for (const pattern of namePatterns) {
      const match = content.match(pattern);
      if (match && match[1] && match[1].trim().length > 0) {
        const name = match[1].trim();
        // Make sure it's not a generic greeting like "Hi there," or "Hi team,"
        if (!["there", "team", "everyone"].includes(name.toLowerCase())) {
          return name;
        }
      }
    }

    return "";
  };

  const handleCreateCalendarEvent = async (message: Message) => {
    if (!message.start_time) return;

    try {
      // Check if event already exists for this message
      const messageTimestamp = new Date(message.start_time).toISOString();
      const existingEvent = events.find(
        (event) =>
          event.notes === message.content &&
          event.startDate &&
          new Date(event.startDate).toISOString() === messageTimestamp
      );

      if (existingEvent) {
        Toast.show({
          type: "info",
          text1: "Event Already Created",
          text2: "This reminder has already been added to your calendar.",
          visibilityTime: 3000,
        });
        return;
      }

      // Parse the start_time string into a Date object
      const startDate = new Date(message.start_time);

      // Validate that the date was parsed correctly
      if (isNaN(startDate.getTime())) {
        throw new Error("Invalid start_time format");
      }

      // Calculate end date (1 hour after start time)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      // Extract contact name from message content
      const contactName = extractContactName(message.content || "");

      // Create title with contact name if available
      const title = contactName
        ? `[Zirkl Ai] Reminder for ${contactName}`
        : `[Zirkl Ai]`;

      await createDeviceEvent({
        title,
        startDate,
        endDate,
        location: "remote",
        notes: message.content,
        reminders: [10, 30], // 10 and 30 minutes before the event
      });

      // Track that this message has an event created
      if (message.start_time) {
        setCreatedEventIds((prev) => new Set([...prev, message.start_time!]));
      }

      Toast.show({
        type: "success",
        text1: "Event Created Successfully",
        text2: "Reminder has been added to your calendar.",
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error("Error creating calendar event:", error);
      Toast.show({
        type: "error",
        text1: "Error Creating Event",
        text2: "Failed to create calendar event. Please try again.",
        visibilityTime: 3000,
      });
    }
  };

  const renderFormattedText = (text: string) => {
    // Split by ### headers first
    const headerRegex = /(### .*?)(?=\n|$)/g;
    const parts = text.split(headerRegex);

    return (
      <View className="flex-col">
        {parts.map((part, index) => {
          // Handle ### headers
          if (part.startsWith("### ")) {
            return (
              <Text
                key={index}
                className="text-white text-lg font-bold mb-2 mt-1 leading-6"
              >
                {part.slice(4).trim()}
              </Text>
            );
          }

          // Handle **bold text** within the remaining text
          if (part.includes("**")) {
            const boldParts = part.split(/(\*\*.*?\*\*)/g);
            return (
              <Text key={index} className="text-white text-base leading-5">
                {boldParts.map((boldPart, boldIndex) => {
                  if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
                    return (
                      <Text key={boldIndex} className="font-bold text-white">
                        {boldPart.slice(2, -2)}
                      </Text>
                    );
                  }
                  return boldPart;
                })}
              </Text>
            );
          }

          // Regular text
          return (
            <Text key={index} className="text-white text-base leading-5 mb-1">
              {part}
            </Text>
          );
        })}
      </View>
    );
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isUser = item.role === "user";
    // const time12 = formatUtcToIstTime(item.timestamp);
    const isAssistant = item.role === "assistant";
    const content = item.content || "";

    const gender = getGender(user.split(" ")[0], "en");
    const randomUserIcon =
      gender === "male" ? ImageIcons.MenImage : ImageIcons.WomanImage;

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
                <View className="w-80 self-start border bg-black/15 border-white/15 rounded-2xl px-6 py-4 mb-4">
                  <View className="mb-2">{renderFormattedText(introText)}</View>

                  {/* Calendar button for messages with start_time */}
                  {item.start_time && !createdEventIds.has(item.start_time) && (
                    <TouchableOpacity
                      className="absolute right-2 top-2 bg-blue-50 border border-white/15 rounded-full p-1.5"
                      onPress={() => handleCreateCalendarEvent(item)}
                    >
                      <MaterialIcons name="event" size={14} color="#3B82F6" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {reminderText && (
                <View className="w-80 self-start border bg-black/15 border-white/15 rounded-2xl px-6 py-4 mb-4">
                  <View className="mb-2">
                    {renderFormattedText(reminderText)}
                  </View>
                </View>
              )}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  gap: 10,
                  display: "flex",
                  flexDirection: "row"
                }}
              >
                {suggestionOnly.map((msg: string, idx: number) => {
                  const copyKey = `msg-${index}-${idx}`;
                  const isCopied = copiedStates[copyKey];
                  const trimmedMsg = msg.trim();

                  return (
                    <View
                      key={idx}
                      className="w-80 flex-row items-center mb-4 border bg-[#5248A0] border-white/15 rounded-2xl px-6 py-4"
                    >
                        <View className="mb-2">
                          {renderFormattedText(trimmedMsg)}
                        </View>

                      {/* Only show copy icon for Message 1, 2, 3 parts */}

                      {(trimmedMsg.includes("Message 1:") ||
                        trimmedMsg.includes("Message 2:") ||
                        trimmedMsg.includes("Message 3:")) && (
                          <View className="absolute right-2 top-2 flex-row gap-4">
                            <TouchableOpacity
                              onPress={() => handleCopy(trimmedMsg, copyKey)}
                            >
                              <MaterialIcons
                                name={isCopied ? "check" : "content-copy"}
                                size={18}
                                color={isCopied ? "#10B981" : "#9CA3AF"}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleShare(trimmedMsg.split(":")[1])}
                            >
                              <MaterialIcons
                                name="share"
                                size={18}
                                color="#9CA3AF"
                              />
                            </TouchableOpacity>
                          </View>
                      )}

                      {/* Calendar button for messages with start_time */}
                      {item.start_time &&
                        !(
                          trimmedMsg.includes("Message 1:") ||
                          trimmedMsg.includes("Message 2:") ||
                          trimmedMsg.includes("Message 3:")
                        ) &&
                        !createdEventIds.has(item.start_time) && (
                          <TouchableOpacity
                            className="absolute right-2 top-2 bg-blue-50 border border-blue-200 rounded-full p-1.5"
                            onPress={() => handleCreateCalendarEvent(item)}
                          >
                            <MaterialIcons
                              name="event"
                              size={14}
                              color="#3B82F6"
                            />
                          </TouchableOpacity>
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
                    <View className="w-80 flex-row items-start border bg-black/5 border-white/15 rounded-2xl px-6 py-4">
                      <View style={{ flex: 1 }} className="mb-2">
                        {renderFormattedText(trimmedTip)}
                      </View>
                    </View>

                    {/* Calendar button for coach tips with start_time */}
                    {item.start_time &&
                      !createdEventIds.has(item.start_time) && (
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
          <View className="w-80 border bg-black/15 border-white/15 rounded-xl px-5 py-3">
            <Text className="text-white text-base mb-3">
              {item.content
                ? item.content
                : "Welcome to Zirkl Global Chat! How can I assist you today?"}
            </Text>

            <View className="flex-row flex-wrap justify-between">
              {item?.options?.map((opt: any, index: number) => {
                const cardClasses = opt.enabled
                  ? "bg-[#5248A0] border border-white/15"
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
            <View className="w-80 border bg-black/15 border-white/15 rounded-xl px-5 py-3">
              <Text className="text-white text-base mb-3">
                {item.content
                  ? item.content
                  : "Welcome to Zirkl Global Chat! How can I assist you today?"}
              </Text>
              {/* <Text className='text-white text-xs text-right'>{time12}</Text> */}
            </View>
            <View className="flex-row w-full flex-wrap justify-start">
              {item?.options?.map((opt: any, index: number) => {
                const gender = getGender(opt.name, "en");
                const randomUserIcon =
                  gender === "male"
                    ? ImageIcons.MenImage
                    : ImageIcons.WomanImage;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => onOptionSelect(opt)}
                    className="w-[40%] rounded-xl p-3 mr-5 mb-4 bg-[#5248A0] border border-white/15 items-center"
                  >
                    {/* Avatar/Image */}
                    {randomUserIcon && (
                      <Image
                        source={randomUserIcon}
                        className="w-6 h-6 rounded-full mb-2"
                      />
                    )}

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
              className="w-10 h-10 ml-2 rounded-full"
            />
          )}
          <View
            className={`w-80 text-white ${isUser ? "bg-[#C6BFFF]/10" : "bg-black/15"} border border-white/10 rounded-2xl px-6 py-4`}
          >
            <View className="mb-2">
              <Text className={`text-white text-base leading-5`}>
                {item.content}
              </Text>
            </View>

            {/* Calendar button for messages with start_time */}
            {isAssistant &&
              item.start_time &&
              !createdEventIds.has(item.start_time) && (
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
                      className={`bg-[#5248A0] rounded-lg px-5 py-3 ${isWaitingForResponse ? "opacity-50" : ""}`}
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
  // Use a useEffect hook to automatically scroll to the end
  useEffect(() => {
    if (flatListRef.current) {
      // The timeout gives the FlatList a moment to render the new item
      // before attempting to scroll to it.
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  }, [messages, flatListRef]);

  // Keyboard handling
  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [flatListRef]);

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(_, idx) => idx.toString()}
      renderItem={({ item, index }) => renderMessage({ item, index })}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 100 : 0 }}
      onContentSizeChange={() => {
        // Always scroll to bottom when content height changes (new messages, initial render)
        if (flatListRef.current && messages.length > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 100);
        }
      }}
      onLayout={() => {
        // Ensures we scroll once layout stabilizes
        if (flatListRef.current && messages.length > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }, 300);
        }
      }}
    />
  );

}
