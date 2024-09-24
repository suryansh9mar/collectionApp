import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../assests/Colors';
import Icon from 'react-native-vector-icons/AntDesign';

const CollectionScreen = ({ route, navigation }) => {
  const { customer, setCustomers } = route.params;
  const [collectionHistory, setCollectionHistory] = useState([
    { id: '1', date: '2024-09-01', amount: 500 },
    { id: '2', date: '2024-09-10', amount: 1200 },
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCollectionAmount, setNewCollectionAmount] = useState('');

  
  useEffect(() => {
    navigation.setOptions({
      title: `Collection for ${customer.name}`,
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name='arrowleft' size={25}/>
        </TouchableOpacity>
       
      ),
    });
  }, [navigation, customer.name]);

  // Calculate total amount paid
  const totalAmountPaid = collectionHistory.reduce((total, item) => total + item.amount, 0);
  const [totalDueAmount,setTotalDueAmount]= useState(customer.dueAmount)
  const handleAddCollection = () => {
    const amountToAdd = parseFloat(newCollectionAmount);

    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    const updatedDueAmount = customer.dueAmount > 0 ? customer.dueAmount - amountToAdd : 0;
     setTotalDueAmount(updatedDueAmount);
    // Update customer due amount in parent (CustomerScreen)
    setCustomers((prevCustomers) =>
      prevCustomers.map((c) =>
        c.id === customer.id ? { ...c, dueAmount: updatedDueAmount } : c
      )
    );

    // Add new collection record
    const newCollection = {
      id: (collectionHistory.length + 1).toString(),
      date: new Date().toLocaleDateString(),
      amount: amountToAdd,
    };

    setCollectionHistory([...collectionHistory, newCollection]);
    setModalVisible(false);
    setNewCollectionAmount(''); // Clear input field
    Alert.alert('Success', 'Collection added and due amount updated!');
  };

  const renderItem = ({ item }) => (
    <View style={styles.collectionCard}>
      <Text style={styles.collectionText}>Date: {item.date}</Text>
      <Text style={styles.collectionText}>Amount: ₹{item.amount}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Total Due Amount: ₹{totalDueAmount }</Text>
        <Text style={styles.summaryText}>Total Paid Amount: ₹{totalAmountPaid}</Text>
      </View>

      <FlatList
        data={collectionHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>Add Collection</Text>
      </TouchableOpacity>

      {/* Modal for adding collection */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Collection Amount</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Enter amount"
              value={newCollectionAmount}
              onChangeText={setNewCollectionAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddCollection}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  summaryContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: colors.accent,
    borderRadius: 10,
  },
  summaryText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  collectionCard: {
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  collectionText: {
    fontSize: 16,
    color: '#FFF',
  },
  addButton: {
    backgroundColor: colors.secondry,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    marginLeft: 15,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.primary,
  },
  input: {
    height: 50,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: colors.error,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CollectionScreen;
