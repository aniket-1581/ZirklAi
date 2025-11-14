import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import CallLogService, { CallLogEntry, CallLogServiceResult } from '../utils/CallLogService';

export interface UseCallLogReturn {
  callLogs: CallLogEntry[];
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
  fetchCallLogs: (limit?: number) => Promise<void>;
  fetchCallLogsByDateRange: (startDate: number, endDate: number, limit?: number) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  refresh: () => Promise<void>;
  statistics: {
    totalCalls: number;
    incomingCalls: number;
    outgoingCalls: number;
    missedCalls: number;
    totalDuration: number;
  };
}

export const useCallLog = (autoFetch: boolean = true, initialLimit: number = 10): UseCallLogReturn => {
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [statistics, setStatistics] = useState({
    totalCalls: 0,
    incomingCalls: 0,
    outgoingCalls: 0,
    missedCalls: 0,
    totalDuration: 0,
  });

  const callLogService = CallLogService.getInstance();

  const fetchCallLogs = useCallback(async (limit: number = 10): Promise<void> => {
    if (Platform.OS !== 'android') {
      setError('Call log access is only available on Android');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result: CallLogServiceResult = await callLogService.getCallLogs(limit);
      
      if (result.success && result.data) {
        setCallLogs(result.data);
        
        // Update statistics only if we have data
        if (result.data.length > 0) {
          try {
            const stats = await callLogService.getCallStatistics();
            setStatistics(stats);
          } catch (statsError) {
            console.warn('Failed to get call statistics:', statsError);
            // Don't set error for statistics failure, just log it
          }
        }
      } else {
        setError(result.error || 'Failed to fetch call logs');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch call logs';
      setError(errorMessage);
      console.error('fetchCallLogs error:', err);
    } finally {
      setLoading(false);
    }
  }, [callLogService]);

  // Check permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await callLogService.checkPermission();
        setPermissionGranted(granted);
      }
    };

    checkPermission();
  }, [callLogService]);

  // Auto-fetch call logs if enabled
  useEffect(() => {
    if (autoFetch && permissionGranted && Platform.OS === 'android') {
      fetchCallLogs(initialLimit);
    }
  }, [autoFetch, permissionGranted, initialLimit, fetchCallLogs]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      setError('Call log access is only available on Android');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      
      const granted = await callLogService.requestCallLogPermission();
      setPermissionGranted(granted);
      
      if (granted && autoFetch) {
        await fetchCallLogs(initialLimit);
      }
      
      return granted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [callLogService, autoFetch, initialLimit, fetchCallLogs]);

  const fetchCallLogsByDateRange = useCallback(async (
    startDate: number,
    endDate: number,
    limit: number = 10
  ): Promise<void> => {
    if (Platform.OS !== 'android') {
      setError('Call log access is only available on Android');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result: CallLogServiceResult = await callLogService.getCallLogsByDateRange(
        startDate,
        endDate,
        limit
      );
      
      if (result.success && result.data) {
        setCallLogs(result.data);
      } else {
        setError(result.error || 'Failed to fetch call logs');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch call logs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [callLogService]);

  const refresh = useCallback(async (): Promise<void> => {
    if (permissionGranted) {
      await fetchCallLogs(initialLimit);
    } else {
      await requestPermission();
    }
  }, [permissionGranted, fetchCallLogs, requestPermission, initialLimit]);

  return {
    callLogs,
    loading,
    error,
    permissionGranted,
    fetchCallLogs,
    fetchCallLogsByDateRange,
    requestPermission,
    refresh,
    statistics,
  };
};

export default useCallLog;
