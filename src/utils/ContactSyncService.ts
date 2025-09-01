import * as Contacts from "expo-contacts";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Contact {
  name: string;
  phoneNumber: string;
  emails: string;
}

export interface ContactSyncResult {
  success: boolean;
  contacts: Contact[];
  error?: string;
  totalContacts: number;
}

class ContactSyncService {
  private readonly CONTACTS_KEY = "@zirklai_contacts";
  private readonly LAST_SYNC_KEY = "@zirklai_last_sync";

  async requestPermission(): Promise<boolean> {
    try {
      const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
      if (status !== "granted" && !canAskAgain) {
        console.warn("Permission denied and cannot ask again");
      }
      return status === "granted";
    } catch (error) {
      console.error("Permission request error:", error)
      return false;
    }
  }

  async hasPermission(): Promise<boolean> {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Permission check error:", error);
      return false;
    }
  }

  async syncContacts(): Promise<ContactSyncResult> {
    try {
      const hasPermission = await this.hasPermission();
      if (!hasPermission && !(await this.requestPermission())) {
        return {
          success: false,
          contacts: [],
          error: "Permission denied",
          totalContacts: 0,
        };
      }
  
      const result = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });
  
      console.log("[ContactSync] Total fetched:", result.data.length); // <-- Debug log
  
      if (!result || !Array.isArray(result.data)) {
        return {
          success: false,
          contacts: [],
          error: "Contacts not available",
          totalContacts: 0,
        };
      }
  
      if (result.data.length === 0) {
        console.warn("[ContactSync] Empty contact list. Samsung One UI 7 workaround may be needed.");
        return {
          success: false,
          contacts: [],
          error: "No contacts found. Please ensure Contacts app is active and try again.",
          totalContacts: 0,
        };
      }
  
      const contacts = result.data
        .filter((contact) => contact.name && contact.phoneNumbers?.length)
        .map((contact) => ({
          name: contact.name || "",
          phoneNumber: contact.phoneNumbers?.[0]?.number || "",
          emails: "",
        }));
  
      await this.storeContacts(contacts);
      await this.updateLastSync();
  
      return {
        success: true,
        contacts,
        totalContacts: contacts.length,
      };
  
    } catch (error) {
      console.error("[ContactSync] Sync error:", error);
      return {
        success: false,
        contacts: [],
        error: error instanceof Error ? error.message : "Unknown error",
        totalContacts: 0,
      };
    }
  }
  

  private async storeContacts(contacts: Contact[]): Promise<void> {
    await AsyncStorage.setItem(this.CONTACTS_KEY, JSON.stringify(contacts));
  }

  async getStoredContacts(): Promise<Contact[]> {
    const raw = await AsyncStorage.getItem(this.CONTACTS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async clearStoredContacts(): Promise<void> {
    await AsyncStorage.multiRemove([this.CONTACTS_KEY, this.LAST_SYNC_KEY]);
  }

  private async updateLastSync(): Promise<void> {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(this.LAST_SYNC_KEY, JSON.stringify(now));
  }

  async getLastSync(): Promise<Date | null> {
    const json = await AsyncStorage.getItem(this.LAST_SYNC_KEY);
    return json ? new Date(JSON.parse(json)) : null;
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const all = await this.getStoredContacts();
    const lowerQuery = query.toLowerCase();
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.phoneNumber.includes(query) ||
        c.emails.includes(lowerQuery)
    );
  }

  async getContactStats(): Promise<{
    totalContacts: number;
    contactsWithPhone: number;
    contactsWithEmail: number;
    lastSync: Date | null;
  }> {
    const contacts = await this.getStoredContacts();
    const lastSync = await this.getLastSync();

    return {
      totalContacts: contacts.length,
      contactsWithPhone: contacts.filter((c) => c.phoneNumber.length > 0)
        .length,
      contactsWithEmail: contacts.filter((c) => c.emails.length > 0).length,
      lastSync,
    };
  }
}

export default new ContactSyncService();
