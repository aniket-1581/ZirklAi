import { UpdateEntryRequest } from "@/api/journal";
import { ScheduleEventModal } from "@/components/journal/ScheduleEventModal";
import { useCalendar } from "@/hooks/useCalendar";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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
    isEditing?: boolean;
  } | null;
  onClose: () => void;
  handleUpdateEntry: (entryId: string, newEntry: UpdateEntryRequest) => void;
}

const JournalEntryModal = ({
  visible,
  entry,
  onClose,
  handleUpdateEntry,
}: JournalEntryModalProps) => {
  const { createDeviceEvent } = useCalendar();

  const isEditing = entry?.isEditing ?? false;

  // Editable fields
  const [title, setTitle] = useState(entry?.title || "");
  const [notes, setNotes] = useState(entry?.entry || "");
  const [contact, setContact] = useState(entry?.contact_name || "");
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [original, setOriginal] = useState({
    title: "",
    notes: "",
    contact: "",
    tags: [] as string[],
  });


  // Suggested actions
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{
    title: string;
  } | null>(null);
  const [scheduledActions, setScheduledActions] = useState<string[]>([]);
  const STORAGE_KEY = "scheduledActions";

  useEffect(() => {
    if (!entry) return;

    setTitle(entry.title);
    setNotes(entry.entry);
    setContact(entry.contact_name || "");
    setTags(entry.tags || []);
    setOriginal({
      title: entry.title,
      notes: entry.entry,
      contact: entry.contact_name || "",
      tags: entry.tags || [],
    });
  }, [entry]);


  // Load scheduled actions
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

    // Load form fields fresh
    setTitle(entry.title);
    setNotes(entry.entry);
    setContact(entry.contact_name || "");
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

  const openScheduling = (subtitle: string, title: string) => {
    setSelectedAction({ title });
    setShowScheduleModal(true);
  };

  const handleSave = () => {
    const updatePayload: UpdateEntryRequest = {};

    if (original.notes !== notes) updatePayload.entry = notes;
    if (original.title !== title) updatePayload.title = title;
    if (original.contact !== contact) updatePayload.contact_name = contact;
    if (JSON.stringify(original.tags) !== JSON.stringify(tags)) {
      updatePayload.tags = tags;
    }

    // If nothing changed → close
    if (Object.keys(updatePayload).length === 0) {
      onClose();
      return;
    }

    // Otherwise update
    handleUpdateEntry(entry?.entry_id as string, updatePayload);

    onClose();
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };




  const formattedDate = new Date(entry?.timestamp as string).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }
  );

  const hasChanges =
    original.notes !== notes ||
    original.title !== title ||
    original.contact !== contact ||
    JSON.stringify(original.tags) !== JSON.stringify(tags);


  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/50"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Background tap to close */}
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal surface */}
        <View className="bg-[#2A1F63] w-full rounded-t-3xl p-6 max-h-[85%]">
          {/* Header */}
          <View className={`flex-row justify-between items-center ${isEditing ? "mb-8" : ""}`}>
            <View className="flex-row justify-between items-center">
              {/* Title */}
              {isEditing ? (
                <TextInput
                  value={title === "Untitled" ? "Title" : title}
                  onChangeText={setTitle}
                  placeholder="Title"
                  placeholderTextColor="#aaa"
                  className={`border-none text-white/70 text-2xl leading-tight`}
                />
              ) : (
                <Text className="text-white text-2xl font-semibold">
                  {entry?.title}
                </Text>
              )}
            </View>
            {/* Close button */}
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Timestamp */}
            {!isEditing && (
              <Text className="text-white/60 text-sm mb-4">{formattedDate}</Text>
            )}

            {/* Contact */}
            <View className="flex-row items-center mb-2 gap-2">
              <Feather name="user" size={18} color="#FF7777" />
              <Text className="text-white/70 text-lg font-medium">Contact</Text>
            </View>
                <TextInput
                  editable={isEditing}
                  value={contact}
                  onChangeText={setContact}
                  placeholder="Contact name"
                  placeholderTextColor="#aaa"
                  className="w-full bg-white/10 rounded-xl px-4 text-white text-lg leading-tight mb-4 py-3"
                />

            {/* Notes */}
            <View className="flex-row items-center mb-2 gap-2">
              <Feather name="book-open" size={18} color="#FF7777" />
              <Text className="text-white/70 text-lg font-medium">Your Notes</Text>
            </View>
            <View className="bg-white/10 rounded-2xl p-4 mb-6 min-h-[120px]">
              <TextInput
                multiline
                editable={isEditing}
                value={notes}
                onChangeText={setNotes}
                placeholder="Write your notes..."
                placeholderTextColor="#bbb"
                className="text-white text-lg leading-6 text-start"
              />
            </View>

            {/* TAGS */}
            {entry && entry?.tags?.length > 0 && (
              <View>
                <View className="flex-row items-center mb-2 gap-2">
                  <Feather name="tag" size={18} color="#FF7777" />
                  <Text className="text-white/70 text-lg font-medium">Tags</Text>
                </View>
                <View className="flex-row flex-wrap mb-4">
                  {tags.map((tag, index) => (
                    <View
                      key={index}
                      className="flex-row items-center bg-white/10 rounded-lg px-3 py-1 mr-2 mb-2"
                    >
                      <Text className="text-white text-base">#{tag}</Text>
                      {isEditing && (
                        <Ionicons name="close" size={16} color="white" onPress={() => removeTag(index)} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Suggested Actions */}
            {entry &&
              entry?.suggested_actions &&
              entry?.suggested_actions?.length > 0 && !isEditing && (
                <View className="bg-black/15 rounded-xl p-4 mt-4">
                  <View className="flex-row justify-start gap-2 items-center mb-2">
                    <Ionicons name="alert-circle-outline" size={18} color="#FF7777" />
                    <Text className="text-white text-lg font-semibold">
                      Suggested Actions
                    </Text>
                  </View>

                  {(() => {
                    const action = entry.suggested_actions[0];
                    const isScheduled = scheduledActions.includes(action.title);

                    return (
                      <View>
                        {!isScheduled ? (
                          <TouchableOpacity
                            onPress={() =>
                              openScheduling(action.subtitle, action.title)
                            }
                          >
                            <Text className="text-[#A78BFA] font-semibold">
                              Add {action.title}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View className="flex-row items-center opacity-80">
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={18}
                              color="#10B981"
                            />
                            <Text className="ml-2 text-white">
                              Added to your Follow-Ups
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })()}
                </View>
              )}
          </ScrollView>

          {isEditing && (
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="flex-1 bg-white/15 rounded-xl py-3 mr-3"
                onPress={onClose}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-[#8B5CF6] rounded-xl py-3 ml-3"
                onPress={handleSave}
                disabled={!hasChanges}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Scheduling Modal */}
      <ScheduleEventModal
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSelect={async ({ startDate, endDate }) => {
          try {
            await createDeviceEvent({
              title: `${selectedAction?.title} for ${entry?.contact_name}`,
              startDate,
              endDate,
              location: "Remote",
              notes: entry?.entry,
              reminders: [10],
            });

            const updated = [...scheduledActions, selectedAction!.title];
            setScheduledActions(updated);
            await saveScheduledAction(entry?.entry_id as string, updated);
          } catch (err) {
            console.error("Calendar Event Error:", err);
            Alert.alert("Error", "Failed to create calendar event.");
          } finally {
            setShowScheduleModal(false);
          }
        }}
      />
    </Modal>
  );
};

export default JournalEntryModal;
