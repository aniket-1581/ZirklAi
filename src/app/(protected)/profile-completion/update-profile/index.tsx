import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getStepData, setUserProfile } from "@/api/profile";
import NetworkIntro from "@/components/profile/NetworkIntro";
import Toast from "react-native-toast-message";
import KeyboardAvoidingLayout from "@/components/KeyboardAvoidingLayout";
import * as Location from "expo-location";

export default function UpdateProfile() {
  const { profileSetupStatus, token, getProfileSetupStatus } = useAuth();
  const [formValues, setFormValues] = useState<any>({});
  const [showPopUp, setShowPopUp] = useState<boolean>(true);
  const [locating, setLocating] = useState<boolean>(false);

  useEffect(() => {
    const fetchStepData = async () => {
      try {
        const res = await getStepData(token!, profileSetupStatus?.next_step!);
        setFormValues(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStepData();
  }, [profileSetupStatus, token]);

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleGetLocation = async () => {
    if (!token) return;
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Error",
          "Location Permission is required to get your location."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (address?.length) {
        const formatted = [
          address[0].city,
          address[0].region,
          address[0].country,
        ]
          .filter(Boolean)
          .join(", ");

        setFormValues((prev: any) => ({ ...prev, location: formatted }));
      } else {
        Alert.alert("Error", "Could not determine address.");
      }
    } catch (err) {
      console.error("Location error:", err);
      Alert.alert("Error", "Failed to get location. Please try again.");
    } finally {
      setLocating(false);
    }
  };

  const handleNext = async () => {
    const res = await setUserProfile(token!, formValues);
    if (res) {
      Toast.show({
        type: "success",
        text1: "Profile updated successfully",
        text2: "Bonus: Zirkl captures business card instantly",
      });
      await getProfileSetupStatus();
    }
  };

  const onClose = () => setShowPopUp(false);

  if (showPopUp) {
    return (
      <NetworkIntro
        step={profileSetupStatus?.next_step!}
        title="Master Networking"
        description="Want to experience the confidence of mastering networking? Every meaningful connection is a step toward your goals."
        onClose={onClose}
      />
    );
  }

  return (
    <View className="flex-1 bg-[#3A327B]">
      <KeyboardAvoidingLayout>
        {/* Header */}
        <View className="pt-24 px-6">
          <Text className="text-white text-2xl font-bold text-center mb-3">
            Your Smart Business Card
          </Text>
          <Text className="w-[80%] mx-auto text-[#C7C2ED] text-base text-center">
            Never run out of cards again. Share instantly.
          </Text>
        </View>

        {/* Scrollable Form */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="px-6 mt-10"
        >
          <View className="flex gap-4 bg-black/15 rounded-md p-5">
            {Object.keys(formValues).map((key) => (
              <View key={key} className="mb-3">
                <Text className="text-[#C6BFFF] mb-[7px] capitalize text-sm">
                  {key.replace("_", " ")} *
                </Text>
                <TextInput
                  value={formValues[key]}
                  onChangeText={(text) => handleInputChange(key, text)}
                  keyboardType={key === "email" ? "email-address" : "default"}
                  autoCapitalize="none"
                  placeholder={`Enter your ${key
                    .replace("_", " ")
                    .toLowerCase()}`}
                  placeholderTextColor="#C7C2ED"
                  className="bg-[#4C4495] border border-white/10 rounded-xl py-[10px] px-4 text-white"
                />
                {key === "location" && (
                  <TouchableOpacity
                    onPress={handleGetLocation}
                    activeOpacity={0.9}
                    className="items-start mt-[7px]"
                    style={{ opacity: locating ? 0.6 : 1 }}
                  >
                    <View className="flex-row items-center">
                      <Text className="text-blue-400 text-base mr-2">
                        Use Current Location
                      </Text>
                      {locating && (
                        <ActivityIndicator size="small" color="#60A5FA" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingLayout>

      {/* Next Button */}
      <View className="absolute bottom-8 left-6 right-6">
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.9}
          className="bg-[#C7C2ED] rounded-full py-4"
        >
          <Text className="text-[#3A327B] text-center font-semibold text-base">
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
