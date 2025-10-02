import React, { useCallback } from 'react';
import { Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCalendar } from '@/hooks/useCalendar';
import { ImageIcons } from '@/utils/ImageIcons';

export default function Home() {
    const { events, getEvents } = useCalendar();
    const router = useRouter();

    // Refetch data when screen comes into focus (tab is selected)
    useFocusEffect(
        useCallback(() => {
            console.log('Home screen focused - refetching data');
            getEvents(); // Refetch calendar events when tab is selected
        }, [getEvents])
    );

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
                    <Text className="text-xl font-bold text-black">Today&apos;s Reminders</Text>
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
                </ScrollView>
            </ImageBackground>
        </View>
    );
}
