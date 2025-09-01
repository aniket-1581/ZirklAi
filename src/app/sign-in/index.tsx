import { GradientBorderButton } from '@/components/GradientBorderButton';
import { useAuth } from '@/context/AuthContext';
import { ImageIcons } from '@/utils/ImageIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ImageBackground, KeyboardAvoidingView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const LoginScreen = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login, user } = useAuth();

    useEffect(() => {
        if (user) {
            router.replace('/(protected)/(tabs)/home');
        }
    }, [user, router]);

    const handleContinue = async () => {
        setError(null);
        if (!phoneNumber) {
            setError('Phone number is required.');
            return;
        }
        setIsLoading(true);
        try {
            await login(phoneNumber);
        } catch (err: any) {
            setError(err.message || 'Failed to request OTP');
            Toast.show({ type: 'error', text1: 'OTP Error', text2: err.message || 'Failed to request OTP' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className='flex-1'>
            <ImageBackground
                source={ImageIcons.OnboardingScreen}
                resizeMode="cover"
                className="flex-1"
            >
                <SafeAreaView className="flex-1 justify-start px-5 mt-10">
                    <Image source={ImageIcons.Logo} className='w-32 h-32' />
                    <Text className="text-[42px] font-normal text-black mb-4">Sign in with mobile number</Text>

                    <View className="flex-row items-center bg-white rounded-xl overflow-hidden mt-2">
                        <View className="flex-row items-center px-5 py-3 border-r border-gray-200 bg-gray-100">
                            <Text className="text-xl mr-1">🇮🇳</Text>
                            <Text className="text-lg font-semibold">+91</Text>
                        </View>
                        <TextInput
                            placeholder="8009877658"
                            placeholderTextColor={'#999'}
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            className="flex-1 px-5 py-3 text-lg text-black"
                        />
                    </View>

                    {error && <Text className="text-red-500 mt-2 text-base">{error}</Text>}
                    <KeyboardAvoidingView
                        behavior="padding"
                        keyboardVerticalOffset={10}
                        className="absolute bottom-14 left-5 right-5"
                    >
                        <GradientBorderButton
                            title={isLoading ? 'Requesting...' : 'Get Verification Code'}
                            onPress={handleContinue}
                            isLoading={isLoading}
                        />
                    </KeyboardAvoidingView>

                </SafeAreaView>
            </ImageBackground>
        </View>
    );
};

export default LoginScreen;
