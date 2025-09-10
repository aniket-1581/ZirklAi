import { Platform } from 'react-native';
import CallLogService, { CallLogEntry } from './CallLogService';

/**
 * Quick utility function to fetch the latest 10 call logs
 * This is a convenience function for common use cases
 */
export const getLatestCallLogs = async (limit: number = 10): Promise<CallLogEntry[]> => {
  if (Platform.OS !== 'android') {
    console.warn('Call log access is only available on Android');
    return [];
  }

  try {
    const callLogService = CallLogService.getInstance();
    const result = await callLogService.getCallLogs(limit);
    
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('Failed to fetch call logs:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Error in getLatestCallLogs:', error);
    return [];
  }
};

/**
 * Quick utility function to check if call log permission is granted
 */
export const checkCallLogPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const callLogService = CallLogService.getInstance();
    return await callLogService.checkPermission();
  } catch (error) {
    console.error('Error checking call log permission:', error);
    return false;
  }
};

/**
 * Quick utility function to request call log permission
 */
export const requestCallLogPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const callLogService = CallLogService.getInstance();
    return await callLogService.requestCallLogPermission();
  } catch (error) {
    console.error('Error requesting call log permission:', error);
    return false;
  }
};

/**
 * Format call log entry for display
 */
export const formatCallLogEntry = (call: CallLogEntry): string => {
  const callLogService = CallLogService.getInstance();
  const formattedNumber = callLogService.formatPhoneNumber(call.phoneNumber);
  const formattedDuration = callLogService.formatDuration(call.duration);
  const date = new Date(call.dateTime).toLocaleDateString();
  
  return `${call.type} - ${formattedNumber} (${formattedDuration}) - ${date}`;
};

/**
 * Get call statistics summary
 */
export const getCallLogSummary = async (): Promise<{
  totalCalls: number;
  recentCalls: number;
  missedCalls: number;
  hasPermission: boolean;
}> => {
  if (Platform.OS !== 'android') {
    return {
      totalCalls: 0,
      recentCalls: 0,
      missedCalls: 0,
      hasPermission: false,
    };
  }

  try {
    const callLogService = CallLogService.getInstance();
    const hasPermission = await callLogService.checkPermission();
    
    if (!hasPermission) {
      return {
        totalCalls: 0,
        recentCalls: 0,
        missedCalls: 0,
        hasPermission: false,
      };
    }

    const stats = await callLogService.getCallStatistics();
    const recentCalls = await getLatestCallLogs(5);
    
    return {
      totalCalls: stats.totalCalls,
      recentCalls: recentCalls.length,
      missedCalls: stats.missedCalls,
      hasPermission: true,
    };
  } catch (error) {
    console.error('Error getting call log summary:', error);
    return {
      totalCalls: 0,
      recentCalls: 0,
      missedCalls: 0,
      hasPermission: false,
    };
  }
};
