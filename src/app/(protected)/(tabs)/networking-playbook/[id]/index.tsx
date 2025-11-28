import { getNetworkingPlaybook, PlaybookResponse } from "@/api/journal";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function PlaybookDetailScreen() {
  const { id } = useLocalSearchParams();
  const [playbook, setPlaybook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const loadPlaybook = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNetworkingPlaybook();
      const foundPlaybook = data.playbooks.find(
        (p: PlaybookResponse) => p.page === id
      );
      if (foundPlaybook) {
        setPlaybook(foundPlaybook);
      }
    } catch (error) {
      console.error("Error loading playbook:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlaybook();
  }, [loadPlaybook]);

  return (
    <View className="flex-1 bg-[#3A327B] justify-start">
      <View className="pt-12 px-6 bg-[#3A327B]">
        <View className="flex-row items-center justify-between">
          
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>

          {/* Title Block */}
          <View className="flex-1 flex-row items-center justify-center ml-[-26px]">
            <View className="bg-gradient-to-br from-purple-400 to-pink-400 p-3 rounded-full mr-3">
              <Ionicons name="people" size={26} color="white" />
            </View>

            <View>
              <Text className="text-white text-2xl font-semibold text-center">
                {playbook?.header?.title || playbook?.title}
              </Text>

              <Text className="text-purple-200 text-base font-medium text-center -mt-1">
                {playbook?.header?.subtitle || playbook?.subtitle}
              </Text>
            </View>
          </View>

          {/* Spacer for symmetry */}
          <View style={{ width: 26 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 80 }}
        ref={scrollRef}
      >
        {/* Header Section */}
        <View className="mb-2 items-center px-6">
          <Text className="text-purple-100 text-center mt-2">
            {playbook?.header?.description}
          </Text>
        </View>

        {/* Framework Section */}
        <View className="bg-white mx-5 rounded-3xl p-6 shadow-md">
          <Text className="text-purple-600 font-semibold mb-3 text-lg">
            ─ The Framework
          </Text>

          {playbook?.framework?.map((section: any, index: number) => (
            <View
              key={index}
              className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-100"
            >
              <View className="flex-row items-center mb-3">
                <Text className="text-gray-900 font-semibold text-lg">
                  {section.title}
                </Text>
              </View>

              {section.steps?.map((step: string, stepIndex: number) => (
                <View key={stepIndex} className="flex-row items-start mt-1">
                  <Text className="text-purple-400 mr-2">•</Text>
                  <Text className="text-gray-700 flex-1">{step}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Why It Works */}
        <View className="bg-white mx-5 mt-8 rounded-3xl p-6 shadow-md">
          <Text className="text-purple-600 font-semibold mb-3 text-lg">
            ─ Why It Works
          </Text>

          {playbook?.benefits?.map((benefit: any, index: number) => (
            <View
              key={index}
              className="bg-purple-100/60 rounded-lg p-3 mb-3 flex-row items-center"
            >
              <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
              <Text className="ml-3 text-gray-800 flex-1">{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Smart Nudging Support */}
        <View className="bg-white mx-5 mt-8 rounded-3xl p-6 shadow-md mb-8 opacity-40">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-purple-600 font-semibold text-lg">
              ─ Smart Nudging Support
            </Text>

            <View className="bg-purple-200 px-3 py-1 rounded-full">
              <Text className="text-purple-700 font-semibold text-xs">
                Coming Soon
              </Text>
            </View>
          </View>

          <View className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <View className="flex-row items-center mb-3">
              <View className="bg-amber-400/60 p-2 rounded-full mr-3">
                <Ionicons name="notifications" size={18} color="white" />
              </View>
              <Text className="font-semibold text-gray-700 text-base">
                Automated Reminders
              </Text>
            </View>

            {playbook?.nudges?.map((nudge: string, idx: number) => (
              <View key={idx} className="flex-row mt-1 items-start">
                <Text className="text-amber-600 mr-2">→</Text>
                <Text className="text-gray-700 flex-1">{nudge}</Text>
              </View>
            ))}
          </View>
        </View>


        {/* Bottom Badge */}
        <View className="items-center mt-4">
          <View className="bg-purple-600 rounded-full px-6 py-3 shadow-lg">
            <Text className="text-white font-semibold text-sm">
              {playbook?.badgeText ||
                "15 minutes/week • 572 yearly touchpoints"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
