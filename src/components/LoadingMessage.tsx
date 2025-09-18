import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface LoadingMessageProps {
  isLoading: boolean;
  message?: string;
}

export default function LoadingMessage({ isLoading, message = "Setting up your onboarding..." }: LoadingMessageProps) {
  if (!isLoading) return null;

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text className="mt-4 text-gray-600">{message}</Text>
    </View>
  );
} 