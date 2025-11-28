import React, { useRef } from "react";
import {
  Modal,
  TouchableWithoutFeedback,
  View,
  TouchableOpacity,
  Text,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { addToContacts } from "@/utils/ScannerService";

interface ModalInfoProps {
  modalVisible: boolean;
  closeModal: () => void;
  modalInfo: any;
  loading?: boolean;
}

export default function ModalInfo({
  modalVisible,
  closeModal,
  modalInfo,
  loading,
}: ModalInfoProps) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const bg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ["#e6e6e6", "#f4f4f4"],
  });
  const Skeleton = ({
    height,
    width,
    radius = 8,
    style = {},
  }: {
    height: number;
    width: string;
    radius?: number;
    style?: any;
  }) => (
    <Animated.View
      style={[
        {
          height,
          width,
          borderRadius: radius,
          backgroundColor: bg,
          marginBottom: 14,
        },
        style,
      ]}
    />
  );
  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (loading) return;
        closeModal();
      }}
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          if (loading) return;
          closeModal();
        }}
      >
        <View className="flex-1 bg-[rgba(0,0,0,0.6)] justify-center items-center">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-xl p-5 w-[85%]">
              <TouchableOpacity
                onPress={closeModal}
                className="absolute top-2 right-2 p-2"
              >
                <Feather name="x" size={20} color="black" />
              </TouchableOpacity>

              <Text className="text-lg font-semibold mb-4">
                📇 Contact Info
              </Text>
              {loading ? (
                <>
                  {/* Title skeleton */}
                  <Skeleton height={22} width={"50%"} />

                  {/* Body text skeleton */}
                  <Skeleton height={70} width={"100%"} radius={10} />

                  {/* Buttons row */}
                  <View className="flex-row justify-between mt-4">
                    <Skeleton height={45} width={"48%"} radius={10} />
                    <Skeleton height={45} width={"48%"} radius={10} />
                  </View>
                </>
              ) : (
                <Text className="text-base mb-5">
                  {modalInfo?.formattedInfo}
                </Text>
              )}

              <View className="flex-row justify-between gap-5 mt-4">
                <TouchableOpacity
                  className={`flex-1 bg-green-600 py-3 rounded-lg items-center ${loading ? "opacity-50" : ""}`}
                  onPress={() => {
                    addToContacts(modalInfo?.contactData);
                    closeModal();
                  }}
                  disabled={loading}
                >
                  <Text className="text-white font-semibold">Save Contact</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 bg-gray-200 py-3 rounded-lg items-center ${loading ? "opacity-50" : ""}`}
                  onPress={closeModal}
                  disabled={loading}
                >
                  <Text className="text-gray-800 font-semibold">Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
