import {
  createWebSocketConnection,
  deleteJournalEntry,
  getEntries,
  getEntry,
  JournalEntryResponse,
  updateEntryTitle
} from "@/api/journal";
import WaveAnimation from "@/components/WaveAnimation";
import GradientMicButton from "@/components/journal/GradientMicButton";
import JournalEntryModal from "@/components/journal/JournalEntryModal";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

async function readFileAsBase64(uri: string): Promise<string> {
  try {
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return content;
  } catch (err) {
    console.error("Failed to read file as Base64:", err);
    return "";
  }
}

const JournalScreen = () => {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [entries, setEntries] = useState<JournalEntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);

  // Animated values
  const fade = useSharedValue(1);
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));

  const coachingMessages = [
    "Reflecting on what you’ve shared…",
    "Identifying the key themes in your voice.",
    "Extracting insights to help you grow your connections.",
    "Highlighting potential follow-ups and next steps.",
    "Turning your reflection into actionable insights.",
  ];

  useEffect(() => {
    if (isProcessing) {
      let i = 0;
      setProcessingMessage(coachingMessages[i]);

      // animate opacity and change text
      const interval = setInterval(() => {
        fade.value = 0;
        setTimeout(() => {
          i = (i + 1) % coachingMessages.length;
          setProcessingMessage(coachingMessages[i]);
          fade.value = withTiming(1, { duration: 600 });
        }, 400);
      }, 3500);

      // continuous pulsing animation
      fade.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1500, easing: Easing.ease }),
          withTiming(1, { duration: 1500, easing: Easing.ease })
        ),
        -1,
        true
      );

      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  // Add this handler function
  const handleEntryPress = async (entryId: string) => {
    try {
      const entryData = await getEntry(entryId, token!);
      setSelectedEntry(entryData);
      setIsModalVisible(true);
    } catch (error) {
      console.error("Error fetching entry:", error);
      Alert.alert("Error", "Failed to load journal entry");
    }
  };

  // Load entries from API
  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getEntries(token!);
      // Convert the entries object into an array of entries
      const entriesArray = Object.entries(response.entries || {}).map(
        ([id, entry]) => ({
          id,
          ...entry,
        })
      );
      // Sort by timestamp in descending order (newest first)
      const sortedEntries = entriesArray.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setEntries(sortedEntries);
    } catch (err) {
      console.error("Failed to load entries:", err);
      setError("Failed to load entries. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // 🧩 Connect to WebSocket
  useEffect(() => {
    let socket: WebSocket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000; // 3 seconds

    const connectWebSocket = async () => {
      try {
        if (socket) {
          socket.close();
        }

        socket = await createWebSocketConnection(token!);
        ws.current = socket;
        reconnectAttempts = 0;

        socket.onopen = () => {
          console.log("✅ WebSocket connected");
          loadEntries();
        };

        socket.onmessage = (event) => {
          
          // Handle non-JSON messages (like "Recording started")
          if (typeof event.data === 'string' && !event.data.trim().startsWith('{') && !event.data.trim().startsWith('[')) {
            return;
          }

          try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            
            if (data?.type === 'processing_complete') {
              setIsProcessing(false);
              loadEntries();
            } else if (data?.type === 'processing') {
              setProcessingMessage(data.message || "Processing your recording...");
            } else if (data?.type === 'journal_entry_complete') {
              // For other messages, still load entries but don't affect processing state
              loadEntries();
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
            // Still try to load entries even if there was a parsing error
            loadEntries();
          }
        };

        socket.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        socket.onclose = () => {
          console.log("❌ WebSocket closed");
          if (reconnectAttempts < maxReconnectAttempts) {
            const delay = reconnectDelay * Math.pow(2, reconnectAttempts);
            console.log(
              `Attempting to reconnect in ${delay / 1000} seconds...`
            );
            setTimeout(connectWebSocket, delay);
            reconnectAttempts++;
          } else {
            setError("Connection lost. Please refresh the page to reconnect.");
          }
        };
      } catch (error) {
        console.error("WebSocket connection error:", error);
        // Try to reconnect after a delay
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(connectWebSocket, reconnectDelay);
          reconnectAttempts++;
        } else {
          setError(
            "Failed to connect to server. Please check your connection and try again."
          );
        }
      }
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [token, loadEntries]);

  // 🎙️ Start recording (WAV format)
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert("Microphone permission is required.");
      }

      ws.current?.send("start");

      console.log("Starting WAV recording...");
      setIsRecording(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // ✅ WAV output on Android; PCM on iOS (convertible)
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: ".wav",
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/wav",
        },
      });

      recordingRef.current = recording;

      // Show recording indicator
      console.log("🎤 Recording started...");
    } catch (err) {
      console.error("Recording start failed:", err);
      Alert.alert("Error", "Failed to start recording.");
    }
  };

  // ⏹️ Stop recording and send audio data
  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      console.log("⏹️ Stopping recording...");
      setIsRecording(false);
      setIsProcessing(true);

      // Stop the recording
      await recordingRef.current.stopAndUnloadAsync();

      // Get the recorded file URI
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri && ws.current) {
        console.log("📤 Sending audio data...");
        const fileBase64 = await readFileAsBase64(uri);

        if (fileBase64.length > 0) {
          console.log(
            `📡 Sending audio (${(fileBase64.length / 1024).toFixed(1)} KB)`
          );
          ws.current.send("data:" + fileBase64);

          // Send stop signal after the data is sent
          ws.current.send("stop");

          // Clear the recorded file
          try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
          } catch (err) {
            console.warn("Failed to delete temp audio file:", err);
          }
        }
      }
    } catch (err) {
      console.error("Stop recording error:", err);
      Alert.alert("Error", "Failed to process recording.");
    }
  };

  // 🎛️ Toggle
  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleUpdateTitle = async (entryId: string, newTitle: string) => {
    try {
      await updateEntryTitle(entryId, newTitle, token!);

      // Update the local state to reflect the change
      setEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.id === entryId ? { ...entry, title: newTitle } : entry
        )
      );

      // Also update the selected entry if it's the one being edited
      if (selectedEntry?.entry_id === entryId) {
        setSelectedEntry((prev: any) => ({ ...prev, title: newTitle }));
      }
    } catch (error) {
      console.error("Error updating title:", error);
      throw error; // This will be caught in the modal
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      setIsDeleting(true);
      await deleteJournalEntry(entryId, token!);
      setEntries(prev => prev.filter(e => e.id !== entryId));
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error deleting entry:', error);
      Alert.alert('Error', 'Failed to delete entry');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#3A327B] items-center justify-start">
      <View className="flex-row gap-4 items-center justify-center w-full mt-16">
        <TouchableOpacity className="absolute left-5" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-3xl font-semibold">Journal</Text>
      </View>
      {/* Journal Entries */}
      <ScrollView
        className="flex-1 w-full mt-6 px-5"
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {isProcessing && (
          <View className="flex-1 items-center justify-center py-10 px-8">
            <Animated.View style={[fadeStyle]}>
              <Text className="text-white text-xl font-semibold text-center">
                {processingMessage || "Turning your thoughts into insights..."}
              </Text>
            </Animated.View>
          </View>
        )}
        {isLoading && entries.length === 0 ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : error ? (
          <View className="items-center justify-center py-10 px-4">
            <Text className="text-red-400 text-center mb-4">{error}</Text>
            <TouchableOpacity
              onPress={loadEntries}
              className="bg-white/10 px-6 py-3 rounded-lg"
            >
              <Text className="text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : entries.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Ionicons name="mic" size={48} color="#ffffff60" />
            <Text className="text-white/60 text-center mt-4 text-lg">
              No journal entries yet.
            </Text>
            <Text className="text-white/50 text-center mt-1">
              Tap the mic to record your first entry.
            </Text>
          </View>
        ) : (
          entries.map((entry, idx) => (
            <TouchableOpacity
              onPress={() => handleEntryPress(entry.id!)}
              key={idx}
              className="bg-white/5 p-4 rounded-xl mb-3"
            >
              <Text className="text-white text-lg font-semibold">
                {entry.title}
              </Text>
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-white/80 text-sm">
                  {formatDate(entry.timestamp || new Date().toISOString())}
                </Text>
                {entry.tags && entry.tags.length > 0 && (
                  <View className="flex-row flex-wrap">
                    {entry.tags
                      .slice(0, 2)
                      .map((tag: string, tagIdx: number) => (
                        <View
                          key={`${tag}-${tagIdx}`}
                          className="bg-purple-600/30 px-2 py-1 rounded-full ml-1"
                        >
                          <Text className="text-purple-300 text-xs">{tag}</Text>
                        </View>
                      ))}
                    {entry.tags.length > 2 && (
                      <View className="bg-gray-600/30 px-2 py-1 rounded-full ml-1">
                        <Text className="text-gray-300 text-xs">
                          +{entry.tags.length - 2}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <Text className="text-white/90">{entry.entry.slice(0, 50)}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Mic Button */}
      <View className="relative items-center w-full py-8">
        <WaveAnimation height={64} width={292} isActive={isRecording} />
        <GradientMicButton isActive={isRecording} onPress={toggleRecording} />
        <Text className="text-white/80 text-center mt-2 text-sm">
          {isRecording ? "Listening..." : "Hold to record"}
        </Text>
      </View>
      <JournalEntryModal
        visible={isModalVisible}
        entry={selectedEntry}
        onClose={() => setIsModalVisible(false)}
        onUpdateTitle={handleUpdateTitle}
        onDelete={handleDeleteEntry}
        isDeleting={isDeleting}
      />
    </View>
  );
};

export default JournalScreen;
