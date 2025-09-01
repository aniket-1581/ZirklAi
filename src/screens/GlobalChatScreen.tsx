import ChatInput from '@/components/ChatInput';
import LoadingIndicator from '@/components/LoadingIndicator';
import MessageList from '@/components/MessageList';
import TypingIndicator from '@/components/TypingIndicator';
import { useGlobalChat } from '@/hooks/useGlobalChat';
import { Message } from '@/types';
import { ImageIcons } from '@/utils/ImageIcons';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ImageBackground, Keyboard, KeyboardAvoidingView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GlobalChatScreen() {
  const flatListRef = useRef<FlatList<Message> | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const {
    messages,
    userInput,
    isLoading,
    isWaitingForResponse,
    loadingMessages,
    setUserInput,
    handleTextSubmit,
  } = useGlobalChat();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground source={ImageIcons.BackgroundImage} resizeMode="cover" style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View className="flex items-start border-b border-gray-200 p-5 bg-white/90">
            <Text className="text-black text-2xl font-bold">Zirkl Global Chat</Text>
          </View>

          <View style={{ flex: 1, gap: 16 }}>
            <View style={{ flex: 1 }}>
              <LoadingIndicator isLoading={isLoading} />
              <MessageList
                messages={messages}
                isWaitingForResponse={isWaitingForResponse}
                onOptionSelect={() => {}}
                onContactSync={() => {}}
                onContactSelection={() => {}}
                onComplete={() => {}}
                flatListRef={flatListRef}
                handleGetLocation={() => {}}
                locating={false}
                currentStep={''}
              />
              <TypingIndicator isWaitingForResponse={isWaitingForResponse} />

              {/* Transient loading messages while waiting for LLM */}
              {loadingMessages.length > 0 && !isLoading && (
                <View className="px-5">
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

            <KeyboardAvoidingView behavior='padding' keyboardVerticalOffset={isKeyboardVisible ? 80 : 0}>
              <ChatInput
                userInput={userInput}
                setUserInput={setUserInput}
                onTextSubmit={handleTextSubmit}
                isWaitingForResponse={isWaitingForResponse}
              />
            </KeyboardAvoidingView>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}


