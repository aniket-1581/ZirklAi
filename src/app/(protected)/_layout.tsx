import { Stack, useRouter } from 'expo-router';
import Protected from '@/components/Protected';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { requestAllPermissions } from '@/utils/requestAllPermissions';
export default function ProtectedLayout() {
    const { isAuthenticated, profileSetupStatus } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (isAuthenticated && profileSetupStatus?.is_completed === true && profileSetupStatus?.current_step === 8) {
            requestAllPermissions();
            router.replace('/(protected)/(tabs)/home');
        } else if (isAuthenticated && profileSetupStatus?.is_completed === false && profileSetupStatus?.next_step === 1) {
            router.replace('/profile-completion/persona');
        } else if (isAuthenticated && profileSetupStatus?.is_completed === false && profileSetupStatus?.next_step === 2) {
            router.replace('/profile-completion/user-challanges');
        } else if (isAuthenticated && profileSetupStatus?.is_completed === false && profileSetupStatus?.next_step === 3) {
            router.replace('/profile-completion/strategy');
        } else if (isAuthenticated && profileSetupStatus?.is_completed === false && profileSetupStatus?.next_step === 4) {
            router.replace('/profile-completion/engagement-plan');
        } else if (isAuthenticated && profileSetupStatus?.is_completed === false && profileSetupStatus?.next_step === 5) {
            router.replace('/profile-completion/update-profile');
        } else if (isAuthenticated && profileSetupStatus?.is_completed === false && profileSetupStatus?.next_step === 6) {
            router.replace('/profile-completion/contact-sync');
        } else if (isAuthenticated && profileSetupStatus?.is_completed === false && profileSetupStatus?.next_step === 7) {
            router.replace('/profile-completion/expertise-level');
        } else if (isAuthenticated && profileSetupStatus?.is_completed === false && profileSetupStatus?.next_step === 8) {
            router.replace('/profile-completion/start-networking');
        }
    }, [router, isAuthenticated, profileSetupStatus]);
    return (
        <Protected>
            <Stack screenOptions={{ headerShown: false, navigationBarHidden: true }} />
        </Protected>
    );  
}
