import React from 'react';
import { Text, View } from 'react-native';

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("ErrorBoundary caught an error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center p-4 bg-white">
          <Text className="text-red-600 text-lg font-semibold mb-2">Something went wrong</Text>
          <Text className="text-gray-800">{this.state.error?.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}
