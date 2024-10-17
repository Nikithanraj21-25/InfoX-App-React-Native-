import React, { useState } from 'react';
import { SafeAreaView, Pressable, Text, Image, View, TextInput, StyleSheet, Alert, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as Contacts from 'expo-contacts';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Define the type for your saved data
interface SavedDataItem {
  _id: string; // MongoDB uses _id as the identifier
  serialNo: number;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  otherInfo?: string;
  date: string;
  time: string;
}

export default function App() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTextExtracted, setIsTextExtracted] = useState(false);
  // State to control the visibility of the expanded icons
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

    const handleClick = () => {
        router.push('/data-page'); // Navigate to the data page
    };

  // Function to toggle the expansion
  const toggleExpand = () => {
    setIsExpanded((prev) => !prev); // Toggle the state without animation
  };
  
  const saveContact = async () => {
    if (!isTextExtracted) {
      Alert.alert('No extracted text', 'Please upload an image and extract text before saving.');
      return;
    }
  
    try {
      // Request permission to access contacts
      const { status } = await Contacts.requestPermissionsAsync();
  
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Access to contacts is required to save.');
        return;
      }
  
      // Parse the JSON data from extractedText
      const contactDetails = JSON.parse(extractedText);
  
      if (!contactDetails.name || !contactDetails.phone) {
        Alert.alert('Missing Information', 'Both Name and Phone number are required to save a contact.');
        return;
      }
  
      // Split the full name into first name and last name
      const nameParts = contactDetails.name.split(' '); // Split by spaces
      const firstName = nameParts[0]; // First word as the first name
      const lastName = nameParts.slice(1).join(' '); // Remaining part as the last name

       // Create the notes string with all additional information
    const additionalInfo = Object.entries(contactDetails)
    .filter(([key]) => !['name', 'phone', 'email', 'company_name', 'address', 'website'].includes(key)) // Exclude certain fields
    .map(([key, value]) => `${key}: ${value}`) // Create key-value pairs
    .join('\n'); // Join them with new line for better readability
  
      // Create contact object with necessary fields
      const contact = {
        [Contacts.Fields.Name]: contactDetails.name, // Save full name for the name field
        [Contacts.Fields.FirstName]: firstName, // First name
        [Contacts.Fields.LastName]: lastName, // Last name (if available)
        [Contacts.Fields.PhoneNumbers]: [{ label: 'mobile', number: contactDetails.phone }],
        [Contacts.Fields.Emails]: contactDetails.email ? [{ label: 'work', email: contactDetails.email }] : [],
        [Contacts.Fields.Company]: contactDetails.company_name || '', // Use the correct key
        [Contacts.Fields.Addresses]: contactDetails.address
          ? [{ label: 'home', street: contactDetails.address }]
          : [],
        [Contacts.Fields.Note]: additionalInfo ? `Website: ${contactDetails.website || ''}\n${additionalInfo}` : '',
        contactType: Contacts.ContactTypes.Person, // Specify the contact type (person or company)
      };
  
      // Save contact
      await Contacts.addContactAsync(contact);
      Alert.alert('Success', 'Contact saved successfully!');
    } catch (error) {
      console.error('Error saving contact:', error);
      Alert.alert('Error', 'There was an error saving the contact.');
    }
  };
     

  const requestPermissions = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted || !mediaLibraryPermission.granted) {
      alert('Permission to access camera and media library is required!');
      return false;
    }
    return true;
  };

  const chooseImageFromGallery = async () => {
    const permissionGranted = await requestPermissions();
    if (!permissionGranted) return;

    const options = {
      mediaType: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    };
    const result = await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      toggleExpand(); 
    }
  };

  const takePhoto = async () => {
    const permissionGranted = await requestPermissions();
    if (!permissionGranted) return;

    const options = {
      mediaType: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    };
    const result = await ImagePicker.launchCameraAsync(options);
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      toggleExpand(); 
    }
  };

  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert('No image selected', 'Please choose an image first.');
      return;
    }
  
    setLoading(true); 
  
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      name: 'photo.jpg', 
      type: 'image/jpeg' 
    }as any);
  
    try {
      const response = await axios.post('http://192.168.233.128:3000/process-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log(response);
      setExtractedText(response.data.extractedText); 
      setIsTextExtracted(true);
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Upload failed', 'There was an error uploading the image.');
    } finally {
      setLoading(false); 
    }
  };

 

  return (
    <SafeAreaView style={styles.container}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity>
          <MaterialIcons name="menu" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.appTitle}>InfoX</Text>
      </View>
      <ScrollView>

        {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity style={styles.uploadButton} onPress={uploadImage}>
              <MaterialIcons name="play-arrow" size={20} color="#00539CFF" />
            </TouchableOpacity>
          </View>
        )}

        {loading && <Text style={{marginLeft: 10}}>Loading...</Text>}

        {imageUri && <TextInput
          style={styles.textInput}
          multiline
          editable={false}
          value={extractedText}
          placeholder="Extracted text will appear here"
        />}

        {isTextExtracted && (
          <View style={styles.buttonContainer}>
            <Pressable style={styles.button} onPress={saveContact}>
              <Text style={styles.buttonText}>Save Contact</Text>
            </Pressable>
          </View>
        )} 
        </ScrollView>
        {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.addButtonContainer}>
          <TouchableOpacity onPress={toggleExpand}>
            <MaterialIcons name="add" size={30} color="#00539CFF" />
          </TouchableOpacity>
        </View>

          {/* Expanded Icons without animation */}
          {isExpanded && (
            <View style={styles.expandedIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <MaterialIcons name="photo-library" size={30} color="black" onPress={chooseImageFromGallery}/>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <MaterialIcons name="camera-alt" size={30} color="black" onPress={takePhoto}/>
              </TouchableOpacity>
            </View>
          )}
  

        <TouchableOpacity>
          <MaterialIcons name="folder" size={30} color="#EEA47FFF" onPress={handleClick}/>
        </TouchableOpacity>
      </View>
</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonContainer: {
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#EEA47FFF',
    padding: 10,
    borderRadius: 5,
    width: '30%',
    marginLeft: '35%',
  },
  buttonText: {
    color: '#00539CFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageContainer: {
    flexDirection: 'row', // Arrange items in a column
    // alignItems: 'flex-end', // Align items to the right
    marginTop: 20,
    marginBottom: 20, // Add some space below the image
    // flexBasis: '50%'
    padding: 5
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    flex: 5,
  },
  uploadButton: {
    backgroundColor: '#EEA47FFF', // Set background color for visibility
    top: 210,
    alignItems: 'center', // Center the icon
    justifyContent: 'center',
    height: 30,
    flex: .45,
    borderRadius: 40,
    marginLeft: 10,
    marginRight: 15
  },
  textInput: {
    marginTop: 20,
    padding: 10,
    height: 250,
    width: '90%',
    borderColor: '#ccc',
    borderWidth: 2,
    color: "black",
    marginLeft: '5%'
  },
  flatList: {
    marginTop: 20,
  },
  savedItemContainer: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginVertical: 5,
  },
  savedItemText: {
    color: '#333',
  },
  indentedText: {
    marginLeft: 20, // Adjust this value as needed for your desired indentation
  },

  // ====UI
  appBar: {
    height: 60,
    backgroundColor: '#00539CFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  appTitle: {
    flex: 1,
    textAlign: 'left',
    fontSize: 20,
    color: 'white',
    paddingLeft: 10,
  },
  bottomBar: {
    height: 60,
    backgroundColor: '#00539CFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative', // Required for absolute positioning
  },
  addButtonContainer: {
    backgroundColor: '#EEA47FFF',
    borderRadius: 5,
    padding: 2
  },
  expandedIcons: {
    position: 'absolute', // Position the icons absolutely
    bottom: 60, // Place the icons above the add button 
    flexDirection: 'column',
    zIndex: 1,
    marginLeft: 22.5,
  },
  iconButton: {
    marginVertical: 5
  },
});
