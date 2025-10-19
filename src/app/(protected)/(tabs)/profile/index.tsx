import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, getPhoneContacts } from "@/api/profile";
import Toast from "react-native-toast-message";
import { getGender } from "gender-detection-from-name";
import { ImageIcons } from "@/utils/ImageIcons";
import { getNotes } from "@/api/notes";
import { router, useFocusEffect } from "expo-router";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const COLORS = {
  white: "#FFFFFF",
  black: "#000000",
  primary: "#4725FC",
  secondary: "#7C75B6",
  accent: "#C7C2ED",
  deepPurple: "#312B69",
  darker: "#3A327B",
  lightPurple: "#E4E2F6",
  gradientStart: "#7A71BD",
  gradientEnd: "#DAAB35",
};

export default function ProfileScreen() {
  const { user, logout, token } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.full_name || "Emily Posa");
  const [ageGroup, setAgeGroup] = useState(user?.age_group || "");
  const [location, setLocation] = useState(user?.location || "");
  const [profession, setProfession] = useState(user?.profession || "");
  const [company, setCompany] = useState(user?.company || "");
  const [contacts, setContacts] = useState<any[]>([]);
  const [phoneContacts, setPhoneContacts] = useState<any[]>([]);

  const gender = getGender(name.split(" ")[0]);
  const avatar = gender === "male" ? ImageIcons.MenImage : ImageIcons.WomanImage;

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
      const profileData = { full_name: name, age_group: ageGroup, location, profession, company };
      await updateProfile(token, profileData);
      Toast.show({
        type: "success",
        text1: "Profile Updated",
        text2: "Your profile has been updated successfully.",
      });
      setEditing(false);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: "Failed to update profile. Please try again.",
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
      const notes = await getNotes(token) as any[];
      setContacts(notes);
    } catch (e: any) {
      console.error('Failed to fetch Chats', e)
      setContacts([]);
    }
  }, [token]);

  const fetchContacts = useCallback(async () => {
    if (!token) return;
    try {
      const contacts = await getPhoneContacts(token) as any[];
      setPhoneContacts(contacts);
    } catch (e: any) {
      console.error('Failed to fetch Chats', e)
      setPhoneContacts([]);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
      fetchContacts();
    }, [token, fetchNotes, fetchContacts])
  );

  return (
    <ErrorBoundary>
    <View className="flex-1 justify-start bg-[#3A327B]">
      <ScrollView
          contentContainerStyle={{
            paddingBottom: 80,
            alignItems: "center",
            paddingHorizontal: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View className="flex-row items-center justify-center px-5 mt-16">
          <Text className="text-2xl font-medium text-white">Profile</Text>
        </View>
        {/* Edit Icon */}
        <View className="absolute top-6 right-7">
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <View className="bg-white/30 rounded-full p-2">
              <MaterialIcons name="edit" color="white" size={24} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile Image & Name */}
        {!editing && (
          <>
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <View>
                <Image
                  source={avatar}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    borderWidth: 3,
                    borderColor: COLORS.primary,
                  }}
                />
              </View>
              <Text
                style={{
                  color: COLORS.white,
                  fontSize: 22,
                  fontWeight: "600",
                  marginTop: 10,
                }}
              >
                {name}
              </Text>
            </View>

            {/* Stats */}
            <View
              className="flex-row justify-between mt-4 gap-5 bg-black/15 p-5 rounded-xl"
            >
              <StatBlock label="Active Network" value={contacts.length} />
              <StatBlock label="Phonebook" value={phoneContacts?.count || 0} />
              <StatBlock label="LinkedIn" value="0" />
            </View>

            {/* Badge Card */}
            <View
              style={{
                backgroundColor: COLORS.deepPurple,
                borderRadius: 16,
                paddingVertical: 30,
                alignItems: "center",
                marginTop: 30,
                width: "100%",
              }}
            >
              <Image
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png",
                }}
                style={{ width: 70, height: 70, marginBottom: 10 }}
              />
              <Text
                style={{
                  color: COLORS.white,
                  fontSize: 18,
                  fontWeight: "600",
                  marginBottom: 20,
                }}
              >
                Network Ninja
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "80%",
                }}
              >
                <StatBlock label="Productive chats" value="8" small />
                <StatBlock label="Follow-ups" value="4" small />
              </View>
            </View>

            {/* Connect Button */}
              <TouchableOpacity className="w-full bg-black/15 flex-row gap-2 items-center justify-center rounded-xl py-3 px-5 mt-4" onPress={() => router.push('/(protected)/(tabs)/chats')}>
                <Ionicons name="cube" size={24} color="#DAAB35" />
                <Text className="text-white font-medium">
                  Connect with one new person today
                </Text>
              </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                marginTop: 40,
                backgroundColor: COLORS.accent,
                paddingVertical: 12,
                borderRadius: 10,
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: COLORS.primary, fontWeight: "600" }}>
                Logout
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Editable Form */}
          {editing && (
              <View style={{ width: "100%", marginTop: 20 }}>
                <FormInput label="Full Name" value={name} setValue={setName} />
                <FormInput label="Age Group" value={ageGroup} setValue={setAgeGroup} />
                <FormInput label="Location" value={location} setValue={setLocation} />
                <FormInput label="Profession" value={profession} setValue={setProfession} />
                <FormInput label="Company" value={company} setValue={setCompany} />

                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary,
                    paddingVertical: 14,
                    borderRadius: 12,
                    marginTop: 20,
                    alignItems: "center",
                  }}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={{ color: COLORS.white, fontWeight: "600" }}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    paddingVertical: 12,
                    alignItems: "center",
                    marginTop: 10,
                  }}
                  onPress={() => setEditing(false)}
                >
                  <Text style={{ color: COLORS.lightPurple }}>Cancel</Text>
                </TouchableOpacity>
              </View>
          )}
      </ScrollView>
    </View>
    </ErrorBoundary>
  );
}

const FormInput = ({ label, value, setValue }: any) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ color: "#E4E2F6", fontSize: 14, marginBottom: 6 }}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={setValue}
      placeholder={`Enter ${label.toLowerCase()}`}
      placeholderTextColor="#7C75B6"
      style={{
        backgroundColor: "#3A327B",
        color: "#FFFFFF",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderColor: "#7C75B6",
        borderWidth: 1,
      }}
    />
  </View>
);

const StatBlock = ({ label, value, small = false }: any) => (
  <View style={{ alignItems: "center" }}>
    <Text
      style={{
        color: "#C7C2ED",
        fontSize: small ? 14 : 16,
        fontWeight: "500",
        marginBottom: 4,
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        color: "#FFFFFF",
        fontSize: small ? 20 : 22,
        fontWeight: "700",
      }}
    >
      {value}
    </Text>
  </View>
);
