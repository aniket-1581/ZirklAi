import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { useCalendar } from '../context/CalendarContext';
import { CalendarEvent } from '@/types/calendar';

const CalendarEvents: React.FC = () => {
  const {
    events,
    isLoading,
    error,
    fetchEvents,
    deleteEvent,
  } = useCalendar();
  
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await fetchEvents();
    } catch (error) {
      console.error('Error refreshing events:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle?: string): Promise<void> => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${eventTitle || 'this event'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent('primary', eventId);
              Alert.alert('Success', 'Event deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const formatEventTime = (event: CalendarEvent): string => {
    const startTime = new Date(event.start.dateTime || event.start.date || '');
    const endTime = new Date(event.end.dateTime || event.end.date || '');
    
    if (event.start.dateTime) {
      return `${startTime.toLocaleString()} - ${endTime.toLocaleTimeString()}`;
    } else {
      return `${startTime.toLocaleDateString()} (All day)`;
    }
  };

  const renderEventItem: ListRenderItem<CalendarEvent> = ({ item }) => (
    <View style={styles.eventItem}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {item.summary || 'No Title'}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteEvent(item.id, item.summary)}
        >
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.eventTime}>{formatEventTime(item)}</Text>
      
      {item.description && (
        <Text style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      {item.location && (
        <Text style={styles.eventLocation} numberOfLines={1}>
          📍 {item.location}
        </Text>
      )}

      {item.hangoutLink && (
        <TouchableOpacity style={styles.meetLinkContainer}>
          <Text style={styles.meetLinkText}>
            🎥 Google Meet Available
          </Text>
        </TouchableOpacity>
      )}

      {item.attendees && item.attendees.length > 0 && (
        <Text style={styles.attendees}>
          👥 {item.attendees.length} attendee(s)
        </Text>
      )}
    </View>
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchEvents()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Calendar Events</Text>
      
      {isLoading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No upcoming events found</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#4285F4']}
            />
          }
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 10,
    color: '#333',
  },
  list: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: '#f8f9fa',
    margin: 10,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  eventLocation: {
    fontSize: 14,
    color: '#4285F4',
    marginBottom: 6,
  },
  meetLinkContainer: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  meetLinkText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  attendees: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default CalendarEvents;
