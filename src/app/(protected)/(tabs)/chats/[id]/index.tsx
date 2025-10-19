import {
  chatWithLlm,
  getLoadingMessage,
  getNoteChatHistory,
  getReturningMessage,
  getWelcomeMessage,
  postNoteChatHistory,
} from "@/api/chat";
import { getNoteById } from "@/api/notes";
import CrystalSphereButton from "@/components/CrystalSphereButton";
import KeyboardLayout from "@/components/KeyboardAvoidingLayout";
import TypingIndicator from "@/components/TypingIndicator";
import { useAuth } from "@/context/AuthContext";
import { ImageIcons } from "@/utils/ImageIcons";
import { formatUtcToIstTime } from "@/utils/date";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getGender } from "gender-detection-from-name";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const femaleUserIcon = [
  ImageIcons.GirlImage,
  ImageIcons.GirlImage2,
  ImageIcons.GirlImage3,
  ImageIcons.GirlImage4,
];
const maleUserIcon = [
  ImageIcons.BoyImage,
  ImageIcons.BoyImage2,
  ImageIcons.BoyImage3,
];

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
  const { token } = useAuth();
  const [note, setNote] = useState<any>(null);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const router = useRouter();

  const randomFemaleUserIcon = useMemo(() =>
    femaleUserIcon[Math.floor(Math.random() * femaleUserIcon.length)],
    []
  );
  const randomMaleUserIcon = useMemo(() =>
    maleUserIcon[Math.floor(Math.random() * maleUserIcon.length)],
    []
  );
  const gender = useMemo(() =>
    getGender(note?.contact_name?.split(" ")[0], "en"),
    [note?.contact_name]
  );

  const handleCopy = (text: string, key: string) => {
    Clipboard.setStringAsync(text);
    setCopiedStates((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [key]: false }));
    }, 3000);
  };

  const renderFormattedText = (text: string) => {
    const parts = text?.split(/(\*.*?\*)/g);
    return (
      <Text className="text-white text-base">
        {parts.map((part, index) => {
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

  // Keyboard handling
  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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

      const adviceSplitRegex = /\n+(?=For |Coach Tip:)/g;
      const contentParts = content?.split(adviceSplitRegex);
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
          <View className={`flex-col items-start mb-4`}>
            {introText && !!introText.trim() && (
              <View className="w-64 self-start border bg-[#F6F4FF] border-[#DADADA] rounded-xl px-5 py-3 mb-2">
                {renderFormattedText(introText)}
                {/* <Text className="text-black/15 text-xs mt-2 text-right">
                  {time12}
                </Text> */}
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Image source={ImageIcons.Assistant} className="w-10 h-10 mr-2" />
              {suggestionMessages.map((msg: string, idx: number) => {
                const copyKey = `msg-${index}-${idx}`;
                const isCopied = copiedStates[copyKey];
                const trimmedMsg = msg.trim();
                return (
                  <View
                    key={idx}
                    className="w-64 flex items-center mr-5 mb-2 border bg-[#5248A0] border-white rounded-xl px-5 py-3"
                  >
                    <View>
                      <Text className={`text-white text-base mb-3`}>
                        {renderFormattedText(trimmedMsg?.split("\n")[1])}
                      </Text>
                      {/* <Text className="text-black text-xs mt-2 text-right">
                      {time12}
                    </Text> */}
                      <TouchableOpacity
                        className="flex-row gap-2 items-center justify-center py-4 rounded-lg border-t border-gray-200"
                        onPress={() =>
                          handleCopy(trimmedMsg?.split("\n")[1], copyKey)
                        }
                      >
                        <Feather name="copy" size={24} color="white" />
                        <Text className="text-white font-semibold">
                          Copy Message
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            {adviceOrTips.map((tip: string, idx: number) => {
              const trimmedTip = tip.trim();
              return (
                <View
                  key={`tip-${idx}`}
                  className="w-full flex-row items-start mb-2 ml-12"
                >
                  <View className="w-64 flex-row items-start border bg-black/15 border-white rounded-xl px-5 py-3">
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
        );
      }
    }

    return (
      <View
        className={`flex-row ${isUser ? "flex-row-reverse" : "flex-row"} items-start mb-4`}
      >
        {isUser ? (
          <Image
            source={
              gender === "male" ? randomMaleUserIcon : randomFemaleUserIcon
            }
            className="w-9 h-9 rounded-full ml-2"
          />
        ) : (
          <Image
            source={ImageIcons.Assistant}
            className="w-10 h-10 rounded-full mr-2"
          />
        )}
        <View
          className={`w-64 ${isUser ? "bg-[#C6BFFF]/10" : "bg-black/15 border border-white"} rounded-xl px-5 py-3`}
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
  return (
    <View className="flex-1 bg-[#3A327B]">
      <KeyboardLayout>
        {/* Header */}
        <View className="flex-row items-center px-5 py-4">
          <TouchableOpacity
            className="mr-4"
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/(protected)/(tabs)/chats")
            }
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <Image
              source={gender === "male" ? randomMaleUserIcon : randomFemaleUserIcon}
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
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(_, idx) => idx.toString()}
            contentContainerStyle={{
              paddingVertical: 26,
              flexGrow: 1,
              paddingBottom: isKeyboardVisible ? 100 : 26,
            }}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              (flatListRef.current as any)?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              (flatListRef.current as any)?.scrollToEnd({ animated: true })
            }
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
        <View className="flex-row items-center bg-white rounded-full mx-4 mb-4 px-4 py-2 shadow-sm shadow-black/20">
          {/* Plus Icon */}
          <TouchableOpacity className="mr-2">
            <MaterialIcons name="add" size={22} color="#808080" />
          </TouchableOpacity>

          {/* Input Field */}
          <TextInput
            className="flex-1 text-[#333] text-base h-10"
            placeholder="Type here..."
            placeholderTextColor="#888"
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          {/* Send Icon */}
          <TouchableOpacity onPress={handleSend}>
            <MaterialIcons name="send" size={24} color="#60646D" />
          </TouchableOpacity>

          {/* Mic Icon */}
          <TouchableOpacity className="ml-2">
            <MaterialIcons name="mic" size={22} color="#60646D" />
          </TouchableOpacity>
        </View>
      </KeyboardLayout>
    </View>
  );
}
