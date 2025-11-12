import { createNote, getNotes } from "@/api/notes";
import {
  getPhoneContacts,
  getStepData,
  setContactSync,
  setPhoneContacts,
} from "@/api/profile";
import ContactSelector from "@/components/ContactSelector";
import SuccessPopup from "@/components/SuccessPopup";
import { useAuth } from "@/context/AuthContext";
import { useContactSync } from "@/hooks/useContactSync";
import { Contact } from "@/types";
import ContactSyncService from "@/utils/ContactSyncService";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

// Utility for delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default function ContactSync() {
  const { profileSetupStatus, token, getProfileSetupStatus } = useAuth();
  const { syncContacts, refreshContacts } = useContactSync();
  const [stepData, setStepData] = useState<{
    google: boolean;
    linkedin: boolean;
    phone: boolean;
  }>({
    google: false,
    linkedin: false,
    phone: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncedContactsCount, setSyncedContactsCount] = useState<number>(0);
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedContacts, setSavedContacts] = useState<Contact[]>([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    const fetchStepData = async () => {
      try {
        const res = await getStepData(token!, profileSetupStatus?.next_step as number);
        setStepData(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStepData();
  }, [profileSetupStatus, token]);

  const loadSavedContacts = async () => {
    if (!token) return;
    try {
      const contactsData = (await getPhoneContacts(token)) as any;
      const contacts = contactsData?.contacts || [];
      setSavedContacts(contacts);
    } catch (error) {
      console.error("Failed to load saved contacts:", error);
      setSavedContacts([]);
    }
  };

  const loadNotes = async () => {
    if (!token) return;
    try {
      const res = await getNotes(token);
      const fetchedNotes = res || [];
      setNotes(fetchedNotes);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      setNotes([]);
    }
  };

  const handleContactSync = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // Wait for contact sync to complete and get the result
      const success = await syncContacts();

      // Wait a bit for state to update, then refresh contacts to get the latest data
      await delay(500);
      await refreshContacts();

      // Get the current contacts after sync
      const currentContacts = await ContactSyncService.getStoredContacts();

      if (success && currentContacts.length > 0) {
        const formatted = currentContacts.map((c) => ({
          name: c.name,
          phoneNumber: c.phoneNumber,
          email: c.emails,
        }));

        await setPhoneContacts(token, formatted);

        setSyncedContactsCount(currentContacts.length);
        setShowSuccessPopup(true);

        await delay(2000);
        await loadSavedContacts();
        setShowSuccessPopup(false);
      } else {
        Toast.show({
          type: "error",
          text1:
            "No contacts synced. Please check your contacts permission and try again.",
        });
      }
    } catch (error) {
      console.error("Contact sync error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to sync contacts. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setStepData({
        google: false,
        linkedin: false,
        phone: true,
      });
    }
  };

  const handleNext = async () => {
    if (!token) return;
    setIsWaitingForResponse(true);
    try {
      const selected = (savedContacts || [])
        .filter((c) => selectedContacts.includes(c.name))
        .map((c) => ({
          contact_id: c.id,
          contact_name: c.name,
          goals: "",
        }))
        .filter((c) => c.contact_name && c.contact_name !== "Unknown Contact");

      if (selected.length === 0) {
        Toast.show({
          type: "error",
          text1: "No valid contacts selected.",
        });
        return;
      }
      await createNote(token, selected);

      await delay(1000);
      await loadNotes();
      const res = await setContactSync(token!, stepData);
      if (res) {
        await getProfileSetupStatus();
      }
    } catch (error) {
      console.error("Contact sync error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to sync contacts. Please try again.",
      });
    }
  };

  const toggleContactSelection = (contactName: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactName)
        ? prev.filter((name) => name !== contactName)
        : [...prev, contactName]
    );
  };

  const handleContactSelection = async () => {
      setShowContactSelector(false);
  };

  useEffect(() => {
    if (token) {
      loadSavedContacts();
      loadNotes();
    }
  }, [token]);

  return (
    <View className="flex-1 bg-[#3A327B]">
      <View className="flex-1 pt-24 px-6">
        {/* Header */}
        <Text className="text-white text-2xl font-bold text-center mb-2">
          Your VIP Connections
        </Text>
        <Text className="w-2/3 mx-auto text-[#C7C2ED] text-base text-center mb-8">
          Who should we never let you lose touch with?
        </Text>

        <ScrollView 
            className="flex"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
        >
            <View className="flex gap-5 bg-black/15 rounded-md px-5 py-8">
                <Text className="text-white text-xl font-normal text-center">
                    Add 5 People who matter {`\n`}most to you
                </Text>
                <TouchableOpacity
                    onPress={() => setShowContactSelector(true)}
                    activeOpacity={0.9}
                    className="bg-white rounded-full py-4"
                >
                    <Text className="text-[#232323] text-center font-semibold text-base">
                    + Add People
                    </Text>
                </TouchableOpacity>
                {selectedContacts?.length > 0 && (
                    <View>
                      <Text className="text-[#C7C2ED] mb-2 font-medium">
                          Your Added Contacts
                      </Text>
                      {selectedContacts.map((contact, index) => (
                          <View
                          key={index}
                          className="bg-[#c6bfff]/10 border border-white/10 rounded-xl p-4 mt-3"
                          >
                          <Text className="text-white font-semibold text-lg mb-1">
                              {contact}
                          </Text>
                          </View>
                      ))}
                    </View>
                )}
                {!stepData?.phone && (
                    <TouchableOpacity
                    onPress={handleContactSync}
                    activeOpacity={0.9}
                    className="bg-[#c6bfff]/10 rounded-full py-4 mt-3"
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#60A5FA" />
                        ) : (
                            <Text className="text-white text-center font-semibold text-base">
                                Import from Phone
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
      </View>
      {stepData?.phone && (
        <View className="px-6 pb-10">
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.9}
            className="bg-[#C7C2ED] rounded-full py-4"
          >
            <Text className="text-[#3A327B] text-center font-semibold text-base">
              Next
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showSuccessPopup && (
        <SuccessPopup
          syncedContactsCount={syncedContactsCount}
          onClose={() => setShowSuccessPopup(false)}
        />
      )}

      <ContactSelector
        showContactSelector={showContactSelector}
        selectedContacts={selectedContacts}
        searchQuery={searchQuery}
        savedContacts={savedContacts}
        isWaitingForResponse={isWaitingForResponse}
        onClose={() => setShowContactSelector(false)}
        onSearchChange={setSearchQuery}
        onContactToggle={toggleContactSelection}
        onDone={handleContactSelection}
        onContactSync={handleContactSync}
      />
    </View>
  );
}
