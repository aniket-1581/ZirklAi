import { View, Text } from 'react-native'
import React from 'react'

const JournalScreen = () => {
  return (
    <View className='flex-1 items-center justify-start bg-[#3A327B]/60'>
      <Text className='text-white font-semibold text-2xl mt-16 px-5'>Journal</Text>
      <View className='flex-1 items-center justify-center px-5'>
        {/* Title */}
      <Text className="text-white text-2xl font-bold mb-3">
        Journal Coming Soon ✨
      </Text>

      {/* Subtitle */}
      <Text className="text-white/70 text-center text-base leading-6">
        We&apos;re working hard to bring you this feature.  
        Stay tuned for updates!
      </Text>
      </View>
    </View>
  )
}

export default JournalScreen