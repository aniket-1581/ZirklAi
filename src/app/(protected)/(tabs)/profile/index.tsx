import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/context/AuthContext";
import { useCalendar } from "@/hooks/useCalendar";
import { ImageIcons } from "@/utils/ImageIcons";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const ageGroups = [
  "15 - 20 years",
  "21 - 30 years",
  "31 - 35 years",
  "35 - 40 years",
  "41 - 45 years",
  "46 - 50 years",
  "50+ years",
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { events, getEvents } = useCalendar();

  const [name, setName] = useState(user?.full_name || "");
  const [ageGroup, setAgeGroup] = useState(user?.age_group || "");
  const [location, setLocation] = useState(user?.location || "");
  const [profession, setProfession] = useState(user?.profession || "");
  const [company, setCompany] = useState(user?.company || "");
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    setEditing(false);
  };

  const handleLogout = () =>
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);

  return (
    <ErrorBoundary>

        <View className="flex-1">
        <ImageBackground
            source={ImageIcons.BackgroundImage}
            className="flex-1"
            resizeMode="cover"
        >
            {/* Header */}
            <Image source={ImageIcons.Logo} className="w-32 h-32 mx-4" />
            <View className="flex flex-row items-center justify-between px-5 pb-2">
            <Text className="text-xl font-bold text-black">Profile</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
                <MaterialIcons
                name={editing ? "close" : "edit"}
                size={20}
                color="#000"
                />
            </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header */}

            {/* Form Card */}
            <View className="px-5 mt-6">
                <View className="bg-white rounded-2xl px-5 py-6">
                {/* Name */}
                <Text className="text-base font-semibold text-gray-700 mb-1">
                    Full Name
                </Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    editable={editing}
                    placeholder="Enter your name"
                    placeholderTextColor="#999"
                    className="bg-gray-100 rounded-xl px-4 py-3 mb-4 text-black"
                />

                {/* Age Group */}
                <Text className="text-base font-semibold text-gray-700 mb-1">
                    Age Group
                </Text>
                <TouchableOpacity
                    className="bg-gray-100 rounded-xl px-4 py-3 mb-2 flex-row justify-between items-center"
                    disabled={!editing}
                >
                    <Text className="text-black">
                    {ageGroup || "Select age group"}
                    </Text>
                    {editing && (
                    <MaterialIcons
                        name="arrow-drop-down"
                        size={24}
                        color="#888"
                    />
                    )}
                </TouchableOpacity>

                {/* Age Selection */}
                {editing && (
                    <View className="mb-4">
                    {ageGroups.map((group) => (
                        <TouchableOpacity
                        key={group}
                        className="py-2"
                        onPress={() => setAgeGroup(group)}
                        >
                        <Text
                            className={`text-base ${
                            ageGroup === group
                                ? "text-violet-600 font-semibold"
                                : "text-gray-700"
                            }`}
                        >
                            {group}
                        </Text>
                        </TouchableOpacity>
                    ))}
                    </View>
                )}

                {/* Location */}
                <Text className="text-base font-semibold text-gray-700 mb-1">
                    Location
                </Text>
                <TextInput
                    value={location}
                    onChangeText={setLocation}
                    editable={editing}
                    placeholder="Enter your location"
                    placeholderTextColor="#999"
                    className="bg-gray-100 rounded-xl px-4 py-3 mb-4 text-black"
                />

                {/* Profession */}
                <Text className="text-base font-semibold text-gray-700 mb-1">
                    Work Profession
                </Text>
                <TextInput
                    value={profession}
                    onChangeText={setProfession}
                    editable={editing}
                    placeholder="Enter your profession"
                    placeholderTextColor="#999"
                    className="bg-gray-100 rounded-xl px-4 py-3 mb-4 text-black"
                />

                {/* Company */}
                <Text className="text-base font-semibold text-gray-700 mb-1">
                    Company
                </Text>
                <TextInput
                    value={company}
                    onChangeText={setCompany}
                    editable={editing}
                    placeholder="Enter your profession"
                    placeholderTextColor="#999"
                    className="bg-gray-100 rounded-xl px-4 py-3 mb-4 text-black"
                />

                {/* Save Button */}
                {editing && (
                    <TouchableOpacity
                    className="bg-violet-600 py-3 rounded-xl items-center mt-2"
                    onPress={handleSave}
                    >
                    <Text className="text-white font-semibold text-base">
                        Save Changes
                    </Text>
                    </TouchableOpacity>
                )}
                </View>

                {/* Fetch Events Button */}
                <TouchableOpacity
                onPress={async () => {
                    try {
                    await getEvents();
                    Alert.alert("Success", "Events fetched successfully!");
                    console.log("Fetched Events:", events);
                    } catch (e) {
                    Alert.alert("Error", "Failed to fetch events.");
                    console.error(e);
                    }
                }}
                className="mt-4"
                >
                <View className="bg-white rounded-xl py-3 items-center shadow-sm">
                    <Text className="text-violet-600 font-semibold text-base">
                    Fetch Calendar Events
                    </Text>
                </View>
                </TouchableOpacity>

                {/* Logout Button */}
                <TouchableOpacity onPress={handleLogout} className="mt-6">
                <View className="bg-white rounded-xl py-3 items-center shadow-sm">
                    <Text className="text-violet-600 font-semibold text-base">
                    Logout
                    </Text>
                </View>
                </TouchableOpacity>
            </View>
            </ScrollView>
        </ImageBackground>
        </View>
    </ErrorBoundary>
  );
}
