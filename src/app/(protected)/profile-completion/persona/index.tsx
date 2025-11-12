import { getStepData, setUserPersona } from "@/api/profile";
import { useAuth } from "@/context/AuthContext";
import {
  Entypo,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function Persona() {
  const { profileSetupStatus, token, getProfileSetupStatus } = useAuth();
  const [stepData, setStepData] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const fetchStepData = async () => {
      try {
        const res = await getStepData(token!, profileSetupStatus?.next_step as number);
        setStepData(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStepData();
  }, [profileSetupStatus, token]);

  const icons: Record<string, any> = {
    sales_professional: (
      <MaterialIcons name="trending-up" size={22} color="#fff" />
    ),
    entrepreneur: <FontAwesome5 name="briefcase" size={18} color="#fff" />,
    student: <FontAwesome5 name="graduation-cap" size={18} color="#fff" />,
    tech_professional: <Ionicons name="bulb-outline" size={22} color="#fff" />,
    homemaker: <Entypo name="home" size={22} color="#fff" />,
    cxo: <FontAwesome5 name="user-tie" size={20} color="#fff" />,
  };

  const handleNext = async () => {
    if (selected) {
      const res = await setUserPersona(token!, selected);
      if (res) {
        await getProfileSetupStatus();
      }
    }
  };

  return (
    <View className="flex-1 bg-[#3A327B]">
      <View className="flex-1 pt-24 px-6">
        {/* Header */}
        <Text className="text-white text-2xl font-bold text-center mb-2">
          Which best describes you?
        </Text>
        <Text className="w-2/3 mx-auto text-[#C7C2ED] text-base text-center mb-8">
          This will help me tailor your experience for you
        </Text>

        {/* Options */}
        <View className="bg-black/15 rounded-md px-5">
          {stepData?.persona_options?.map((item: any, index: number) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setSelected(item.label)}
              activeOpacity={0.8}
              className={`flex-row items-center justify-between py-[14px] ${index !== stepData?.persona_options?.length - 1 ? "border-b border-white/10" : ""}`}
            >
              <View className="flex-row items-center">
                <View className="bg-white/10 p-3 rounded-full mr-4">
                  {icons[item.key]}
                </View>
                <Text className="text-white text-base font-medium">
                  {item.label}
                </Text>
              </View>
              {selected === item.label && (
                <View className="bg-[#C7C2ED] rounded-full p-1">
                  <Ionicons name="checkmark" size={16} color="#3A327B" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {selected && (
        <View className="px-6 pb-10">
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
      )}
    </View>
  );
}
