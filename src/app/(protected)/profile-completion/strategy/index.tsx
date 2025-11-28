import { getStepData, setUserStrategy } from "@/api/profile";
import NetworkIntro from "@/components/profile/NetworkIntro";
import { ProfileCompletionBar } from "@/components/ProfileCompletionBar";
import { useAuth } from "@/context/AuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function Strategy() {
  const { profileSetupStatus, token, getProfileSetupStatus } = useAuth();
  const [stepData, setStepData] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showPopUp, setShowPopUp] = useState<boolean>(true);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);

  useEffect(() => {
    const fetchStepData = async () => {
      try {
        const res = await getStepData(token!, profileSetupStatus?.next_step as number);
        setStepData(res);
        setCompletionPercentage(res.completion_percentage);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStepData();
  }, [profileSetupStatus, token]);

  const icons: Record<string, any> = {
    full_focus: <MaterialIcons name="my-location" size={22} color="#C6BFFF" />,
    task_done: <MaterialIcons name="check-circle-outline" size={18} color="#C6BFFF" />,
    habit_loop: <MaterialIcons name="loop" size={18} color="#C6BFFF" />,
    routines: <MaterialIcons name="sunny-snowing" size={22} color="#C6BFFF" />,
    gameful: <MaterialIcons name="gamepad" size={22} color="#C6BFFF" />,
  };

  const handleNext = async () => {
    if (selected) {
      const res = await setUserStrategy(token!, selected);
      if (res) {
        await getProfileSetupStatus();
      }
    }
  };

  const onClose = () => {
    setShowPopUp(false);
  };

  return showPopUp ? (
    <NetworkIntro
      step={profileSetupStatus?.next_step!}
      title={`Ready to build\nyour Network?`}
      description={`Meet every day a networking opportunity, \nGrow your connections, discover \nopportunities, and unlock hidden pathways \nto success.`}
      onClose={onClose}
    />
  ) : (
    <View className="flex-1 bg-[#3A327B]">
      <ProfileCompletionBar progress={completionPercentage} />
        <View className="flex-1 pt-24 px-6">
            {/* Header */}
            <Text className="text-white text-2xl font-bold text-center mb-4">
                Choose your Technique
            </Text>
            <Text className="w-[80%] mx-auto text-[#C7C2ED] text-base text-center mb-3">
                Our AI will guide you through the approach that best fits your style.
            </Text>

            {/* Options */}
            <View className="flex gap-[10px] mt-10">
                {stepData?.strategy_options?.map((item: any, index: number) => (
                <TouchableOpacity
                    key={item.key}
                    onPress={() => setSelected(item.label)}
                    activeOpacity={0.8}
                    className={`flex-row bg-black/15 rounded-xl px-6 items-center justify-between py-[14px] border border-white/10`}
                >
                    <View className="flex-row items-center">
                    <View className="bg-black/20 p-3 rounded-full mr-4">
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
            className="bg-white rounded-full py-4"
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
