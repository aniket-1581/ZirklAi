import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

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
  isWaitingForResponse,
}: ChatInputProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 16,
        marginHorizontal: 16,
        paddingHorizontal: 12,
      }}
    >
      <TextInput
        style={{
          flex: 1,
          color: "black",
          fontSize: 16,
          height: 48,
          backgroundColor: "white",
        }}
        placeholder="Type here..."
        placeholderTextColor="#888"
        value={userInput}
        onChangeText={setUserInput}
        onSubmitEditing={onTextSubmit}
        returnKeyType="send"
      />
      <TouchableOpacity
        onPress={onTextSubmit}
        disabled={!userInput.trim() || isWaitingForResponse}
        className={`ml-2 ${!userInput.trim() || isWaitingForResponse ? "opacity-50" : ""}`}
      >
        <MaterialIcons
          name="send"
          size={20}
          color={
            !userInput.trim() || isWaitingForResponse ? "#9CA3AF" : "#6B7280"
          }
        />
      </TouchableOpacity>
    </View>
  );
}
