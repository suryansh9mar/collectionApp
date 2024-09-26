import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/AntDesign';
import { colors } from '../assests/Colors';

const CollectionScreen = ({ route, navigation }) => {
  const { customer, setCustomers } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [newCollectionAmount, setNewCollectionAmount] = useState('');
  const [updatedCustomer, setUpdatedCustomer] = useState(customer);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch customer data from AsyncStorage and ensure latest data
  const fetchCustomerData = useCallback(async () => {
    try {
      const customersData = await AsyncStorage.getItem('customers');
      if (customersData) {
        const customers = JSON.parse(customersData);
        const customerData = customers.find(c => c.id === customer.id);
        setUpdatedCustomer(customerData);
      }
    } catch (error) {
      console.error('Error fetching customer data: ', error);
      Alert.alert('Error', 'Failed to load customer data');
    } finally {
      setIsLoading(false);
    }
  }, [customer.id]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  // Calculate total amounts dynamically
  const totalAmountPaid = updatedCustomer?.collection?.reduce((total, item) => total + item.amount, 0) || 0;
  const totalDueAmount = updatedCustomer ? updatedCustomer.dueAmount : 0;

  // Handle adding a new collection
  const handleAddCollection = async () => {
    const amountToAdd = parseFloat(newCollectionAmount);

    // Check for valid amount and whether it exceeds the total due amount
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    if (amountToAdd > totalDueAmount) {
      Alert.alert('Error', `The collection amount cannot be greater than the due amount (₹${totalDueAmount}).`);
      return;
    }

    const newCollection = {
      id: (customer.collection.length + 1).toString(),
      date: new Date().toISOString(),
      amount: amountToAdd,
    };

    const updatedCollections = [...customer.collection, newCollection];
    const newDueAmount = customer.dueAmount - amountToAdd;
    const updatedData = { ...customer, collection: updatedCollections, dueAmount: newDueAmount };


    try {
      const customersData = JSON.parse(await AsyncStorage.getItem('customers'));
      const updatedCustomers = customersData.map(c =>
        c.id === customer.id ? updatedData : c
      );

      await AsyncStorage.setItem('customers', JSON.stringify(updatedCustomers));

      setNewCollectionAmount('');
      setModalVisible(false);
      setUpdatedCustomer(updatedData);
      setCustomers(updatedCustomers);

      Alert.alert('Success', 'Collection added successfully!');
    } catch (error) {
      console.error('Error updating customer data: ', error);
      Alert.alert('Error', 'Failed to add collection. Please try again.');
    }
  };

  // Render individual collection item
  const renderItem = ({ item }) => (
    <View style={styles.collectionCard}>
      <Text style={styles.collectionText}>Date: {new Date(item.date).toLocaleDateString()}</Text>
      <Text style={styles.collectionText}>Amount: ₹{item.amount}</Text>
    </View>
  );

  useEffect(() => {
    navigation.setOptions({
      title: `Collection for ${customer.name}`,
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name='arrowleft' size={25} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, customer.name]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>Total Due Amount: ₹{totalDueAmount}</Text>
        <Text style={styles.summaryText}>Total Paid Amount: ₹{totalAmountPaid}</Text>
      </View>

      <FlatList
        data={updatedCustomer?.collection || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyListText}>No collections yet.</Text>}
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter Collection Amount</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder={`Max: ₹${totalDueAmount}`}
                value={newCollectionAmount}
                onChangeText={setNewCollectionAmount}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.confirmButton} onPress={handleAddCollection}>
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

// Styles
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: colors.primary,
  },
  emptyListText: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent, 
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30, 
    left: 10,
    zIndex: 1,
  },
});

export default CollectionScreen;
