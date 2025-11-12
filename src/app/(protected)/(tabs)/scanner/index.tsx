import { CameraView } from "expo-camera";
import {
  AppState,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Alert,
  Share,
  View,
  TouchableOpacity,
  Text,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import Overlay from "./Overlay";
import * as Contacts from 'expo-contacts';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { uploadBusinessCard } from "@/api/ocr";
import { useAuth } from "@/context/AuthContext";

export default function ScannerScreen() {
  const { token } = useAuth();
  const qrLock = useRef(false);
  const appState = useRef(AppState.currentState);
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInfo, setModalInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        qrLock.current = false;
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  // Parse vCard format
  const parseVCard = (vcard: string) => {
    const lines = vcard.split(/\r?\n/);
    const contact: any = {};

    for (const line of lines) {
      if (line.startsWith('FN:')) {
        contact.name = line.substring(3).trim();
      } else if (line.startsWith('TEL')) {
        const tel = line.split(':')[1]?.trim();
        if (tel) contact.mobile = tel;
      } else if (line.startsWith('EMAIL')) {
        const email = line.split(':')[1]?.trim();
        if (email) contact.email = email;
      } else if (line.startsWith('ORG:')) {
        contact.company = line.substring(4).trim();
      } else if (line.startsWith('TITLE:')) {
        contact.designation = line.substring(6).trim();
      } else if (line.startsWith('ADR')) {
        const addr = line.split(':')[1]?.trim();
        if (addr) contact.address = addr.replace(/;/g, ", ")
        .replace(/\\,/g, ",")
        .replace(/\s*,\s*/g, ", ")
        .replace(/(,\s*)+/g, ", ")
        .trim()
        .replace(/^,|,$/g, "");
      }
    }

    return contact;
  };

  // Parse MECARD format
  const parseMECARD = (mecard: string) => {
    const contact: any = {};
    const nameMatch = mecard.match(/N:([^;]+)/);
    const telMatch = mecard.match(/TEL:([^;]+)/);
    const emailMatch = mecard.match(/EMAIL:([^;]+)/);
    const orgMatch = mecard.match(/ORG:([^;]+)/);
    const addrMatch = mecard.match(/ADR:([^;]+)/);

    if (nameMatch) contact.name = nameMatch[1];
    if (telMatch) contact.mobile = telMatch[1];
    if (emailMatch) contact.email = emailMatch[1];
    if (orgMatch) contact.company = orgMatch[1];
    if (addrMatch) contact.address = addrMatch[1];

    return contact;
  };

  // New function to handle image selection
  const handleImageSelection = async (useCamera: boolean) => {
    setLoading(true);
    setShowUploadOptions(false);
    
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Camera permission is needed to take photos");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.9,
          base64: false,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Gallery access is needed to select photos");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.9,
          base64: false,
        });
      }

      if (!result.canceled && result.assets?.[0]?.uri) {
        await processBusinessCard(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to process image");
    } finally {
      setLoading(false);
    }
  };

  // Process business card image
  const processBusinessCard = async (imageUri: string) => {
    if (!token) {
      Alert.alert("Authentication required", "Please sign in to use this feature");
      return;
    }

    setLoading(true);
    try {
      const response = await uploadBusinessCard(imageUri, token);
      if (response.status === "success") {
        const { data, summary } = response;
        const contactInfo = {
          name: data.full_name || "",
          email: data.email || "",
          mobile: data.phone_number || "",
          company: data.company || "",
          designation: data.designation || "",
          address: data.location || "",
          summary: summary || ""
        };
        handleContactData(contactInfo);
      } else {
        Alert.alert("Error", "Could not extract contact information");
      }
    } catch (error) {
      console.error("Error processing business card:", error);
      Alert.alert("Error", "Failed to process business card");
    } finally {
      setLoading(false);
    }
  };

  // Add contact to device
  const addToContacts = async (contactData: any) => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot add contact without permission');
        return;
      }

      const contact: any = {
        [Contacts.Fields.FirstName]: contactData.name || '',
        [Contacts.Fields.ContactType]: Contacts.ContactTypes.Person,
      };

      if (contactData.mobile) {
        contact[Contacts.Fields.PhoneNumbers] = [{
          label: 'mobile',
          number: contactData.mobile,
        }];
      }

      if (contactData.email) {
        contact[Contacts.Fields.Emails] = [{
          label: 'work',
          email: contactData.email,
        }];
      }

      if (contactData.company) {
        contact[Contacts.Fields.Company] = contactData.company;
      }

      if (contactData.designation) {
        contact[Contacts.Fields.JobTitle] = contactData.designation;
      }

      if (contactData.address) {
        contact[Contacts.Fields.Addresses] = [{
          label: 'home',
          street: contactData.address,
        }];
      }

      if (contactData.summary) {
        contact[Contacts.Fields.Note] = contactData.summary;
      }

      const contactId = await Contacts.addContactAsync(contact);
      if (contactId) {
        Alert.alert('✅ Success', 'Contact added successfully');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      Alert.alert('Error', 'Failed to add contact');
    }
  };

  const handleContactData = async (contactData: any) => {
    const { name, email, mobile, company, designation, address, summary } = contactData;

    const contactInfo = [
      name ? `👤 ${name}` : '',
      mobile ? `📱 ${mobile}` : '',
      email ? `📧 ${email}` : '',
      company ? `🏢 ${company}` : '',
      designation ? `💼 ${designation}` : '',
      address ? `📍 ${address}` : '',
      summary ? `📝 ${summary}` : '',
    ].filter(Boolean).join('\n\n');

    // Show contact options with formatted information
    showContactOptions(contactInfo, contactData);
  };

  const showContactOptions = (formattedInfo: string, contactData: any) => {
    setModalInfo({ formattedInfo, contactData });
    setModalVisible(true);
  };

  const handleScannedData = async (data: any) => {
    if (!data || qrLock.current) return;
    qrLock.current = true;

    try {
      // Check if it's vCard format
      if (data.startsWith('BEGIN:VCARD')) {
        const contactData = parseVCard(data);
        if (contactData.name || contactData.mobile || contactData.email) {
          handleContactData(contactData);
          return;
        }
      }
      // Check if it's MECARD format
      else if (data.startsWith('MECARD:')) {
        const contactData = parseMECARD(data);
        if (contactData.name || contactData.mobile || contactData.email) {
          handleContactData(contactData);
          return;
        }
      }
      // Check if it's JSON contact data
      else if (data.trim().startsWith('{') && data.trim().endsWith('}')) {
        try {
          const contactData = JSON.parse(data);
          if (contactData.name && (contactData.email || contactData.mobile)) {
            handleContactData(contactData);
            return;
          }
        } catch {
          // If JSON parsing fails, continue with other checks
        }
      }
      // Check if it's a URL
      else if (data.startsWith('http://') || data.startsWith('https://')) {
        await Linking.openURL(data);
      }
      // Check if it's an email address
      else if (data.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        await Linking.openURL(`mailto:${data}`);
      }
      // Check if it's a phone number
      else if (data.match(/^\+?[\d\s\-\(\)]+$/)) {
        await Linking.openURL(`tel:${data.replace(/\s/g, '')}`);
      }
      // Check if it's plain text without URL patterns
      else if (!data.match(/^https?:\/\//i)) {
        Alert.alert(
          "Scanned Text",
          data,
          [
            { text: "Share", onPress: () => Share.share({ message: data }) },
            { text: "Copy", onPress: async () => {
              await Clipboard.setStringAsync(data);
              Alert.alert("Copied to clipboard");
            }},
            { text: "Cancel", style: "cancel" }
          ]
        );
      }
      // For other formats that weren't caught above, try to open directly
      else {
        await Linking.openURL(data);
      }
    } catch (error) {
      console.error('Error handling scanned data:', error);
      Alert.alert(
        "Error",
        "Unable to process the scanned content. It may not be a valid URL or supported format.",
        [{ text: "OK" }]
      );
    }

    // Reset the lock after a delay
    setTimeout(() => {
      qrLock.current = false;
    }, 2000);
  };

  const closeModal = () => {
    setModalVisible(false);
    qrLock.current = false;
  };

  const handleCloseScreen = () => {
    router.back();
    qrLock.current = false;
  };

  return (
    <>
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS === "android" && <StatusBar hidden />}
        
        {/* Close button */}
        <TouchableOpacity
          onPress={handleCloseScreen}
          className={`absolute ${Platform.OS === 'ios' ? 'top-[50px]' : 'top-5'} right-5 bg-black/50 rounded-full p-2 z-10`}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Feather name="x" size={24} color="white" />
        </TouchableOpacity>

        {/* Toggle button for upload options */}
        <TouchableOpacity
          onPress={() => setShowUploadOptions(!showUploadOptions)}
          className="absolute bottom-8 right-5 bg-black/50 rounded-full p-3 z-10"
        >
          <Feather name="upload" size={24} color="white" />
        </TouchableOpacity>

        {/* Upload options menu */}
        {showUploadOptions && (
          <View className="absolute bottom-24 right-5 bg-white rounded-lg p-2 z-10 shadow-lg">
            <TouchableOpacity 
              onPress={() => handleImageSelection(true)}
              className="flex-row items-center p-2"
            >
              <Feather name="camera" size={20} className="mr-2" />
              <Text>Take Photo</Text>
            </TouchableOpacity>
            <View className="h-px bg-gray-200 my-1" />
            <TouchableOpacity 
              onPress={() => handleImageSelection(false)}
              className="flex-row items-center p-2"
            >
              <Feather name="image" size={20} className="mr-2" />
              <Text>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Camera View */}
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={({ raw }) => handleScannedData(raw)}
        />
        <Overlay />

        {/* Loading indicator */}
        {loading && (
          <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-black/50">
            <ActivityIndicator size="large" color="#16a34a" />
            <Text className="mt-4 text-white">Processing...</Text>
          </View>
        )}
      </View>

      {/* Contact Info Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View className="flex-1 bg-[rgba(0,0,0,0.6)] justify-center items-center">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-xl p-5 w-[85%]">
                <TouchableOpacity 
                  onPress={closeModal} 
                  className="absolute top-2 right-2 p-2"
                >
                  <Feather name="x" size={20} color="black" />
                </TouchableOpacity>
                
                <Text className="text-lg font-semibold mb-4">📇 Contact Info</Text>
                
                <Text className="text-base mb-5">{modalInfo?.formattedInfo}</Text>

                <View className="flex-row justify-between gap-5 mt-4">
                  <TouchableOpacity
                    className="flex-1 bg-green-600 py-3 rounded-lg items-center"
                    onPress={() => {
                      addToContacts(modalInfo?.contactData);
                      closeModal();
                    }}
                  >
                    <Text className="text-white font-semibold">Save Contact</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="flex-1 bg-gray-200 py-3 rounded-lg items-center"
                    onPress={closeModal}
                  >
                    <Text className="text-gray-800 font-semibold">Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}