import {
  getGlobalChatHistory,
  getLoadingMessage,
  getWelcomeMessage,
  globalChatWithLlm,
  getReturningMessage
} from '@/api/global-chat';
import { useAuth } from '@/context/AuthContext';
import { Message, Option } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { CalendarEventResponse, getCalendarEvents } from '@/api/calendar';

export function useGlobalChat() {
  const { token } = useAuth();
  const isFocused = useIsFocused();

  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [events, setEvents] = useState<CalendarEventResponse[]>([]);

  // Ensure we only trigger returning message once per entry (focus) session
  const hasTriggeredReturningRef = useRef(false);

  const loadEvents = useCallback(async () => {
    if (!token) return;
    try {
      const events = await getCalendarEvents(token);
      setEvents(events.calendar_events);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  }, [token]);

  const normalizeMessages = (data: any): Message[] => {
    if (!data) return [];

    let messageList: any[] = [];
    if (Array.isArray(data)) {
      messageList = data;
    } else if (Array.isArray(data.conversations)) {
      messageList = data.conversations;
    } else if (Array.isArray(data.messages)) {
      messageList = data.messages;
    }

    return messageList.map((item) =>
      typeof item === 'string' ? { role: 'assistant', content: item, timestamp: new Date() } : item
    );
  };

  const loadWelcomeMessage = useCallback(async () => {
    try {
      await getWelcomeMessage(token as string);
    } catch (err) {
      console.error('Welcome message failed:', err);
    }
  }, [token]);

  // onEnter flag decides whether to trigger returning message once
  const loadHistory = useCallback(async (onEnter: boolean = false) => {
    if (!token) return;

    setIsLoading(true); // ALWAYS show loader when entering

    try {
      // When entering screen — ALWAYS trigger returning message first
      if (onEnter) {
        try {
          await getReturningMessage(token);
        } catch (err) {
          console.warn("Returning message fetch failed:", err);
        }
      }

      // Now fetch updated history AFTER returning message is done
      const history = await getGlobalChatHistory(token);
      const normalized = normalizeMessages(history);

      if (normalized.length > 0) {
        setMessages(normalized);
      } else {
        // fallback if empty
        await loadWelcomeMessage();
        const historyAfterWelcome = await getGlobalChatHistory(token);
        setMessages(normalizeMessages(historyAfterWelcome));
      }
    } catch (error) {
      console.error("Failed to load zirkl assistant history:", error);
      Alert.alert("Error", "Failed to load chat.");
    } finally {
      setIsLoading(false); 
    }
  }, [token, loadWelcomeMessage]);


  const handleTextSubmit = async (text?: string) => {
    Keyboard.dismiss();
    const input = text || userInput.trim();
    if (!token || !input || isWaitingForResponse) return;

    setUserInput('');
    setIsWaitingForResponse(true);

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: input,
        timestamp: new Date(),
      } as Message,
    ]);

    try {
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
          console.warn('Loading messages fetch failed');
        }
      })();

      await globalChatWithLlm(input, token);
      await loadHistory(); // not onEnter
    } catch (error) {
      console.error('Zirkl Assistant failed:', error);
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setIsWaitingForResponse(false);
      setLoadingMessages([]);
    }
  };

  const handleOptionSelect = async (option: string | Option) => {
    if (!token || isWaitingForResponse) return;

    const text = typeof option === 'string' ? option : (option as any).name ? (option as any).name : (option as any).title;
    await handleTextSubmit(text);
  };

  // Trigger on focus so re-entering the chat runs the returning check
  useEffect(() => {
    if (isFocused && token) {

      // 1️⃣ Clear UI immediately (prevents stale messages from flashing)
      setMessages([]);
      setIsLoading(true);

      // 2️⃣ Reset returning flag
      hasTriggeredReturningRef.current = false;

      // 3️⃣ Load everything AFTER clearing UI
      (async () => {
        await loadHistory(true);   // returning message included
        await loadEvents();
      })();
    }

    return () => {
      hasTriggeredReturningRef.current = false;
    };
  }, [isFocused, token]);


  return {
    messages,
    userInput,
    isLoading,
    isWaitingForResponse,
    loadingMessages,
    setUserInput,
    handleTextSubmit,
    handleOptionSelect,
    loadHistory,
    events
  };
}