import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Keyboard } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { Message, Option } from '../types';

interface MessageListProps {
  messages: Message[];
  isWaitingForResponse: boolean;
  onOptionSelect: (option: string | Option) => void;
  onContactSync: () => void;
  onContactSelection: () => void;
  onComplete: () => void;
  flatListRef: React.RefObject<FlatList<Message> | null>;
  handleGetLocation: () => void;
  locating: boolean;
  currentStep: string;
}

export default function MessageList({
  messages,
  isWaitingForResponse,
  onOptionSelect,
  onContactSync,
  onContactSelection,
  onComplete,
  flatListRef,
  handleGetLocation,
  locating,
  currentStep
}: MessageListProps) {

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [flatListRef]);

  return (
    <FlatList
      data={messages}
      keyExtractor={(_, idx) => idx.toString()}
      className='flex-1 px-5 pt-4'
      showsVerticalScrollIndicator={false}
      ref={flatListRef}
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 100 : 0 }}
      renderItem={({ item, index }) => {
        const isSystem = item.role === 'assistant';
        return (
          <View className={`mb-4 ${isSystem ? 'items-start' : 'items-end'}`}>
            <View className={`max-w-[80%] border ${isSystem ? 'bg-[#F6F4FF] border-[#DADADA]' : 'bg-white border-[#E2E2E2]'} rounded-2xl px-5 py-3`}>
              <Text className={`text-base text-black`}>
                {item.content}
              </Text>
            </View>

            {item.next_step === 'location' && (
              <TouchableOpacity
                className="mb-8 items-start"
                onPress={handleGetLocation}
                disabled={locating || item.next_step !== currentStep}
                style={{ opacity: locating ? 0.6 : 1 }}
              >
                <View className="flex-row items-center">
                  <Text className="text-blue-400 text-base mr-2">Use Current Location</Text>
                  {locating && <ActivityIndicator size="small" color="#60A5FA" />}
                </View>
              </TouchableOpacity>
            )}

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

            {item.next_step === 'connect_contacts' && (
              <TouchableOpacity onPress={onContactSync} className="bg-[#444A8E] rounded-lg px-5 py-3 mt-4 flex-row items-center justify-between" disabled={item.next_step !== currentStep}>
                <View className="flex-row items-center">
                  <AntDesign name="contacts" size={18} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white text-start font-medium">Connect phone-book </Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            )}

            {(item.next_step === 'select_contacts') && (
              <TouchableOpacity onPress={onContactSelection} className="bg-[#444A8E] rounded-lg px-5 py-3 mt-4 flex-row items-center justify-between" disabled={item.next_step !== currentStep}>
                <View className="flex-row items-center">
                  <MaterialIcons name="person-add" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white text-start font-medium">Select contacts for your </Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            )}

            {item.next_step === 'complete' && isSystem && (
              <TouchableOpacity onPress={onComplete} className="bg-[#444A8E] rounded-lg px-5 py-3 mt-4 flex-row items-center justify-between">
                <Text className='text-white'>Let&apos;s Start</Text>
              </TouchableOpacity>
            )}
          </View>
        )
      }}
    />
  );
}