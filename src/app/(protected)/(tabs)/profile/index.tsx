import { getCalendarEvents } from "@/api/calendar";
import { getNotes } from "@/api/notes";
import { updateProfile } from "@/api/profile";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import BusinessCard from "@/components/businessCard/BusinessCard";
import { useAuth } from "@/context/AuthContext";
import { useNudges } from "@/hooks/useNudges";
import { ImageIcons } from "@/utils/ImageIcons";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { JSX, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function ProfileScreen() {
  const { user, logout, token, getUserDetails } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { nudges, fetchNudges } = useNudges();
  const [name, setName] = useState(user?.full_name || "");
  // const [ageGroup, setAgeGroup] = useState(user?.age_group || "");
  const [email, setEmail] = useState(user?.email || "");
  const [location, setLocation] = useState(user?.location || "");
  const [profession, setProfession] = useState(user?.profession || "");
  const [company, setCompany] = useState(user?.company || "");
  const [contacts, setContacts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const handleSave = async () => {
    if (!token) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Authentication token not found.",
      });
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        full_name: name,
        location,
        profession,
        company,
        email,
      };
      await updateProfile(token, profileData);
      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: "Your profile has been updated successfully.",
      });
      try {
        await getUserDetails();
        setEditing(false);
      } catch (error: any) {
        console.error("Failed to fetch user details", error);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error || "Failed to update profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () =>
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);

  const fetchNotes = useCallback(async () => {
    if (!token) return;
    try {
      const notes = (await getNotes(token)) as any[];
      const events = await getCalendarEvents(token!);
      setEvents(events.calendar_events);
      setContacts(notes);
    } catch (e: any) {
      console.error("Failed to fetch Chats", e);
      setContacts([]);
    }
  }, [token]);

  const today = new Date().toISOString().split("T")[0];
  const followUp = [...nudges.filter((n) => today === n.created_at.split("T")[0]), ...events.filter((e) => today === e.created_at.split("T")[0])];

  useEffect(() => {
    fetchNotes();
    getUserDetails();
    fetchNudges(token!);
  }, [fetchNotes, fetchNudges, getUserDetails, token]);

  const handleEdit = () => {
    setEditing((prev) => !prev);
  };

  return (
    <ErrorBoundary>
      <View className="flex-1 justify-start bg-[#3A327B]">
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 80,
            alignItems: "center",
            paddingHorizontal: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-center px-6 mt-16">
            <Text className="text-2xl font-medium text-white">
              {editing ? "Edit Profile" : "Profile"}
            </Text>
          </View>
          {/* Edit Icon */}
          {editing ? (
            <View className="absolute top-7 right-6">
              <TouchableOpacity onPress={() => setEditing(!editing)}>
                <View className="bg-white/30 rounded-full p-2">
                  <MaterialIcons name="close" color="white" size={20} />
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="absolute top-7 right-6">
              <TouchableOpacity onPress={handleLogout}>
                <View className="bg-white/30 rounded-full p-2">
                  <MaterialIcons name="logout" color="white" size={20} />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Profile Image & Name */}
          {!editing && (
            <>
              <BusinessCard
                name={user?.full_name || ""}
                company={user?.company || ""}
                designation={user?.profession || ""}
                email={user?.email || ""}
                mobile={user?.phone_number || ""}
                address={user?.location || ""}
                qrBase64={user?.businessCardQRCode || ""}
                setEditing={handleEdit}
                persona={user?.persona || ""}
              />

              {/* Badge Card */}
              <View className="flex flex-col bg-[#312B69] rounded-2xl py-6 items-center mt-6 w-full gap-2">
                <Image
                  source={ImageIcons.NinjaBadge}
                  className="w-[60px] h-[60px] mb-[10px] mt-10"
                />
                <Text className="text-white font-medium text-[14px]">
                  Network Ninja
                </Text>
                <View className="flex-row justify-between w-[80%] mt-8">
                  <StatBlock
                    label="Productive chats"
                    value={contacts.length}
                    iconName={() => (
                      <Ionicons name="bulb-outline" size={24} color="#7C75B6" />
                    )}
                  />
                  <StatBlock
                    label="Follow-ups"
                    value={followUp.length}
                    iconName={() => (
                      <AntDesign name="user-switch" size={24} color="#7C75B6" />
                    )}
                  />
                </View>
              </View>

              {/* Connect Button */}
              <TouchableOpacity
                className="w-full bg-black/15 flex-row gap-2 items-center justify-center rounded-xl py-3 px-6 mt-4"
                onPress={() => router.push("/(protected)/(tabs)/chats")}
              >
                <Ionicons name="cube" size={24} color="#DAAB35" />
                <Text className="text-white font-medium">
                  Connect with one new person today
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Editable Form */}
          {editing && (
            <View className="w-full mt-12">
              <FormField label="Full name" value={name} setValue={setName} />

              {/* <FormField label="Age" value={ageGroup} setValue={setAgeGroup} /> */}

              <FormField label="Email" value={email} setValue={setEmail} />

              <FormField
                label="Profession"
                value={profession}
                setValue={setProfession}
              />

              {user?.persona !== 'Student' && (
                <FormField
                  label="Company"
                  value={company}
                  setValue={setCompany}
                />
              )}

              <FormField
                label="Address"
                value={location}
                setValue={setLocation}
              />

              {/* SUBMIT BUTTON */}
              <TouchableOpacity
                className="w-full bg-[#C6BFFF] py-3 mt-10 rounded-xl"
                onPress={handleSave}
                disabled={saving}
              >
                <Text className="text-center text-[#232323] font-semibold text-lg">
                  {saving ? "Saving..." : "SUBMIT"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </ErrorBoundary>
  );
}

const FormField = ({ label, value, setValue }: any) => {
  const inputRef = useRef<TextInput>(null);
  return (
    <Pressable onPress={() => inputRef.current?.focus()} className="mt-5">
      <View className="flex gap-1 bg-[#4C4495] rounded-lg border border-[#9E96D8]/40 px-4 py-2">
        <Text className="text-[#E4E2F6] text-[10px]">{label}</Text>

        {/* INPUT FIELD */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={setValue}
          className="text-white text-sm py-0 px-0 mx-0"
          placeholder=""
          placeholderTextColor="#C7C2ED"
        />
      </View>
    </Pressable>
  );
};

const StatBlock = ({
  label,
  value,
  iconName,
}: {
  label: string;
  value: number;
  iconName: () => JSX.Element;
}) => (
  <View className="flex flex-col items-center gap-2">
    {iconName()}
    <Text className="text-[#C7C2ED] font-medium text-[14px]">{label}</Text>
    <Text className="text-white font-medium text-xl">{value}</Text>
  </View>
);
