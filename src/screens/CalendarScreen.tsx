import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import useGoogleAuth from '../hooks/useGoogleAuth';
import GoogleAuthScreen from './GoogleAuthScreen';
import CalendarEvents from '@/components/CalendarEvents';
import CreateEvent from '../components/CreateEvent';
import { CalendarProvider } from '../context/CalendarContext';
import { CalendarEvent } from '@/types/calendar';

type TabType = 'events' | 'create';

const CalendarContent: React.FC = () => {
  const { user, signOut, isAuthenticated, isLoading } = useGoogleAuth();
  const [activeTab, setActiveTab] = useState<TabType>('events');

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <GoogleAuthScreen />;
  }

  const handleEventCreated = (event: CalendarEvent): void => {
    setActiveTab('events');
  };

  return (
    <CalendarProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Google Calendar</Text>
            <Text style={styles.headerSubtitle}>
              Welcome, {user?.name || user?.email}
            </Text>
          </View>
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'events' && styles.activeTab]}
            onPress={() => setActiveTab('events')}
          >
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
              Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'create' && styles.activeTab]}
            onPress={() => setActiveTab('create')}
          >
            <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
              Create Event
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'events' ? (
            <CalendarEvents />
          ) : (
            <CreateEvent onEventCreated={handleEventCreated} />
          )}
        </View>
      </SafeAreaView>
    </CalendarProvider>
  );
};

const CalendarScreen: React.FC = () => {
  return <CalendarContent />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  signOutText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  activeTab: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#4285F4',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4285F4',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default CalendarScreen;
