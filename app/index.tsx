import React, { useEffect, useState } from 'react';
import { SafeAreaView, Pressable, Text, Image, View, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
// import * as Contacts from 'expo-contacts';
import Contacts from 'react-native-contacts';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

type PostalAddress = {
  street: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
  pobox?: string;
  neighborhood?: string;
  region?: string; // Added region to match requirements
  postCode?: string; // Added postCode to match requirements
  [key: string]: any; // allow additional properties
};

export default function App() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [previousImageUri, setPreviousImageUri] = useState<string | null>(null); // Store previous image URI
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTextExtracted, setIsTextExtracted] = useState(false);
  // State to control the visibility of the expanded icons
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Add a state variable to lock the function

  // Function to toggle the expansion
  const toggleExpand = () => {
    setIsExpanded((prev) => !prev); // Toggle the state without animation
  };

   // Load previous image on app start
   useEffect(() => {
    const loadPreviousImage = async () => {
      const savedImageUri = await AsyncStorage.getItem('previousImageUri');
      if (savedImageUri) {
        setPreviousImageUri(savedImageUri);
      }
    };

    loadPreviousImage();
  }, []);

  useEffect(() => {
    if (extractedText && isTextExtracted) {
      saveContact(); // Call saveContact only when text is fully extracted
    }
  }, [extractedText, isTextExtracted]);

  const saveContact = async () => {
    if (!isTextExtracted) {
      Alert.alert('No extracted text', 'Please upload an image and extract text before saving.');
      return;
    }

    if (isSaving) {
      Alert.alert('Saving in progress', 'Please wait until the current save operation is completed.');
      return;
    }

    setIsSaving(true);

    try {

        // Check if Contacts is not null
        if (!Contacts) {
          Alert.alert('Error', 'Contacts module is not initialized.');
          return;
        }

      const permission = await Contacts.requestPermission();

      if (permission !== 'authorized') {
        Alert.alert('Permission Denied', 'Access to contacts is required to save.');
        return;
      }

      const contactDetails = JSON.parse(extractedText);

      if (!contactDetails.name || !contactDetails.phone) {
        Alert.alert('Missing Information', 'Both Name and Phone number are required to save a contact.');
        return;
      }

      const nameParts = contactDetails.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const additionalInfo = Object.entries(contactDetails)
        .filter(([key]) => !['name', 'phone', 'email', 'company_name', 'address', 'website'].includes(key))
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');

      // Prepare the contact data
      const contact = {
        displayName: contactDetails.name,
        firstName,
        lastName,
        phoneNumbers: [{ label: 'mobile', number: contactDetails.phone }],
        emails: contactDetails.email ? [{ label: 'work', email: contactDetails.email }] : [],
        organization: contactDetails.businessName || '',
        postalAddresses: contactDetails.address
          ? [{
              label: 'home',
              street: contactDetails.address,
              city: '', // Add city if available
              state: '', // Add state if available
              country: '', // Add country if available
              postalCode: '', // Add postal code if available
              formattedAddress: '', // Add formatted address if available
              pobox: '', // Add pobox if available
              neighborhood: '', // Add neighborhood if available
              region: '', // Add region if available
              postCode: '' // Ensure postCode is included
            }]
          : [],
        note: additionalInfo ? `Website: ${contactDetails.website || ''}\n${additionalInfo}` : '',
      };

     // Open the native contact form with pre-filled data
     Contacts.openContactForm(contact)
     .then((contact) => {
       if (contact) {
         Alert.alert('Success', 'Contact saved successfully!');
       }
     })
     .catch((error) => {
       console.error('Error opening contact form:', error);
       Alert.alert('Error', 'There was an error opening the contact form.');
     });

 } catch (error) {
   console.error('Error saving contact:', error);
   Alert.alert('Error', 'There was an error processing the contact.');
 } finally {
   setIsSaving(false);
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
      // Set image URI
      const uri = result.assets[0].uri;
      setPreviousImageUri(imageUri);
      setImageUri(uri);

      // Save the new image URI to AsyncStorage for future loads
      try {
        await AsyncStorage.setItem('previousImageUri', uri); // Save the new image in AsyncStorage
      } catch (error) {
        console.error('Error saving image to AsyncStorage:', error);
      }

      toggleExpand(); 
      uploadImage(uri);
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
      const uri = result.assets[0].uri;
      setPreviousImageUri(imageUri);
      setImageUri(uri);

      // Save the new image URI to AsyncStorage for future loads
      try {
        await AsyncStorage.setItem('previousImageUri', uri); // Save the new image in AsyncStorage
      } catch (error) {
        console.error('Error saving image to AsyncStorage:', error);
      }

      toggleExpand(); 
      await uploadImage(uri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!uri) {
      Alert.alert('No image selected', 'Please choose an image first.');
      return;
    }
  
    setLoading(true); 
  
    const formData = new FormData();
    formData.append('image', {
      uri: uri,
      name: 'photo.jpg', 
      type: 'image/jpeg' 
    }as any);
  
    try {
      const response = await axios.post('http://192.168.73.128:3000/process-image', formData, {
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

  const loadPreviousImage = async () => {
    if (previousImageUri) {
      setImageUri(previousImageUri);
      await uploadImage(previousImageUri); // Load the previous image
    } else {
      Alert.alert('No previous image', 'There is no previously uploaded image.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Centered Content */}
    <View style={styles.centeredContent}>
      {!imageUri && (
        <View style={styles.logoAndTextContainer}>
          {/* Company Logo */}
          <Image source={require('../assets/fonts/Sprint1-Logo-For-lt-bg.png')} style={styles.logo} />

          {/* Company Info Text */}
          <Text style={styles.infoText}>
            Effortlessly capture and save business card details to your contacts with just one click.
          </Text>

        <Text style={styles.infoText2}>
            Simply snap a photo, and the app handles the rest!
        </Text>
        </View>
      )}

{imageUri && (
  <>
    <Image source={{ uri: imageUri }} style={styles.image} />
    {loading && <Text style={styles.loadingText}>Loading...</Text>}
  </>
)}
    </View>
        {/* Bottom Bar */}
      <View style={styles.bottomBar}>

            {/* Small box showing the previous image */}
        {previousImageUri && (
          <TouchableOpacity onPress={loadPreviousImage} style={styles.previousImageContainer}>
            <Image source={{ uri: previousImageUri }} style={styles.previousImage} />
          </TouchableOpacity>
        )}

          <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
              <View style={styles.innerCircle}></View>
          </TouchableOpacity>


                    {/* Three Dots Icon for Dropdown Menu */}
            <View style={styles.dotMenuContainer}>
              <TouchableOpacity onPress={toggleExpand}>
                <MaterialIcons name="more-vert" size={30} color="#00539CFF" />
              </TouchableOpacity>

              {/* Dropdown Gallery Icon */}
              {isExpanded && (
                <View style={styles.expandedIcons}>
                  <TouchableOpacity style={styles.iconButton}>
                    <MaterialIcons name="photo-library" size={30} color="black" onPress={chooseImageFromGallery} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

  
      </View>
</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },

  image: {
    width: '100%',
    height: '50%',
    resizeMode: 'contain',
    // flex: 1,
  },
  loadingText: {
    fontSize: 18,
    color: 'blue',
    textAlign: 'center',
  },

  centeredContent: {
    flex: 1,
    justifyContent: 'center', // Center content vertically
    alignItems: 'center',     // Center content horizontally
  },
  logoAndTextContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 250,   // Adjust the width and height of the logo
    height: 70,  // Example size
  },
  infoText: {
    fontSize: 18,
    textAlign: 'center',  // Center the text
    color: 'black',
    paddingHorizontal: 40,
    marginBottom: 30,
    marginTop: 70,
  },
  infoText2: {
    fontSize: 16,
    textAlign: 'center',  // Center the text
    color: 'black',
    paddingHorizontal: 40,
    fontWeight: 'bold'
  },
  bottomBar: {
    height: 150,
    // backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  previousImageContainer: {
    position: 'absolute',
    width: 60,  // Adjust the size of the small box
    height: 60,
    borderRadius: 10,  // Add a slight rounding
    overflow: 'hidden',
    bottom: 45,
    left: 30
  },
  previousImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',  // Ensure the image fits the box
  },
  captureButton: {
    width: 60, // Adjust width to create the round shape
    height: 60, // Same height as width for a perfect circle
    borderRadius: 30, // Half of the width/height to make it circular
    backgroundColor: 'red', // Capture button color (you can customize this)
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 40, // Smaller circle inside for the capture effect
    height: 40,
    borderRadius: 20, // Inner circle color
  },
  dotMenuContainer: {
    alignItems: 'center',
    marginLeft: 10
  },
  expandedIcons: {
    position: 'absolute',
    top: -50, // Adjust position based on your layout
    left: 10,
    // backgroundColor: '#fff',
    borderRadius: 5,
    padding: 0,
    height: 50,
    width: 50
  },
  iconButton: {
    padding: 10,
  },
});
