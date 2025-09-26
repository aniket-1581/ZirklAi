import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCalendar } from '../context/CalendarContext';
import { CalendarEvent } from '@/types/calendar';

interface CreateEventProps {
  onEventCreated?: (event: CalendarEvent) => void;
}

interface EventFormData {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  attendees: string;
}

const CreateEvent: React.FC<CreateEventProps> = ({ onEventCreated }) => {
  const { createEvent, createEventWithMeet } = useCalendar();
  
  const [eventData, setEventData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    attendees: '',
  });
  
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const handleCreateEvent = async (withMeet: boolean = false): Promise<void> => {
    if (!eventData.title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    if (eventData.startDate >= eventData.endDate) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    try {
      setIsCreating(true);
      
      const eventPayload = {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        startDateTime: eventData.startDate.toISOString(),
        endDateTime: eventData.endDate.toISOString(),
        attendees: eventData.attendees.split(',').map(email => email.trim()).filter(Boolean),
      };

      let event: CalendarEvent;
      if (withMeet) {
        event = await createEventWithMeet('primary', eventPayload);
      } else {
        event = await createEvent('primary', eventPayload);
      }

      Alert.alert(
        'Success', 
        withMeet ? 'Event with Google Meet created successfully!' : 'Event created successfully!'
      );
      
      // Reset form
      setEventData({
        title: '',
        description: '',
        location: '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 60 * 1000),
        attendees: '',
      });

      if (onEventCreated) {
        onEventCreated(event);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString();
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate: Date | undefined,
    isStart: boolean
  ): void => {
    const setShowPicker = isStart ? setShowStartPicker : setShowEndPicker;
    setShowPicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      if (isStart) {
        setEventData({ ...eventData, startDate: selectedDate });
      } else {
        setEventData({ ...eventData, endDate: selectedDate });
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create New Event</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter event title"
            value={eventData.title}
            onChangeText={(text) => setEventData({ ...eventData, title: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter event description"
            value={eventData.description}
            onChangeText={(text) => setEventData({ ...eventData, description: text })}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter event location"
            value={eventData.location}
            onChangeText={(text) => setEventData({ ...eventData, location: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Attendees (comma separated emails)</Text>
          <TextInput
            style={styles.input}
            placeholder="email1@example.com, email2@example.com"
            value={eventData.attendees}
            onChangeText={(text) => setEventData({ ...eventData, attendees: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeRow}>
            <Text style={styles.label}>Start Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateTimeText}>
                {formatDateTime(eventData.startDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={eventData.startDate}
              mode="datetime"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => handleDateChange(event, selectedDate, true)}
            />
          )}
        </View>

        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeRow}>
            <Text style={styles.label}>End Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateTimeText}>
                {formatDateTime(eventData.endDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {showEndPicker && (
            <DateTimePicker
              value={eventData.endDate}
              mode="datetime"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => handleDateChange(event, selectedDate, false)}
            />
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => handleCreateEvent(false)}
            disabled={isCreating}
          >
            <Text style={styles.buttonText}>
              {isCreating ? 'Creating...' : 'Create Event'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => handleCreateEvent(true)}
            disabled={isCreating}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              {isCreating ? 'Creating...' : 'Create with Google Meet'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    marginBottom: 20,
  },
  dateTimeRow: {
    marginBottom: 10,
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4285F4',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#4285F4',
  },
});

export default CreateEvent;
