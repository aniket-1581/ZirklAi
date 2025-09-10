import {
  getGlobalChatHistory,
  getLoadingMessage,
  getWelcomeMessage,
  globalChatWithLlm,
} from '@/api/global-chat';
import { useAuth } from '@/context/AuthContext';
import { Message } from '@/types';
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
    if (!data) return [];
    if (Array.isArray(data)) return data as Message[];
    if (Array.isArray(data?.conversations)) return data.conversations as Message[];
    if (Array.isArray(data?.messages)) return data.messages as Message[];
    return [];
  };

  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const history = await getGlobalChatHistory(token);
      const normalized = normalizeMessages(history);
      if (normalized.length > 0) {
        setMessages(normalized);
      } else {
        // If no history, try welcome/returning message fallbacks
        try {
          const welcome = await getWelcomeMessage(token);
          const welcomeMsgs = normalizeMessages(welcome);
          if (welcomeMsgs.length > 0) {
            setMessages(welcomeMsgs);
          }
        } catch {}
      }
    } catch (error) {
      console.error('Failed to load global chat history:', error);
      Alert.alert('Error', 'Failed to load chat.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleTextSubmit = async () => {
    if (!token || !userInput.trim() || isWaitingForResponse) return;
    const input = userInput.trim();
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
          const loading = await getLoadingMessage(token);
          const msgs = normalizeMessages(loading) as any[];
          if (Array.isArray(msgs) && msgs.length > 0) {
            for (let i = 0; i < msgs.length; i++) {
              await new Promise((res) => setTimeout(res, 1000));
              setLoadingMessages((prev) => [...prev, (msgs[i] as any).content ?? String(msgs[i])]);
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
  };
}


