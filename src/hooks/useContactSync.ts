import { useState, useEffect, useCallback } from 'react';
import ContactSyncService, { Contact, ContactSyncResult } from '@/utils/ContactSyncService';

export interface UseContactSyncReturn {
  // State
  contacts: Contact[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  hasPermission: boolean;
  
  // Actions
  syncContacts: () => Promise<boolean>;
  refreshContacts: () => Promise<void>;
  searchContacts: (query: string) => Promise<Contact[]>;
  clearContacts: () => Promise<void>;
  checkPermission: () => Promise<void>;
}

export function useContactSync(): UseContactSyncReturn {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check permission
      const permission = await ContactSyncService.hasPermission();
      setHasPermission(permission);
      
      // Load stored contacts
      const storedContacts = await ContactSyncService.getStoredContacts();
      setContacts(storedContacts);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncContacts = useCallback(async () => {
    try {
      setIsSyncing(true);
      setError(null);
      
      const result: ContactSyncResult = await ContactSyncService.syncContacts();
      
      if (result.success) {
        setContacts(result.contacts);
        setHasPermission(true);
        return result.success;
      } else {
        setError(result.error || 'Failed to sync contacts');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync contacts');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const refreshContacts = useCallback(async () => {
    try {
      setError(null);
      
      const storedContacts = await ContactSyncService.getStoredContacts();
      setContacts(storedContacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh contacts');
    }
  }, []);

  const searchContacts = useCallback(async (query: string): Promise<Contact[]> => {
    try {
      return await ContactSyncService.searchContacts(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search contacts');
      return [];
    }
  }, []);

  const clearContacts = useCallback(async () => {
    try {
      setError(null);
      
      await ContactSyncService.clearStoredContacts();
      setContacts([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear contacts');
    }
  }, []);

  const checkPermission = useCallback(async () => {
    try {
      const permission = await ContactSyncService.hasPermission();
      setHasPermission(permission);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check permission');
    }
  }, []);

  return {
    contacts,
    isLoading,
    isSyncing,
    error,
    hasPermission,
    syncContacts,
    refreshContacts,
    searchContacts,
    clearContacts,
    checkPermission,
  };
} 