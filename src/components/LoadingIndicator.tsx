import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface LoadingIndicatorProps {
  isLoading: boolean;
  message?: string;
}

export default function LoadingIndicator({ isLoading, message = "Setting up your onboarding..." }: LoadingIndicatorProps) {
  if (!isLoading) return null;

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text className="mt-4 text-gray-600">{message}</Text>
    </View>
  );
} 