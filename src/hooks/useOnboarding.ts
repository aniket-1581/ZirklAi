import { createNote } from '@/api/notes';
import {
  getConversationHistory,
  getOnboardingStep,
  saveOnboardingResponse
} from '@/api/onboarding';
import { getPhoneContacts, setPhoneContacts } from '@/api/profile';
import { useAuth } from '@/context/AuthContext';
import { useContactSync } from '@/hooks/useContactSync';
import ContactSyncService from '@/utils/ContactSyncService';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Contact, Message, Option } from '@/types';
import { ONBOARDING_STEPS } from '@/constants/OnboardingSteps';

// Utility for delay
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function useOnboarding() {
  const {
    token,
    user,
    getUserDetails,
    getProfileSetupStatus,
    profileSetupStatus
  } = useAuth();

  const { syncContacts, refreshContacts } = useContactSync();

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('welcome');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [syncedContactsCount, setSyncedContactsCount] = useState(0);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedContacts, setSavedContacts] = useState<Contact[]>([]);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState('');
  const router = useRouter();

  const loadConversationHistory = async () => {
    if (!token) return;
    try {
      const history = await getConversationHistory(token);
      if (history.conversations?.length) {
        setMessages(history.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const loadSavedContacts = async () => {
    if (!token) return;
    try {
      const contactsData = await getPhoneContacts(token) as any;
      const contacts = contactsData?.contacts || [];
      setSavedContacts(contacts);
    } catch (error) {
      console.error('Failed to load saved contacts:', error);
      setSavedContacts([]);
    }
  };

  const initializeOnboarding = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      await loadConversationHistory();

      const hasAnswered = messages.some(
        (msg) => msg.role === 'user' && msg.step === currentStep
      );

      if (!hasAnswered && !profileSetupStatus?.completed) {
        const stepData = await getOnboardingStep(token);
        await loadConversationHistory();
        setCurrentStep(stepData.next_step || 'welcome');
      } else {
        const answeredSteps = messages
          .filter((msg) => msg.role === 'user' && msg.step)
          .map((msg) => msg.step);

        const nextUnansweredStep =
          ONBOARDING_STEPS.find((step) => !answeredSteps.includes(step)) || 'complete';
        setCurrentStep(nextUnansweredStep);
      }
    } catch (error) {
      console.error('Failed to initialize onboarding:', error);
      Alert.alert('Error', 'Failed to start onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLocation = async () => {
    if (!token) return;
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Location Permission is required to get your location.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (address?.length) {
        const formatted = [address[0].city, address[0].region, address[0].country]
          .filter(Boolean)
          .join(', ');

        setLocation(formatted);

        await saveOnboardingResponse(token, {
          response: formatted
        });

        const nextStep = await getOnboardingStep(token);
        if (nextStep.next_step) setCurrentStep(nextStep.next_step);

        await loadConversationHistory();
      } else {
        Alert.alert('Error', 'Could not determine address.');
      }
    } catch (err) {
      console.error('Location error:', err);
      Alert.alert('Error', 'Failed to get location. Please try again.');
    } finally {
      setLocating(false);
    }
  };

  const handleOptionSelect = async (option: string | Option) => {
    if (!token || isWaitingForResponse) return;
    setIsWaitingForResponse(true);
    try {
      const text = typeof option === 'string' ? option : option.text;
      console.log(option);

      await saveOnboardingResponse(token, {
        response: text
      });

      const next = await getOnboardingStep(token);
      if (next.next_step) setCurrentStep(next.next_step);

      await loadConversationHistory();
    } catch (error) {
      console.error('Option select failed:', error);
      Alert.alert('Error', 'Failed to save your response.');
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handleContactSync = async () => {
    if (!token) return;
    setIsWaitingForResponse(true);
    try {
      // Wait for contact sync to complete and get the result
      const success = await syncContacts();
      
      // Wait a bit for state to update, then refresh contacts to get the latest data
      await delay(500);
      await refreshContacts();
      
      // Get the current contacts after sync
      const currentContacts = await ContactSyncService.getStoredContacts();

      if (success && currentContacts.length > 0) {
        const formatted = currentContacts.map((c) => ({
          name: c.name,
          phoneNumber: c.phoneNumber,
          email: c.emails,
        }));

        await setPhoneContacts(token, formatted);

        setSyncedContactsCount(currentContacts.length);
        setShowSuccessPopup(true);

        await saveOnboardingResponse(token, {
          response: `${currentContacts.length} contacts successfully synced`
        });

        await delay(2000);

        const next = await getOnboardingStep(token);
        if (next.next_step) setCurrentStep(next.next_step);

        await loadConversationHistory();
        await loadSavedContacts();
        await getUserDetails();
        setShowSuccessPopup(false);
      } else {
        Alert.alert('Error', 'No contacts synced. Please check your contacts permission and try again.');
      }
    } catch (error) {
      console.error('Contact sync error:', error);
      Alert.alert('Error', 'Failed to sync contacts. Please try again.');
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handleContactSelection = async () => {
    if (!token) return;
    setIsWaitingForResponse(true);
    try {
      const selected = (savedContacts || [])
        .filter((c) => selectedContacts.includes(c.name))
        .map((c) => ({
          contact_id: c.id,
          contact_name: c.name,
          goals: [
            {
              text: user?.goal,
              completed: false,
            },
          ],
        }))
        .filter((c) => c.contact_name && c.contact_name !== 'Unknown Contact');

      if (selected.length === 0) {
        Alert.alert('Error', 'No valid contacts selected.');
        return;
      }

      await createNote(token, selected);

      await saveOnboardingResponse(token, {
        response: `${selectedContacts.length} contacts selected`
      });

      await delay(1000);

      const next = await getOnboardingStep(token);
      if (next.next_step) setCurrentStep(next.next_step);

      await loadConversationHistory();
      setShowContactSelector(false);
    } catch (error) {
      console.error('Contact selection failed:', error);
      Alert.alert('Error', 'Failed to save contacts.');
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handleComplete = async () => {
    if (!token) return;
    setIsWaitingForResponse(true);
    try {
      await saveOnboardingResponse(token, {
        response: "Let's Start"
      });

      await delay(1000);

      const next = await getOnboardingStep(token);
      if (next.next_step) setCurrentStep(next.next_step);

      await loadConversationHistory();
      await getProfileSetupStatus();
      await getUserDetails();
      await delay(1000);

      router.replace('/(protected)/(tabs)/home');
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      Alert.alert('Error', 'Failed to complete onboarding.');
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!token || !userInput.trim() || isWaitingForResponse) return;

    const input = userInput.trim();
    setUserInput('');
    setIsWaitingForResponse(true);

    try {
      await saveOnboardingResponse(token, {
        response: input
      });

      const next = await getOnboardingStep(token);
      if (next.next_step) setCurrentStep(next.next_step);

      await loadConversationHistory();
    } catch (error) {
      console.error('Text submit failed:', error);
      Alert.alert('Error', 'Failed to save your response.');
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const handleGlobalChatTextSubmit = async () => {
    if (!token || !userInput.trim() || isWaitingForResponse) return;

    const input = userInput.trim();
    setUserInput('');
    setIsWaitingForResponse(true);

    try {
      await saveOnboardingResponse(token, {
        response: input
      });
      await loadConversationHistory();
    } catch (error) {
      console.error('Text submit failed:', error);
      Alert.alert('Error', 'Failed to save your response.');
    } finally {
      setIsWaitingForResponse(false);
    }
  };

  const toggleContactSelection = (contactName: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactName)
        ? prev.filter((name) => name !== contactName)
        : [...prev, contactName]
    );
  };

  useEffect(() => {
    if (token) {
      loadSavedContacts();
      initializeOnboarding();
    }
  }, [token]);

  return {
    // State
    messages,
    currentStep,
    userInput,
    isLoading,
    isWaitingForResponse,
    showSuccessPopup,
    syncedContactsCount,
    showContactSelector,
    selectedContacts,
    searchQuery,
    savedContacts,
    location,
    locating,
    profileSetupStatus,
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
    // Utilities
    loadConversationHistory,
    loadSavedContacts,
  };
}
