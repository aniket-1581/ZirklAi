import { getNotifications, NotificationItem, nudgeAction, deleteNotification } from "@/api/notifications";
import { useAuth } from "@/context/AuthContext";
import { formatUtcToIstTime } from "@/utils/date";
import { ImageIcons } from "@/utils/ImageIcons";
import { notificationStorage, ArchivedNotification } from "@/utils/notificationStorage";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  SectionList,
  Image,
  ImageBackground,
  RefreshControl,
  Text,
  View,
  TouchableOpacity,
  PanResponder,
  Animated
} from "react-native";
import Toast from "react-native-toast-message";
export default function NotificationsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [archivedItems, setArchivedItems] = useState<ArchivedNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>([]);
  const router = useRouter();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getNotifications(token, 50, 0);
      const notifications = Array.isArray(data) ? data : [];

      // Sort notifications by created_at (newest first)
      const sortedNotifications = notifications.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
      });

      setAllNotifications(sortedNotifications);
    } catch {
      setAllNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Filter notifications based on archived items when either changes
  useEffect(() => {
    if (allNotifications.length > 0) {
      const archivedIds = new Set(archivedItems.map(item => item._id));
      const activeNotifications = allNotifications.filter((notification: NotificationItem) => !archivedIds.has(notification._id));
      setItems(activeNotifications);
    }
  }, [allNotifications, archivedItems]);

  const loadArchived = useCallback(async () => {
    const archived = await notificationStorage.getArchivedNotifications();
    setArchivedItems(archived);
  }, []);

  // Refetch data when screen comes into focus (tab is selected)
  useFocusEffect(
    useCallback(() => {
      console.log("Notifications screen focused - refetching data");
      load(); // Refetch notifications when tab is selected
      loadArchived(); // Load archived notifications
    }, [load, loadArchived])
  );

  const handleNudgeAction = async (notificationId: string) => {
    if (!token) return;
    try {
      const res = await nudgeAction(token, notificationId);
      if(res.success){
        router.push('/(protected)/(tabs)/home');
      }
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  }

  const archiveNotification = async (notification: NotificationItem) => {
    try {
      await notificationStorage.archiveNotification(notification);
      await loadArchived(); // Refresh archived list
      load(); // Refresh active list
    } catch (error) {
      console.error('Failed to archive notification:', error);
    }
  }

  const unarchiveNotification = async (notificationId: string) => {
    try {
      await notificationStorage.unarchiveNotification(notificationId);
      await loadArchived(); // Refresh archived list
      load(); // Refresh active list
    } catch (error) {
      console.error('Failed to unarchive notification:', error);
    }
  }

  const currentItems = showArchived ? archivedItems : items;

  // Group notifications by date
  const groupNotificationsByDate = (notifications: (NotificationItem | ArchivedNotification)[]) => {
    const groups: { [key: string]: (NotificationItem | ArchivedNotification)[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.created_at || '');
      const dateKey = notificationDate.toDateString();

      // Check if it's today
      if (notificationDate.toDateString() === today.toDateString()) {
        if (!groups['Today']) groups['Today'] = [];
        groups['Today'].push(notification);
      }
      // Check if it's yesterday
      else if (notificationDate.toDateString() === yesterday.toDateString()) {
        if (!groups['Yesterday']) groups['Yesterday'] = [];
        groups['Yesterday'].push(notification);
      }
      // Older dates - use the actual date
      else {
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(notification);
      }
    });

    // Convert to sections array and sort by date (newest first)
    return Object.entries(groups)
      .map(([title, data]) => ({ title, data }))
      .sort((a, b) => {
        if (a.title === 'Today') return -1;
        if (b.title === 'Today') return 1;
        if (a.title === 'Yesterday') return -1;
        if (b.title === 'Yesterday') return 1;
        return new Date(b.title).getTime() - new Date(a.title).getTime();
      });
  };

  const sections = groupNotificationsByDate(currentItems);

  const renderSectionHeader = ({ section }: any) => (
    <View className="px-5 py-2 bg-gray-50">
      <Text className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
        {section.title}
      </Text>
    </View>
  );

  const renderEmpty = (
    <View className="flex-1 items-center justify-center py-16">
      <MaterialIcons
        name={showArchived ? "archive" : "notifications-none"}
        size={64}
        color="#6E9EFF"
        style={{ marginBottom: 16 }}
      />
      <Text className="text-black text-lg font-semibold mb-1">
        {showArchived ? "Archived Notifications" : "Notifications"}
      </Text>
      <Text className="text-[#999] text-base">
        {showArchived ? "No archived notifications yet." : "No notifications yet."}
      </Text>
    </View>
  );

  const SwipeableNotificationItem = ({ item }: { item: NotificationItem | ArchivedNotification }) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const [showMenu, setShowMenu] = useState(false);

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (e, gestureState) => {
          if (Math.abs(gestureState.dx) > 20) {
            pan.setValue({ x: gestureState.dx, y: 0 });
          }
        },
        onPanResponderRelease: (e, gestureState) => {
          if (gestureState.dx > 100) {
            // Swipe right - archive
            if (!showArchived && 'archived_at' in item === false) {
              archiveNotification(item as NotificationItem);
            }
          } else if (gestureState.dx < -100) {
            // Swipe left - archive
            if (!showArchived && 'archived_at' in item === false) {
              archiveNotification(item as NotificationItem);
            }
          }
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        },
      })
    ).current;

    const isArchived = 'archived_at' in item;

    const handleMenuAction = async (action: 'archive' | 'delete') => {
      setShowMenu(false);
      if (action === 'archive' && !isArchived) {
        await archiveNotification(item as NotificationItem);
        Toast.show({
          type: 'success',
          text1: 'Notification archived successfully',
        })
      } else if (action === 'delete') {
        await deleteNotificationFromAPI(item._id);
      }
    };

    const deleteNotificationFromAPI = async (notificationId: string) => {
      if (!token) return;
      try {
        await deleteNotification(token, notificationId);
        await getNotifications(token);
        Toast.show({
          type: 'success',
          text1: 'Notification deleted successfully',
        })
        // Refresh the lists
        load();
        if (showArchived) loadArchived();
      } catch (error) {
        console.error('Failed to delete notification:', error);
      }
    };

    return (
      <View style={{ marginVertical: 6, position: 'relative', marginHorizontal: 20 }}>
        <Animated.View
          style={{
            transform: [{ translateX: pan.x }],
          }}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity onPress={() => !isArchived && handleNudgeAction(item._id)}>
            <View className="bg-white/95 rounded-2xl px-5 py-3 border border-gray-200 shadow-sm"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-4">
                  <Text className="text-[#374151] text-base leading-6 mb-2">{item.message}</Text>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-[#6B7280] text-sm">
                      {formatUtcToIstTime(item.created_at || "")}
                    </Text>
                  </View>
                  {isArchived && (
                    <TouchableOpacity
                      className="mt-3 self-start bg-blue-500 px-4 py-2 rounded-lg"
                      onPress={() => unarchiveNotification(item._id)}
                    >
                      <Text className="text-white text-sm font-semibold">Unarchive</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 3-dot menu button */}
                <TouchableOpacity
                  onPress={() => setShowMenu(!showMenu)}
                  className="p-2 bg-gray-50 rounded-full"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <MaterialIcons name="more-vert" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Dropdown menu */}
        {showMenu && (
          <View
            className="absolute top-14 right-3 bg-white rounded-xl shadow-lg border border-gray-200 z-20"
            style={{
              minWidth: 140,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {!isArchived && (
              <TouchableOpacity
                className="px-4 py-3 border-b border-gray-100 flex-row items-center"
                onPress={() => handleMenuAction('archive')}
              >
                <MaterialIcons name="archive" size={16} color="#6B7280" style={{ marginRight: 8 }} />
                <Text className="text-gray-700 text-sm font-medium">Archive</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="px-4 py-3 flex-row items-center"
              onPress={() => handleMenuAction('delete')}
            >
              <MaterialIcons name="delete" size={16} color="#EF4444" style={{ marginRight: 8 }} />
              <Text className="text-red-600 text-sm font-medium">Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem | ArchivedNotification }) => (
    <SwipeableNotificationItem item={item} />
  );

  return (
    <View className="flex-1">
      <ImageBackground
        source={ImageIcons.BackgroundImage}
        className="flex-1 bg-white"
      >
        {/* Header */}
        <Image source={ImageIcons.Logo} className="w-32 h-32 mx-4" />
        <View className="px-5 pb-2 flex-row justify-between items-center">
          <Text className="text-xl font-bold text-black">
            {showArchived ? "Archived Notifications" : "Notifications"}
          </Text>
          <TouchableOpacity
            onPress={() => setShowArchived(!showArchived)}
            className="bg-blue-500 px-3 py-2 rounded-lg"
          >
            <Text className="text-white text-sm font-semibold">
              {showArchived ? "Show Active" : "Show Archived"}
            </Text>
          </TouchableOpacity>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
          ListEmptyComponent={!loading ? renderEmpty : null}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => {
              load();
              if (showArchived) loadArchived();
            }} />
          }
          renderItem={renderNotificationItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
        />
      </ImageBackground>
    </View>
  );
}
