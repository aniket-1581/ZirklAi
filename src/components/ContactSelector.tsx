import React from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { GradientBorderButton } from '@/components/GradientBorderButton';
import { Button } from './Button';

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
  onContactSync
}: ContactSelectorProps) {
  const filteredContacts = (savedContacts || []).filter(contact =>
    (contact.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!showContactSelector) return null;

  return (
    <View className="absolute inset-0 bg-white">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex flex-row items-center p-5 justify-between">
          <Text className="text-xl font-bold text-black">Choose people who can {'\n'}help you move forward.</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="black" />
          </TouchableOpacity>
        </View>

        {/* Selection Info */}
        <View className="flex-row items-center justify-between px-5 py-2">
          <Text className="text-sm font-bold text-black">Select multiple</Text>
          <Text className="text-sm text-gray-600">{selectedContacts.length}/{savedContacts?.length || 0} selected</Text>
        </View>

        {/* Search Bar */}
        <View className="px-5 py-2">
          <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
            <MaterialIcons name="search" size={20} color="gray" />
            <TextInput
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder="Search Contact"
              className="flex-1 ml-2 text-base"
            />
          </View>
        </View>

        {/* Contact List */}
        <FlatList
          data={filteredContacts}
          keyExtractor={(item, index) => `${item.id || item.phoneNumber || index}-${item.name}`}
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const contactName = item.name || item.contact_name || 'Unknown';
            return (
              <TouchableOpacity
                onPress={() => onContactToggle(contactName)}
                className="flex-row items-center py-3 border-b border-gray-100"
              >
                {/* Avatar */}
                <View className="w-10 h-10 bg-purple-200 rounded-full items-center justify-center mr-3">
                  <Text className="text-purple-600 font-semibold">
                    {contactName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Contact Name */}
                <Text className="flex-1 text-base text-black">{contactName}</Text>

                {/* Checkbox */}
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedContacts.includes(contactName)
                  ? 'bg-purple-500 border-purple-500'
                  : 'border-gray-300'
                  }`}>
                  {selectedContacts.includes(contactName) && (
                    <MaterialIcons name="check" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Done Button */}
        <GradientBorderButton 
          title='Done'
          onPress={onDone}
          className={`absolute right-5 left-5 ${filteredContacts.length === 0 ? 'bottom-10' : 'bottom-28'}`}
        />
        {filteredContacts.length === 0 && (
          <Button
            title='Sync Contacts'
            onPress={onContactSync}
            className='absolute bottom-10 right-5 left-5 !bg-green-500 text-white'
          />
        )}
      </SafeAreaView>
    </View>
  );
} 