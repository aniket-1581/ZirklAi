import { getNotes } from '@/api/notes';
import NewChatModal from '@/components/MobileNewChatModal';
import { useAuth } from '@/context/AuthContext';
import { ImageIcons } from '@/utils/ImageIcons';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, ImageBackground, Text, TouchableOpacity, View } from 'react-native';

const avatarColors = ['bg-[#E1E1E1]', 'bg-[#D6DDB2]', 'bg-[#B7D9F7]', 'bg-[#F7B7D9]', 'bg-[#B7EFC8]'];

export default function ChatsScreen() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const notes = await getNotes(token!) as any[];
      setContacts(notes);
    } catch (e: any) {
      console.error('Failed to fetch Chats', e)
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [fetchNotes])
  );

  const handleChatPress = (contact: any) => {
    router.push(`/(protected)/(tabs)/chats/${contact.id as string}`);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center py-20">
        <Text className="text-gray-600">Loading Chats...</Text>
      </View>
    )
  }

  return (
    <View className='flex-1'>
      <ImageBackground source={ImageIcons.BackgroundImage} className='flex-1 bg-white'>
        {/* Header */}
        <Text className='text-[22px] font-semibold border-b border-gray-200 p-5 mt-8'>Chats</Text>
        {loading && (
          <View style={{ position: 'absolute', zIndex: 9999, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        {/* Contacts List */}
        <View className='flex-1 bg-white rounded-t-2xl px-5 mt-3'>
          <FlatList
            data={contacts}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => handleChatPress(item)} className='flex-row items-center py-6 px-5 border-b border-gray-200'>
                <View className={`w-8 h-8 rounded-full ${avatarColors[index]} mr-4`} />
                <View className='flex-1'>
                  <Text className='text-black text-base font-semibold'>{item.contact_name}</Text>
                  {item.profession && (
                    <Text className='text-[#B0B0B0] text-sm mt-1'>{item.profession}</Text>
                  )}
                </View>
                <MaterialIcons name="chat-bubble" size={20} color="#B0B0B0" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={!loading ? <Text className='text-[#B0B0B0] text-center mt-10'>No contacts found.</Text> : null}
            showsVerticalScrollIndicator={false}
          />
        </View>
        <TouchableOpacity
          className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg z-10"
          onPress={() => setIsModalVisible(true)}
        >
          <AntDesign name='plus' color="white" size={24} />
        </TouchableOpacity>

        {/* Modal */}
        <NewChatModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
        />
      </ImageBackground>
    </View>
  );
} 