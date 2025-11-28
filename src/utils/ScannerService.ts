import { Alert } from "react-native";
import * as Contacts from "expo-contacts";
import { uploadBusinessCard } from "@/api/ocr";

// Process business card image
export const processBusinessCard = async (imageUri: string, token: string) => {
  if (!token) {
    Alert.alert(
      "Authentication required",
      "Please sign in to use this feature"
    );
    return;
  }

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
        summary: summary || "",
      };
      return contactInfo;
    } else {
      Alert.alert("Error", "Could not extract contact information");
    }
  } catch (error) {
    console.error("Error processing business card:", error);
    Alert.alert("Error", "Failed to process business card");
  }
};

// Add contact to device
export const addToContacts = async (contactData: any) => {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Cannot add contact without permission");
      return;
    }

    const contact: any = {
      [Contacts.Fields.FirstName]: contactData.name || "",
      [Contacts.Fields.ContactType]: Contacts.ContactTypes.Person,
    };

    if (contactData.mobile) {
      contact[Contacts.Fields.PhoneNumbers] = [
        {
          label: "mobile",
          number: contactData.mobile,
        },
      ];
    }

    if (contactData.email) {
      contact[Contacts.Fields.Emails] = [
        {
          label: "work",
          email: contactData.email,
        },
      ];
    }

    if (contactData.company) {
      contact[Contacts.Fields.Company] = contactData.company;
    }

    if (contactData.designation) {
      contact[Contacts.Fields.JobTitle] = contactData.designation;
    }

    if (contactData.address) {
      contact[Contacts.Fields.Addresses] = [
        {
          label: "home",
          street: contactData.address,
        },
      ];
    }

    if (contactData.summary) {
      contact[Contacts.Fields.Note] = contactData.summary;
    }

    const contactId = await Contacts.addContactAsync(contact);
    if (contactId) {
      Alert.alert("✅ Success", "Contact added successfully");
    }
  } catch (error) {
    console.error("Error adding contact:", error);
    Alert.alert("Error", "Failed to add contact");
  }
};


export const handleContactData = async (contactData: any) => {
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
    return {contactInfo};
};