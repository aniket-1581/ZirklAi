import ChatInput from '@/components/ChatInput';
import GlobalMessageList from '@/components/GlobalMessageList';
import KeyboardLayout from '@/components/KeyboardAvoidingLayout';
import LoadingMessage from '@/components/LoadingMessage';
import TypingIndicator from '@/components/TypingIndicator';
import { useGlobalChat } from '@/hooks/useGlobalChat';
import { Message } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, Text, View, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function GlobalChatScreen() {
  const flatListRef = useRef<FlatList<Message> | null>(null);
  const { autoMessage } = useLocalSearchParams<{ autoMessage?: string }>();
  const lastSentMessage = useRef<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
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
      loadHistory(); // Refetch chat history when tab is selected
    }, [loadHistory])
  );

  // Handle auto-message on load (send only if it's a new message)
  useEffect(() => {
    if (autoMessage && !isLoading && autoMessage !== lastSentMessage.current) {
      lastSentMessage.current = autoMessage;
      setUserInput(autoMessage);
      handleTextSubmit(autoMessage);
    }
  }, [autoMessage, isLoading, setUserInput, handleTextSubmit]);

  return (
    <View className="flex-1 bg-[#3A327B]">
      <KeyboardLayout>
        {/* Header */}
        <View className="flex-row items-center justify-center px-5 mt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute left-5"
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-2xl font-medium text-white">Zirkl Assistant</Text>
        </View>

        <View className='flex-1 mx-5 mt-4'>
          <LoadingMessage isLoading={isLoading} message='Setting up your zirkl assistant...' />
          <GlobalMessageList
            messages={messages}
            isWaitingForResponse={isWaitingForResponse}
            onOptionSelect={handleOptionSelect}
            flatListRef={flatListRef}
            currentStep={''}
            user={user?.full_name || ''}
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
    </View>
  );
}
