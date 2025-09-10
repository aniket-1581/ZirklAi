import { Platform } from 'react-native';
import CallLogs from 'react-native-call-log';

/**
 * Debug utility for troubleshooting call log issues
 */
export class CallLogDebug {
  /**
   * Test basic call log loading with minimal parameters
   */
  static async testBasicLoad(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    if (Platform.OS !== 'android') {
      return {
        success: false,
        error: 'Not on Android platform',
      };
    }

    try {
      const result = await CallLogs.load(1);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Basic load error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Test call log loading with different limits
   */
  static async testDifferentLimits(): Promise<{
    success: boolean;
    results: { limit: number; success: boolean; error?: string; count?: number }[];
  }> {
    if (Platform.OS !== 'android') {
      return {
        success: false,
        results: [],
      };
    }

    const limits = [1, 5, 10, 20];
    const results = [];

    for (const limit of limits) {
      try {
        const data = await CallLogs.load(limit);
        results.push({
          limit,
          success: true,
          count: Array.isArray(data) ? data.length : 0,
        });
      } catch (error) {
        console.error(`Error with limit ${limit}:`, error);
        results.push({
          limit,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: results.some(r => r.success),
      results,
    };
  }

  /**
   * Test date range functionality
   */
  static async testDateRange(): Promise<{
    success: boolean;
    results: { test: string; success: boolean; error?: string }[];
  }> {
    if (Platform.OS !== 'android') {
      return {
        success: false,
        results: [],
      };
    }

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

    const tests = [
      { name: 'Last 24 hours', start: oneDayAgo, end: now },
      { name: 'Last week', start: oneWeekAgo, end: now },
      { name: 'Last month', start: oneMonthAgo, end: now },
      { name: 'Invalid range (future)', start: now + 1000, end: now + 2000 },
      { name: 'Invalid range (negative)', start: -1000, end: -500 },
    ];

    const results = [];

    for (const test of tests) {
      try {
        await CallLogs.load(5, test.start, test.end);
        results.push({
          test: test.name,
          success: true,
        });
      } catch (error) {
        console.error(`Error with date range ${test.name}:`, error);
        results.push({
          test: test.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: results.some(r => r.success),
      results,
    };
  }

  /**
   * Run all debug tests
   */
  static async runAllTests(): Promise<{
    basicLoad: any;
    differentLimits: any;
    dateRange: any;
  }> {
    
    const basicLoad = await this.testBasicLoad();
    const differentLimits = await this.testDifferentLimits();
    const dateRange = await this.testDateRange();

    return {
      basicLoad,
      differentLimits,
      dateRange,
    };
  }
}

export default CallLogDebug;
