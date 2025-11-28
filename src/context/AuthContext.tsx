import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Toast from "react-native-toast-message";

import { login as apiLogin, getUser, updateTimezone, verifyOtp } from "@/api/auth";
import { createCallLogs } from "@/api/call-logs";
import { registerAndSendFcmToken } from "@/api/notifications";
import { getProfileStatus, ProfileStatusResponse } from "@/api/profile";
import { identify, initMixpanel, resetMixpanel, setUserProps, track } from "@/lib/mixpanel";
import CallLogService from "@/utils/CallLogService";
import { getTimezone } from "@/utils/timezone";

interface User {
  id: string;
  full_name: string;
  age_group: string;
  profession: string;
  company?: string;
  location: string;
  goal?: string;
  businessCardQRCode?: string;
  email?: string;
  persona?: string;
  profile_completed?: boolean;
  expertise_level?: string;
  engagement_plan?: string;
  strategy?: string;
  user_challenges?: string;
  [key: string]: any;
}

interface AuthContextData {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  ready: boolean;
  user: User | null;
  profileSetupStatus: ProfileStatusResponse | null;
  completionStatusLoading: boolean;
  login: (
    phoneNumber: string
  ) => Promise<{ success: boolean; message?: string }>;
  loginWithOtp: (
    phoneNumber: string,
    otp: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getUserDetails: () => Promise<void>;
  getProfileSetupStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profileSetupStatus, setProfileSetupStatus] =
    useState<ProfileStatusResponse | null>(null);
  const [completionStatusLoading, setCompletionStatusLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // MIXPANEL: initialize analytics
        await initMixpanel();

        const storedToken = await AsyncStorage.getItem("userToken");
        if (isMounted) {
          setToken(storedToken);
          setReady(true);
        }
      } catch (error) {
        console.log("Error during auth init:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);


  const getUserDetails = useCallback(async () => {
    if (!token) return;

    try {
      const res = (await getUser(token)) as User;
      setUser(res);

      // MIXPANEL: Identify user & set properties
      identify(res.id);
      setUserProps({
        full_name: res.full_name,
        age_group: res.age_group,
        profession: res.profession,
        location: res.location,
        email: res.email,
      });
    } catch (err: any) {
      console.error("getUserDetails error:", err);

      // Check for expired/invalid token cases
      if (err) {
        console.warn("Token invalid or expired. Logging out...");
        await AsyncStorage.removeItem("userToken");
        setToken(null);
        setUser(null);
        setProfileSetupStatus(null);
        Toast.show({
          type: "error",
          text1: "Session Expired",
          text2: "Please sign in again.",
        });
        router.replace("/sign-in");
      } else {
        setUser(null);
      }
    }
  }, [token, router]);

  const getProfileSetupStatus = useCallback(async () => {
    if (!token) return;
    try {
      setCompletionStatusLoading(true);
      const res = await getProfileStatus(token);
      setProfileSetupStatus(res);
    } catch (err: any) {
      console.error("getProfileSetupStatus error:", err);
    } finally {
      setCompletionStatusLoading(false);
    }
  }, [token]);

  const getNotificationToken = useCallback(async () => {
    if (!token) return;
    try {
      await registerAndSendFcmToken(token);
    } catch (err: any) {
      console.log("Error while getting fcm token", err);
    }
  }, [token]);

  const shouldSyncCallLogs = async () => {
    try {
      const lastSync = await AsyncStorage.getItem('@last_call_log_sync');
      if (!lastSync) return true;
      
      const lastSyncDate = new Date(lastSync);
      const today = new Date();
      
      // Check if a day has passed since last sync
      const diffTime = Math.abs(today.getTime() - lastSyncDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays >= 1;
    } catch (error) {
      console.error('Error checking last sync date:', error);
      return false;
    }
  };

  const updateLastSyncDate = async () => {
    try {
      await AsyncStorage.setItem('@last_call_log_sync', new Date().toISOString());
    } catch (error) {
      console.error('Error updating last sync date:', error);
    }
  };

  const syncCallLogsToServer = useCallback(async () => {
    if (!token) return;

    // Check if we should sync (once per day)
    const shouldSync = await shouldSyncCallLogs();
    if (!shouldSync) {
      console.log('Call logs already synced today. Skipping...');
      return;
    }

    const callLogService = CallLogService.getInstance();
    try {
      const hasPermission = await callLogService.checkPermission();
      if (!hasPermission) {
        const permissionGranted =
          await callLogService.requestCallLogPermission();
        if (!permissionGranted) {
          console.log("Call log permission not granted. Cannot sync call logs.");
          return;
        }
      }

      const result = await callLogService.getCallLogs(100);

      if (result.success && result.data && result.data.length > 0) {
        const logsToSave = result.data.map((log) => ({
          dateTime: log.dateTime,
          duration: log.duration,
          name: log.name || "Unknown",
          phoneNumber: log.phoneNumber,
          timestamp: log.timestamp,
          type: log.type,
        }));

        if (logsToSave.length > 0) {
          await createCallLogs(logsToSave, token);
          await updateLastSyncDate(); // Update sync time only on successful sync
          console.log('Call logs synced successfully');
        } else {
          console.log("No call logs to sync.");
        }
      } else {
        console.warn("Failed to fetch call logs:", result.error);
      }
    } catch (err) {
      console.error("Error syncing call logs:", err);
    }
  }, [token]);

  useEffect(() => {
    if (!ready) return;

    if (token) {
      (async () => {
        try {
          await getUserDetails();
          if (user && (user.timezone === "" || user.timezone === null)) {
            const timezone = await getTimezone();
            await updateTimezone(token, timezone);
          }
          await getProfileSetupStatus();
          await getNotificationToken();
          await syncCallLogsToServer();
        } catch (err) {
          console.error("Error initializing user session:", err);

          // Defensive logout for any critical error (network/token)
          await AsyncStorage.removeItem("userToken");
          setToken(null);
          setUser(null);
          setProfileSetupStatus(null);
          router.replace("/sign-in");
        }
      })();
    } else {
      setUser(null);
      setProfileSetupStatus(null);
    }
  }, [
    ready,
    token,
    getUserDetails,
    getProfileSetupStatus,
    getNotificationToken,
    syncCallLogsToServer
  ]);

  const login = useCallback(
    async (phoneNumber: string): Promise<{ success: boolean; message?: string }> => {
      if (phoneNumber.length !== 10) {
        Toast.show({
          type: "error",
          text1: "Invalid Phone Number",
          text2: "Please enter 10 digit phone number.",
        });
        return { success: false, message: "Please enter 10 digit phone number." };
      }
      setIsLoading(true);
      try {
        const res = (await apiLogin(phoneNumber)) as {
          success: boolean;
          message?: string;
        };
        if (res?.success) {
          Toast.show({
            type: "success",
            text1: "OTP Sent",
            text2: res.message,
          });
          router.replace({ pathname: "/sign-in/otp", params: { phoneNumber } });
        } else {
          Toast.show({
            type: "error",
            text1: "Login Error",
            text2: res.message || "An error occurred.",
          });
        }
        return res;
      } catch (err: any) {
        Toast.show({
          type: "error",
          text1: "Login Error",
          text2: err.message || "Something went wrong",
        });
        return { success: false, message: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const loginWithOtp = useCallback(
    async (phoneNumber: string, otp: string) => {
      setIsLoading(true);
      try {
        const res = (await verifyOtp(phoneNumber, otp)) as {
          access_token?: string;
          message?: string;
        };
        if (res?.access_token) {
          await AsyncStorage.setItem("userToken", res.access_token);
          setToken(res.access_token);

          // MIXPANEL: track login event
          track("Login", { phoneNumber });

          Toast.show({ type: "success", text1: "Login Successful" });
          router.replace("/(protected)/(tabs)/home");
          return { success: true };
        } else {
          Toast.show({
            type: "error",
            text1: "OTP Error",
            text2: res.message || "Invalid OTP",
          });
          return { success: false, error: res.message || "Invalid OTP" };
        }
      } catch (err: any) {
        Toast.show({
          type: "error",
          text1: "OTP Error",
          text2: err.message || "OTP verification failed",
        });
        return { success: false, error: err.message };
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // MIXPANEL: track logout
      track("Logout");

      // MIXPANEL: reset anonymous state
      resetMixpanel();

      await AsyncStorage.multiRemove(["userToken"]);
      setToken(null);
      setUser(null);
      setProfileSetupStatus(null);
      router.replace("/sign-in");
      Toast.show({ type: "success", text1: "Logged out successfully" });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const authContextValue = useMemo<AuthContextData>(
    () => ({
      token,
      isAuthenticated: !!token,
      isLoading,
      ready,
      user,
      profileSetupStatus,
      completionStatusLoading,
      login,
      loginWithOtp,
      logout,
      getUserDetails,
      getProfileSetupStatus,
    }),
    [
      token,
      isLoading,
      ready,
      user,
      profileSetupStatus,
      completionStatusLoading,
      login,
      loginWithOtp,
      logout,
      getUserDetails,
      getProfileSetupStatus,
    ]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
