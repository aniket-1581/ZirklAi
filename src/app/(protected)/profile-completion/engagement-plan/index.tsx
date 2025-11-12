import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getStepData, setUserEngagementPlan } from "@/api/profile";
import { Ionicons } from "@expo/vector-icons";
import NetworkIntro from "@/components/profile/NetworkIntro";
import Toast from "react-native-toast-message";

export default function EngagementPlan() {
  const { profileSetupStatus, token, getProfileSetupStatus } = useAuth();
  const [stepData, setStepData] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showPopUp, setShowPopUp] = useState<boolean>(true);

  useEffect(() => {
    const fetchStepData = async () => {
      try {
        const res = await getStepData(token!, profileSetupStatus?.next_step!);
        setStepData(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStepData();
  }, [profileSetupStatus, token]);

  const handleNext = async () => {
    if (selected) {
      const res = await setUserEngagementPlan(token!, selected);
      if (res) {
        await getProfileSetupStatus();
        Toast.show({ type: "success", text1: "Engagement Plan Set" });
      }
    }
  };

  const onClose = () => {
    setShowPopUp(false);
  };

  return showPopUp ? (
    <NetworkIntro
      step={profileSetupStatus?.next_step!}
      title={`Transform your Network?`}
      description={`You are missing connections that could \nchange everything. \nLet Zirkl make everything natural.`}
      onClose={onClose}
      quote={
        "Your network is your net worth. Let \nme help you build meaningful \nconnections that open doors."
      }
      quoteAuthor={"-Sarah Chen"}
    />
  ) : (
    <View className="flex-1 bg-[#3A327B]">
      <View className="flex-1 pt-24 px-6">
        {/* Header */}
        <Text className="text-white text-2xl font-bold text-center mb-4">
          Set your Pace
        </Text>
        <Text className="w-[80%] mx-auto text-[#C7C2ED] text-base text-center mb-3">
          How many people do you want to connect in each week?
        </Text>

        {/* Options */}
        <View className="flex gap-[10px] mt-10">
          {stepData?.engagement_plan_options?.map(
            (item: any, index: number) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => setSelected(item.label)}
                activeOpacity={0.8}
                className={`flex-row items-center justify-between bg-black/15 rounded-xl py-[14px] px-5 border border-white/10`}
              >
                <View className="flex-col">
                  <Text className="text-white text-base font-medium">
                    {item.label}
                  </Text>
                  <Text className="text-[#C6BFFF] text-base font-medium">
                    {item.description}
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
