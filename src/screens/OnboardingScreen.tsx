import ChatInput from '@/components/ChatInput';
import ContactSelector from '@/components/ContactSelector';
import LoadingIndicator from '@/components/LoadingMessage';
import MessageList from '@/components/MessageList';
import SuccessPopup from '@/components/SuccessPopup';
import TypingIndicator from '@/components/TypingIndicator';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Message } from '@/types';
import { ImageIcons } from '@/utils/ImageIcons';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, ImageBackground, Keyboard, KeyboardAvoidingView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
    const flatListRef = useRef<FlatList<Message> | null>(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
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

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <ImageBackground
                source={ImageIcons.BackgroundImage}
                resizeMode="cover"
                style={{ flex: 1 }}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Header */}
                    <View className="flex items-start border-b border-gray-200 p-5 bg-white/90">
                        <Text className="text-black text-2xl font-bold">{profileSetupStatus?.completed ? 'Zirkl Chat' : 'Onboarding'}</Text>
                    </View>

                    {/* Main Content */}
                    <View
                        style={{ flex: 1, gap: 16 }}
                    >
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

                        {/* Chat input pinned to bottom */}
                        <KeyboardAvoidingView
                            behavior='padding'
                            keyboardVerticalOffset={isKeyboardVisible ? 80 : 0}
                        >
                            <ChatInput
                                userInput={userInput}
                                setUserInput={setUserInput}
                                onTextSubmit={profileSetupStatus?.completed ? handleGlobalChatTextSubmit : handleTextSubmit}
                                isWaitingForResponse={isWaitingForResponse}
                            />
                        </KeyboardAvoidingView>
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
                </SafeAreaView>
            </ImageBackground>
        </View>
    );
} 