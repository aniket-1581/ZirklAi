import { getNotes, createNote } from '@/api/notes';
import { getPhoneContacts } from '@/api/profile';
import PlanCard from '@/components/home/PlanCard';
import NewChatModal from '@/components/MobileNewChatModal';
import { useAuth } from '@/context/AuthContext';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Contact {
    id: string;
    name: string;
    phoneNumber?: string;
    email?: string;
    contact_name?: string;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default function ChatsScreen() {
  const { token } = useAuth();
  const [notesContacts, setNotesContacts] = useState<any[]>([]);
  const [phoneContacts, setPhoneContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<'inNetwork' | 'outsideNetwork'>('inNetwork');

  const fetchData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Fetch notes (In my network)
      const notes = await getNotes(token);
      setNotesContacts(notes || []);

      // Fetch phone contacts (Outside my network)
      const phoneData = await getPhoneContacts(token);
      const allPhoneContacts = phoneData?.contacts || [];

      // Filter out contacts that are already in the network
      const networkContactNames = new Set(notes?.map((note: any) => note.contact_name?.toLowerCase()) || []);
      const filteredPhoneContacts = allPhoneContacts.filter((contact: any) =>
        contact.name && !networkContactNames.has(contact.name.toLowerCase())
      );

      setPhoneContacts(filteredPhoneContacts);
    } catch (e: any) {
      console.error('Failed to fetch data', e);
      setNotesContacts([]);
      setPhoneContacts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleChatPress = (contact: any) => {
    router.push(`/(protected)/(tabs)/chats/${contact.id as string}`);
  };

  const handleSelectContact = async (contact: Contact) => {
    console.log(contact);
    try {
      setLoading(true);
      const contactData = {
        contact_id: contact.id,
        contact_name: contact.name,
        goal: ''
      }
      await createNote(token as string, [contactData]);
      await delay(2000);
      // Refresh data to move the contact from outside network to in network
      await fetchData();
      setActiveSection('inNetwork');
    } catch (err) {
      console.error('Failed to start chat:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center py-20 bg-[#3A327B]">
        <Text className="text-white">Loading Chats...</Text>
      </View>
    )
  }

  return (
    <View className='flex-1 bg-[#3A327B]'>
        {/* Header */}
        <View className='flex-row items-center justify-center px-5 pt-16'>
          <Text className='text-2xl font-medium text-white'>Chats</Text>
        </View>

        {/* Section Buttons */}
        <View className='flex-row px-5 mt-3'>
          <TouchableOpacity
            className={`flex-1 mr-2 py-3 rounded-full ${activeSection === 'inNetwork' ? 'bg-[#DAD8EF]' : 'bg-black/15'}`}
            onPress={() => setActiveSection('inNetwork')}
          >
            <Text className={`text-center font-semibold text-sm ${activeSection === 'inNetwork' ? 'text-black' : 'text-white'}`}>
              In My Network
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 ml-2 py-3 rounded-full ${activeSection === 'outsideNetwork' ? 'bg-[#DAD8EF]' : 'bg-black/15'}`}
            onPress={() => setActiveSection('outsideNetwork')}
          >
            <Text className={`text-center font-semibold text-sm ${activeSection === 'outsideNetwork' ? 'text-black' : 'text-white'}`}>
              Outside My Network
            </Text>
          </TouchableOpacity>
        </View>

        {/* In My Network Section */}
        {activeSection === 'inNetwork' && (
          <View className='flex-1 px-5 mt-8'>
            <View className='flex-row items-center justify-start mb-4'>
              <Text className='text-white/70 font-medium text-lg'>Recent Chats</Text>
            </View>
            <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
              {notesContacts.map((item, index) => (
                <TouchableOpacity onPress={() => handleChatPress(item)} key={index}>
                  <PlanCard item={item} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Outside My Network Section */}
        {activeSection === 'outsideNetwork' && (
          <View className='px-5 mt-8'>
            <View className='flex-row items-center justify-start mb-4'>
              <Text className='text-white/70 font-medium text-lg'>My Contacts</Text>
            </View>
            <FlatList
              data={phoneContacts}
              keyExtractor={(item, index) => `${item.phoneNumber}-${index}`}
              renderItem={({ item, index }) => (
                <TouchableOpacity className='bg-black/15 rounded-xl p-4 mb-3'>
                  <View className='flex-row items-center'>
                    <View className='w-12 h-12 bg-white/20 rounded-full mr-4 items-center justify-center'>
                      <Text className='text-white font-semibold text-lg'>{item.name?.charAt(0) || '?'}</Text>
                    </View>
                    <View className='flex-1'>
                      <Text className='text-white text-base font-semibold'>{item.name || 'Unknown Contact'}</Text>
                      {item.phoneNumber && (
                        <Text className='text-white/70 text-sm mt-1'>{item.phoneNumber}</Text>
                      )}
                    </View>
                    <TouchableOpacity className='bg-[#5C57A5] px-3 py-1 rounded-full' onPress={() => handleSelectContact(item)}>
                      <Text className='text-white text-xs font-medium'>Add</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={!loading ? <Text className='text-white/70 text-center'>No phone contacts found.</Text> : null}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        <TouchableOpacity
          className="absolute bottom-6 right-6 bg-[#5C57A5] w-14 h-14 rounded-full items-center justify-center shadow-lg z-10"
          onPress={() => setIsModalVisible(true)}
        >
          <AntDesign name='plus' color="white" size={24} />
        </TouchableOpacity>

        {/* Modal */}
        <NewChatModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
        />
      </View>
  );
}