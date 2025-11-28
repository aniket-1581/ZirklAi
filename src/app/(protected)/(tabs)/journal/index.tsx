import {
  createWebSocketConnection,
  deleteJournalEntry,
  getEntries,
  getEntry,
  updateEntry,
  UpdateEntryRequest,
} from "@/api/journal";
import WaveAnimation from "@/components/WaveAnimation";
import GradientMicButton from "@/components/journal/GradientMicButton";
import JournalEntryModal from "@/components/journal/JournalEntryModal";
import { useAuth } from "@/context/AuthContext";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useNavigation } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { useProcessingMessages } from "@/hooks/useProcessingMessages";

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
  const [rawEntries, setRawEntries] = useState<any>({});
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { processingMessage, fadeStyle } = useProcessingMessages(isProcessing, [
    "Reflecting on what you've shared…",
    "Identifying the key themes in your voice.",
    "Extracting insights to help you grow your connections.",
    "Highlighting potential follow-ups and next steps.",
    "Turning your reflection into actionable insights.",
  ]);
  const { processingMessage: loadingMessage, fadeStyle: loadingFadeStyle } =
    useProcessingMessages(loadingEntries, [
      "Loading entries…",
      "Processing entries…",
      "Sorting entries…",
      "Loading more entries…",
      "Processing more entries…",
      "Sorting more entries…",
    ]);
  const { processingMessage: updateMessage, fadeStyle: updateFadeStyle } =
    useProcessingMessages(isUpdating, [
      "Updating entry…",
      "Processing entry…",
      "Sorting entry…",
    ]);
    const [micAmplitude, setMicAmplitude] = useState(0);

    useEffect(() => {
      let interval: any;

      if (isRecording) {
        interval = setInterval(async () => {
          const status: any = await recordingRef.current?.getStatusAsync();
          if (!status) return;

          if (typeof status.metering === "number") {
            const linear = Math.pow(10, status.metering / 20); 
            setMicAmplitude(Math.min(1, linear * 250));   // Boost slightly
          }
        }, 80);
      } else {
        interval = setInterval(() => {
          setMicAmplitude((v) => Math.max(0, v * 0.8));
        }, 100);
      }

      return () => clearInterval(interval);
    }, [isRecording]);



  // ------------------------------------------------------------------
  // LOAD ENTRIES
  // ------------------------------------------------------------------

  const loadEntries = useCallback(async () => {
    try {
      setLoadingEntries(true);
      setError(null);

      const response = await getEntries(token!);
      setRawEntries(response.entries || {});
    } catch (err) {
      console.error("Failed to load entries:", err);
      setError("Failed to load entries. Please try again.");
    } finally {
      setLoadingEntries(false);
    }
  }, [token]);

  const entries = useMemo(() => {
    if (!rawEntries) return [];

    return Object.entries(rawEntries)
      .map(([id, entry]: any) => ({
        id,
        ...entry,
      }))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [rawEntries]);

  // ------------------------------------------------------------------
  // LOAD SINGLE ENTRY (for modal)
  // ------------------------------------------------------------------

  const handleEntryPress = useCallback(
    async (entryId: string, isEditing?: boolean) => {
      try {
        const entryData = await getEntry(entryId, token!);
        setSelectedEntry({...entryData, isEditing});
        setIsModalVisible(true);
      } catch (error) {
        console.error("Error fetching entry:", error);
        Alert.alert("Error", "Failed to load journal entry");
      }
    },
    [token]
  );

  // ------------------------------------------------------------------
  // WEBSOCKET HANDLER
  // ------------------------------------------------------------------

  useEffect(() => {
    let socket: WebSocket;
    let reconnectAttempts = 0;

    const connect = async () => {
      try {
        socket = await createWebSocketConnection(token!);
        ws.current = socket;

        socket.onopen = () => {
          loadEntries();
          reconnectAttempts = 0;
        };

        socket.onmessage = (evt) => {
          const msg = evt.data?.toString().trim();

          if (!msg || (!msg.startsWith("{") && !msg.startsWith("["))) return;

          try {
            const data = JSON.parse(msg);

            if (data?.type === "processing_complete") {
              setIsProcessing(false);
              loadEntries();
            }

            if (data?.type === "journal_entry_complete") {
              loadEntries();
            }
          } catch (e: any) {
            console.warn("WS parse error", e);
          }
        };

        socket.onerror = () => {};

        socket.onclose = () => {
          if (reconnectAttempts < 5) {
            setTimeout(() => connect(), 2000);
            reconnectAttempts++;
          }
        };
      } catch (e: any) {
        console.error("WS connection failed", e);
      }
    };

    connect();

    return () => {
      ws.current?.close();
      ws.current = null;
    };
  }, [token, loadEntries]);

  // ------------------------------------------------------------------
  // RECORDING
  // ------------------------------------------------------------------

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert("Microphone permission is required.");
      }

      ws.current?.send("start");
      setIsRecording(true);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: {
          extension: ".wav",
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000
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
          linearPCMIsFloat: false
        },
        web: {
          mimeType: "audio/wav",
        },
      });

      recordingRef.current = recording;
    } catch (err) {
      console.error("Recording start failed:", err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    setIsRecording(false);
    setIsProcessing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        const base64 = await readFileAsBase64(uri);

        if (base64.length > 0) {
          ws.current?.send("data:" + base64);
          ws.current?.send("stop");
        }

        FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
      }
    } catch (err) {
      console.error("Stop recording error:", err);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    return isRecording ? stopRecording() : startRecording();
  }, [isRecording, stopRecording, startRecording]);


  const handleUpdateEntry = useCallback(
    async (entryId: string, newEntry: UpdateEntryRequest) => {
      setIsModalVisible(false);
      setIsUpdating(true);
      try {
        await updateEntry(newEntry, token!, entryId);
        await loadEntries();

        if (selectedEntry?.entry_id === entryId) {
          setSelectedEntry((p: any) => ({ ...p, ...newEntry }));
        }
      } catch (err: any) {
        Alert.alert("Error", err.message);
      } finally {
        setIsUpdating(false);
      }
    },
    [token, loadEntries, selectedEntry]
  );

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      try {
        setIsDeleting(true);
        await deleteJournalEntry(entryId, token!);
        setRawEntries((prev: any) => {
          const copy = { ...prev };
          delete copy[entryId];
          return copy;
        });
        setIsModalVisible(false);
      } catch (err: any) {
        Alert.alert("Error", err.message);
      } finally {
        setIsDeleting(false);
      }
    },
    [token]
  );

  const handleDelete = async (entryId: string) => {
      Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await handleDeleteEntry(entryId);
            } catch (error) {
              console.error("Failed to delete entry:", error);
              Alert.alert("Error", "Failed to delete entry");
            }
          },
        },
      ]);
    };

  // ------------------------------------------------------------------
  // RENDER ENTRY ITEM (memoized)
  // ------------------------------------------------------------------

  const renderEntry = useCallback(
    ({ item }: { item: any }) => {
      const formattedDate = new Date(item.timestamp).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      );

      const monthsAgo = Math.floor(
        (Date.now() - new Date(item.timestamp).getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      );

      return (
        <TouchableOpacity
          onPress={() => handleEntryPress(item.entry_id)}
          activeOpacity={0.9}
          className="bg-white/5 p-4 rounded-xl mb-3 w-full"
        >
          <View className="absolute top-3 right-3 flex-row space-x-2 z-20">
            {/* Edit */}
            <TouchableOpacity
              className="p-2 bg-white/7 rounded-md"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => handleEntryPress(item.entry_id, true)} 
            >
              <Feather name="edit-2" size={18} color="#E9D5FF" />
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              onPress={() => handleDelete(item.entry_id)}
              className="p-2 bg-white/7 rounded-md"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="delete-outline" size={20} color="#FF7777" />
            </TouchableOpacity>
          </View>
          {/* Title */}
          <View className="flex-row items-center">
            <Text className="text-white text-lg font-bold mr-2" numberOfLines={3}>
              {item.title || "Untitled"}
            </Text>
          </View>
          {/* Contact Badge */}
          <View className="flex-1 items-start">
            {item.contact_name && (
              <View className="rounded-md bg-[#1b7723] px-3 py-1">
                <Text className="text-white text-sm font-semibold">
                  {item.contact_name?.toLowerCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Date + months ago */}
          <View className="flex-row items-center mt-2">
            <MaterialIcons name="calendar-today" size={16} color="#E5E7EB" />
            <Text className="text-gray-200 text-sm ml-2">{formattedDate}</Text>
            <Text className="text-gray-200 mx-2">•</Text>
            <Text className="text-gray-200 text-sm">
              {monthsAgo} months ago
            </Text>
          </View>

          {/* Entry text */}
          <Text className="text-white mt-3 leading-6" numberOfLines={3}>
            {item.entry.trim()}
          </Text>

          {/* Tags */}
          {item.tags?.length > 0 && (
            <View className="flex-row flex-wrap mt-4">
              {item.tags.slice(0, 3).map((tag: string, index: number) => (
                <View
                  key={index}
                  className="bg-purple-700 px-3 py-1 rounded-full mr-2 mb-2"
                >
                  <Text className="text-white text-xs font-semibold">
                    #{tag}
                  </Text>
                </View>
              ))}

              {item.tags.length > 3 && (
                <View className="bg-white/20 px-3 py-1 rounded-full mb-2">
                  <Text className="text-white text-xs font-semibold">
                    +{item.tags.length - 3}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* AI Insight (fsm_summary) */}
          {item.fsm_summary && (
            <View className="bg-white/10 rounded-xl p-4 mt-4 flex-row gap-2">
              <MaterialIcons name="auto-awesome" size={16} color="#E5E7EB" />
              <Text className="text-indigo-200 text-sm">
                {item.suggested_actions[0]?.reason || item.fsm_summary}
              </Text>
            </View>
          )}

          {/* Suggested Actions */}
          {item.suggested_actions?.length > 0 && (
            <View className="mt-4">
              <View className="bg-[#db8439] px-4 py-2 rounded-lg self-start">
                <Text className="text-white font-semibold">
                  {item.suggested_actions.length} action items
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [handleEntryPress]
  );

  const handleClose = () => {
    setSelectedEntry(null);
    setIsModalVisible(false);
  }

  // ------------------------------------------------------------------
  // MAIN UI
  // ------------------------------------------------------------------

  return (
    <View className="flex-1 bg-[#3A327B] items-center justify-start">
      {/* Header */}
      <View className="flex-row gap-4 items-center justify-center w-full mt-16">
        <TouchableOpacity
          className="absolute left-5"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text className="text-white text-3xl font-semibold">Journal</Text>
      </View>

      {/* Processing */}
      {isProcessing && (
        <Animated.View style={[fadeStyle]} className="mt-8 px-6">
          <Text className="text-white text-xl text-center">
            {processingMessage || "Turning your thoughts into insights..."}
          </Text>
        </Animated.View>
      )}

      {/* Updating */}
      {isUpdating && (
        <Animated.View style={[updateFadeStyle]} className="mt-8 px-6">
          <Text className="text-white text-xl text-center">
            {updateMessage || "Updating entry..."}
          </Text>
        </Animated.View>
      )}

      {/* Entries */}
      {loadingEntries ? (
        <Animated.View style={[loadingFadeStyle]} className="mt-8 px-6">
          <Text className="text-white text-xl text-center">
            {loadingMessage || "Loading entries..."}
          </Text>
        </Animated.View>
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
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={{
            paddingBottom: 150,
            paddingHorizontal: 24,
            marginTop: 24,
          }}
          style={{ width: "100%" }}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={10}
          removeClippedSubviews
        />
      )}

      {/* Mic Button */}
      <View className="relative bottom-0 items-center w-full py-8">
        <WaveAnimation
          amplitude={micAmplitude}
          height={64}
          width={310}
        />
        <GradientMicButton isActive={isRecording} onPress={toggleRecording} />
      </View>

      {/* Modal */}
      <JournalEntryModal
        visible={isModalVisible}
        entry={selectedEntry}
        onClose={handleClose}
        handleUpdateEntry={handleUpdateEntry}
      />
    </View>
  );
};

export default JournalScreen;
