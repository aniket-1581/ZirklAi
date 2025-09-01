import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface SuccessPopupProps {
  syncedContactsCount: number;
  onClose: () => void;
}

export default function SuccessPopup({
  syncedContactsCount,
  onClose
}: SuccessPopupProps) {
  return (
    <View className="absolute inset-0 bg-black/50 justify-center items-center">
      <View className="bg-white rounded-3xl p-8 mx-6 items-center">
        {/* Success Icon */}
        <View className="w-20 h-20 rounded-full border-4 border-green-500 items-center justify-center mb-4">
          <MaterialIcons name="check" size={40} color="#10B981" />
        </View>
        
        {/* Contact Count */}
        <Text className="text-4xl font-bold text-black mb-2">{syncedContactsCount}</Text>
        
        {/* Success Message */}
        <Text className="text-lg text-black text-center mb-8">
          Potential opportunities just unlocked
        </Text>
        
        {/* Done Button */}
        <TouchableOpacity
          onPress={onClose}
          className="bg-white border-2 border-purple-500 rounded-full px-8 py-3"
        >
          <Text className="text-black font-semibold text-lg">Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 