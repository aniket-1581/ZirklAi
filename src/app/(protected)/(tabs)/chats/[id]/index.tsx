import { chatWithLlm, getLoadingMessage, getNoteChatHistory, getReturningMessage, getWelcomeMessage, postNoteChatHistory } from '@/api/chat';
import { getNoteById } from '@/api/notes';
import LoadingIndicator from '@/components/LoadingIndicator';
import TypingIndicator from '@/components/TypingIndicator';
import { useAuth } from '@/context/AuthContext';
import { ImageIcons } from '@/utils/ImageIcons';
import { formatUtcToIstTime } from '@/utils/date';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ChatScreen() {
  const { id, draftMessage } = useLocalSearchParams<{ id: string; draftMessage?: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState(draftMessage || '');
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const flatListRef = useRef(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { token } = useAuth();
  const [note, setNote] = useState<any>(null);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();

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
          if (part.startsWith('*') && part.endsWith('*')) {
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

  useEffect(() => {
    const fetchNote = async () => {
      const note = await getNoteById(id as string, token!) as any;
      setNote(note);
    }
    fetchNote();
  }, [id, token]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const fetchChat = async () => {
      setLoading(true);
      try {
        let chatHistory = await getNoteChatHistory(id as string, token!) as any;
        if (!chatHistory || chatHistory.messages.length === 0) {
          const welcome = await getWelcomeMessage() as any;
          chatHistory = [
            {
              role: 'assistant',
              content: welcome.message || welcome.text || 'Welcome!',
              timestamp: new Date().toISOString()
            }
          ];
          await postNoteChatHistory(id as string, chatHistory, token!);
          setMessages(chatHistory);
        } else {
          const lastMessage = chatHistory.messages[chatHistory.messages.length - 1];
          // Only show a returning message if the user was the last one to speak.
          if (lastMessage && lastMessage.role === 'user') {
            const returningMsg = await getReturningMessage() as any;
            if (returningMsg && returningMsg.message) {
              const updatedMessages = [
                ...chatHistory.messages,
                {
                  role: 'assistant',
                  content: returningMsg.message,
                  timestamp: new Date().toISOString()
                }
              ];
              setMessages(updatedMessages);
              await postNoteChatHistory(id as string, updatedMessages, token!);
              return; // Exit after updating
            }
          }
          setMessages(chatHistory.messages);
        }
      } catch (e: any) {
        console.error('Error Fetching Chat', e)
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchChat();
  }, [token, id]);


  const handleSend = async () => {
    if (!message.trim()) return;
    const newMessages = [
      ...messages,
      { role: 'user', content: message, timestamp: new Date().toISOString() }
    ];
    setIsWaitingForResponse(true);
    setMessages(newMessages);
    setMessage('');

    try {
      setLoadingMessages([]);
      const loadingResponse = await getLoadingMessage();
      const msgs = loadingResponse?.messages || [];
      if (Array.isArray(msgs) && msgs.length > 0) {
        for (let i = 0; i < msgs.length; i++) {
          await new Promise((res) => setTimeout(res, 1000));
          setLoadingMessages((prev) => [...prev, String(msgs[i])]);
        }
      }
    } catch {
      console.warn('Loading messages fetch failed');
    }

    try {
      const ollamaRes = await chatWithLlm(message, note?.content || '', id as string, token!) as any;
      // Replace loading indicator with the actual response
      if (ollamaRes && ollamaRes.response) {
        setMessages(prev => [
          ...prev.filter(m => m.type !== 'loading'),
          { role: 'assistant', content: ollamaRes.response, timestamp: new Date().toISOString() },
        ]);
      }
    } catch (e) {
      console.error('Error', e);
    } finally {
      setIsWaitingForResponse(false);
    }
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

      const adviceSplitRegex = /\n+(?=For |Coach Tip:)/g;
      const contentParts = content.split(adviceSplitRegex);
      let mainContent = contentParts[0];
      adviceOrTips = contentParts.slice(1).map(p => p.trim());

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

      if (isComplexAssistantMessage || adviceOrTips.length > 0) {
        return (
          <View className={`flex-col items-start mb-4`}>
            {introText && !!introText.trim() && (
              <View className="max-w-[85%] self-start border bg-[#F6F4FF] border-[#DADADA] rounded-xl px-5 py-3 mb-2">
                {renderFormattedText(introText)}
                <Text className='text-black text-xs mt-2 text-right'>{time12}</Text>
              </View>
            )}
            {suggestionMessages.map((msg: string, idx: number) => {
              const copyKey = `msg-${index}-${idx}`;
              const isCopied = copiedStates[copyKey];
              const trimmedMsg = msg.trim();
              return (
                <View key={idx} className="max-w-[85%] flex-row items-start mb-2 border bg-[#F6F4FF] border-[#DADADA] rounded-xl px-5 py-3">
                  <View style={{ flex: 1 }}>
                    <Text className={`text-black text-base pr-5`}>{renderFormattedText(trimmedMsg)}</Text>
                    <Text className='text-black text-xs mt-2 text-right'>{time12}</Text>
                  </View>
                  <TouchableOpacity className="absolute right-5 top-3" onPress={() => handleCopy(trimmedMsg, copyKey)}>
                    <MaterialIcons name={isCopied ? "check" : "content-copy"} size={18} color={isCopied ? "green" : "#60646D"} />
                  </TouchableOpacity>
                </View>
              );
            })}
            {adviceOrTips.map((tip: string, idx: number) => {
              const trimmedTip = tip.trim();
              return (
                <View key={`tip-${idx}`} className="w-full flex-row items-start mb-2">
                  <View className="max-w-[85%] flex-row items-start border bg-[#E6F5FA] border-[#DADADA] rounded-xl px-5 py-3">
                    <View style={{ flex: 1 }}>{renderFormattedText(trimmedTip)}</View>
                  </View>
                </View>
              );
            })}
          </View>
        );
      }
    }

    return (
      <View className={`flex-row ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start mb-4`}>
        <View className={`max-w-[85%] border ${isUser ? 'bg-white border-[#E2E2E2]' : 'bg-[#F6F4FF] border-[#DADADA]'} rounded-xl px-5 py-3`}>
          <Text className={`text-black text-base`}>{item.content}</Text>
          <Text className='text-black text-xs text-right'>{time12}</Text>
        </View>
      </View>
    );
  }
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <Text className="text-gray-600">Loading chats...</Text>
      </View>
    )
  }
  return (
    <ImageBackground source={ImageIcons.BackgroundImage} className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-start px-5 pt-10 pb-4 border-b border-[#35383E]">
        <TouchableOpacity className='mr-4' onPress={() => router.canGoBack() ? router.back() : router.replace('/(protected)/(tabs)/chats')}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View>
          <Text className='text-black text-[22px] font-bold'>{note?.contact_name}</Text>
          <Text className='text-[#B0B0B0] text-sm'>{note?.goal}</Text>
        </View>
      </View>
      {/* Chat */}
      <View className="flex-1 mx-5">
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, idx) => idx.toString()}
          contentContainerStyle={{ paddingVertical: 26, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => (flatListRef.current as any)?.scrollToEnd({ animated: true })}
          onLayout={() => (flatListRef.current as any)?.scrollToEnd({ animated: true })}
        />
        <TypingIndicator isWaitingForResponse={isWaitingForResponse} />
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={isKeyboardVisible ? 0 : -80}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, margin: 16, paddingHorizontal: 12 }}>
          <TextInput
            style={{ flex: 1, color: 'black', fontSize: 16, height: 48, backgroundColor: 'white' }}
            placeholder="Type here..."
            placeholderTextColor="#888"
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={handleSend} style={{ marginLeft: 8 }}>
            <MaterialIcons name="send" size={28} color="#60646D" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};
