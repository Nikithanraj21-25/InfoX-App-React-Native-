import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useData } from './DataContext'; // Import your context

// Define the structure of your saved data item
interface SavedDataItem {
  serialNo: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  otherInfo: string;
  date: string;
  time: string;
}

const DataPage = () => {
  const { savedData } = useData(); // Access saved data from context

  const renderItem = ({ item }: { item: SavedDataItem }) => (
    <View style={styles.savedItemContainer}>
      <Text style={styles.savedItemText}>Serial No: {item.serialNo}</Text>
      <Text style={styles.savedItemText}>Name: {item.name}</Text>
      <Text style={styles.savedItemText}>Business Name: {item.businessName}</Text>
      <Text style={styles.savedItemText}>Phone: {item.phone}</Text>
      <Text style={styles.savedItemText}>Email: {item.email}</Text>
      <Text style={styles.savedItemText}>Address: {item.address}</Text>
      <Text style={styles.savedItemText}>Website: {item.website}</Text>
      <Text>Other Infos:-</Text>
      <Text style={[styles.savedItemText, styles.indentedText]}>{item.otherInfo}</Text>
      <Text style={styles.savedItemText}>Date: {item.date}</Text>
      <Text style={styles.savedItemText}>Time: {item.time}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stored Data</Text>
      {savedData && savedData.length > 0 ? (
        <FlatList
          data={savedData}
          keyExtractor={(item, index) => index.toString()} // You can adjust keyExtractor if 'id' exists
          renderItem={renderItem}
        />
      ) : (
        <Text style={styles.noDataText}>No data found.</Text>
      )}
    </View>
  );
};

// Define your styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  savedItemContainer: {
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  savedItemText: {
    fontSize: 14,
    marginVertical: 2,
  },
  indentedText: {
    paddingLeft: 10,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default DataPage;
