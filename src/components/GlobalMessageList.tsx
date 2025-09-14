import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Message, Option } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { FocusCard } from "./FocusCard";

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

  const renderMessage = ({ item, index }: { item: any, index: number }) => {
    const isUser = item.role === 'user';
    const hours12 = new Date(item.timestamp).getHours() % 12 || 12;
    const ampm = new Date(item.timestamp).getHours() >= 12 ? 'PM' : 'AM';
    const time12 = `${hours12.toString().padStart(2, '0')}:${new Date(item.timestamp).getMinutes().toString().padStart(2, '0')} ${ampm}`;

    const isAssistant = item.role === 'assistant';

    // Match all occurrences of "Message X:"
    const messageMatch = item.content.match(/Message \d+:/g);

    const isSuggestionGroup = isAssistant && messageMatch && messageMatch.length >= 3;

    if (isAssistant && index === 0) {
      return (
        <View>
          <FocusCard onSelect={(opt) => onOptionSelect(opt)} message={item.content} />
        </View>
      );
    }

    if (isSuggestionGroup) {
      // Split the message into each "Message X: ..." part
      const suggestionMessages = item.content.split(/(?=Message \d+:)/g).filter((msg: string) => msg.trim());

      return (
        <View className={`flex-col items-start mb-4 px-4`}>
          {suggestionMessages.map((msg: string, idx: number) => (
            <View
              key={idx}
              className="max-w-[75%] flex-row items-start mb-2 border bg-[#F6F4FF] border-[#DADADA] rounded-xl px-5 py-3"
            >
              <View style={{ flex: 1 }}>
                <Text className='text-black text-base'>{msg.trim()}</Text>
                <Text className='text-black text-xs text-right'>{item.timestamp}</Text>
              </View>
              <TouchableOpacity
                className="ml-2 mt-1"
                onPress={() => Clipboard.setStringAsync(msg.trim())}
              >
                <MaterialIcons name="content-copy" size={18} color="#60646D" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      );
    } else {
      // Normal single message (user or assistant)
      return (
        <View className={`flex-row ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start mb-4`}>
          <View className={`max-w-[75%] mx-4 border ${isUser ? 'bg-white border-[#E2E2E2]' : 'bg-[#F6F4FF] border-[#DADADA]'} rounded-xl px-5 py-3`}>
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
      className='flex-1 px-5 pt-4'
      showsVerticalScrollIndicator={false}
      ref={flatListRef}
      keyboardShouldPersistTaps='handled'
      renderItem={({ item, index }) => {
        return renderMessage({ item, index });
      }}
    />
  );
}