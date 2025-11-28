import {
  deleteNotification,
  getNotifications,
  NotificationItem as NItem,
  nudgeAction,
} from "@/api/notifications";
import { useAuth } from "@/context/AuthContext";
import { formatUtcToIstTime } from "@/utils/date";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

/* -------------------------------------------
   GROUP BY DATE
--------------------------------------------*/
const groupByDateLabel = (notifications: NItem[]) => {
  const now = new Date();
  const todayString = now.toDateString();

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return notifications.reduce((acc: any, item: NItem) => {
    const date = new Date(item.created_at || "");
    const dateString = date.toDateString();

    const month = date.getMonth();
    const year = date.getFullYear();

    let label = "";

    // TODAY
    if (dateString === todayString) {
      label = "Today";
    }
    // THIS MONTH
    else if (month === currentMonth && year === currentYear) {
      label = "This Month";
    }
    // LAST MONTH
    else if (
      (currentMonth === 0 && month === 11 && year === currentYear - 1) ||
      (month === currentMonth - 1 && year === currentYear)
    ) {
      label = "Last Month";
    }
    // OLDER MONTHS → e.g. March 2024
    else {
      label = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }

    if (!acc[label]) acc[label] = [];
    acc[label].push(item);

    return acc;
  }, {});
};

const NotificationCards = ({
  item,
  onDelete,
  onNudge,
}: {
  item: NItem;
  onDelete: (id: string) => void;
  onNudge: (item: NItem) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const isUnread = item.is_read === false || item.status !== "read";
  return (
    <View className="px-6 mb-4">
      {/* CARD */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          setShowMenu(false);
          onNudge(item);
        }}
        disabled={item.is_read === true}
        className="bg-white/10 border border-white/10 rounded-xl p-4 flex-row gap-3 items-start"
      >
        {/* LEFT AVATAR */}

        {/* RIGHT CONTENT */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              {isUnread ? <Ionicons name="mail" size={20} color="#fff" /> : <Ionicons name="mail-open" size={20} color="#fff" />}
              {/* Red dot for unread */}
              {isUnread && (
                <View className="w-2 h-2 rounded-full bg-[#90cdf4] absolute top-0 right-0" />
              )}
            </View>
            {/* LINE 1 — NAME + ACTION + DOC NAME */}
            <Text className="text-white text-base font-semibold flex-1">
              {item.title}{" "}
            </Text>
          </View>

          {/* OPTIONAL COMMENT */}
          {item.message && (
            <View>
              <Text className="text-white/80 text-sm mt-2">
              {readMore ? `${item.message} ` : item.message.slice(0, 50) + "... "}
              <Text
                className="text-[#FF7777]/80 text-sm"
                onPress={() => setReadMore(!readMore)}
              >
                {readMore ? "Read Less" : "Read More"}
              </Text>
              </Text>
            </View>
          )}

        </View>
          {/* TIME */}
          <Text className="absolute right-5 bottom-2 text-white/50 text-xs">
            {formatUtcToIstTime(item.created_at || "")}
          </Text>
        {/* 3 DOT MENU */}
        <TouchableOpacity
          onPress={() => setShowMenu(!showMenu)}
          className="p-2 bg-white/15 rounded-full"
        >
          <MaterialIcons name="more-vert" size={20} color="#d1d5db" />
        </TouchableOpacity>
      </TouchableOpacity>
      {/* DROPDOWN MENU */}
      {showMenu && (
        <View className="absolute top-14 right-8 bg-white rounded-xl shadow-lg p-2 min-w-[120px] z-50">
          <TouchableOpacity
            className="px-4 py-3 flex-row items-center"
            onPress={() => {
              setShowMenu(false);
              onDelete(item._id);
            }}
          >
            <MaterialIcons
              name="delete-outline"
              size={20}
              color="#FF7777"
              style={{ marginRight: 8 }}
            />
            <Text className="text-[#FF7777] font-medium">Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

/* -------------------------------------------
   MAIN SCREEN
--------------------------------------------*/
export default function NotificationsScreen() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /* LOAD NOTIFICATIONS */
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const data = await getNotifications(token, 50, 0);
      const sorted = (data || []).sort(
        (a, b) =>
          new Date(b.created_at as string).getTime() -
          new Date(a.created_at as string).getTime()
      );
      setNotifications(sorted);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  /* DELETE HANDLER */
  const deleteNotificationById = async (id: string) => {
    if (!token) return;
    await deleteNotification(token, id);
    load();
    Toast.show({ type: "success", text1: "Deleted successfully" });
  };

  /* RESTORED handleNudgeAction */
  const handleNudgeAction = async (notificationId: string) => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await nudgeAction(token, notificationId);

      if (res.success) {
        router.push("/(protected)/(tabs)/home");
      }
    } catch (err) {
      console.log("Nudge error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* WHAT HAPPENS WHEN USER TAPS A NOTIFICATION */
  const handlePress = (item: NItem) => {
    handleNudgeAction(item._id);
  };

  /* GROUPING */
  const grouped = groupByDateLabel(notifications);
  const sectionKeys = Object.keys(grouped);

  const flatListData = sectionKeys.flatMap((section) => [
    { type: "header", id: section, title: section },
    ...grouped[section].map((n: NItem) => ({ type: "item", ...n })),
  ]);

  return (
    <View className="flex-1 bg-[#3A327B]">
      {/* SCREEN HEADER */}
      <View className="flex-row gap-4 items-center justify-center w-full mt-16 mb-6">
        <TouchableOpacity
          className="absolute left-5"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text className="text-white text-3xl font-semibold">Notifications</Text>
      </View>

      {/* LIST */}
      <FlatList
        data={flatListData}
        keyExtractor={(item) => item._id || item.id}
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <Text className="px-6 py-2 text-white/70 font-semibold uppercase tracking-wide">
                {item.title}
              </Text>
            );
          }

          return (
            <NotificationCards
              item={item}
              onDelete={deleteNotificationById}
              onNudge={handlePress}
            />
          );
        }}
        contentContainerStyle={{ paddingBottom: 60 }}
      />

      {/* LOADING OVERLAY */}
      {loading && (
        <View className="absolute inset-0 justify-center items-center bg-black/40">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </View>
  );
}
