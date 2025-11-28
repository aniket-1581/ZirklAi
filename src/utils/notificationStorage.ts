import AsyncStorage from "@react-native-async-storage/async-storage";

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
}

export interface ArchivedNotification extends NotificationItem {
  archived_at: string;
}

export interface SnoozedNotification extends NotificationItem {
  snoozed_at: string;
  snooze_until: string; // ISO string for when to show again
}

const ARCHIVED_NOTIFICATIONS_KEY = "@archived_notifications";
const SNOOZED_NOTIFICATIONS_KEY = "@snoozed_notifications";

export const notificationStorage = {
  async getSnoozedNotifications(): Promise<SnoozedNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(SNOOZED_NOTIFICATIONS_KEY);
      const snoozedNotifications = stored ? JSON.parse(stored) : [];

      // Filter out notifications that are no longer snoozed (snooze period has expired)
      const now = new Date().toISOString();
      const activeSnoozed = snoozedNotifications.filter(
        (n: SnoozedNotification) => n.snooze_until > now
      );

      // Update storage with only active snoozed notifications
      if (activeSnoozed.length !== snoozedNotifications.length) {
        await AsyncStorage.setItem(
          SNOOZED_NOTIFICATIONS_KEY,
          JSON.stringify(activeSnoozed)
        );
      }

      return activeSnoozed;
    } catch (error) {
      console.error("Error getting snoozed notifications:", error);
      return [];
    }
  },

  async snoozeNotification(
    notification: NotificationItem,
    snoozeHours: number = 1
  ): Promise<void> {
    try {
      const snoozedNotifications = await this.getSnoozedNotifications();
      const now = new Date();
      const snoozeUntil = new Date(
        now.getTime() + snoozeHours * 60 * 60 * 1000
      );

      const snoozedNotification: SnoozedNotification = {
        ...notification,
        snoozed_at: now.toISOString(),
        snooze_until: snoozeUntil.toISOString(),
      };

      // Remove from snoozed if it already exists (shouldn't happen but just in case)
      const filtered = snoozedNotifications.filter(
        (n) => n._id !== notification._id
      );

      // Add to beginning of array (most recent first)
      filtered.unshift(snoozedNotification);

      await AsyncStorage.setItem(
        SNOOZED_NOTIFICATIONS_KEY,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error("Error snoozing notification:", error);
      throw error;
    }
  },

  async unsnoozeNotification(notificationId: string): Promise<void> {
    try {
      const snoozedNotifications = await this.getSnoozedNotifications();
      const filtered = snoozedNotifications.filter(
        (n) => n._id !== notificationId
      );
      await AsyncStorage.setItem(
        SNOOZED_NOTIFICATIONS_KEY,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error("Error unsnoozing notification:", error);
      throw error;
    }
  },

  async clearSnoozedNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SNOOZED_NOTIFICATIONS_KEY);
    } catch (error) {
      console.error("Error clearing snoozed notifications:", error);
      throw error;
    }
  },

  async isNotificationSnoozed(notificationId: string): Promise<boolean> {
    try {
      const snoozedNotifications = await this.getSnoozedNotifications();
      return snoozedNotifications.some((n) => n._id === notificationId);
    } catch (error) {
      console.error("Error checking if notification is snoozed:", error);
      return false;
    }
  },

  // Keep archived methods for backward compatibility but mark as deprecated
  async getArchivedNotifications(): Promise<ArchivedNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(ARCHIVED_NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error getting archived notifications:", error);
      return [];
    }
  },

  async archiveNotification(notification: NotificationItem): Promise<void> {
    try {
      const archivedNotifications = await this.getArchivedNotifications();
      const archivedNotification: ArchivedNotification = {
        ...notification,
        archived_at: new Date().toISOString(),
      };

      // Remove from archived if it already exists (shouldn't happen but just in case)
      const filtered = archivedNotifications.filter(
        (n) => n._id !== notification._id
      );

      // Add to beginning of array (most recent first)
      filtered.unshift(archivedNotification);

      await AsyncStorage.setItem(
        ARCHIVED_NOTIFICATIONS_KEY,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error("Error archiving notification:", error);
      throw error;
    }
  },

  async unarchiveNotification(notificationId: string): Promise<void> {
    try {
      const archivedNotifications = await this.getArchivedNotifications();
      const filtered = archivedNotifications.filter(
        (n) => n._id !== notificationId
      );
      await AsyncStorage.setItem(
        ARCHIVED_NOTIFICATIONS_KEY,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error("Error unarchiving notification:", error);
      throw error;
    }
  },
};
