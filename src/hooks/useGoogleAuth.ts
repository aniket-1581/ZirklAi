import { useState, useEffect } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GOOGLE_CONFIG } from '../constants/googleConfig';
import { GoogleUser, GoogleTokens } from '@/types/calendar';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

interface UseGoogleAuthReturn {
  user: GoogleUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccessToken: () => Promise<string>;
}

const useGoogleAuth = (): UseGoogleAuthReturn => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // OAuth request configuration
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CONFIG.WEB_CLIENT_ID,
      scopes: [...GOOGLE_CONFIG.SCOPES],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'zirklai',
        path: 'oauth'
      }),
      responseType: AuthSession.ResponseType.Code,
      extraParams: {
        access_type: 'offline',
        prompt: 'consent',
      }

    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    }
  );

  useEffect(() => {
    checkStoredAuth();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      exchangeCodeForToken(code);
    }
  }, [response]);

  const checkStoredAuth = async (): Promise<void> => {
    try {
      const storedAccessToken = await AsyncStorage.getItem('google_access_token');
      const storedRefreshToken = await AsyncStorage.getItem('google_refresh_token');
      const storedUser = await AsyncStorage.getItem('google_user');

      if (storedAccessToken && storedUser) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setUser(JSON.parse(storedUser) as GoogleUser);
        setIsAuthenticated(true);

        // Verify token is still valid
        await verifyToken(storedAccessToken);
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exchangeCodeForToken = async (code: string): Promise<void> => {
    try {
      setIsLoading(true);
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'zirklai',
        path: 'oauth',
      });

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CONFIG.WEB_CLIENT_ID,
          code,
          grant_type: 'authorization_code',
          redirect_uri: GOOGLE_CONFIG.REDIRECT_URI,
        }),
      });

      const tokenData: GoogleTokens = await tokenResponse.json();

      if (tokenData.access_token) {
        setAccessToken(tokenData.access_token);
        setRefreshToken(tokenData.refresh_token || null);

        // Store tokens
        await AsyncStorage.setItem('google_access_token', tokenData.access_token);
        if (tokenData.refresh_token) {
          await AsyncStorage.setItem('google_refresh_token', tokenData.refresh_token);
        }

        // Get user info
        await getUserInfo(tokenData.access_token);
      }
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInfo = async (token: string): Promise<void> => {
    try {
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData: GoogleUser = await userResponse.json();
      setUser(userData);
      setIsAuthenticated(true);

      // Store user data
      await AsyncStorage.setItem('google_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error getting user info:', error);
    }
  };

  const verifyToken = async (token: string): Promise<void> => {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
      if (!response.ok) {
        // Token is invalid, try to refresh
        await refreshAccessToken();
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      // If verification fails, sign out
      await signOut();
    }
  };

  const refreshAccessToken = async (): Promise<string> => {
    try {
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CONFIG.WEB_CLIENT_ID,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const tokenData: GoogleTokens = await response.json();

      if (tokenData.access_token) {
        setAccessToken(tokenData.access_token);
        await AsyncStorage.setItem('google_access_token', tokenData.access_token);
        return tokenData.access_token;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      await signOut();
      throw error;
    }
  };

  const signIn = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await promptAsync();
    } catch (error) {
      console.error('Error signing in:', error);
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Revoke token if available
      if (accessToken) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
          method: 'POST',
        });
      }

      // Clear stored data
      await AsyncStorage.multiRemove([
        'google_access_token',
        'google_refresh_token',
        'google_user'
      ]);

      // Reset state
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    accessToken,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    refreshAccessToken,
  };
};

export default useGoogleAuth;
