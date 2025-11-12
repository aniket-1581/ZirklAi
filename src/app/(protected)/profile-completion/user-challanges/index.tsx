import { getStepData, setUserChallenges } from "@/api/profile";
import { useAuth } from "@/context/AuthContext";
import {
  Entypo,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function UserChallenges() {
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
    fear_of_rejection: (
      <MaterialIcons name="trending-up" size={22} color="#fff" />
    ),
    dont_know_where_to_start: (
      <FontAwesome5 name="briefcase" size={18} color="#fff" />
    ),
    not_feeling_good_enough: (
      <FontAwesome5 name="graduation-cap" size={18} color="#fff" />
    ),
    no_time: <Ionicons name="bulb-outline" size={22} color="#fff" />,
    hate_self_promotion: <Entypo name="home" size={22} color="#fff" />,
    feels_fake: <FontAwesome5 name="user-tie" size={20} color="#fff" />,
  };

  const handleNext = async () => {
    if (selected) {
      const res = await setUserChallenges(token!, selected);
      if (res) {
        await getProfileSetupStatus();
      }
    }
  };

  return (
    <View className="flex-1 bg-[#3A327B] justify-between">
      <View className="flex-1 pt-24 px-6">
        {/* Header */}
        <Text className="text-white text-2xl font-bold text-center mb-4">
          What’s holding you back?
        </Text>
        <Text className="w-2/3 mx-auto text-[#C7C2ED] text-base text-center mb-3">
          Identify the hurdles and I will help you make you happen
        </Text>

        {/* Options */}
        <View className="bg-black/15 rounded-md px-5 mt-10">
          {stepData?.user_challenges_options?.map(
            (item: any, index: number) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => setSelected(item.label)}
                activeOpacity={0.8}
                className={`flex-row items-center justify-between py-[14px] ${index !== stepData?.user_challenges_options?.length - 1 ? "border-b border-white/10" : ""}`}
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
            )
          )}
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
