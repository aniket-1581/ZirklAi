import { chatWithLlm, getLoadingMessage, getNoteChatHistory, getReturningMessage, getWelcomeMessage, postNoteChatHistory } from '@/api/chat';
import { getNoteById } from '@/api/notes';
import { useAuth } from '@/context/AuthContext';
import { ImageIcons } from '@/utils/ImageIcons';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export default function ChatScreen() {
  const { id, draftMessage } = useLocalSearchParams<{ id: string; draftMessage?: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState(draftMessage || '');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { token } = useAuth();
  const [note, setNote] = useState<any>(null);
  const router = useRouter();

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
          } else {
            setMessages(chatHistory.messages);
          }
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
    setMessages(newMessages);
    setMessage('');

    let loadingMsgObj = null;
    try {
      const loadingMsg = await getLoadingMessage() as any;
      let loadingText = 'Loading...';
      if (loadingMsg && Array.isArray(loadingMsg.messages) && loadingMsg.messages.length > 0) {
        loadingText = loadingMsg.messages[Math.floor(Math.random() * loadingMsg.messages.length)];
      }
      loadingMsgObj = { role: 'assistant', content: loadingText, timestamp: new Date().toISOString() };
      setMessages([...newMessages, loadingMsgObj]);
    } catch {
      loadingMsgObj = { role: 'assistant', content: 'Loading...', timestamp: new Date().toISOString() };
      setMessages([...newMessages, loadingMsgObj]);
    }

    try {
      const ollamaRes = await chatWithLlm(message, note?.content || '', id as string, token!) as any;
      if (ollamaRes && ollamaRes.response) {
        const updatedMessages = [
          ...newMessages,
          { role: 'assistant', content: ollamaRes.response, timestamp: new Date().toISOString() }
        ];
        setMessages(updatedMessages);
      }
    } catch (e) {
      console.error('Error', e);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isUser = item.role === 'user';
    const hours12 = new Date(item.timestamp).getHours() % 12 || 12;
    const ampm = new Date(item.timestamp).getHours() >= 12 ? 'PM' : 'AM';
    const time12 = `${hours12.toString().padStart(2, '0')}:${new Date(item.timestamp).getMinutes().toString().padStart(2, '0')} ${ampm}`;
  
    const isAssistant = item.role === 'assistant';
  
    // Match all occurrences of "Message X:"
    const messageMatch = item.content.match(/Message \d+:/g);
  
    const isSuggestionGroup = isAssistant && messageMatch && messageMatch.length >= 3;
  
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
                <Text className='text-black text-xs text-right'>{time12}</Text>
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
        </View>
      );
    }
  };

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
          <Text className='text-[#B0B0B0] text-sm'>{note?.goals[0]?.text}</Text>
        </View>
      </View>
      {/* Chat */}
      <View className="flex-1">
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
}
