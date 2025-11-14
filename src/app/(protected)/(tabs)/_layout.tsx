import CrystalSphereButton from '@/components/CrystalSphereButton';
import { FontAwesome, Fontisto, MaterialIcons, Octicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { View } from 'react-native';


export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => {
                const hiddenRoute = route.name === 'chats/[id]/index' || route.name === 'global-chat/index' || route.name === 'journal/index';
                return {
                    headerShown: false,
                    tabBarStyle: hiddenRoute ? { display: 'none' } : {
                        backgroundColor: '#FFFFFF',
                        height: 90,
                        paddingTop: 8,
                    },
                    tabBarActiveTintColor: '#4725FC',
                    tabBarInactiveTintColor: '#9CA3AF',
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '500',
                        marginTop: 4,
                    },
                }
            }}
        >
            <Tabs.Screen
                name="home/index"
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <View className="items-center justify-center" style={{ width: 50, height: 50 }}>
                            <Octicons name="home" color={color} size={size} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="chats/index"
                options={{
                    tabBarLabel: 'Chat',
                    tabBarIcon: ({ color, size }) => (
                        <View className="items-center justify-center" style={{ width: 50, height: 50 }}>
                            <MaterialIcons name="chat-bubble-outline" color={color} size={size} />
                        </View>
                    ),
                }}
            />
            {/* Center Floating Button */}
            <Tabs.Screen
                name="global-chat/index"
                options={{
                    tabBarLabel: '',
                    tabBarButton: () => (
                        <View style={{
                            alignSelf: 'center',
                            bottom: 35,
                            elevation: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                        }}>
                            <CrystalSphereButton onPress={() => router.push('/(protected)/(tabs)/global-chat')} />
                        </View>
                    )
                }}
            />
            <Tabs.Screen
                name="journal/index"
                options={{
                    tabBarLabel: 'Journal',
                    tabBarIcon: ({ color, size }) => (
                        <View className="items-center justify-center" style={{ width: 50, height: 50 }}>
                            <FontAwesome name="microphone" color={color} size={size} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile/index"
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <View className="items-center justify-center" style={{ width: 50, height: 50 }}>
                            <Fontisto name="person" color={color} size={size} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="chats/[id]/index"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="notifications/index"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="scanner/index"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="scanner/Overlay"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="networking-playbook/[id]/index"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}