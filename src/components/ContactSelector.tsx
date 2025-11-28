import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { Button } from "./Button";

interface ContactSelectorProps {
  showContactSelector: boolean;
  selectedContacts: string[];
  searchQuery: string;
  savedContacts: any[];
  isWaitingForResponse: boolean;
  onClose: () => void;
  onSearchChange: (text: string) => void;
  onContactToggle: (contactName: string) => void;
  onDone: () => void;
  onContactSync: () => void;
}

export default function ContactSelector({
  showContactSelector,
  selectedContacts,
  searchQuery,
  savedContacts,
  isWaitingForResponse,
  onClose,
  onSearchChange,
  onContactToggle,
  onDone,
  onContactSync,
}: ContactSelectorProps) {
  const inputRef = useRef<TextInput>(null);

  if (!showContactSelector) return null;

  const filteredContacts = (savedContacts || []).filter((contact) =>
    (contact.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="absolute inset-0 bg-[#3A327B]">
      <SafeAreaView className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center justify-between pt-6">
          <Text className="text-white text-xl font-semibold leading-6">
            Choose people who can{"\n"}help you move forward.
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className="bg-white/10 p-2 rounded-full"
          >
            <MaterialIcons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Selection Info */}
        <View className="flex-row items-center justify-between py-3">
          <Text className="text-[#C7C2ED] text-sm font-medium">
            Select multiple
          </Text>
          <Text className="text-[#C7C2ED] text-sm">
            {selectedContacts.length}/{savedContacts?.length || 0} selected
          </Text>
        </View>

        {/* Search Bar */}
        <Pressable  onPress={() => inputRef.current?.focus()} className="w-full mb-4">
          <View className="flex-row gap-2 justify-between items-center bg-[#c6bfff]/10 border border-white/10 rounded-xl px-3 py-2">
            <MaterialIcons name="search" size={16} color="#C7C2ED" />
            <TextInput
              ref={inputRef}
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder="Search Contact"
              placeholderTextColor="#C7C2ED"
              className="flex-1 text-base text-white pb-2"
            />
          </View>
        </Pressable>

        {/* Contact List */}
        <FlatList
          data={filteredContacts}
          keyExtractor={(item, index) =>
            `${item.id || item.phoneNumber || index}-${item.name}`
          }
          className="flex-1"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const contactName = item.name || item.contact_name || "Unknown";
            const isSelected = selectedContacts.includes(contactName);

            return (
              <TouchableOpacity
                onPress={() => onContactToggle(contactName)}
                className="flex-row items-center py-3 border-b border-white/10"
              >
                {/* Avatar */}
                <View className="w-10 h-10 bg-[#C7C2ED]/20 rounded-full items-center justify-center mr-3">
                  <Text className="text-[#C7C2ED] font-semibold text-lg">
                    {contactName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Contact Name */}
                <Text className="flex-1 text-base text-white">{contactName}</Text>

                {/* Checkbox */}
                <View
                  className={`w-6 h-6 rounded-full items-center justify-center ${
                    isSelected
                      ? "bg-[#C7C2ED] border border-[#C7C2ED]"
                      : "border border-white/20"
                  }`}
                >
                  {isSelected && (
                    <MaterialIcons name="check" size={16} color="#3A327B" />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Bottom Buttons */}
        <View className="py-5">
          <TouchableOpacity
            onPress={onDone}
            activeOpacity={0.9}
            className="bg-[#C7C2ED] rounded-full py-4"
          >
            <Text className="text-[#3A327B] text-center font-semibold text-base">
              Next
            </Text>
          </TouchableOpacity>
          {filteredContacts.length === 0 && (
            <Button
              title="Sync Contacts"
              onPress={onContactSync}
              className="!bg-[#C7C2ED] text-[#3A327B]"
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
