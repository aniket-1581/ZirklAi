import { Fontisto, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import CrystalSphereButton from '@/components/CrystalSphereButton';


export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => {
                const hiddenRoute = route.name === 'chats/[id]/index';
                return {
                    headerShown: false,
                    tabBarStyle: hiddenRoute ? { display: 'none' } : { backgroundColor: '#FFFFFF', height: 80, paddingTop: 10 },
                    tabBarActiveTintColor: '#4725FC',
                    tabBarInactiveTintColor: '#35383E',
                }
            }}
        >
            <Tabs.Screen
                name="home/index"
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <View className="items-center">
                            <MaterialIcons name="home" color={color} size={size} />
                        </View>
                    ),
                    tabBarLabelStyle: {
                        fontSize: 10,
                        fontWeight: '400',
                    },
                }}
            />
            <Tabs.Screen
                name="chats/index"
                options={{
                    tabBarLabel: 'Chat',
                    tabBarIcon: ({ color, size }) => (
                        <View className="items-center">
                            <MaterialIcons name="chat" color={color} size={size} />
                        </View>
                    ),
                    tabBarLabelStyle: {
                        fontSize: 10,
                        fontWeight: '400',
                    },
                }}
            />
            {/* Center Floating Button (e.g., Add) */}
            <Tabs.Screen
                name="global-chat/index"
                options={{
                    tabBarLabel: '',
                    tabBarButton: (props) => (
                    <View style={{
                        alignSelf: 'center'
                    }}>
                        <CrystalSphereButton onPress={props.onPress} />
                    </View>
                    )
                }}
            />
            <Tabs.Screen
                name="notifications/index"
                options={{
                    tabBarLabel: 'Notifications',
                    tabBarIcon: ({ color, size }) => (
                        <Fontisto name="bell" color={color} size={size} />
                    ),
                    tabBarLabelStyle: {
                        fontSize: 10,
                        fontWeight: '400',
                    },
                }}
            />
            <Tabs.Screen
                name="profile/index"
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="person-outline" color={color} size={size} />
                    ),
                    tabBarLabelStyle: {
                        fontSize: 10,
                        fontWeight: '400',
                    },
                }}
            />
            <Tabs.Screen
                name="chats/[id]/index"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}