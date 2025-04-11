import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DropDownPicker from "react-native-dropdown-picker";
import { colors } from "../assests/Colors";

export default function AddCollection({ route, navigation }) {
  const [customerList, setCustomerList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState(null);
  const [balance, setBalance] = useState(0);
  const [collectionAmount, setCollectionAmount] = useState("");
  const [openCustomer, setOpenCustomer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  // const [isOffline, setIsOffline] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentList, setPaymentList] = useState([
    { label: "CASH", value: "CASH" },
    { label: "UPI", value: "UPI" },
    { label: "CHEQUE", value: "CHEQUE" },
    { label: "BANK TRANSFER", value: "BANK_TRANSFER" },
    { label: "DEBIT CARD", value: "DEBIT" },
    { label: "OTHER", value: "OTHER" },
  ]);
  const { customer, item } = route?.params || {};
  useEffect(() => {
    navigation.setOptions({
      title: `${item?.id ? "Update Collection" : "Add Collection"}`,
      headerShown: true,
      
    });
  }, [navigation]);
  useEffect(() => {
    if (customer) {
      console.log(customer);
      setSelectedCustomer(customer.id);
    }
    if (item) {
      setCollectionAmount(item.collectionAmount);
      setPaymentMethod(item.paymentMethod);
      setSelectedCustomer(item.selectedCustomer);
    }
    getCustomers();
    console.log(item);
  }, []);

  const getCustomers = async () => {
    try {
      const storedCustomers = await AsyncStorage.getItem("customers");
      if (!storedCustomers) {
        throw new Error("No stored customers found");
      }

      const customers = JSON.parse(storedCustomers);
      const formattedCustomers = customers.map((customer) => ({
        label: `${customer.name} `,
        value: customer.id,
        balance: customer.balance,
      }));

      setCustomerList(formattedCustomers);
    } catch (error) {
      console.error("Error loading customers:", error);
      Alert.alert("Error", "Failed to load customers.");
    }
  };
  //update customer
  const handleUpdateCollection = async () => {
    setIsLoading(true);
    if (!paymentMethod) {
      Alert.alert("Error", "Please select a payment method");
      setIsLoading(false);
      return;
    }
    if (!selectedCustomer) {
      Alert.alert("Error", "Please select a customer.");
      setIsLoading(false);
      return;
    }
    if (!collectionAmount || isNaN(collectionAmount) || collectionAmount <= 0) {
      Alert.alert("Error", "Enter a valid collection amount.");
      setIsLoading(false);
      return;
    }
    const today = new Date();
    const currentDate = today.toLocaleDateString("en-CA");
    try {
      const payloads = await AsyncStorage.getItem("offlineCollections");
      let offlineData = payloads ? JSON.parse(payloads) : [];
      const updatedData = offlineData.map((entry) => {
        if (entry.id === item.id) {
          return {
            ...entry,
            id: item.id,
            selectedCustomer,
            selectedCustomerName,
            collectionAmount,
            paymentMethod,
            currentDate,
          };
        }
        return entry;
      });
      // console.log(updatedData);
      await AsyncStorage.setItem(
        "offlineCollections",
        JSON.stringify(updatedData)
      );
      setIsLoading(false);
      Alert.alert("Success", "Collection updated successfully.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to update customer.");
      console.log(error);
      setIsLoading(false);
    }
  };

  const handleCustomerChange = (customerId) => {
    const customer = customerList.find((c) => c.value === customerId);
    setSelectedCustomer(customerId);
    setBalance(customer?.balance || 0);
    setSelectedCustomerName(customer?.label || "");
  };

 
  const handleAddCollection = async () => {
    setIsLoading(true);
    if (!paymentMethod) {
      Alert.alert("Error", "Please select a payment method");
      setIsLoading(false);
      return;
    }
    if (!selectedCustomer) {
      Alert.alert("Error", "Please select a customer.");
      setIsLoading(false);
      return;
    }
    if (!collectionAmount || isNaN(collectionAmount) || collectionAmount <= 0) {
      Alert.alert("Error", "Enter a valid collection amount.");
      setIsLoading(false);
      return;
    }
    const today = new Date();
    const currentDate = today.toLocaleDateString("en-CA"); // Returns YYYY-MM-DD format
    try {
      const newPayLoad = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        selectedCustomer,
        selectedCustomerName,
        paymentMethod,
        collectionAmount,
        currentDate,
      };
      const payloads = await AsyncStorage.getItem("offlineCollections");
      const parsedPayloads = payloads ? JSON.parse(payloads) : [];
      const updatedPayloads = [...parsedPayloads, newPayLoad];
      await AsyncStorage.setItem(
        "offlineCollections",
        JSON.stringify(updatedPayloads)
      );
      // console.log("saved offine succesfully");
      Alert.alert("Success", "Collection added successfully");
      setBalance(
        (prevBalance) => parseFloat(prevBalance) + parseFloat(collectionAmount)
      );
    } catch (error) {
      console.error("Error adding collection:", error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setIsLoading(false);
      setCollectionAmount("");
      setPaymentMethod(null);
    }
  };
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Customer:</Text>
      <DropDownPicker
        open={openCustomer}
        value={selectedCustomer}
        items={customerList}
        setOpen={setOpenCustomer}
        setValue={setSelectedCustomer}
        setItems={setCustomerList}
        placeholder="Choose a customer"
        searchable={true}
        searchPlaceholder="Search customers..."
        containerStyle={styles.dropdownContainer}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownBox}
        onChangeValue={handleCustomerChange}
        listMode="MODAL"
        modalProps={{
          animationType: "slide",
        }}
        scrollViewProps={{
          contentContainerStyle: {
            paddingBottom: 20,
          },
        }}
      />

      {selectedCustomer && (
        <Text style={styles.balanceText}>Due Amount: ₹{balance * -1}</Text>
      )}

      <Text style={styles.label}>Payment Method:</Text>
      <DropDownPicker
        open={openPayment}
        value={paymentMethod}
        items={paymentList}
        setOpen={setOpenPayment}
        setValue={setPaymentMethod}
        setItems={setPaymentList}
        placeholder="Select Payment Method"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownBox}
        onChangeValue={(value) => console.log("Selected:", value)}
      />
      <Text style={styles.label}>Collection Amount:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter amount"
        keyboardType="numeric"
        value={collectionAmount}
        onChangeText={setCollectionAmount}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={item ? handleUpdateCollection : handleAddCollection}
      >
        {item ? (
          <Text style={styles.buttonText}>Update </Text>
        ) : (
          <Text style={styles.buttonText}>Add </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 5,
  },
  dropdownContainer: {
    height: 50,
    marginBottom: 15,
  },
  dropdown: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
  },
  dropdownBox: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  balanceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.error,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "bold",
  },
  offlineText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "red",
  },
});
