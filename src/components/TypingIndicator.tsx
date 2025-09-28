import React from 'react';
import { View } from 'react-native';

interface TypingIndicatorProps {
  isWaitingForResponse: boolean;
}

export default function TypingIndicator({ isWaitingForResponse }: TypingIndicatorProps) {
  if (!isWaitingForResponse) return null;

  return (
    <View className="mb-4 items-start px-5">
      <View className="bg-gray-100 rounded-2xl py-3">
        <View className="flex-row space-x-1">
          <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
          <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
          <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        </View>
      </View>
    </View>
  );
} 