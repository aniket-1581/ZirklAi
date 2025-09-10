// components/NewChatModal.tsx

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getPhoneContacts } from '@/api/profile';
import { useAuth } from '@/context/AuthContext';
import { createNote } from '@/api/notes';

interface Contact {
    id: string;
    name: string;
    phoneNumber?: string;
    email?: string;
    contact_name?: string;
}

interface NewChatModalProps {
  visible: boolean;
  onClose: () => void;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const NewChatModal: React.FC<NewChatModalProps> = ({ visible, onClose }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (visible) {
      fetchContacts();
    }
  }, [visible]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const result = await getPhoneContacts(token as string) as any;
      const contacts = result?.contacts || [];
      setContacts(contacts);
      setFilteredContacts(contacts);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const filtered = contacts.filter((c) =>
      c.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredContacts(filtered);
  };

  const handleSelectContact = async (contact: Contact) => {
    try {
        const contactData = {
            contact_id: contact.id,
            contact_name: contact.name,
            goal: ''
        }
        const newNote = await createNote(token as string, [contactData]);
        setLoading(true);
        onClose();
        delay(4000);
        router.push(`/(protected)/(tabs)/chats/${newNote.id}`);
    } catch (err) {
      console.error('Failed to start chat:', err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white p-4 rounded-t-2xl max-h-[90%]">
          <Text className="text-lg font-bold mb-3">Select Contact</Text>

          <TextInput
            className="border border-gray-300 px-3 py-2 rounded mb-3"
            placeholder="Search contacts..."
            value={search}
            onChangeText={handleSearch}
          />

          {loading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectContact(item)}
                  className="py-3 border-b border-gray-100"
                >
                  <Text className="font-medium text-base text-black">{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text className="text-sm text-gray-400 text-center mt-6">No contacts found</Text>
              }
              keyboardShouldPersistTaps="handled"
            />
          )}

          <TouchableOpacity onPress={onClose} className="mt-4 items-center">
            <Text className="text-blue-600 font-semibold">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default NewChatModal;
