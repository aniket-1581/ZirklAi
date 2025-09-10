import React from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallLog } from '../hooks/useCallLog';
import CallLogDebug from '../utils/CallLogDebug';
import CallLogService from '../utils/CallLogService';

interface CallLogDemoProps {
  limit?: number;
}

const CallLogDemo: React.FC<CallLogDemoProps> = ({ limit = 10 }) => {
  const {
    callLogs,
    loading,
    error,
    permissionGranted,
    fetchCallLogs,
    requestPermission,
    refresh,
    statistics,
  } = useCallLog(false, limit); // Don't auto-fetch, let user control
  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      Alert.alert('Success', 'Call log permission granted!');
    }
  };

  const handleFetchCallLogs = async () => {
    try {
      await fetchCallLogs(limit);
    } catch (error) {
      console.error('Error in handleFetchCallLogs:', error);
      Alert.alert(
        'Error',
        'Failed to fetch call logs. Please try again or check your permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRefresh = async () => {
    await refresh();
  };

  const handleDebugTest = async () => {
    try {
      Alert.alert('Debug Test', 'Running debug tests...');
      const results = await CallLogDebug.runAllTests();
      
      Alert.alert(
        'Debug Results',
        `Basic Load: ${results.basicLoad.success ? 'Success' : 'Failed'}\n` +
        `Different Limits: ${results.differentLimits.success ? 'Success' : 'Failed'}\n` +
        `Date Range: ${results.dateRange.success ? 'Success' : 'Failed'}\n\n` +
        'Check console for detailed results.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Debug test error:', error);
      Alert.alert('Debug Error', 'Failed to run debug tests. Check console for details.');
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const getCallTypeColor = (type: string) => {
    switch (type) {
      case 'INCOMING':
        return '#4CAF50'; // Green
      case 'OUTGOING':
        return '#2196F3'; // Blue
      case 'MISSED':
        return '#F44336'; // Red
      default:
        return '#757575'; // Gray
    }
  };

  const callLogService = CallLogService.getInstance();

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Call Log Demo</Text>
        <Text style={styles.errorText}>
          Call log access is only available on Android devices.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Call Log Demo</Text>
      
      {/* Permission Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permission Status</Text>
        <Text style={[
          styles.statusText,
          { color: permissionGranted ? '#4CAF50' : '#F44336' }
        ]}>
          {permissionGranted ? '✓ Granted' : '✗ Not Granted'}
        </Text>
      </View>

      {/* Statistics */}
      {statistics.totalCalls > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{statistics.totalCalls}</Text>
              <Text style={styles.statLabel}>Total Calls</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                {statistics.incomingCalls}
              </Text>
              <Text style={styles.statLabel}>Incoming</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#2196F3' }]}>
                {statistics.outgoingCalls}
              </Text>
              <Text style={styles.statLabel}>Outgoing</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#F44336' }]}>
                {statistics.missedCalls}
              </Text>
              <Text style={styles.statLabel}>Missed</Text>
            </View>
          </View>
          <Text style={styles.durationText}>
            Total Duration: {callLogService.formatDuration(statistics.totalDuration)}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.buttonContainer}>
          {!permissionGranted ? (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleRequestPermission}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Requesting...' : 'Request Permission'}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleFetchCallLogs}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Loading...' : `Fetch Latest ${limit} Calls`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleRefresh}
                disabled={loading}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Refresh
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.debugButton]}
                onPress={handleDebugTest}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  Debug Test
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            onPress={handleFetchCallLogs}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Retrying...' : 'Retry'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Call Logs List */}
      {callLogs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Call Logs</Text>
          {callLogs.map((call, index) => (
            <View key={index} style={styles.callItem}>
              <View style={styles.callHeader}>
                <Text style={styles.phoneNumber}>
                  {callLogService.formatPhoneNumber(call.phoneNumber)}
                </Text>
                <View style={[
                  styles.callTypeBadge,
                  { backgroundColor: getCallTypeColor(call.type) }
                ]}>
                  <Text style={styles.callTypeText}>{call.type}</Text>
                </View>
              </View>
              {call.name && (
                <Text style={styles.contactName}>{call.name}</Text>
              )}
              <Text style={styles.callDateTime}>
                {formatDateTime(call.dateTime)}
              </Text>
              {call.duration > 0 && (
                <Text style={styles.callDuration}>
                  Duration: {callLogService.formatDuration(call.duration)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {!loading && callLogs.length === 0 && permissionGranted && !error && (
        <View style={styles.section}>
          <Text style={styles.emptyText}>
            No call logs found. Try fetching call logs or check if you have any recent calls.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButtonText: {
    color: '#2196F3',
  },
  retryButton: {
    backgroundColor: '#FF9800',
    marginTop: 8,
  },
  debugButton: {
    backgroundColor: '#9C27B0',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
  },
  callItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  callTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  callTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  contactName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  callDateTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  callDuration: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default CallLogDemo;
