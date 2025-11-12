import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScheduleEventModal } from "@/components/journal/ScheduleEventModal";
import { useCalendar } from "@/hooks/useCalendar";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SuggestedAction {
  action: string;
  reason: string;
  confidence: number;
  subtitle: string;
  title: string;
}

interface JournalEntryModalProps {
  visible: boolean;
  entry: {
    entry_id: string;
    title: string;
    entry: string;
    timestamp: string;
    tags: string[];
    suggested_actions?: SuggestedAction[];
    contact_name?: string;
    contact_note_id?: string;
    fsm_summary?: string;
  } | null;
  onClose: () => void;
  onUpdateTitle?: (entryId: string, newTitle: string) => Promise<void>;
  onDelete?: (entryId: string) => Promise<void>;
  isDeleting?: boolean;
  startInEditMode?: boolean;
}

const JournalEntryModal = ({
  visible,
  entry,
  onClose,
  onUpdateTitle,
  onDelete,
  isDeleting,
  startInEditMode,
}: JournalEntryModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(entry?.title || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const { createDeviceEvent } = useCalendar();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{
    title: string;
  } | null>(null);
  const [scheduledActions, setScheduledActions] = useState<string[]>([]);

  const STORAGE_KEY = "scheduledActions";

  // 🔹 Load scheduled actions for this entry when modal opens
  useEffect(() => {
    if (!entry) return;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setScheduledActions(parsed[entry.entry_id] || []);
        }
      } catch (err) {
        console.error("Failed to load saved actions:", err);
      }
    })();
  }, [entry]);

  // 🔹 Save scheduled actions for this specific entry
  const saveScheduledAction = async (entryId: string, updated: string[]) => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      parsed[entryId] = updated;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (err) {
      console.error("Failed to save scheduled actions:", err);
    }
  };

  const handleSaveTitle = async () => {
    if (!entry || !onUpdateTitle || !newTitle.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      setIsUpdating(true);
      await onUpdateTitle(entry.entry_id, newTitle);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update title:", error);
      Alert.alert("Error", "Failed to update title");
    } finally {
      setIsUpdating(false);
      setNewTitle("");
    }
  };

  const handleDelete = async () => {
    if (!entry || !onDelete) return;

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
            await onDelete(entry.entry_id);
            onClose();
          } catch (error) {
            console.error("Failed to delete entry:", error);
            Alert.alert("Error", "Failed to delete entry");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (startInEditMode) {
      setIsEditing(true);
      setNewTitle(entry?.title || "");
    }
  }, [startInEditMode, entry]);

  if (!entry) return null;

  const handleOnPress = (subtitle: string, title: string) => {
    setSelectedAction({ title });
    setShowScheduleModal(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        onClose();
        setIsEditing(false);
        setNewTitle("");
      }}
      statusBarTranslucent={true}
    >
      <TouchableOpacity
        activeOpacity={1}
        className="flex-1 bg-black/50 justify-center p-5"
        onPress={() => {
          onClose();
          setIsEditing(false);
          setNewTitle("");
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="bg-[#3A327B] p-6 rounded-xl"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row justify-between gap-2 items-center mb-4">
            {isEditing ? (
              <View className="flex-1 flex-row items-center border-b border-gray-200 pb-1">
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  className="flex-1 text-xl font-bold text-[#1F2937]"
                  autoFocus
                  onSubmitEditing={handleSaveTitle}
                />
                <TouchableOpacity
                  onPress={handleSaveTitle}
                  disabled={isUpdating}
                  className="ml-2 p-1"
                >
                  <Ionicons
                    name="checkmark"
                    size={24}
                    color={isUpdating ? "#9CA3AF" : "#10B981"}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text
                  className="text-xl font-bold text-white flex-1"
                  onPress={() => setIsEditing(true)}
                >
                  {entry.title || "Untitled"}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  className="ml-2 p-1"
                >
                  <Ionicons name="pencil" size={18} color="white" />
                </TouchableOpacity>
              </>
            )}
            {onDelete && (
              <TouchableOpacity onPress={handleDelete} disabled={isDeleting}>
                <Ionicons
                  name="trash-outline"
                  size={24}
                  color={isDeleting ? "#9CA3AF" : "#EF4444"}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons
                name="close"
                size={24}
                color={isDeleting ? "#9CA3AF" : "white"}
              />
            </TouchableOpacity>
          </View>

          <Text className="text-sm text-white mb-4">
            {new Date(entry.timestamp).toLocaleString()}
          </Text>

          <ScrollView className="mb-4 max-h-[60%] bg-[#655BC5] p-2 rounded-xl">
            <Text className="text-base text-white">{entry.entry}</Text>
          </ScrollView>

          {entry.tags && entry.tags.length > 0 && (
            <View className="flex-row flex-wrap mt-2">
              {entry.tags.map((tag, index) => (
                <View
                  key={index}
                  className="bg-black/15 rounded-full px-3 py-2 mr-2 mb-2"
                >
                  <Text className="text-white text-base">#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {entry.suggested_actions && entry.suggested_actions.length > 0 && (
            <View className="mt-3">
              <Text className="text-lg font-bold text-white mb-2">
                Suggested Actions
              </Text>
              {entry.suggested_actions && entry.suggested_actions.length > 0 && (() => {
                const action = entry.suggested_actions[0]; // 👈 Show only the first action
                const isScheduled = scheduledActions.includes(action.title);

                return (
                  <View className="flex items-start justify-between mb-2">
                    {!isScheduled ? (
                      <TouchableOpacity
                        onPress={() => handleOnPress(action.subtitle, action.title)}
                        className="opacity-100"
                      >
                        <Text className="text-base text-[#655BC5] font-bold border-b-2 border-[#655BC5]">
                          Add {action.title}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="flex-row items-center opacity-60">
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={18}
                          color="#10B981"
                        />
                        <Text className="ml-1 text-base text-white">
                          Added to your Follow-Ups
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}

            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
      <ScheduleEventModal
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSelect={async ({ startDate, endDate }) => {
          if (entry && selectedAction) {
            try {
              await createDeviceEvent({
                title: `${selectedAction.title} for ${entry.contact_name}`,
                startDate,
                endDate,
                location: "Remote",
                notes: entry.entry,
                reminders: [10],
              });

              // ✅ Update scheduled actions for this entry
              const updated = [...scheduledActions, selectedAction.title];
              setScheduledActions(updated);
              await saveScheduledAction(entry.entry_id, updated);
            } catch (err) {
              console.error("Failed to create calendar event:", err);
              Alert.alert("Error", "Failed to create calendar event.");
            } finally {
              setShowScheduleModal(false);
            }
          }
        }}

      />
    </Modal>
  );
};

export default JournalEntryModal;
