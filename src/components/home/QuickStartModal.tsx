import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface QuickStartModalProps {
  visible: boolean;
  onClose: () => void;
  data: any; // quickStartOptions[index].knowMore
}

export default function QuickStartModal({
  visible,
  onClose,
  data,
}: QuickStartModalProps) {
  if (!data) return null;

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      onRequestClose={onClose}
      statusBarTranslucent={true}
      navigationBarTranslucent={true}
    >
      <View className="flex-1 bg-black/60 justify-end">
        {/* Close on background tap */}
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Popup Content */}
        <View className="w-full rounded-t-3xl bg-[#3A327B]">
          {/* Header */}
          <View className="w-full flex-row justify-between mb-5 border-b border-white/20">
            <View className="flex-1 flex-row items-center gap-3 p-5">
                <LinearGradient
                    colors={data.bgColor}
                    style={{
                        width: 50,
                        height: 60,
                        borderRadius: 15,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Feather name={data.icon} size={28} color="white" />
                </LinearGradient>
              <View>
                <Text className="text-white font-bold text-2xl">
                  {data.title}
                </Text>
                <Text className="text-white/80 text-base w-[80%]">
                  {data.description}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} className="p-5">
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Steps */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            className="px-6 max-h-[60vh]"
          >
            {data.cards.map((card: any, index: number) => (
              <View
                key={index}
                className="bg-white/10 rounded-2xl p-4 mb-4 border border-white/20"
              >
                <View className="flex-row gap-4 items-start">
                  <LinearGradient
                    colors={data.bgColor}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text className="text-white font-bold text-lg">
                      {index + 1}
                    </Text>
                  </LinearGradient>

                  <View className="flex-1">
                    <Text className="text-white font-semibold text-lg">
                      {card.title}
                    </Text>
                    <Text className="text-white/80 leading-6 mt-1">
                      {card.description}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            <View className="bg-black/10 rounded-2xl p-4 mt-2 mb-4 flex-row gap-2">
                <MaterialIcons name="auto-awesome" size={14} color="#F59E0B" className="mt-1" />
                <View className="flex-1">
                    <Text className="text-white text-base">Ready to try it?</Text>
                    <Text className="text-white/70 text-sm">
                    {data.subText}
                    </Text>
                </View>
            </View>
          </ScrollView>

          {/* Start Button */}
          <LinearGradient
            colors={data.bgColor}
            style={{
              marginHorizontal: 20,
              borderRadius: 10,
              marginVertical: 24,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                data.action()
                onClose()
            }}
              className="py-4 items-center"
            >
              <Text className="text-white font-semibold text-lg">
                Start Now
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}
