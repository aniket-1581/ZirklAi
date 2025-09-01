import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ImageBackground, TextInput, Image, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import Toast from 'react-native-toast-message';
import { ImageIcons } from '@/utils/ImageIcons';
import { GradientBorderButton } from '@/components/GradientBorderButton';

const OtpScreen = () => {
    const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputsRef = useRef<Array<TextInput | null>>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { loginWithOtp, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        inputsRef.current[0]?.focus(); // Auto-focus only once
    }, []);

    const handleChange = (text: string, index: number) => {
        if (/^\d$/.test(text)) {
            const newOtp = [...otp];
            newOtp[index] = text;
            setOtp(newOtp);
            if (index < 5) inputsRef.current[index + 1]?.focus();
        } else if (text === '') {
            const newOtp = [...otp];
            newOtp[index] = '';
            setOtp(newOtp);
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        setError(null);
        const code = otp.join('');
        if (!code || code.length !== 6) {
            setError('OTP is required.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await loginWithOtp(phoneNumber, code);
            if (result.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Login Successful',
                });
            } else {
                setError(result.error || 'Invalid OTP');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!phoneNumber) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <Text className="text-red-500 text-lg">Missing phone number</Text>
            </SafeAreaView>
        );
    }

    return (
        <ImageBackground
            source={ImageIcons.OnboardingScreen}
            resizeMode="cover"
            className="flex-1"
        >
            <SafeAreaView className="flex-1 justify-start px-5 mt-10">
                <Image source={ImageIcons.Logo} className="w-32 h-32 mb-4" />
                <Text className="text-[42px] font-normal text-black mb-4">Enter verification code</Text>

                <View className="flex-row justify-between w-full px-5 mb-10">
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => {
                                inputsRef.current[index] = ref;
                            }}
                            className="w-12 h-14 rounded-lg border border-gray-600 text-black text-center text-xl"
                            keyboardType="number-pad"
                            maxLength={1}
                            value={digit}
                            onChangeText={(text) => handleChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                        />

                    ))}
                </View>

                {error && <Text className="text-red-500 mt-2 text-base">{error}</Text>}

                <KeyboardAvoidingView
                    behavior="padding"
                    keyboardVerticalOffset={10}
                    className="absolute bottom-14 left-5 right-5"
                >
                    <GradientBorderButton
                        title={isLoading ? 'Verifying...' : 'Verify OTP'}
                        onPress={handleVerify}
                        isLoading={isLoading}
                    />
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
};

export default OtpScreen;
