import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ChatInputProps {
  userInput: string;
  setUserInput: (text: string) => void;
  onTextSubmit: () => void;
  isWaitingForResponse: boolean;
}

export default function ChatInput({
  userInput,
  setUserInput,
  onTextSubmit,
  isWaitingForResponse
}: ChatInputProps) {
  return (
    <View className='px-5' style={{ paddingBottom: 20}}>
      <View className="flex-row items-center bg-white rounded-full px-5 py-1 shadow-sm border border-gray-100">
        <TextInput
          value={userInput}
          onChangeText={setUserInput}
          onSubmitEditing={onTextSubmit}
          placeholder="+ Type here..."
          placeholderTextColor="#9CA3AF"
          className="flex-1 text-base text-gray-900"
          multiline
          maxLength={500}
          editable={!isWaitingForResponse}
          returnKeyType='send'
          returnKeyLabel='Send'
        />
        <TouchableOpacity
          onPress={onTextSubmit}
          disabled={!userInput.trim() || isWaitingForResponse}
          className={`ml-2 ${!userInput.trim() || isWaitingForResponse ? 'opacity-50' : ''}`}
        >
          <MaterialIcons
            name="send"
            size={20}
            color={!userInput.trim() || isWaitingForResponse ? "#9CA3AF" : "#6B7280"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}