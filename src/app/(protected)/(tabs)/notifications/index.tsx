import {
  getNotifications,
  NotificationItem,
  nudgeAction,
  deleteNotification,
} from "@/api/notifications";
import { useAuth } from "@/context/AuthContext";
import { formatUtcToIstTime } from "@/utils/date";
import {
  notificationStorage,
  SnoozedNotification,
} from "@/utils/notificationStorage";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  SectionList,
  RefreshControl,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [snoozedItems, setSnoozedItems] = useState<SnoozedNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [allNotifications, setAllNotifications] = useState<NotificationItem[]>(
    []
  );
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

  // Filter notifications based on snoozed items when either changes
  useEffect(() => {
    if (allNotifications.length > 0) {
      const snoozedIds = new Set(snoozedItems.map((item) => item._id));
      const activeNotifications = allNotifications.filter(
        (notification: NotificationItem) => !snoozedIds.has(notification._id)
      );
      setItems(activeNotifications);
    }
  }, [allNotifications, snoozedItems]);

  const loadSnoozed = useCallback(async () => {
    const snoozed = await notificationStorage.getSnoozedNotifications();
    setSnoozedItems(snoozed);
  }, []);

  // Refetch data when screen comes into focus (tab is selected)
  useFocusEffect(
    useCallback(() => {
      console.log("Notifications screen focused - refetching data");
      load(); // Refetch notifications when tab is selected
      loadSnoozed(); // Load snoozed notifications
    }, [load, loadSnoozed])
  );

  const handleNudgeAction = async (notificationId: string) => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await nudgeAction(token, notificationId);
      if (res.success) {
        router.push("/(protected)/(tabs)/home");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const snoozeNotification = async (
    notification: NotificationItem,
    snoozeHours: number = 1
  ) => {
    try {
      await notificationStorage.snoozeNotification(notification, snoozeHours);
      await loadSnoozed(); // Refresh snoozed list
      load(); // Refresh active list
    } catch (error) {
      console.error("Failed to snooze notification:", error);
    }
  };

  const unsnoozeNotification = async (notificationId: string) => {
    try {
      await notificationStorage.unsnoozeNotification(notificationId);
      await loadSnoozed(); // Refresh snoozed list
      load(); // Refresh active list
    } catch (error) {
      console.error("Failed to unsnooze notification:", error);
    }
  };

  const currentItems = showSnoozed ? snoozedItems : items;

  // Group notifications by date
  const groupNotificationsByDate = (
    notifications: (NotificationItem | SnoozedNotification)[]
  ) => {
    const groups: {
      [key: string]: (NotificationItem | SnoozedNotification)[];
    } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach((notification) => {
      const notificationDate = new Date(notification.created_at || "");
      const dateKey = notificationDate.toDateString();

      // Check if it's today
      if (notificationDate.toDateString() === today.toDateString()) {
        if (!groups["Today"]) groups["Today"] = [];
        groups["Today"].push(notification);
      }
      // Check if it's yesterday
      else if (notificationDate.toDateString() === yesterday.toDateString()) {
        if (!groups["Yesterday"]) groups["Yesterday"] = [];
        groups["Yesterday"].push(notification);
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
        if (a.title === "Today") return -1;
        if (b.title === "Today") return 1;
        if (a.title === "Yesterday") return -1;
        if (b.title === "Yesterday") return 1;
        return new Date(b.title).getTime() - new Date(a.title).getTime();
      });
  };

  const sections = groupNotificationsByDate(currentItems);

  const renderSectionHeader = ({ section }: any) => (
    <View className="px-5 py-2 mb-4 mt-3 bg-[#3A327B]">
      <Text className="text-sm font-semibold text-white uppercase tracking-wide">
        {section.title}
      </Text>
    </View>
  );

  const renderEmpty = (
    <View className="flex-1 items-center justify-center">
      <MaterialIcons
        name={showSnoozed ? "schedule" : "notifications-none"}
        size={64}
        color="white"
        style={{ marginBottom: 16 }}
      />
      <Text className="text-white text-lg font-semibold mb-1">
        {showSnoozed ? "Snoozed Notifications" : "Notifications"}
      </Text>
      <Text className="text-[#999] text-base">
        {showSnoozed
          ? "No snoozed notifications yet."
          : "No notifications yet."}
      </Text>
    </View>
  );

  const NotificationItem = ({
    item,
  }: {
    item: NotificationItem | SnoozedNotification;
  }) => {
    const [showMenu, setShowMenu] = useState(false);

    const isSnoozed = "snoozed_at" in item;

    const handleMenuAction = async (action: "snooze" | "delete") => {
      setShowMenu(false);
      if (action === "snooze" && !isSnoozed) {
        await snoozeNotification(item as NotificationItem, 1);
        Toast.show({
          type: "success",
          text1: "Notification snoozed for 1 hour",
        });
      } else if (action === "delete") {
        await deleteNotificationFromAPI(item._id);
      }
    };

    const deleteNotificationFromAPI = async (notificationId: string) => {
      if (!token) return;
      try {
        await deleteNotification(token, notificationId);
        await getNotifications(token);
        Toast.show({
          type: "success",
          text1: "Notification deleted successfully",
        });
        // Refresh the lists
        load();
        if (showSnoozed) loadSnoozed();
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    };

    return (
      <View className="flex-1 px-5 mb-4">
        <TouchableOpacity
          onPress={() => !isSnoozed && handleNudgeAction(item._id)}
        >
          <View className="bg-black/15 rounded-2xl px-5 py-3 border border-white/15">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-4">
                <Text className="text-white text-lg font-semibold mb-2">
                  {item.title}
                </Text>
                <View className="flex-row justify-between items-center">
                  <Text className="text-white text-sm">
                    {formatUtcToIstTime(item.created_at || "")}
                  </Text>
                </View>
                {isSnoozed && (
                  <TouchableOpacity
                    className="mt-3 self-start bg-[#C6BFFF] px-4 py-2 rounded-lg"
                    onPress={() => unsnoozeNotification(item._id)}
                  >
                    <Text className="text-white text-sm font-semibold">
                      Unsnooze
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 3-dot menu button */}
              <TouchableOpacity
                onPress={() => setShowMenu(!showMenu)}
                className="p-2 bg-white/15 rounded-full"
                style={{
                  shadowColor: "#000",
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

        {/* Dropdown menu */}
        {showMenu && (
          <View
            className="absolute top-14 right-3 bg-white rounded-xl shadow-lg border border-gray-200 z-20"
            style={{
              minWidth: 140,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {!isSnoozed && (
              <TouchableOpacity
                className="px-4 py-3 border-b border-gray-100 flex-row items-center"
                onPress={() => handleMenuAction("snooze")}
              >
                <MaterialIcons
                  name="schedule"
                  size={16}
                  color="#6B7280"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-gray-700 text-sm font-medium">
                  Snooze
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="px-4 py-3 flex-row items-center"
              onPress={() => handleMenuAction("delete")}
            >
              <MaterialIcons
                name="delete"
                size={16}
                color="#EF4444"
                style={{ marginRight: 8 }}
              />
              <Text className="text-red-600 text-sm font-medium">Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderNotificationItem = ({
    item,
  }: {
    item: NotificationItem | SnoozedNotification;
  }) => <NotificationItem item={item} />;

  return (
    <View className="flex-1 bg-[#3A327B]">
      {/* Header */}
      <View className="flex-row items-center justify-center px-5 mt-16">
        <Text className="text-2xl font-medium text-white">
          {showSnoozed ? "Snoozed Notifications" : "Notifications"}
        </Text>
      </View>
      <View className="absolute top-6 right-7">
        <TouchableOpacity onPress={() => setShowSnoozed(!showSnoozed)}>
          <View className="bg-white/15 rounded-full p-2">
            {showSnoozed ? (
              <MaterialIcons name="notifications" size={24} color="white" />
            ) : (
              <MaterialIcons name="snooze" size={24} color="white" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 16, flexGrow: 1 }}
        ListEmptyComponent={!loading ? renderEmpty : null}
        renderItem={renderNotificationItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
      />

      {loading && (
        <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-black/50">
          <ActivityIndicator size="large" color="#16a34a" />
          <Text className="mt-4 text-white">Processing...</Text>
        </View>
      )}
    </View>
  );
}
