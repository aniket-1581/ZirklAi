import * as Notifications from 'expo-notifications';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function registerAndSendFcmToken(token: string) {
  // Request permissions even on emulators; token fetch will still be restricted to real devices
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const devicePush = await Notifications.getDevicePushTokenAsync();
  const fcmToken = (devicePush as any)?.data ?? (devicePush as unknown as { data?: string })?.data;
  console.log("fcmToken", fcmToken)
  if (!fcmToken) return null;

  try {
    await fetch(`${BASE_URL}/me/notification-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token: fcmToken }),
    });
  } catch {
    // Swallow network errors; token will be retried on next app start/login
  }

  return fcmToken;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
}

export async function getNotifications(token: string, limit: number = 50, skip: number = 0): Promise<NotificationItem[]> {
  const url = new URL(`${BASE_URL}/api/v1/notifications/`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('skip', String(skip));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}


