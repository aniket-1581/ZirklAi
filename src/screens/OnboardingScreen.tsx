import ChatInput from "@/components/ChatInput";
import ContactSelector from "@/components/ContactSelector";
import KeyboardLayout from "@/components/KeyboardAvoidingLayout";
import LoadingIndicator from "@/components/LoadingMessage";
import MessageList from "@/components/MessageList";
import SuccessPopup from "@/components/SuccessPopup";
import TypingIndicator from "@/components/TypingIndicator";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Message } from "@/types";
import { ImageIcons } from "@/utils/ImageIcons";
import React, { useRef } from "react";
import {
  FlatList,
  ImageBackground,
  Text,
  View,
} from "react-native";

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList<Message> | null>(null);
  const {
    // State
    messages,
    userInput,
    currentStep,
    isLoading,
    isWaitingForResponse,
    showSuccessPopup,
    syncedContactsCount,
    showContactSelector,
    selectedContacts,
    searchQuery,
    savedContacts,

    // Setters
    setUserInput,
    setSearchQuery,
    setShowContactSelector,
    setShowSuccessPopup,

    // Handlers
    handleOptionSelect,
    handleContactSync,
    handleContactSelection,
    handleComplete,
    handleTextSubmit,
    toggleContactSelection,
    handleGetLocation,
    handleGlobalChatTextSubmit,
    locating,
    profileSetupStatus,
  } = useOnboarding();

  return (
    <ImageBackground
      source={ImageIcons.BackgroundImage}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
        <KeyboardLayout>
            {/* Header */}
            <View className="flex items-start border-b border-gray-200 p-5 bg-white/90">
                <Text className="text-black text-2xl font-bold">
                {profileSetupStatus?.completed ? "Zirkl Chat" : "Onboarding"}
                </Text>
            </View>

            {/* Main Content */}
            <View style={{ flex: 1, gap: 16 }}>
                <View style={{ flex: 1 }}>
                <LoadingIndicator isLoading={isLoading} />

                <MessageList
                    messages={messages}
                    isWaitingForResponse={isWaitingForResponse}
                    onOptionSelect={handleOptionSelect}
                    onContactSync={handleContactSync}
                    onContactSelection={() => setShowContactSelector(true)}
                    onComplete={handleComplete}
                    flatListRef={flatListRef}
                    handleGetLocation={handleGetLocation}
                    locating={locating}
                    currentStep={currentStep}
                />

                <TypingIndicator isWaitingForResponse={isWaitingForResponse} />
                </View>

                <ChatInput
                    userInput={userInput}
                    setUserInput={setUserInput}
                    onTextSubmit={
                    profileSetupStatus?.completed
                        ? handleGlobalChatTextSubmit
                        : handleTextSubmit
                    }
                    isWaitingForResponse={isWaitingForResponse}
                />
            </View>

            {/* Modals and overlays */}
            {showSuccessPopup && (
                <SuccessPopup
                syncedContactsCount={syncedContactsCount}
                onClose={() => setShowSuccessPopup(false)}
                />
            )}

            <ContactSelector
                showContactSelector={showContactSelector}
                selectedContacts={selectedContacts}
                searchQuery={searchQuery}
                savedContacts={savedContacts}
                isWaitingForResponse={isWaitingForResponse}
                onClose={() => setShowContactSelector(false)}
                onSearchChange={setSearchQuery}
                onContactToggle={toggleContactSelection}
                onDone={handleContactSelection}
                onContactSync={handleContactSync}
            />
        </KeyboardLayout>
    </ImageBackground>
  );
}
