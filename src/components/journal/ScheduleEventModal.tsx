import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

interface ScheduleEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: { label: string; startDate: Date; endDate: Date }) => void;
}

const getDateForOption = (option: string) => {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (option) {
    case "Later today":
      start.setHours(18, 0, 0, 0);
      end.setHours(19, 0, 0, 0);
      break;
    case "Tomorrow":
      start.setDate(now.getDate() + 1);
      start.setHours(8, 0, 0, 0);
      end.setDate(now.getDate() + 1);
      end.setHours(9, 0, 0, 0);
      break;
    case "Later this week":
      start.setDate(now.getDate() + (5 - now.getDay()));
      start.setHours(8, 0, 0, 0);
      end.setDate(now.getDate() + (5 - now.getDay()));
      end.setHours(9, 0, 0, 0);
      break;
    case "This weekend":
      start.setDate(now.getDate() + (7 - now.getDay()));
      start.setHours(8, 0, 0, 0);
      end.setDate(now.getDate() + (7 - now.getDay()));
      end.setHours(9, 0, 0, 0);
      break;
    case "Next week":
      start.setDate(now.getDate() + (8 - now.getDay()));
      start.setHours(8, 0, 0, 0);
      end.setDate(now.getDate() + (8 - now.getDay()));
      end.setHours(9, 0, 0, 0);
      break;
  }

  return { startDate: start, endDate: end };
};

const options = [
  { label: "Later today", icon: "sunny-outline", time: "6:00 pm" },
  { label: "Tomorrow", icon: "partly-sunny-outline", time: "Thu, 8:00 am" },
  { label: "Later this week", icon: "briefcase-outline", time: "Fri, 8:00 am" },
  { label: "This weekend", icon: "cafe-outline", time: "Sun, 8:00 am" },
  { label: "Next week", icon: "calendar-outline", time: "Mon, 8:00 am" },
  { label: "Select date and time", icon: "calendar", time: "" },
];

export const ScheduleEventModal = ({
  visible,
  onClose,
  onSelect,
}: ScheduleEventModalProps) => {
  const [pickerMode, setPickerMode] = useState<"none" | "date" | "time">(
    "none"
  );
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleOptionPress = (opt: string) => {
    if (opt === "Select date and time") {
      setPickerMode("date");
      return;
    }

    const { startDate, endDate } = getDateForOption(opt);
    onSelect({ label: opt, startDate, endDate });
    onClose();
  };

  const handlePickerChange = (event: any, date?: Date) => {
    if (event.type === "dismissed") {
      setPickerMode("none");
      return;
    }

    if (pickerMode === "date" && date) {
      // Save selected date and open time picker next
      setSelectedDate(date);
      setPickerMode("time");
    } else if (pickerMode === "time" && date && selectedDate) {
      // Combine date + time into one Date object
      const combined = new Date(selectedDate);
      combined.setHours(date.getHours(), date.getMinutes(), 0, 0);
      const endDate = new Date(combined.getTime() + 60 * 60 * 1000);

      onSelect({ label: "Custom", startDate: combined, endDate });
      onClose();
      setPickerMode("none");
      setSelectedDate(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-black/50 justify-center p-6">
        <View className="bg-[#3A327B] rounded-2xl p-6">
          <View className="flex-row flex-wrap justify-between">
            {options.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleOptionPress(opt.label)}
                className="w-[48%] bg-black/15 rounded-xl p-4 mb-4"
              >
                <View className="flex items-center">
                  <Ionicons name={opt.icon as any} size={28} color="white" />
                  <Text className="text-white font-semibold mt-2 text-center">
                    {opt.label}
                  </Text>
                  {opt.time ? (
                    <Text className="text-gray-400 text-sm">{opt.time}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={onClose} className="mt-2 p-2 items-center">
            <Text className="text-gray-400">Cancel</Text>
          </TouchableOpacity>
        </View>

        {pickerMode !== "none" && (
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-2xl p-2">
            <DateTimePicker
              value={tempDate}
              mode={pickerMode}
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={handlePickerChange}
              minimumDate={new Date()}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};
