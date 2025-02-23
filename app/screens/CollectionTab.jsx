import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../assests/Colors";

const CollectionTab = ({ route }) => {
  const { customer, setCollectionData } = route.params;
  // console.log(customer);

  const [modalVisible, setModalVisible] = useState(false);
  const [newCollectionAmount, setNewCollectionAmount] = useState("");
  const [collectionData, setCollectionDataState] = useState([]); // Store collection data
  const [totalPaid, setTotalPaid] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadCollectionData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(`collectionData${customer.id}`);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setCollectionDataState(parsedData);
        setTotalPaid(
          parsedData.reduce((acc, item) => acc + parseFloat(item.amount), 0)
        ); // Calculate total paid
      }
    } catch (error) {
      console.error("Error loading collection data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log(collectionData);
    loadCollectionData();
  }, []);

  const totalDueAmount = customer?.balance ? customer.balance * -1 : 0;

  // Handle adding a new collection
  const handleAddCollection = async () => {
    const amountToAdd = parseFloat(newCollectionAmount);

    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    if (amountToAdd > totalDueAmount) {
      Alert.alert(
        "Error",
        `The collection amount cannot be greater than the due amount (₹${totalDueAmount}).`
      );
      return;
    }
    const newCollection = {
      id: (collectionData.length + 1).toString(),
      date: new Date().toISOString(),
      amount: amountToAdd,
      payment_method: "CASH",
      transaction_number: `TXN-${new Date().getTime()}`,
    };

    const updatedCollections = [...collectionData, newCollection];
    const newDueAmount = customer.balance * -1 - amountToAdd;
    const updatedData = {
      ...customer,
      balance: newDueAmount,
    };
    try {
      await AsyncStorage.setItem(
        `collectionData${customer.id}`,
        JSON.stringify(updatedCollections)
      );
      setCollectionDataState(updatedCollections);
      setCollectionData(updatedCollections); // Update parent state
      setTotalPaid(
        updatedCollections.reduce(
          (acc, item) => acc + parseFloat(item.amount),
          0
        )
      );

      setNewCollectionAmount("");
      setModalVisible(false);
      Alert.alert("Success", "Collection added successfully!");
    } catch (error) {
      console.error("Error updating collection data: ", error);
      Alert.alert("Error", "Failed to add collection. Please try again.");
    }
  };

  // Render individual collection item
  const renderItem = ({ item }) => (
    <View style={styles.collectionCard}>
      <Text style={styles.collectionText}>Transaction: {item.transaction_number}</Text>
      <Text style={styles.collectionText}>Date: {new Date(item.created_at).toLocaleDateString()}</Text>
      <Text style={styles.collectionText}>Amount: ₹{item.amount}</Text>
      <Text style={styles.collectionText}>Payment Method: {item.payment_method}</Text>
    </View>
  );

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
        <Text style={styles.summaryText}>
          Total Due Amount: ₹{totalDueAmount}
        </Text>
        <Text style={styles.summaryText}>Total Paid Amount: ₹{totalPaid}</Text>
      </View>

      <FlatList
        data={collectionData || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>No collections yet.</Text>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
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
        </TouchableWithoutFeedback>
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
    color: "#FFF",
    fontWeight: "bold",
  },
  collectionCard: {
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  collectionText: {
    fontSize: 16,
    color: "#FFF",
  },
  addButton: {
    backgroundColor: colors.secondry,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
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
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmButton: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  confirmButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: colors.error,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
    marginTop: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30,
    left: 10,
    zIndex: 1,
  },
});

export default CollectionTab;
