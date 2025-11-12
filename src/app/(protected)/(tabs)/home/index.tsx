import {
  getNetworkingPlaybook,
  NetworkingPlaybookRespnse,
} from "@/api/journal";
import { getNotes } from "@/api/notes";
import { getPhoneContacts } from "@/api/profile";
import ContactPlanCard from "@/components/home/ContactPlanCard";
import EventCard from "@/components/home/EventCard";
import PlanCard from "@/components/home/PlanCard";
import { quickStartOptions } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { useCalendar } from "@/hooks/useCalendar";
import { useNudges } from "@/hooks/useNudges";
import { Contact } from "@/types";
import { ImageIcons } from "@/utils/ImageIcons";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Home() {
  const { events, getEvents } = useCalendar();
  const [showMenu, setShowMenu] = useState(false);
  const [displayedContacts, setDisplayedContacts] = useState<any[]>([]);
  const [notesContacts, setNotesContacts] = useState<any[]>([]);
  const [phoneContacts, setPhoneContacts] = useState<Contact[]>([]);
  const [networkingPlaybook, setNetworkingPlaybook] = useState<
    NetworkingPlaybookRespnse["playbooks"]
  >([]);
  const { nudges, fetchNudges, deleteNudgeById } = useNudges();
  const { token, user } = useAuth();

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
      setNotesContacts(notes || []);

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
      setNotesContacts([]);
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

  // Refetch data when screen comes into focus (tab is selected)
  useFocusEffect(
    useCallback(() => {
      fetchContact();
      getEvents();
      if (token) {
        fetchNetworkingPlaybook();
        fetchNudges(token);
      }
    }, [getEvents, fetchNudges, token, fetchContact, fetchNetworkingPlaybook])
  );

  useEffect(() => {
    shuffleContacts();
  }, [phoneContacts]);

  return (
    <View className="flex-1 bg-[#3A327B]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Wave background with gradient overlay */}
        <View style={{ height: 290 }}>
          <ImageBackground
            source={ImageIcons.HomeScreen} // your wave image
            resizeMode="cover"
            style={{ height: 290 }}
          >
            <LinearGradient
              colors={["rgba(58, 50, 123, 0.3)", "rgba(58, 50, 123, 1)"]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "100%",
              }}
            />
            {/* Dashboard Icon */}
            <View className="absolute top-6 left-7">
              <View className="bg-white/30 rounded-full p-2">
                <TouchableOpacity onPress={() => setShowMenu((prev) => !prev)}>
                  <MaterialIcons name="dashboard" color="white" size={24} />
                </TouchableOpacity>
              </View>
            </View>
            {/* Notification Icon */}
            <View className="absolute top-6 right-7">
              <TouchableOpacity
                onPress={() => router.push("/(protected)/(tabs)/notifications")}
              >
                <View className="bg-white/30 rounded-full p-2">
                  <MaterialIcons name="notifications" color="white" size={24} />
                </View>
              </TouchableOpacity>
            </View>
            {/* Zirkl Text */}
            <View className="flex-1 items-center justify-start pt-16">
              <Text className="text-white text-2xl font-bold">Zirkl</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Greeting Text */}
        <View className="px-5">
          <Text className="text-xl font-bold text-white mb-4">
            Good Morning, {user?.full_name.split(" ")[0]}
          </Text>
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
        <View className="px-5 pb-2 mt-9">
          <Text className="text-lg font-bold text-white mb-3">Quick Start</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickStartOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => option.action()}
                className="items-center mr-5"
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

        {/* Plan Today Section */}
        <View className="px-5 mt-[60px]">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-lg font-bold text-white">
              You may want to reach out
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

        {/* Combined Calendar + Follow-Ups Section */}
        <View className="px-5 mt-[60px]">
          <Text className="text-lg font-bold text-white mb-3">
            Follow-Ups & Calendar
          </Text>

          <EventCard
            items={[...events.map(e => ({ ...e, type: 'followup' })), 
                    ...nudges.map(n => ({ ...n, type: 'nudge' }))]}
            type="combined"
            emptyMessage="No events or follow-ups available"
            handleDeleteNudge={handleDeleteNudge}
          />
        </View>


        {/* Playbook Section */}
        <View className="px-5 mt-[60px]">
          <Text className="text-lg font-bold text-white mb-3">
            Networking Playbook
          </Text>

          {/* Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 24 }}
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
                      width: 130,
                      height: "auto",
                      flexDirection: "column",
                      justifyContent: "space-between",
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
                          borderColor: "#fff"
                        }}
                      >
                        <Feather
                          name={icon}
                          size={24}
                          color="white"
                        />
                      </LinearGradient>
                    </View>

                    {/* Title + Subtitle */}
                    <View className="mt-1">
                      <Text
                        className="text-black font-semibold text-[15px]"
                        numberOfLines={2}
                      >
                        {playbook.title}
                      </Text>
                      <Text
                        className="text-black/80 text-[13px] mt-1"
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
        <View className="px-5 mt-[60px] mb-10">
          <Text className="text-lg font-bold text-white mb-5">
            Here is the plan today
          </Text>

          {(() => {
            const today = new Date();
            const todayDate = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD

            // Filter today's nudges
            const todayNudges = nudges
              .filter((n) => {
                const nudgeDate = n.created_at?.split("T")[0];
                return nudgeDate === todayDate;
              })
              .map((n) => ({
                ...n,
                type: "nudge"
              }));

            // Filter today's events
            const todayEvents = events
              .filter((e) => {
                const eventDate = new Date(e.startDate).toISOString().split("T")[0];
                return eventDate === todayDate;
              })
              .map((e) => ({
                ...e,
                type: "followup"
              }));

            // Combine & sort (optional)
            const todayPlans = [...todayNudges, ...todayEvents].sort(
              (a, b) => (a.type === "event" ? -1 : 1)
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

            return todayPlans.map((plan, index) => <PlanCard key={index} item={plan} />);
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
        </View>
      )}
    </View>
  );
}
