import { getNotes } from '@/api/notes';
import { getDraftMessageSuggestions } from '@/api/chat';
import { useAuth } from '@/context/AuthContext';
import { ImageIcons } from '@/utils/ImageIcons';
import React, { useEffect, useState } from 'react';
import { Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
    const { token, user } = useAuth();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messageSuggestions, setMessageSuggestions] = useState<Record<string, string>>({});
    const router = useRouter();

    const fetchNotes = async () => {
        setLoading(true);
        setError(null);
        try {
            const notes = await getNotes(token!) as any[];
            const validNotes = Array.isArray(notes) ? notes.filter(note => note && typeof note === 'object') : [];
            setContacts(validNotes);
        } catch (e) {
            console.error('Error fetching notes:', e);
            setError('Failed to load opportunities');
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessageSuggestions = async (note_id: string) => {
        try {
            const res = await getDraftMessageSuggestions(note_id, token as string, user?.goal as string) as any;
            const suggestion = res?.message?.response || 'Message suggestion unavailable';
            setMessageSuggestions(prev => ({ ...prev, [note_id]: suggestion }));
        } catch (error) {
            console.error('Error fetching message suggestion:', error);
            setMessageSuggestions(prev => ({ ...prev, [note_id]: 'Message suggestion unavailable' }));
        }
    };

    useEffect(() => {
        if (token) {
            fetchNotes();
        }
    }, [token]);

    useEffect(() => {
        if (contacts.length > 0) {
            contacts.forEach(contact => {
                if (contact?.id) {
                    fetchMessageSuggestions(contact.id);
                }
            });
        }
    }, [contacts]);

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
                    <Text className="text-xl font-bold text-black">Today’s Opportunities</Text>
                </View>

                {/* Opportunity Cards */}
                <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                    {loading ? (
                        <View className="flex-1 justify-center items-center py-20">
                            <Text className="text-gray-600">Loading opportunities...</Text>
                        </View>
                    ) : error ? (
                        <View className="flex-1 justify-center items-center py-20">
                            <Text className="text-red-600">{error}</Text>
                            <TouchableOpacity 
                                className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
                                onPress={() => {
                                    setError(null);
                                    if (token) fetchNotes();
                                }}
                            >
                                <Text className="text-white">Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : contacts.length === 0 ? (
                        <View className="flex-1 justify-center items-center py-20">
                            <Text className="text-gray-600">No opportunities available</Text>
                        </View>
                    ) : (
                        contacts.map((item, index) => (
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
                                        <Text className="font-semibold text-base text-black">{item.contact_name || 'Unknown Contact'}</Text>
                                        <Text className="text-sm text-gray-500">{item?.work_profession || 'No profession listed'}</Text>
                                    </View>
                                </View>
                                <View className="bg-yellow-400 rounded-full px-2 py-1">
                                    <Text className="text-xs font-semibold text-white">
                                        {item.updated_at ? item.updated_at.split('T')[0] : 'N/A'}
                                    </Text>
                                </View>
                            </View>

                            {/* Message */}
                            {item.content && <Text className="text-sm text-black mt-2">{item.content.slice(0, 100)}...</Text>}
                            <View className="flex-row items-center mt-2">
                                <Text className="text-lg mr-2">💡</Text>
                                <Text className="text-sm text-gray-600">
                                    {messageSuggestions[item.id] || 'Loading suggestion...'}
                                </Text>
                            </View>

                            {/* Buttons */}
                            <View className="flex-row justify-between mt-4 gap-3">
                                <TouchableOpacity className="flex-1 bg-gray-100 py-2 rounded-xl items-center">
                                    <Text className="text-gray-600 font-semibold">Remind me Later</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    className="flex-1 bg-[#4725FC] py-2 rounded-xl items-center"
                                    onPress={() => {
                                        router.push({
                                            pathname: `/(protected)/(tabs)/chats/${item.id as string}`,
                                            params: {
                                                draftMessage: messageSuggestions[item.id] || ''
                                            }
                                        });
                                    }}
                                >
                                    <Text className="text-white font-semibold">Draft Message</Text>
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
