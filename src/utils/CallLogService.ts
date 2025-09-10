import { Alert, PermissionsAndroid, Platform } from 'react-native';
import CallLogs from 'react-native-call-log';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export interface CallLogEntry {
  phoneNumber: string;
  type: 'INCOMING' | 'OUTGOING' | 'MISSED';
  dateTime: string;
  duration: number;
  name?: string;
  timestamp: number;
}

export interface CallLogServiceResult {
  success: boolean;
  data?: CallLogEntry[];
  error?: string;
}

class CallLogService {
  private static instance: CallLogService;
  private permissionGranted: boolean = false;

  private constructor() {}

  public static getInstance(): CallLogService {
    if (!CallLogService.instance) {
      CallLogService.instance = new CallLogService();
    }
    return CallLogService.instance;
  }

  /**
   * Request READ_CALL_LOG permission for Android
   * Required for Android 6.0+ (API level 23+)
   */
  public async requestCallLogPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      // Check if permission is already granted
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
      );

      if (granted) {
        this.permissionGranted = true;
        return true;
      }

      // Request permission
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        {
          title: 'Call Log Permission',
          message: 'This app needs access to your call log to provide enhanced features.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      this.permissionGranted = result === PermissionsAndroid.RESULTS.GRANTED;
      
      if (!this.permissionGranted) {
        Alert.alert(
          'Permission Required',
          'Call log access is required for this feature. Please enable it in app settings.',
          [{ text: 'OK' }]
        );
      }

      return this.permissionGranted;
    } catch (error) {
      console.error('Error requesting call log permission:', error);
      return false;
    }
  }

  /**
   * Check if call log permission is granted
   */
  public async checkPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
      );
      this.permissionGranted = granted;
      return granted;
    } catch (error) {
      console.error('Error checking call log permission:', error);
      return false;
    }
  }

  /**
   * Fetch the latest call log entries
   * @param limit Number of entries to fetch (default: 10)
   * @returns Promise<CallLogServiceResult>
   */
  public async getCallLogs(limit: number = 10): Promise<CallLogServiceResult> {
    try {
      // Ensure we're on Android
      if (Platform.OS !== 'android') {
        return {
          success: false,
          error: 'Call log access is only available on Android',
        };
      }

      // Validate limit parameter
      const validLimit = Math.max(1, Math.min(limit, 100)); // Limit between 1 and 100

      // Check permission first
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const permissionGranted = await this.requestCallLogPermission();
        if (!permissionGranted) {
          return {
            success: false,
            error: 'Call log permission not granted',
          };
        }
      }

      // Fetch call logs with error handling
      let callLogs;
      try {
        callLogs = await CallLogs.load(validLimit);
      } catch (loadError) {
        console.error('CallLogs.load error:', loadError);
        // Try with a smaller limit if the original fails
        try {
          callLogs = await CallLogs.load(5);
        } catch (retryError) {
          throw new Error(`Failed to load call logs: ${loadError instanceof Error ? loadError.message : 'Unknown error'}`);
        }
      }
      
      // Ensure we have an array
      if (!Array.isArray(callLogs)) {
        return {
          success: false,
          error: 'Invalid call log data received',
        };
      }
      
      // Transform the data to our interface with validation
      const transformedLogs: CallLogEntry[] = callLogs
        .filter((log: any) => log && typeof log === 'object') // Filter out invalid entries
        .map((log: any): CallLogEntry | null => {
          try {
            const rawDateTime: string = log.dateTime || '';
            const normalizedDateTime = rawDateTime.replace(/Sept/i, 'Sep');

            const parsedDate = dayjs(normalizedDateTime, 'DD-MMM-YYYY HH:mm:ss');
            if (!parsedDate.isValid()) {
              console.warn('Invalid date format in call log:', log.dateTime);
              return null;
            }
            
            return {
              phoneNumber: log.phoneNumber || 'Unknown',
              type: this.mapCallType(log.type),
              dateTime: parsedDate.toISOString(),
              duration: parseInt(log.duration) || 0,
              name: log.name || undefined,
              timestamp: parsedDate.valueOf(),
            };
          } catch (transformError) {
            console.warn('Error transforming call log entry:', transformError, log);
            return null;
          }
        })
        .filter((log): log is CallLogEntry => log !== null);

      return {
        success: true,
        data: transformedLogs,
      };
    } catch (error) {
      console.error('Error fetching call logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetch call logs with date range
   * @param startDate Start date (timestamp)
   * @param endDate End date (timestamp)
   * @param limit Number of entries to fetch
   */
  public async getCallLogsByDateRange(
    startDate: number,
    endDate: number,
    limit: number = 10
  ): Promise<CallLogServiceResult> {
    try {
      if (Platform.OS !== 'android') {
        return {
          success: false,
          error: 'Call log access is only available on Android',
        };
      }

      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const permissionGranted = await this.requestCallLogPermission();
        if (!permissionGranted) {
          return {
            success: false,
            error: 'Call log permission not granted',
          };
        }
      }

      // Validate date parameters
      const now = Date.now();
      const validStartDate = Math.max(0, Math.min(startDate, now));
      const validEndDate = Math.max(validStartDate, Math.min(endDate, now));

      // Ensure we have valid dates
      if (isNaN(validStartDate) || isNaN(validEndDate)) {
        return {
          success: false,
          error: 'Invalid date parameters provided',
        };
      }

      // For now, let's use the simple load method without date range
      // as the date range functionality seems to have issues
      const callLogs = await CallLogs.load(limit);
      
      // Filter by date range manually if needed
      const filteredLogs = callLogs.filter((log: any) => {
        const logTimestamp = parseInt(log.dateTime);
        return logTimestamp >= validStartDate && logTimestamp <= validEndDate;
      });
      
      const transformedLogs: CallLogEntry[] = filteredLogs.map((log: any) => ({
        phoneNumber: log.phoneNumber || 'Unknown',
        type: this.mapCallType(log.type),
        dateTime: new Date(log.dateTime).toISOString(),
        duration: parseInt(log.duration) || 0,
        name: log.name || undefined,
        timestamp: parseInt(log.dateTime),
      }));

      return {
        success: true,
        data: transformedLogs,
      };
    } catch (error) {
      console.error('Error fetching call logs by date range:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get call statistics
   */
  public async getCallStatistics(): Promise<{
    totalCalls: number;
    incomingCalls: number;
    outgoingCalls: number;
    missedCalls: number;
    totalDuration: number;
  }> {
    try {
      const result = await this.getCallLogs(100); // Get more records for statistics
      
      if (!result.success || !result.data) {
        return {
          totalCalls: 0,
          incomingCalls: 0,
          outgoingCalls: 0,
          missedCalls: 0,
          totalDuration: 0,
        };
      }

      const stats = result.data.reduce(
        (acc, call) => {
          acc.totalCalls++;
          acc.totalDuration += call.duration;
          
          switch (call.type) {
            case 'INCOMING':
              acc.incomingCalls++;
              break;
            case 'OUTGOING':
              acc.outgoingCalls++;
              break;
            case 'MISSED':
              acc.missedCalls++;
              break;
          }
          
          return acc;
        },
        {
          totalCalls: 0,
          incomingCalls: 0,
          outgoingCalls: 0,
          missedCalls: 0,
          totalDuration: 0,
        }
      );

      return stats;
    } catch (error) {
      console.error('Error getting call statistics:', error);
      return {
        totalCalls: 0,
        incomingCalls: 0,
        outgoingCalls: 0,
        missedCalls: 0,
        totalDuration: 0,
      };
    }
  }

  /**
   * Map call type from library format to our interface
   */
  private mapCallType(type: any): 'INCOMING' | 'OUTGOING' | 'MISSED' {
    switch (type) {
      case 1:
      case 'INCOMING':
        return 'INCOMING';
      case 2:
      case 'OUTGOING':
        return 'OUTGOING';
      case 3:
      case 'MISSED':
        return 'MISSED';
      default:
        return 'MISSED';
    }
  }

  /**
   * Format duration in seconds to human readable format
   */
  public formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * Format phone number for display
   */
  public formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Basic formatting for common patterns
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phoneNumber; // Return original if no pattern matches
  }
}

export default CallLogService;
