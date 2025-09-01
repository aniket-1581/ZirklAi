import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  className?: string;
};

export const Button = ({ title, onPress, isLoading, className }: Props) => {
  return (
    <View
        className={`p-[2px] mt-12 ${className || ''}`}
        style={{ borderRadius: 9999 }}
    >
      <TouchableOpacity
        onPress={onPress}
        className="bg-white rounded-full py-4 items-center justify-center"
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text className="text-base font-semibold text-black">
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
