import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../assests/Colors';

const initialCustomersData = [
  { id: '1', name: 'John Doe', phone: '123-456-7890', address: '123 Main St, City A', dueAmount: 1500 },
  { id: '2', name: 'Jane Smith', phone: '987-654-3210', address: '456 Elm St, City B', dueAmount: 3000 },
  // Add more customers here
];

const CustomerScreen = () => {
  const [customers, setCustomers] = useState(initialCustomersData);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  const handleDetails = (customer) => {
    setSelectedCustomer(customer);
    setModalVisible(true);
  };

  const handleCustomerClick = (customer) => {
    navigation.navigate('Collection', { customer, setCustomers });
  };

  const renderItem = ({ item }) => (
    <View style={styles.customerCard}>
      <TouchableOpacity onPress={() => handleCustomerClick(item)}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.dueAmount}>Due Amount: ₹{item.dueAmount}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.detailsButton} onPress={() => handleDetails(item)}>
        <Text style={styles.detailsButtonText}>Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Customers</Text>
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      {/* Modal for Customer Details */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Customer Details</Text>
            {selectedCustomer && (
              <>
                <Text style={styles.modalText}>Name: {selectedCustomer.name}</Text>
                <Text style={styles.modalText}>Phone: {selectedCustomer.phone}</Text>
                <Text style={styles.modalText}>Address: {selectedCustomer.address}</Text>
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
  },
  customerCard: {
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flex:1,
  },
  customerName: {
    fontSize: 18,
    color: '#FFF',
  },
  dueAmount: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 5,
  },
  detailsButton: {
    backgroundColor: colors.secondry,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width:70,
    position:'absolute',
    left:290,
  },
  detailsButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalContainer: {
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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: colors.error,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default CustomerScreen;
