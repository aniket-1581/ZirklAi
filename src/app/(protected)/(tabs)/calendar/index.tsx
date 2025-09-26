import { View, Text } from 'react-native'
import React from 'react'
import CalendarScreen from '@/screens/CalendarScreen'

export default function Calendar() {
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <CalendarScreen />
    </View>
  )
}