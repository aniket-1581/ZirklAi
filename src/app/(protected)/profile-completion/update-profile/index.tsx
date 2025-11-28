import { getStepData, setUserProfile } from "@/api/profile";
import KeyboardAvoidingLayout from "@/components/KeyboardAvoidingLayout";
import NetworkIntro from "@/components/profile/NetworkIntro";
import { ProfileCompletionBar } from "@/components/ProfileCompletionBar";
import { useAuth } from "@/context/AuthContext";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function UpdateProfile() {
  const { user } = useAuth();
  const { profileSetupStatus, token, getProfileSetupStatus } = useAuth();
  const [formValues, setFormValues] = useState<any>({});
  const [showPopUp, setShowPopUp] = useState<boolean>(true);
  const [locating, setLocating] = useState<boolean>(false);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) ? null : 'Please enter a valid email address';
  };

  const validateField = (name: string, value: string) => {
    if (name === 'email') {
      return validateEmail(value);
    }
    return null;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === 'email') {
      const error = validateField(field, formValues[field] || '');
      setErrors(prev => ({
        ...prev,
        [field]: error || ''
      }));
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormValues((prev: any) => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error || ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Only validate email if it exists in the form
    if ('email' in formValues) {
      const emailError = validateEmail(formValues.email || '');
      if (emailError) {
        newErrors.email = emailError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    // Only check for errors in fields that have been touched
    const hasErrors = Object.entries(errors).some(([field, error]) => 
      touched[field] && error
    );
    return !hasErrors;
  };


  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (token) {
        await setUserProfile(token, formValues);
        getProfileSetupStatus();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  useEffect(() => {
    const fetchStepData = async () => {
      try {
        const res = await getStepData(token!, profileSetupStatus?.next_step as number);
        setFormValues(res.fields);
        setCompletionPercentage(res.completion_percentage);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStepData();
  }, [profileSetupStatus, token]);

  const handleInputChange = (key: string, value: string) => {
    handleChange(key, value);
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
    if (!token) return;
    const res = await setUserProfile(token!, formValues);
    if (res) {
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
      <ProfileCompletionBar progress={completionPercentage} />
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
            {Object.keys(formValues).filter(key => {
              if (user?.persona === 'Student' && key === 'company') {
                return false;
              }
              return true;
            }).map((key) => (
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
                  className={`bg-[#4C4495] border ${errors[key] ? 'border-red-500' : 'border-white/10'} rounded-xl py-[10px] px-4 text-white`}
                />
                {errors[key] && (
                  <Text className="text-red-400 text-xs mt-1">{errors[key]}</Text>
                )}
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
          onPress={handleSubmit}
          activeOpacity={0.9}
          className="bg-white rounded-xl py-4 px-6 items-center mt-6"
          disabled={!isFormValid()}
          style={{ opacity: isFormValid() ? 1 : 0.6 }}
        >
          <Text className="text-[#3A327B] text-center font-semibold text-base">
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
