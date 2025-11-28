import ModalInfo from "@/components/businessCard/ModalInfo";
import { handleContactData } from "@/utils/ScannerService";
import { Feather } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import * as Clipboard from 'expo-clipboard';
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Linking,
  Platform,
  Share,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Overlay from "./Overlay";

export default function ScannerScreen() {
  const qrLock = useRef(false);
  const appState = useRef(AppState.currentState);
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInfo, setModalInfo] = useState<any>(null);

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
          const { contactInfo } = await handleContactData(contactData);
          showContactOptions(contactInfo, contactData);
          return;
        }
      }
      // Check if it's MECARD format
      else if (data.startsWith('MECARD:')) {
        const contactData = parseMECARD(data);
        if (contactData.name || contactData.mobile || contactData.email) {
          const { contactInfo } = await handleContactData(contactData);
          showContactOptions(contactInfo, contactData);
          return;
        }
      }
      // Check if it's JSON contact data
      else if (data.trim().startsWith('{') && data.trim().endsWith('}')) {
        try {
          const contactData = JSON.parse(data);
          if (contactData.name && (contactData.email || contactData.mobile)) {
            const { contactInfo } = await handleContactData(contactData);
            showContactOptions(contactInfo, contactData);
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

        {/* Camera View */}
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "code128", "code39", "ean13", "ean8", "upc_a", "upc_e"]
          }}
          onBarcodeScanned={(result) => {
            if (qrLock.current) return;

            const scanned = result.raw ? result.raw : result.data;
            if (!scanned) return;

            handleScannedData(scanned);
          }}
        />

        <Overlay />
      </View>
      <ModalInfo modalVisible={modalVisible} closeModal={closeModal} modalInfo={modalInfo} />
    </>
  );
}