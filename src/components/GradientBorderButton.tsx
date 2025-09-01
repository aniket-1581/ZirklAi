import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  className?: string;
};

export const GradientBorderButton = ({ title, onPress, isLoading, className }: Props) => {
  return (
    <LinearGradient
      colors={['#D165F6', '#C14AF0', '#7B5FFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
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
    </LinearGradient>
  );
};
