import AsyncStorage from '@react-native-async-storage/async-storage';

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

const ARCHIVED_NOTIFICATIONS_KEY = '@archived_notifications';

export const notificationStorage = {
  async getArchivedNotifications(): Promise<ArchivedNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(ARCHIVED_NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting archived notifications:', error);
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
      const filtered = archivedNotifications.filter(n => n._id !== notification._id);

      // Add to beginning of array (most recent first)
      filtered.unshift(archivedNotification);

      await AsyncStorage.setItem(ARCHIVED_NOTIFICATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error archiving notification:', error);
      throw error;
    }
  },

  async unarchiveNotification(notificationId: string): Promise<void> {
    try {
      const archivedNotifications = await this.getArchivedNotifications();
      const filtered = archivedNotifications.filter(n => n._id !== notificationId);
      await AsyncStorage.setItem(ARCHIVED_NOTIFICATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error unarchiving notification:', error);
      throw error;
    }
  },

  async clearArchivedNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ARCHIVED_NOTIFICATIONS_KEY);
    } catch (error) {
      console.error('Error clearing archived notifications:', error);
      throw error;
    }
  },

  async isNotificationArchived(notificationId: string): Promise<boolean> {
    try {
      const archivedNotifications = await this.getArchivedNotifications();
      return archivedNotifications.some(n => n._id === notificationId);
    } catch (error) {
      console.error('Error checking if notification is archived:', error);
      return false;
    }
  }
};
