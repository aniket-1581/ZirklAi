import React, { JSX } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Feather, FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { ImageIcons } from "@/utils/ImageIcons";
import { getGender } from "gender-detection-from-name";

interface BusinessCardProps {
  name: string;
  company: string;
  designation: string;
  email: string;
  mobile: string;
  address: string;
  qrBase64: string;
  setEditing: () => void;
  persona: string;
}

const BusinessCard: React.FC<BusinessCardProps> = ({
  name,
  company,
  designation,
  email,
  mobile,
  address,
  qrBase64,
  setEditing,
  persona
}) => {
  const qrSrc = qrBase64.startsWith("data:")
    ? qrBase64
    : `data:image/png;base64,${qrBase64}`;

  const gender = getGender(name.split(" ")[0]);
  const avatar = gender === "male" ? ImageIcons.MaleAvatar : ImageIcons.FemaleAvatar;

  const Row = ({ icon, text }: { icon: () => JSX.Element; text: string }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {icon()}
      <Text
        style={{
          color: "white",
          marginLeft: 14,
          fontSize: 16,
        }}
      >
        {text}
      </Text>
    </View>
  );

  return (
    <View
      className="w-full bg-[#27215B] rounded-2xl overflow-hidden p-3 mt-5"
    >
      {/* ---------------------- TOP HEADER ---------------------- */}
      <View className="flex-row p-5 bg-white items-center justify-between rounded-t-lg">
        {/* LEFT: Avatar + Name */}
        <View className="flex justify-center items-center">
          <View>
              {/* Avatar Wrapper */}
              <Image
                source={avatar}
                className="w-24 h-24 rounded-full"
              />
              <TouchableOpacity className="absolute top-0 right-0 bg-[#7A71BD] rounded-full p-2" onPress={setEditing}>
                <FontAwesome6 name='pencil' size={18} color="white" />
              </TouchableOpacity>
          </View>
            {/* Name */}
            <Text
              className="text-lg font-bold text-black"
            >
              {name}
            </Text>
        </View>

        {/* Right: QR Code */}
        <View className="flex justify-center items-center">
          <Image
            source={{ uri: qrSrc }}
            className="w-24 h-24"
          />
          <Text className="text-[#444A8E] text-xs mt-1 font-medium">
            Scan to share card
          </Text>
        </View>
      </View>

      {/* ---------------------- BOTTOM CONTENT ---------------------- */}
      <View
        className="px-2 py-5 gap-5"
      >
        {/* Designation */}
        <Row icon={() => <Feather name="briefcase" size={20} color="#FFFFFF" />} text={designation} />

        {/* Company */}
        {persona !== 'Student' && (
          <Row icon={() => <FontAwesome5 name="building" size={20} color="#FFFFFF" />} text={company} />
        )}

        {/* Email */}
        <Row icon={() => <Feather name="mail" size={20} color="#FFFFFF" />} text={email} />

        {/* Mobile */}
        <Row icon={() => <Feather name="phone" size={20} color="#FFFFFF" />} text={mobile} />

        {/* Address */}
        <Row icon={() => <Feather name="map-pin" size={20} color="#FFFFFF" />} text={address} />
      </View>
    </View>
  );
};

export default BusinessCard;
