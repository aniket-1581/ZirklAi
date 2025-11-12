import * as Camera from 'expo-camera';
import * as Contacts from 'expo-contacts';
import * as Calendar from 'expo-calendar';
import * as Audio from 'expo-av';
import * as Device from 'expo-device';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Requests all required permissions sequentially.
 * Returns true if all granted, false otherwise.
 */
export async function requestAllPermissions(): Promise<boolean> {
  try {
    // --- CAMERA ---
    const { status: cameraStatus } = await Camera.Camera.requestCameraPermissionsAsync();
    if (cameraStatus !== 'granted') return false;

    // --- MICROPHONE / AUDIO RECORDING ---
    const { status: audioStatus } = await Audio.Audio.requestPermissionsAsync();
    if (audioStatus !== 'granted') return false;

    // --- CONTACTS ---
    const { status: contactStatus } = await Contacts.requestPermissionsAsync();
    if (contactStatus !== 'granted') return false;

    // --- CALENDAR ---
    const { status: calendarStatus } = await Calendar.requestCalendarPermissionsAsync();
    if (calendarStatus !== 'granted') return false;

    // --- ANDROID ONLY PERMISSIONS ---
    if (Platform.OS === 'android') {
      // READ_CALL_LOG, READ_PHONE_STATE, WRITE_CONTACTS
      const androidPermissions = [
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS,
      ];

      const results = await PermissionsAndroid.requestMultiple(androidPermissions);

      const allGranted = Object.values(results).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
}
