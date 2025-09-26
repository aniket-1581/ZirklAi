import {
  getGlobalChatHistory,
  getLoadingMessage,
  getWelcomeMessage,
  globalChatWithLlm,
} from '@/api/global-chat';
import { useAuth } from '@/context/AuthContext';
import { Message, Option } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export function useGlobalChat() {
  const { token } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);

  const normalizeMessages = (data: any): Message[] => {
    console.log("Normalizing messages:", data);
    if (!data) {
      return [];
    }

    let messageList: any[] = [];
    if (Array.isArray(data)) {
      messageList = data;
    } else if (Array.isArray(data.conversations)) {
      messageList = data.conversations;
    } else if (Array.isArray(data.messages)) {
      messageList = data.messages;
    }

    // Ensure all items are objects with a 'content' property
    return messageList.map((item) =>
      typeof item === 'string' ? { role: 'assistant', content: item, timestamp: new Date() } : item
    );
  };

  const loadWelcomeMessage = async () => {
    try {
      await getWelcomeMessage(token as string);
    } catch (err) {
      console.error('Welcome message failed:', err);
    }
  };

  const loadHistory = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const history = await getGlobalChatHistory(token);
      console.log("Fetched history:", history);
      const normalized = normalizeMessages(history);
      if (normalized.length > 0) {
        setMessages([...normalized]);
      } else {
        await loadWelcomeMessage();
        const history = await getGlobalChatHistory(token);
        console.log("Fetched history after welcome message:", history);
        const normalized = normalizeMessages(history);
        if (normalized.length > 0) {
          setMessages(normalized);
        }
      }
    } catch (error) {
      console.error('Failed to load global chat history:', error);
      Alert.alert('Error', 'Failed to load chat.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleTextSubmit = async (text?: string) => {
    const input = text || userInput.trim();
    if (!token || !input || isWaitingForResponse) return;

    setUserInput('');
    setIsWaitingForResponse(true);

    // Optimistically add the user message
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: input,
        timestamp: new Date(),
      } as Message,
    ]);

    try {
      // Kick off transient loading messages while waiting
      (async () => {
        try {
          setLoadingMessages([]);
          const loadingResponse = await getLoadingMessage(token);
          const msgs = loadingResponse?.messages || [];
          if (Array.isArray(msgs) && msgs.length > 0) {
            for (let i = 0; i < msgs.length; i++) {
              await new Promise((res) => setTimeout(res, 1000));
              setLoadingMessages((prev) => [...prev, String(msgs[i])]);
            }
          }
        } catch {
          // Ignore loading message failures
          console.warn('Loading messages fetch failed');
        }
      })();

      await globalChatWithLlm(input, token);
      await loadHistory();
    } catch (error) {
      console.error('Global chat failed:', error);
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setIsWaitingForResponse(false);
      setLoadingMessages([]);
    }
  };

  const handleOptionSelect = async (option: string | Option) => {
    if (!token || isWaitingForResponse) return;

    const text = typeof option === 'string' ? option : (option as any).name ? (option as any).name : (option as any).title;

    // We can reuse the logic from handleTextSubmit
    await handleTextSubmit(text);
  };

  useEffect(() => {
    if (token) {
      loadHistory();
    }
  }, [token, loadHistory]);

  return {
    messages,
    userInput,
    isLoading,
    isWaitingForResponse,
    loadingMessages,
    setUserInput,
    handleTextSubmit,
    handleOptionSelect,
  };
}
