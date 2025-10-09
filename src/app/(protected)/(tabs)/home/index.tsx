import { useAuth } from '@/context/AuthContext';
import { useCalendar } from '@/hooks/useCalendar';
import { useNudges } from '@/hooks/useNudges';
import { ImageIcons } from '@/utils/ImageIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, Clipboard, Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function Home() {
    const { events, getEvents } = useCalendar();
    const { nudges, loading: nudgesLoading, fetchNudges } = useNudges();
    const { token } = useAuth();
    const router = useRouter();

    // Refetch data when screen comes into focus (tab is selected)
    useFocusEffect(
        useCallback(() => {
            console.log('Home screen focused - refetching data');
            getEvents(); // Refetch calendar events when tab is selected
            if (token) {
                fetchNudges(token); // Refetch nudges when tab is selected
            }
        }, [getEvents, fetchNudges, token])
    );

    const handleCopyNudge = async (message: string) => {
        try {
            await Clipboard.setString(message);
            Alert.alert('Copied!', 'Nudge message copied to clipboard');
        } catch {
            Alert.alert('Error', 'Failed to copy message');
        }
    };

    return (
        <View className='flex-1'>
            <ImageBackground
                source={ImageIcons.BackgroundImage}
                className="flex-1 bg-white"
                resizeMode="cover"
            >
                {/* Header */}
                <Image source={ImageIcons.Logo} className='w-32 h-32 mx-4' />

                {/* Section Title */}
                <View className="px-5 pb-2">
                    <Text className="text-xl font-bold text-black">Reminders</Text>
                </View>

                {/* Reminder Cards */}
                <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                    {events.length === 0 ? (
                        <View className="flex-1 justify-center items-center py-20">
                            <Text className="text-gray-600">No reminders available</Text>
                        </View>
                    ) : (
                        events.map((event, index) => (
                        <View
                            key={index}
                            className="bg-white mx-5 mt-4 p-4 rounded-2xl shadow-sm border border-gray-100"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 3,
                                elevation: 2,
                            }}
                        >
                            {/* Header Row */}
                            <View className="flex-row items-center justify-between mb-1">
                                <View className="flex-row items-center">
                                    <View>
                                        <Text className="font-semibold text-base text-black">{event.title}</Text>
                                    </View>
                                </View>
                                <View className="bg-blue-400 rounded-full px-2 py-1">
                                    <Text className="text-xs font-semibold text-white">
                                        {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row items-center mt-2">
                                <Text className="text-lg mr-2">📅</Text>
                                <Text className="text-sm text-gray-600">
                                    {event.startDate ? new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No time set'}
                                </Text>
                            </View>

                            {/* Event Notes */}
                            {event.notes && (
                                <View className="mt-2">
                                    <Text className="text-sm text-gray-500">{event.notes.slice(0, 100)}</Text>
                                </View>
                            )}

                            {/* Buttons */}
                            <View className="flex-row justify-between mt-4 gap-3">
                                <TouchableOpacity className="flex-1 bg-gray-100 py-2 rounded-xl items-center">
                                    <Text className="text-gray-600 font-semibold">Edit Reminder</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-1 bg-[#4725FC] py-2 rounded-xl items-center"
                                    onPress={() => {
                                        // Navigate to global chat or wherever makes sense for the reminder
                                        router.push('/(protected)/(tabs)/global-chat');
                                    }}
                                >
                                    <Text className="text-white font-semibold">Open Chat</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                    )}

                    {/* Nudges Section */}
                    <View className="px-5 pb-2 mt-6">
                        <Text className="text-xl font-bold text-black">Nudges</Text>
                    </View>

                    {nudgesLoading ? (
                        <View className="flex-1 justify-center items-center py-10">
                            <Text className="text-gray-600">Loading nudges...</Text>
                        </View>
                    ) : nudges.length === 0 ? (
                        <View className="flex-1 justify-center items-center py-10">
                            <Text className="text-gray-600">No nudges available</Text>
                        </View>
                    ) : (
                        nudges.map((nudge) => (
                            <View
                                key={nudge._id}
                                className="bg-white mx-5 mt-4 p-4 rounded-2xl shadow-sm border border-gray-100"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 3,
                                    elevation: 2,
                                }}
                            >
                                {/* Header Row */}
                                <View className="flex-row items-center justify-between mb-1">
                                    <View className="flex-row items-center">
                                        <View>
                                            <Text className="font-semibold text-base text-black">
                                                To: {nudge.contact_name}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="bg-blue-400 rounded-full px-2 py-1">
                                        <Text className="text-xs font-semibold text-white">
                                            Nudge
                                        </Text>
                                    </View>
                                </View>

                                {/* Message */}
                                <View className="mt-2">
                                    <Text className="text-sm text-gray-700">{nudge.message.slice(0, 150)}{nudge.message.length > 150 ? '...' : ''}</Text>
                                </View>

                                {/* Buttons */}
                                <View className="flex-row justify-between mt-4 gap-3">
                                    <TouchableOpacity
                                        className="flex-1 bg-gray-100 py-2 rounded-xl items-center"
                                        onPress={() => handleCopyNudge(nudge.message)}
                                    >
                                        <Text className="text-gray-600 font-semibold">📋 Copy Message</Text>
                                    </TouchableOpacity>
                                    {/* <TouchableOpacity
                                        className="flex-1 bg-[#4725FC] py-2 rounded-xl items-center"
                                        onPress={() => {
                                            // Navigate to global chat for nudge
                                            router.push('/(protected)/(tabs)/global-chat');
                                        }}
                                    >
                                        <Text className="text-white font-semibold">💬 Open Chat</Text>
                                    </TouchableOpacity> */}
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            </ImageBackground>
        </View>
    );
}
