export const GOOGLE_CONFIG = {
  // Replace with your actual client IDs from Google Cloud Console
  WEB_CLIENT_ID: '102424279215-k9r8snqfs576v0aejtrb9c7puran2hvb.apps.googleusercontent.com',
  ANDROID_CLIENT_ID: '102424279215-5jsp3oe3du9kcg9hpk4hil70k2t02bgp.apps.googleusercontent.com',
  IOS_CLIENT_ID: '102424279215-hlpuesti6jvk8r9a9e6o7r9llilajqvl.apps.googleusercontent.com',
  
  // OAuth endpoints
  DISCOVERY_DOCUMENT: 'https://accounts.google.com/.well-known/openid_configuration',
  
  // Calendar API scopes
  SCOPES: [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ] as const,
  
  // Calendar API endpoints
  CALENDAR_API_BASE: 'https://www.googleapis.com/calendar/v3',
  
  // Redirect URI for Expo
  REDIRECT_URI: 'zirklai://oauth',
} as const;

export type GoogleScope = typeof GOOGLE_CONFIG.SCOPES[number];
