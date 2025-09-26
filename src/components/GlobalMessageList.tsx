import { formatUtcToIstTime } from '@/utils/date';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Message, Option } from '../types';

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
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const handleCopy = (text: string, key: string) => {
    Clipboard.setStringAsync(text);
    setCopiedStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: false }));
    }, 3000);
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*.*?\*)/g);
    return (
      <Text className="text-black text-base">
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**:')) {
            return (
              <Text key={index} className="font-bold">
                {part.slice(1, -1)}
              </Text>
            );
          }
          return part;
        })}
      </Text>
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
            <View className="max-w-[85%] self-start border bg-[#F6F4FF] border-[#DADADA] rounded-xl px-5 py-3">
              <Text className="text-black text-base">{introText}</Text>
            </View>
          )}
          {suggestionMessages.map((msg: string, idx: number) => {
            const copyKey = `msg-${index}-${idx}`;
            const isCopied = copiedStates[copyKey];
            const trimmedMsg = msg.trim();

            return (
              <View
                key={idx}
                className="max-w-[85%] flex-row items-start mb-3 border bg-[#F6F4FF] border-[#DADADA] rounded-xl px-5 py-3"
              >
                <View style={{ flex: 1 }}>
                  <Text className="text-black text-base pr-5">{renderFormattedText(trimmedMsg)}</Text>
                  <Text className='text-black text-xs mt-2 text-right'>{time12}</Text>
                </View>

                {/* Only show copy icon if it's messageGroupRegex */}
                {mainContent.match(messageGroupRegex) && (
                  <TouchableOpacity
                    className="absolute right-5 top-3" 
                    onPress={() => handleCopy(trimmedMsg, copyKey)}
                  >
                    <MaterialIcons 
                      name={isCopied ? "check" : "content-copy"} 
                      size={18} 
                      color={isCopied ? "green" : "#60646D"} 
                    />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          {adviceOrTips.map((tip: string, idx: number) => {
            const trimmedTip = tip.trim();
            return (
              <View key={`tip-${idx}`} className="w-full flex-row items-start mb-2">
                <View className="max-w-[85%] flex-row items-start border bg-[#E6F5FA] border-[#DADADA] rounded-xl px-5 py-3">
                  <View style={{ flex: 1 }}>
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
          <View className="max-w-[85%] border bg-[#F6F4FF] border-[#DADADA] rounded-xl px-5 py-3">
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
          <View className={`max-w-[85%] border ${isUser ? 'bg-white border-[#E2E2E2]' : 'bg-[#F6F4FF] border-[#DADADA]'} rounded-xl px-5 py-3`}>
            <Text className={`text-black text-base`}>{item.content}</Text>
            <Text className='text-black text-xs text-right'>{time12}</Text>
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
  }, [messages]);

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