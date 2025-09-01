import { Stack, useRouter } from 'expo-router';
import Protected from '@/components/Protected';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
export default function ProtectedLayout() {
    const { isAuthenticated, profileSetupStatus } = useAuth();
    const router = useRouter();
    console.log(profileSetupStatus)
    useEffect(() => {
        if (isAuthenticated && profileSetupStatus?.completed !== false && profileSetupStatus?.current_step === 'complete') {
            router.replace('/(protected)/(tabs)/home');
        } else if (isAuthenticated && profileSetupStatus?.completed === false) {
            router.replace('/onboarding-flow');
        } 
    }, [router, isAuthenticated, profileSetupStatus]);
    return (
        <Protected>
            <Stack screenOptions={{ headerShown: false, navigationBarHidden: true }} />
        </Protected>
    );  
}
