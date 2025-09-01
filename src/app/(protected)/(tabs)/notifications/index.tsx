import { getNotifications, NotificationItem } from '@/api/notifications';
import { useAuth } from '@/context/AuthContext';
import { ImageIcons } from '@/utils/ImageIcons';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, ImageBackground, RefreshControl, Text, View } from 'react-native';

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getNotifications(token, 50, 0);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const renderEmpty = (
    <View className='flex-1 items-center justify-center py-16'>
      <MaterialIcons name="notifications-none" size={64} color="#6E9EFF" style={{ marginBottom: 16 }} />
      <Text className="text-black text-lg font-semibold mb-1">Notifications</Text>
      <Text className="text-[#999] text-base">No notifications yet.</Text>
    </View>
  );

  return (
    <View className='flex-1'>
      <ImageBackground source={ImageIcons.BackgroundImage} className="flex-1 bg-white">
        {/* Header */}
        <Image source={ImageIcons.Logo} className='w-32 h-32 mx-4' />
        <View className="px-5 pb-2">
            <Text className="text-xl font-bold text-black">Notifications</Text>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={!loading ? renderEmpty : null}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <View className='bg-white/90 rounded-xl p-4 mb-3 border border-[#e5e7eb]'>
              <Text className='text-black font-semibold text-base'>{item.title}</Text>
              <Text className='text-[#4B5563] mt-1'>{item.message}</Text>
            </View>
          )}
        />
      </ImageBackground>
    </View>
  );
}