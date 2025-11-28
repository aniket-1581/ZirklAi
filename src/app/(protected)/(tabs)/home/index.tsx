import { CalendarEventListResponse, getCalendarEvents } from "@/api/calendar";
import {
  getNetworkingPlaybook,
  NetworkingPlaybookRespnse,
} from "@/api/journal";
import { getNotes } from "@/api/notes";
import { getPhoneContacts } from "@/api/profile";
import ModalInfo from "@/components/businessCard/ModalInfo";
import ContactPlanCard from "@/components/home/ContactPlanCard";
import EventCard from "@/components/home/EventCard";
import PlanCard from "@/components/home/PlanCard";
import QuickStartModal from "@/components/home/QuickStartModal";
import { quickStartOptions } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { useNudges } from "@/hooks/useNudges";
import { Contact } from "@/types";
import { getGreetingByIST, getGrowthMessageOnce } from "@/utils/date";
import { handleContactData, processBusinessCard } from "@/utils/ScannerService";
import { launchScanner } from "@dariyd/react-native-document-scanner";
import { Feather, FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Home() {
  const [showMenu, setShowMenu] = useState(false);
  const [events, setEvents] = useState<CalendarEventListResponse>({
    calendar_events: [],
    total_count: 0,
  });
  const [displayedContacts, setDisplayedContacts] = useState<any[]>([]);
  const [phoneContacts, setPhoneContacts] = useState<Contact[]>([]);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [quickStartData, setQuickStartData] = useState(null);
  const [networkingPlaybook, setNetworkingPlaybook] = useState<
    NetworkingPlaybookRespnse["playbooks"]
  >([]);
  const { nudges, fetchNudges, deleteNudgeById } = useNudges();
  const { token, user } = useAuth();
  const growthMessage = useMemo(() => getGrowthMessageOnce(), []);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInfo, setModalInfo] = useState<any>(null);

  const handleDeleteNudge = async (nudgeId: string) => {
    if (!token) return;
    try {
      await deleteNudgeById(token, nudgeId);
      // Refresh the nudges list after deletion
      await fetchNudges(token);
    } catch (error) {
      console.error("Failed to delete nudge:", error);
    }
  };

  const shuffleContacts = useCallback(() => {
    if (phoneContacts.length <= 5) {
      setDisplayedContacts(phoneContacts);
    } else {
      const shuffled = [...phoneContacts].sort(() => Math.random() - 0.5);
      setDisplayedContacts(shuffled.slice(0, 5));
    }
  }, [phoneContacts]);

  const fetchContact = useCallback(async () => {
    if (!token) return;
    try {
      // Fetch notes (In my network)
      const notes = await getNotes(token);

      // Fetch phone contacts (Outside my network)
      const phoneData = await getPhoneContacts(token);
      const allPhoneContacts = phoneData?.contacts || [];

      // Filter out contacts that are already in the network
      const networkContactNames = new Set(
        notes?.map((note: any) => note.contact_name?.toLowerCase()) || []
      );
      const filteredPhoneContacts = allPhoneContacts.filter(
        (contact: any) =>
          contact.name && !networkContactNames.has(contact.name.toLowerCase())
      );

      setPhoneContacts(filteredPhoneContacts);
    } catch (e: any) {
      console.error("Failed to fetch data", e);
      setPhoneContacts([]);
    }
  }, [token]);

  const fetchNetworkingPlaybook = useCallback(async () => {
    try {
      const networkingPlaybook =
        (await getNetworkingPlaybook()) as NetworkingPlaybookRespnse;
      setNetworkingPlaybook(networkingPlaybook.playbooks);
    } catch (e: any) {
      console.error("Failed to fetch Networking Playbook", e);
      setNetworkingPlaybook([]);
    }
  }, []);

  const getEvents = useCallback(async () => {
    if (!token) return;
    try {
      const events = await getCalendarEvents(token);
      setEvents(events);
    } catch (e: any) {
      console.error("Failed to fetch events", e);
      setEvents({
        calendar_events: [],
        total_count: 0,
      });
    }
  }, [token]);

  // Business Card Scanner
  // New function to handle image selection
  const handleImageSelection = async () => {
    setLoading(true);

    try {
      // Launch native auto document scanner
      const result = await launchScanner({
        quality: 1
      });
      console.log("Scanner result:", result);

      if (result.didCancel) {
        setLoading(false);
        return;
      }

      if (result.error) {
        console.log("Scanner error:", result.errorMessage);
        Alert.alert("Error", "Failed to scan document");
        setLoading(false);
        return;
      }

      if (!result.images || result.images.length === 0) {
        Alert.alert("Scan Failed", "No image captured");
        setLoading(false);
        return;
      }
      if (!result.didCancel && result.images[0]) {
        setModalVisible(true);
        const res = await processBusinessCard(result.images[0].uri, token!);
        if (res) {
          const { contactInfo } = await handleContactData(res);
          showContactOptions(contactInfo, res);
        }
      }

    } catch (error) {
      console.error("Scanner error:", error);
      Alert.alert("Error", "Failed to scan card");
    } finally {
      setLoading(false);
    }
  };

  const showContactOptions = (formattedInfo: string, contactData: any) => {
    setModalInfo({ formattedInfo, contactData });
  };

  // Refetch data when screen comes into focus (tab is selected)
  useFocusEffect(
    useCallback(() => {
      fetchContact();
      getEvents();
      if (token) {
        fetchNetworkingPlaybook();
        fetchNudges(token);
        getEvents();
      }
    }, [getEvents, fetchNudges, token, fetchContact, fetchNetworkingPlaybook])
  );

  useEffect(() => {
    shuffleContacts();
  }, [phoneContacts]);

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <View className="flex-1 bg-[#3A327B]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        onScrollBeginDrag={() => setShowMenu(false)}
      >
        {/* Wave background with gradient overlay */}
        <View>
          {/* Dashboard Icon */}
          <View className="absolute top-7 left-6">
            <View className="bg-white/30 rounded-full p-2">
              <TouchableOpacity onPress={() => setShowMenu((prev) => !prev)}>
                <MaterialIcons name="dashboard" color="white" size={20} />
              </TouchableOpacity>
            </View>
          </View>
          {/* Notification Icon */}
          <View className="absolute top-7 right-6">
            <TouchableOpacity
              onPress={() => router.push("/(protected)/(tabs)/notifications")}
            >
              <View className="bg-white/30 rounded-full p-2">
                <MaterialIcons name="notifications" color="white" size={20} />
              </View>
            </TouchableOpacity>
          </View>
          {/* Zirkl Text */}
          <View className="flex-1 items-center justify-start pt-16">
            <Text className="text-white text-2xl font-bold">Zirkl</Text>
          </View>
        </View>

        {/* Greeting Text */}
        <View className="px-6 pt-10">
          <Text className="text-xl font-bold text-white mb-3">
            {getGreetingByIST()}, {user?.full_name.split(" ")[0]}
          </Text>
          <Text className="text-white text-base mb-4">{growthMessage}</Text>
          <TouchableOpacity
            className="bg-black/15 flex-row gap-2 items-center justify-center rounded-xl py-3 border border-white/15"
            onPress={() => router.push("/(protected)/(tabs)/chats")}
          >
            <Ionicons name="cube" size={24} color="#DAAB35" />
            <Text className="text-white font-medium">
              Connect with one new person today
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Start Options */}
        <View className="px-6 pb-2 mt-9">
          <Text className="text-lg font-bold text-white mb-3">Quick Start</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickStartOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                className="items-center mr-5"
                onPress={() => {
                  setQuickStartData(option.knowMore as any);
                  setShowQuickStart(true);
                }}
              >
                <View className="flex gap-3 items-start">
                  <Image
                    source={option.icon}
                    className="w-[230px] h-[149px] rounded-xl"
                  />
                  <Text className="text-sm font-semibold text-white">
                    {option.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Combined Calendar + Follow-Ups Section */}
        <View className="px-6 mt-[60px]">
          <Text className="text-lg font-bold text-white mb-3">
            Follow-Ups & Calendar
          </Text>

          <EventCard
            items={[
              ...events.calendar_events.map((e) => ({ ...e, type: "followup" })),
              ...nudges.map((n) => ({ ...n, type: "nudge" })),
            ]}
            type="combined"
            emptyMessage="No events or follow-ups available"
            handleDeleteNudge={handleDeleteNudge}
          />
        </View>

        {/* You may want to reach out */}
        <View className="px-6 mt-[60px]">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold text-white">
              Discover lost connections
            </Text>
            <TouchableOpacity
              className="items-center"
              onPress={shuffleContacts}
            >
              <Feather name="refresh-cw" size={18} color="white" />
            </TouchableOpacity>
          </View>
          <ContactPlanCard item={displayedContacts} />
        </View>

        {/* Playbook Section */}
        <View className="px-6 mt-[60px]">
          <Text className="text-lg font-bold text-white mb-3">
            Networking Playbook
          </Text>

          {/* Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {networkingPlaybook.map((playbook: any, index: number) => {
              const icon = playbook.icon;
              const gradientColors = playbook.cardGradient
                ? playbook.cardGradient
                : ["#a855f7", "#ec4899"];

              return (
                <TouchableOpacity
                  key={playbook.id || index}
                  activeOpacity={0.9}
                  className="mr-5 my-2"
                  onPress={() =>
                    router.push(
                      `/(protected)/(tabs)/networking-playbook/${playbook.page}`
                    )
                  }
                >
                  {/* Full Card Gradient */}
                  <LinearGradient
                    colors={gradientColors}
                    style={{
                      flex: 1,
                      width: 140,
                      height: "auto",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      rowGap: 20,
                      alignItems: "center",
                      borderRadius: 10,
                      padding: 10,
                      borderWidth: 1,
                      borderColor: "#fff"
                    }}
                  >
                    {/* Icon */}
                    <View className="items-center mt-1">
                      <LinearGradient
                        colors={playbook.bgGradient}
                        style={{
                          width: 64,
                          height: 64,
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          borderRadius: 9999,
                          borderWidth: 1,
                          borderColor: "#fff",
                        }}
                      >
                        <Feather name={icon} size={24} color="white" />
                      </LinearGradient>
                    </View>

                    {/* Title + Subtitle */}
                    <View className="mt-1">
                      <Text
                        className="text-black text-center font-semibold text-[15px]"
                        numberOfLines={2}
                      >
                        {playbook.title}
                      </Text>
                      <Text
                        className="text-black/80 text-center text-[13px] mt-1"
                        numberOfLines={1}
                      >
                        {playbook.subtitle}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Plan Today Section */}
        <View className="px-6 mt-[60px] mb-10">
          <Text className="text-lg font-bold text-white mb-5">
            Here is the plan today
          </Text>

          {(() => {
            const now = new Date();
            const startOfDay = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              0, 0, 0, 0
            ).getTime();

            const endOfDay = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              23, 59, 59, 999
            ).getTime();


            // Filter today's nudges
            const todayNudges = nudges
              .filter((n) => {
                const created = new Date(n.created_at).getTime();
                return created >= startOfDay && created <= endOfDay;
              })
              .map((n) => ({ ...n, type: "nudge" }));

            // Filter today's events
            const todayEvents = events.calendar_events
              .filter((e) => {
                const start = new Date(e.startDate).getTime();
                return start >= startOfDay && start <= endOfDay;
              })
              .map((e) => ({ ...e, type: "followup" }));



            // Combine & sort (optional)
            const todayPlans = [...todayNudges, ...todayEvents].sort((a, b) =>
              a.type === "event" ? -1 : 1
            );

            if (todayPlans.length === 0) {
              return (
                <View className="bg-black/20 rounded-xl p-4 border border-white/15">
                  <Text className="text-white/70 text-center">
                    No plans scheduled for today
                  </Text>
                </View>
              );
            }

            return todayPlans.map((plan, index) => (
              <PlanCard key={index} item={plan} />
            ));
          })()}
        </View>
      </ScrollView>
      {showMenu && (
        <View
          className="absolute top-20 left-6 bg-white rounded-xl shadow-lg z-20"
          style={{
            minWidth: 140,
          }}
        >
          <TouchableOpacity
            className="px-4 py-3 flex-row items-center"
            onPress={() => {
              setShowMenu(false);
              router.push("/(protected)/(tabs)/scanner");
            }}
          >
            <MaterialIcons
              name="qr-code"
              size={16}
              color="#6B7280"
              style={{ marginRight: 8 }}
            />
            <Text className="text-gray-700 text-sm font-medium">QR Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-3 flex-row items-center"
            onPress={() => {
              handleImageSelection();
              setShowMenu(false);
            }}
          >
            <FontAwesome5
              name="id-card"
              size={16}
              color="#6B7280"
              style={{ marginRight: 8 }}
            />
            <Text className="text-gray-700 text-sm font-medium">Business Card Scan</Text>
          </TouchableOpacity>
        </View>
      )}
      <QuickStartModal
        visible={showQuickStart}
        onClose={() => setShowQuickStart(false)}
        data={quickStartData}
      />

      <ModalInfo modalVisible={modalVisible} closeModal={closeModal} modalInfo={modalInfo} loading={loading} />
    </View>
  );
}
