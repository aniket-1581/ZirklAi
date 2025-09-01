import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';
import { Redirect } from 'expo-router';

interface ProtectedProps {
  children: React.ReactNode;
}

const Protected: React.FC<ProtectedProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#151922]">
        <ActivityIndicator size="large" color="#6E9EFF" />
        <Text className="mt-2 text-gray-400">Loading session...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  return children;
};

export default Protected;