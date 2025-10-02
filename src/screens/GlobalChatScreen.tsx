import ChatInput from '@/components/ChatInput';
import GlobalMessageList from '@/components/GlobalMessageList';
import KeyboardLayout from '@/components/KeyboardAvoidingLayout';
import LoadingMessage from '@/components/LoadingMessage';
import TypingIndicator from '@/components/TypingIndicator';
import { useGlobalChat } from '@/hooks/useGlobalChat';
import { Message } from '@/types';
import { ImageIcons } from '@/utils/ImageIcons';
import React, { useRef, useCallback } from 'react';
import { FlatList, ImageBackground, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

export default function GlobalChatScreen() {
  const flatListRef = useRef<FlatList<Message> | null>(null);

  const {
    messages,
    userInput,
    isLoading,
    isWaitingForResponse,
    setUserInput,
    handleTextSubmit,
    loadingMessages,
    handleOptionSelect,
    loadHistory,
  } = useGlobalChat();

  // Refetch data when screen comes into focus (tab is selected)
  useFocusEffect(
    useCallback(() => {
      console.log('Global chat screen focused - refetching data');
      loadHistory(); // Refetch chat history when tab is selected
    }, [loadHistory])
  );

  return (
    <ImageBackground source={ImageIcons.BackgroundImage} resizeMode="cover" style={{ flex: 1 }}>
      <KeyboardLayout>
        <View className="flex items-start border-b border-gray-200 p-5 bg-white/90">
          <Text className="text-black text-2xl font-bold">Zirkl Global Chat</Text>
        </View>
          <View className='flex-1 mx-5 mt-4'>
            <LoadingMessage isLoading={isLoading} message='Setting up your global chat...' />
            <GlobalMessageList
              messages={messages}
              isWaitingForResponse={isWaitingForResponse}
              onOptionSelect={handleOptionSelect}
              flatListRef={flatListRef}
              currentStep={''}
            />
            <TypingIndicator isWaitingForResponse={isWaitingForResponse} />

            {/* Transient loading messages while waiting for LLM */}
            {loadingMessages.length > 0 && isWaitingForResponse && (
              <View>
                {loadingMessages.map((msg, idx) => (
                  <View key={`loading-${idx}`} className="mb-2 items-start">
                    <View className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                      <Text className="text-sm text-gray-600">{msg}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
          <ChatInput userInput={userInput} setUserInput={setUserInput} onTextSubmit={() => handleTextSubmit()} isWaitingForResponse={isWaitingForResponse} />
      </KeyboardLayout>
    </ImageBackground>
  );
}
