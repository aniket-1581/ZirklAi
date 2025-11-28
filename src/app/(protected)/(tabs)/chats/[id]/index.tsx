import {
  chatWithLlm,
  getLoadingMessage,
  getNoteChatHistory,
  getReturningMessage,
  getWelcomeMessage,
  postNoteChatHistory,
} from "@/api/chat";
import { getNoteById } from "@/api/notes";
import ChatInput from "@/components/ChatInput";
import KeyboardLayout from "@/components/KeyboardAvoidingLayout";
import TypingIndicator from "@/components/TypingIndicator";
import { useAuth } from "@/context/AuthContext";
import { useRoundRobinAssignment } from "@/hooks/useRoundRobinAssignment";
import { ImageIcons } from "@/utils/ImageIcons";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useNavigation, useRouter, useFocusEffect } from "expo-router";
import { getGender } from "gender-detection-from-name";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Image,
  Keyboard,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChatScreen() {
  const { id, draftMessage } = useLocalSearchParams<{
    id: string;
    draftMessage?: string;
  }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState(draftMessage || "");
  const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const flatListRef = useRef<FlatList | null>(null);
  const { token, user } = useAuth();
  const [note, setNote] = useState<any>(null);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();

  const chatGender = useMemo(
    () => getGender(note?.contact_name?.split(" ")[0], "en"),
    [note?.contact_name]
  );
  const gender = getGender(user?.full_name.split(" ")[0] as string, "en");

  const femalePool = [
    ImageIcons.GirlImage,
    ImageIcons.GirlImage2,
    ImageIcons.GirlImage3,
    ImageIcons.GirlImage4,
  ];
  
  const malePool = [
    ImageIcons.BoyImage,
    ImageIcons.BoyImage2,
    ImageIcons.BoyImage3,
    ImageIcons.MenImage,
  ];
  
  const femaleRR = useRoundRobinAssignment(femalePool, "chat_avatar_female");
  const maleRR = useRoundRobinAssignment(malePool, "chat_avatar_male");
  const randomUserIcon = chatGender === 'male' ? maleRR.assign(id as string) : femaleRR.assign(id as string);

  const handleCopy = (text: string, key: string) => {
    Clipboard.setStringAsync(text);
    setCopiedStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: false }));
    }, 3000);
  };

  // Share handler
  const handleShare = (text: string) => {
    Share.share({ message: text });
  };

  const renderFormattedText = (text: string) => {
    const parts = text?.split(/(\*.*?\*)/g);
    return (
      <Text className="text-white text-base">
        {parts?.map((part, index) => {
          if (part.startsWith("*") && part.endsWith("*")) {
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
      const note = (await getNoteById(id as string, token!)) as any;
      setNote(note);
    };
    fetchNote();
  }, [id, token]);

  useEffect(() => {
    const fetchChat = async () => {
      setLoading(true);
      try {
        let chatHistory = (await getNoteChatHistory(
          id as string,
          token!
        )) as any;
        if (!chatHistory || chatHistory.messages.length === 0) {
          const welcome = (await getWelcomeMessage()) as any;
          chatHistory = [
            {
              role: "assistant",
              content: welcome.message || welcome.text || "Welcome!",
              timestamp: new Date().toISOString(),
            },
          ];
          await postNoteChatHistory(id as string, chatHistory, token!);
          setMessages(chatHistory);
        } else {
          const lastMessage =
            chatHistory.messages[chatHistory.messages.length - 1];
          // Only show a returning message if the user was the last one to speak.
          if (
            lastMessage &&
            lastMessage.type !== "loading" &&
            lastMessage.role !== "user" &&
            lastMessage.timestamp?.split("T")[0] !==
              new Date().toISOString()?.split("T")[0]
          ) {
            const returningMsg = (await getReturningMessage()) as any;
            if (returningMsg && returningMsg.message) {
              const updatedMessages = [
                ...chatHistory.messages,
                {
                  role: "assistant",
                  content: returningMsg.message,
                  timestamp: new Date().toISOString(),
                  type: "loading",
                },
              ];
              setMessages(updatedMessages);
              await postNoteChatHistory(id as string, updatedMessages, token!);
              return; // Exit after updating
            }
          }
          setMessages(chatHistory.messages);
        }
      } catch (e: any) {
        console.error("Error Fetching Chat", e);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchChat();
  }, [token, id]);

  // Keyboard events
  useEffect(() => {
      const show = Keyboard.addListener("keyboardDidShow", () =>
        setIsKeyboardVisible(true)
      );
      const hide = Keyboard.addListener("keyboardDidHide", () =>
        setIsKeyboardVisible(false)
      );
      return () => {
        show.remove();
        hide.remove();
      };
  }, []);

  useFocusEffect(
    useCallback(() => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({
        offset: 0, // inverted list => 0 means bottom
        animated: false,
        });
      });
      return () => {};
    }, [])
  );

  const handleSend = async () => {
    Keyboard.dismiss();
    if (!message.trim()) return;
    const newMessages = [
      ...messages,
      { role: "user", content: message, timestamp: new Date().toISOString() },
    ];
    setIsWaitingForResponse(true);
    setMessages(newMessages);
    setMessage("");

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
      console.warn("Loading messages fetch failed");
    }

    try {
      const ollamaRes = (await chatWithLlm(
        message,
        note?.content || "",
        id as string,
        token!
      )) as any;
      // Replace loading indicator with the actual response
      if (ollamaRes && ollamaRes.response) {
        setMessages((prev) => [
          ...prev.filter((m) => m.type !== "loading"),
          {
            role: "assistant",
            content: ollamaRes.response,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.error("Error", e);
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  useEffect(() => {
    if (draftMessage !== "") {
      handleSend();
    }
  }, [draftMessage]);

  // 🟣 CHATGPT/WHATSAPP STYLE LIST = reversed + inverted
  const reversedMessages = useMemo(
    () => [...messages].reverse(),
    [messages]
  );

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isUser = item.role === "user";

    const isAssistant = item.role === "assistant";
    const content = item.content || "";

    // --- Parsing Logic ---
    let isComplexAssistantMessage = false;
    if (isAssistant && typeof content === "string") {
      let introText = "";
      let suggestionMessages: string[] = [];
      let adviceOrTips: string[] = [];

      const coachTipRegex = item.type === "advice" ? /(?=\n\n)/g : /\n+(?=Coach Tip:)/g;
      const contentParts = content?.split(coachTipRegex);
      let mainContent = contentParts[0];
      adviceOrTips = contentParts.slice(1).map((p) => p.trim());

      const numberedListRegex = /\n+(?=\d+\.\s)/g;
      const messageGroupRegex = /(?=Message \d+:)/g;

      if (mainContent.match(messageGroupRegex)) {
        suggestionMessages = mainContent
          ?.split(messageGroupRegex)
          .filter((msg: string) => msg.trim());
        isComplexAssistantMessage = true;
      } else if (mainContent.match(numberedListRegex)) {
        const numberedListParts = mainContent?.split(numberedListRegex);
        introText = numberedListParts[0].trim();
        suggestionMessages = numberedListParts
          .slice(1)
          .map((p: string) => p.trim());
        isComplexAssistantMessage = true;
      } else {
        introText = mainContent.trim();
      }

      if (isComplexAssistantMessage || adviceOrTips.length > 0) {
        return (
          <View className={`flex-row items-start mb-4`}>
            <Image source={ImageIcons.Assistant} className="w-10 h-10 mr-2" />
            <View className="flex-col items-start mb-4">
              {introText && !!introText.trim() && (
                <View className="w-80 flex-row items-center mr-4 mb-4 bg-[#5248A0] border border-white/10  rounded-2xl px-6 py-4">
                  {renderFormattedText(introText)}
                  {/* <Text className="text-black/15 text-xs mt-2 text-right">
                  {time12}
                </Text> */}
                </View>
              )}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingRight: 16, // Add side padding to prevent clipping
                  columnGap: 10, // Consistent gap between cards
                }}
                snapToAlignment="start"
                decelerationRate="fast"
                overScrollMode="never"
              >
                {suggestionMessages.map((msg: string, idx: number) => {
                  const copyKey = `msg-${index}-${idx}`;
                  const isCopied = copiedStates[copyKey];
                  const trimmedMsg = msg.trim();
                  return (
                    <View
                      key={idx}
                      style={{
                        marginRight:
                          idx === suggestionMessages.length - 1 ? 36 : 0, // right padding for last card
                      }}
                      className="w-80 flex-row items-start mb-4 bg-[#5248A0] border border-white/10 rounded-2xl px-6 py-4"
                    >
                        <Text className={`text-white text-base mb-3`}>
                          {renderFormattedText(trimmedMsg)}
                        </Text>
                        {(trimmedMsg.includes("Message 1:") ||
                          trimmedMsg.includes("Message 2:") ||
                          trimmedMsg.includes("Message 3:")) && (
                          <View className="absolute right-2 top-2 flex-row gap-4">
                            <TouchableOpacity
                              onPress={() => handleCopy(trimmedMsg, copyKey)}
                            >
                              <MaterialIcons
                                name={isCopied ? "check" : "content-copy"}
                                size={18}
                                color={isCopied ? "#10B981" : "#9CA3AF"}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() =>
                                handleShare(
                                  trimmedMsg.split(`Message ${idx + 1}:`)[1]
                                )
                              }
                            >
                              <MaterialIcons
                                name="share"
                                size={18}
                                color="#9CA3AF"
                              />
                            </TouchableOpacity>
                          </View>
                        )}
                    </View>
                  );
                })}
              </ScrollView>
              {adviceOrTips.map((tip: string, idx: number) => {
                const trimmedTip = tip.trim();
                return (
                  <View
                    key={`tip-${idx}`}
                    className="w-full flex-row items-start mb-4"
                  >
                    <View className="w-80 flex-row items-start bg-black/15 border border-white/10 rounded-xl px-6 py-3">
                      <View style={{ flex: 1 }}>
                        {renderFormattedText(trimmedTip)}
                      </View>
                      {/* <Text className="text-black text-xs mt-2 text-right">
                      {time12}
                    </Text> */}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      }
    }

    return (
      <View
        className={`flex-row ${isUser ? "flex-row-reverse" : "flex-row"} items-start mb-4`}
      >
        {isUser ? (
          <Image
            source={gender === "male" ? ImageIcons.MaleAvatar : ImageIcons.FemaleAvatar}
            className="w-9 h-9 rounded-full ml-2"
          />
        ) : (
          <Image
            source={ImageIcons.Assistant}
            className="w-10 h-10 rounded-full mr-2"
          />
        )}
        <View
          className={`w-80 ${isUser ? "bg-[#C6BFFF]/10" : "bg-[#5248A0] border border-white/10 "} rounded-xl px-6 py-3`}
        >
          <Text className={`text-white text-base`}>{item.content}</Text>
          {/* <Text className="text-white text-xs text-right">{time12}</Text> */}
        </View>
      </View>
    );
  };
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <Text className="text-gray-600">Loading chats...</Text>
      </View>
    );
  }

  const handleGoBack = () => {
    router.push("/(protected)/(tabs)/chats");
  };

  return (
    <View className="flex-1 bg-[#3A327B]">
      <KeyboardLayout>
        {/* Header */}
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity className="mr-4" onPress={handleGoBack}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <Image
              source={randomUserIcon}
              className="w-10 h-10 rounded-full mr-2"
            />
            <Text className="text-white text-[22px] font-bold">
              {note?.contact_name || "Gargy Chattery"}
            </Text>
          </View>
        </View>
        {/* Chat */}
        <View className="flex-1 mx-5">
          <FlatList
            ref={flatListRef}
            data={reversedMessages}
            inverted
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingVertical: 26,
              paddingBottom: isKeyboardVisible ? 100 : 26,
            }}
            initialNumToRender={12}
            windowSize={10}
            removeClippedSubviews={true}
          />

          <TypingIndicator isWaitingForResponse={isWaitingForResponse} />
          {loadingMessages.length > 0 && isWaitingForResponse && (
            <View>
              {loadingMessages.map((msg, idx) => (
                <View key={`loading-${idx}`} className="mb-2 items-start">
                  <View className="bg-white border border-white/10  rounded-lg px-4 py-2">
                    <Text className="text-sm text-gray-600">{msg}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        <ChatInput
          userInput={message}
          setUserInput={setMessage}
          onTextSubmit={() => handleSend()}
          isWaitingForResponse={isWaitingForResponse}
        />
      </KeyboardLayout>
    </View>
  );
}
