import { getNotes } from "@/api/notes";
import EventCard from "@/components/home/EventCard";
import PlanCard from "@/components/home/PlanCard";
import { quickStartOptions } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { useCalendar } from "@/hooks/useCalendar";
import { useNudges } from "@/hooks/useNudges";
import { ImageIcons } from "@/utils/ImageIcons";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
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
  const [contacts, setContacts] = useState<any[]>([]);
  const [displayedContacts, setDisplayedContacts] = useState<any[]>([]);
  const {
    nudges,
    fetchNudges,
    deleteNudgeById
      } = useNudges();
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
    if (contacts.length <= 5) {
      setDisplayedContacts(contacts);
    } else {
      const shuffled = [...contacts].sort(() => Math.random() - 0.5);
      setDisplayedContacts(shuffled.slice(0, 5));
    }
  }, [contacts]);

  const fetchNotes = useCallback(async () => {
      try {
        const notes = await getNotes(token!) as any[];
        setContacts(notes);
        shuffleContacts(); // Set initial displayed contacts
      } catch (e: any) {
        console.error('Failed to fetch Chats', e)
        setContacts([]);
        setDisplayedContacts([]);
      }
    }, [token]);

  // Refetch data when screen comes into focus (tab is selected)
  useFocusEffect(
    useCallback(() => {
      fetchNotes();
      getEvents();
      if (token) {
        fetchNudges(token);
      }
    }, [getEvents, fetchNudges, token, fetchNotes])
  );

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
                height: '100%'
              }}
            />
            {/* Dashboard Icon */}
            <View className="absolute top-6 left-7">
              <View className="bg-white/30 rounded-full p-2">
                <MaterialIcons name="dashboard" color="white" size={24} />
              </View>
            </View>
            {/* Notification Icon */}
            <View className="absolute top-6 right-7">
              <TouchableOpacity onPress={() => router.push('/(protected)/(tabs)/notifications')}>
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
          <Text className="text-xl font-bold text-white mb-4">Good Morning, {user?.full_name.split(" ")[0]}</Text>
          <TouchableOpacity className="bg-black/15 flex-row gap-2 items-center justify-center rounded-xl py-3" onPress={() => router.push('/(protected)/(tabs)/chats')}>
            <Ionicons name="cube" size={24} color="#DAAB35" />
            <Text className="text-white font-medium">
              Connect with one new person today
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Start Options */}
        <View className="px-5 pb-2 mt-9">
          <Text className="text-lg font-bold text-white mb-3">
            Quick Start
          </Text>
          <ScrollView
            horizontal 
            showsHorizontalScrollIndicator={false}
          >
              {quickStartOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => option.action()}
                  className="items-center mr-5"
                >
                  <View className="flex gap-3 items-start">
                    <Image source={option.icon}  className="w-[230px] h-[149px] rounded-xl" />
                    <Text className="text-sm font-semibold text-white">
                      {option.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {/* Follow-Ups Section */}
        <View className="px-5 mt-[60px]">
          <Text className="text-lg font-bold text-white mb-3">Follow-Ups</Text>
          <EventCard
            items={nudges}
            type="followup"
            emptyMessage="No follow-ups available"
            handleDeleteNudge={handleDeleteNudge}
          />
        </View>

        {/* Today's Calendar Section */}
        <View className="px-5 mt-[60px]">
          <Text className="text-lg font-bold text-white mb-3">Todays Calendar</Text>
          <EventCard
            items={events}
            type="calendar"
            emptyMessage="No events scheduled"
          />
        </View>

        {/* Plan Today Section */}
        <View className="px-5 mt-[60px] mb-10">
          <Text className="text-lg font-bold text-white mb-5">Here is the plan today</Text>

          {displayedContacts?.length ? (
            displayedContacts.map((item, index) => (
              <PlanCard
                key={index}
                item={item}
              />
            ))
          ) : (
            <Text className="text-white/70">No plans available</Text>
          )}

          <TouchableOpacity
            className="bg-[#3A327B] border border-[#5C57A5] py-3 rounded-2xl mt-3 items-center"
            onPress={shuffleContacts}
          >
            <Text className="text-white font-semibold">Refresh Recommendations</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
