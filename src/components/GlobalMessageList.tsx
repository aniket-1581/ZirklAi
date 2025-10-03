import { formatUtcToIstTime } from '@/utils/date';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Message, Option } from '../types';
import { useCalendar } from '../hooks/useCalendar';

interface MessageListProps {
  messages: Message[];
  isWaitingForResponse: boolean;
  onOptionSelect: (option: string | Option) => void;
  flatListRef: React.RefObject<FlatList<Message> | null>;
  currentStep: string;
}

export default function GlobalMessageList({
  messages,
  isWaitingForResponse,
  onOptionSelect,
  flatListRef,
  currentStep
}: MessageListProps) {
  const { createDeviceEvent, events } = useCalendar();
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [createdEventIds, setCreatedEventIds] = useState<Set<string>>(new Set());

  const handleCopy = (text: string, key: string) => {
    Clipboard.setStringAsync(text);
    setCopiedStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: false }));
    }, 3000);
  };

  const handleCreateCalendarEvent = async (message: Message) => {
    if (!message.start_time) return;

    try {
      // Check if event already exists for this message
      const messageTimestamp = new Date(message.start_time).toISOString();
      const existingEvent = events.find(event =>
        event.notes === message.content &&
        event.startDate &&
        new Date(event.startDate).toISOString() === messageTimestamp
      );

      if (existingEvent) {
        Toast.show({
          type: 'info',
          text1: 'Event Already Created',
          text2: 'This reminder has already been added to your calendar.',
          visibilityTime: 3000,
        });
        return;
      }

      // Parse the start_time string into a Date object
      const startDate = new Date(message.start_time);

      // Validate that the date was parsed correctly
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid start_time format');
      }

      // Calculate end date (1 hour after start time)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      const title = `[Zirkl Ai]`;

      await createDeviceEvent({
        title,
        startDate,
        endDate,
        location: 'remote',
        notes: message.content
      });

      // Track that this message has an event created
      if (message.start_time) {
        setCreatedEventIds(prev => new Set([...prev, message.start_time!]));
      }

      Toast.show({
        type: 'success',
        text1: 'Event Created Successfully',
        text2: 'Reminder has been added to your calendar.',
        visibilityTime: 3000,
      });

      console.log('Calendar event created successfully');
    } catch (error) {
      console.error('Error creating calendar event:', error);
      Toast.show({
        type: 'error',
        text1: 'Error Creating Event',
        text2: 'Failed to create calendar event. Please try again.',
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
          if (part.startsWith('### ')) {
            return (
              <Text key={index} className="text-black text-lg font-bold mb-2 mt-1 leading-6">
                {part.slice(4).trim()}
              </Text>
            );
          }

          // Handle **bold text** within the remaining text
          if (part.includes('**')) {
            const boldParts = part.split(/(\*\*.*?\*\*)/g);
            return (
              <Text key={index} className="text-black text-base leading-5">
                {boldParts.map((boldPart, boldIndex) => {
                  if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                    return (
                      <Text key={boldIndex} className="font-bold text-black">
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
            <Text key={index} className="text-black text-base leading-5 mb-1">
              {part}
            </Text>
          );
        })}
      </View>
    );
  };

  const renderMessage = ({ item, index }: { item: any, index: number }) => {
    const isUser = item.role === 'user';
    const time12 = formatUtcToIstTime(item.timestamp);
    const isAssistant = item.role === 'assistant';
    const content = item.content || '';

    // --- Parsing Logic ---
    let isComplexAssistantMessage = false;
    if (isAssistant && typeof content === 'string') {
      let introText = '';
      let suggestionMessages: string[] = [];
      let adviceOrTips: string[] = [];

      // Regex to split by "For..." or "Coach Tip:". It looks for one or more newlines.
      const adviceSplitRegex = /\n+(?=For |Coach Tip:)/g;
      const contentParts = content.split(adviceSplitRegex);
      let mainContent = contentParts[0];
      adviceOrTips = contentParts.slice(1).map(p => p.trim());

      // Regex for numbered lists (handles single or double newlines) and message groups
      const numberedListRegex = /\n+(?=\d+\.\s)/g;
      const messageGroupRegex = /(?=Message \d+:)/g;

      if (mainContent.match(messageGroupRegex)) {
        suggestionMessages = mainContent.split(messageGroupRegex).filter((msg: string) => msg.trim());
        isComplexAssistantMessage = true;
      } else if (mainContent.match(numberedListRegex)) {
        const numberedListParts = mainContent.split(numberedListRegex);
        introText = numberedListParts[0].trim();
        suggestionMessages = numberedListParts.slice(1).map((p: string) => p.trim());
        isComplexAssistantMessage = true;
      } else {
        introText = mainContent.trim();
      }

      // If we found any special formatting, use the complex renderer
      if (isComplexAssistantMessage || adviceOrTips.length > 0) {
        return (
          <View className={`flex-col items-start mb-4`}>
          {introText && (
            <View className="max-w-[85%] self-start border bg-[#F6F4FF] border-[#DADADA] rounded-2xl px-6 py-4 mb-4 shadow-sm">
              <View className="mb-2">
                {renderFormattedText(introText)}
              </View>

              {/* Calendar button for messages with start_time */}
              {item.start_time && !createdEventIds.has(item.start_time) && (
                <TouchableOpacity
                  className="absolute right-2 top-2"
                  onPress={() => handleCreateCalendarEvent(item)}
                >
                  <Text className="text-gray-500 text-xs">📅</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {suggestionMessages.map((msg: string, idx: number) => {
            const copyKey = `msg-${index}-${idx}`;
            const isCopied = copiedStates[copyKey];
            const trimmedMsg = msg.trim();

            return (
              <View
                key={idx}
                className="max-w-[85%] flex-row items-start mb-4 border bg-[#F6F4FF] border-[#DADADA] rounded-2xl px-6 py-4 shadow-sm"
              >
                <View style={{ flex: 1 }}>
                  <View className="mb-2">
                    {renderFormattedText(trimmedMsg)}
                  </View>
                  <Text className='text-gray-500 text-xs text-right mt-1'>{time12}</Text>
                </View>

                {/* Only show copy icon for Message 1, 2, 3 parts */}
                {(trimmedMsg.includes('Message 1:') || trimmedMsg.includes('Message 2:') || trimmedMsg.includes('Message 3:')) && (
                  <TouchableOpacity
                    className="absolute right-2 top-2"
                    onPress={() => handleCopy(trimmedMsg, copyKey)}
                  >
                    <MaterialIcons
                      name={isCopied ? "check" : "content-copy"}
                      size={18}
                      color={isCopied ? "#10B981" : "#9CA3AF"}
                    />
                  </TouchableOpacity>
                )}

                {/* Calendar button for messages with start_time */}
                {item.start_time && !(trimmedMsg.includes('Message 1:') || trimmedMsg.includes('Message 2:') || trimmedMsg.includes('Message 3:')) && !createdEventIds.has(item.start_time) && (
                  <TouchableOpacity
                    className="absolute right-2 top-2"
                    onPress={() => handleCreateCalendarEvent(item)}
                  >
                    <Text className="text-gray-500 text-lg">📅</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          {adviceOrTips.map((tip: string, idx: number) => {
            const trimmedTip = tip.trim();
            return (
              <View key={`tip-${idx}`} className="w-full flex-row items-start mb-4">
                <View className="max-w-[85%] flex-row items-start border bg-[#E6F5FA] border-[#DADADA] rounded-2xl px-6 py-4 shadow-sm">
                  <View style={{ flex: 1 }} className="mb-2">
                    {renderFormattedText(trimmedTip)}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
        );
      }
    }
    
    // --- Fallback and other message type rendering ---
    if (isAssistant && item.options && item.type === 'flow') {
      return (
        <View className={`flex-col items-start mb-4`}>
          <View className="max-w-[85%] border bg-[#F6F4FF] border-[#DADADA] rounded-xl px-5 py-3 shadow-sm">
            <Text className="text-base mb-3">
              {item.content ? item.content : "Welcome to Zirkl Global Chat! How can I assist you today?"}
            </Text>

            <View className="flex-row flex-wrap justify-between">
              {item?.options?.map((opt: any, index: number) => {
                const cardClasses = opt.enabled
                  ? "bg-white border border-gray-300"
                  : "bg-gray-50 border border-gray-200 opacity-50";

                return (
                  <TouchableOpacity
                    key={index} 
                    onPress={() => onOptionSelect(opt)}
                    disabled={!opt.enabled}
                    className={`w-[48%] mb-3 rounded-xl p-3 ${cardClasses}`}
                  >
                    <Text className="text-2xl">{opt.emoji}</Text>
                    <Text className="font-semibold text-base">{opt.title}</Text>
                    <Text className="text-xs text-gray-500">{opt.subtitle}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text className='text-black text-xs text-right mt-2'>{time12}</Text>
          </View>
        </View>
      );
    } else if (isAssistant && item.options && (item.type === 'option' || item.type === 'confirmation')) {
      return (
        <View className={`flex-col items-start mb-4`}>
          <View className="max-w-[85%] border bg-[#F6F4FF] border-[#DADADA] rounded-xl px-5 py-3">
            <Text className="text-black text-base mb-3">
              {item.content ? item.content : "Welcome to Zirkl Global Chat! How can I assist you today?"}
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {item?.options?.map((opt: any, index: number) => {
                const cardClasses = "bg-white border border-gray-300";

                return (
                  <TouchableOpacity
                    key={index} 
                    onPress={() => onOptionSelect(opt)}
                    className={`w-[48%] mb-3 rounded-xl p-3 ${cardClasses}`}
                  >
                    <Text className="font-semibold text-base">{opt.name}</Text>
                    <Text className="text-xs text-gray-500">{opt.phoneNumber}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text className='text-black text-xs text-right'>{time12}</Text>
          </View>
        </View>
      );
    } else {
      // Normal single message (user or assistant)
      return (
        <View className={`flex-row ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start mb-4`}>
          <View className={`max-w-[85%] border ${isUser ? 'bg-white border-[#E2E2E2]' : 'bg-[#F6F4FF] border-[#DADADA]'} rounded-2xl px-6 py-4 shadow-sm`}>
            <View className="mb-2">
              <Text className={`text-black text-base leading-5`}>{item.content}</Text>
            </View>

            {/* Calendar button for messages with start_time */}
            {isAssistant && item.start_time && !createdEventIds.has(item.start_time) && (
              <TouchableOpacity
                className="absolute right-2 top-2"
                onPress={() => handleCreateCalendarEvent(item)}
              >
                <Text className="text-gray-500 text-xs">📅</Text>
              </TouchableOpacity>
            )}

            <Text className='text-gray-500 text-xs text-right mt-1'>{time12}</Text>
          </View>
          {item.options && (
            <View className="flex mt-3 gap-2">
              {item.options.map((option: string | Option, optionIndex: number) => {
                const optionText = typeof option === 'string' ? option : option.text;
                return (
                  <TouchableOpacity
                    key={`option-${index}-${optionIndex}-${optionText}`}
                    onPress={() => onOptionSelect(option)}
                    disabled={isWaitingForResponse || item.next_step !== currentStep}
                    className={`bg-[#444A8E] rounded-lg px-5 py-3 ${isWaitingForResponse ? 'opacity-50' : ''}`}
                  >
                    <Text className="text-white text-start font-medium">{optionText}</Text>
                  </TouchableOpacity>
                );
              })}
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

  return (
    <FlatList
      data={messages}
      keyExtractor={(_, idx) => idx.toString()}
      showsVerticalScrollIndicator={false}
      ref={flatListRef}
      keyboardShouldPersistTaps='handled'
      renderItem={({ item, index }) => {
        return renderMessage({ item, index });
      }}
    />
  );
}