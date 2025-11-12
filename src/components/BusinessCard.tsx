import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View, Text, Image } from "react-native";

interface BusinessCardProps {
  name: string;
  company: string;
  designation: string;
  email: string;
  mobile: string;
  address: string;
  qrBase64: string;
}

const BusinessCard: React.FC<BusinessCardProps> = ({
  name,
  company,
  designation,
  email,
  mobile,
  address,
  qrBase64,
}) => {
  const qrSrc = qrBase64.startsWith("data:")
    ? qrBase64
    : `data:image/png;base64,${qrBase64}`;

  return (
    <LinearGradient 
      colors={["#C546E1", "#4725FC"]} 
      style={{
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        height: 200,
        borderRadius: 16,
        padding: 16,
        margin: 16,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#fff',
      }}
    >
      {/* Header with decorative elements */}
      <View className="flex-col justify-center">
        <View className="flex-1">
          {/* Name */}
          <Text className="text-white text-xl font-bold mb-1">{name}</Text>

          {/* Designation */}
          <Text className="text-[#e4e2f6] text-base font-semibold mb-1">
            {designation}
          </Text>

          {/* Company */}
          <Text className="text-[#e4e2f6] text-base font-medium mb-1">{company}</Text>
          {/* Contact Information */}
          {email && (
                <Text className="text-[#e4e2f6] text-base flex-1">{email}</Text>
            )}

            {mobile && (
                <Text className="text-[#e4e2f6] text-base flex-1">{mobile}</Text>
            )}

            {address && (
                <Text className="text-[#e4e2f6] text-base flex-1">{address}</Text>
            )}
        </View>
      </View>
      {/* QR Code */}
      <View className="">
        <View className="bg-white rounded-lg shadow-md">
          <Image
            source={{ uri: qrSrc }}
            className="w-28 h-28 rounded"
            resizeMode="cover"
          />
        </View>
        <Text className="text-[#C7C2ED] text-lg text-center mt-1 font-medium">
          Scan Me
        </Text>
      </View>
    </LinearGradient>
  );
};

export default BusinessCard;
