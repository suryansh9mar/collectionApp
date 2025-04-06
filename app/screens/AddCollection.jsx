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
import axios from "axios";
import DropDownPicker from "react-native-dropdown-picker";
import { colors } from "../assests/Colors";
import { getDeviceInfo } from "../utlity/deviceInfo";
import NetInfo from "@react-native-community/netinfo";

export default function AddCollection({ route, navigation }) {
  const [customerList, setCustomerList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState(null);
  const [balance, setBalance] = useState(0);
  const [collectionAmount, setCollectionAmount] = useState("");
  const [openCustomer, setOpenCustomer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentList, setPaymentList] = useState([
    { label: "CASH", value: "CASH" },
    { label: "UPI", value: "UPI" },
    { label: "CHEQUE", value: "CHEQUE" },
    { label: "BANK TRANSFER", value: "BANK_TRANSFER" },
    { label: "CREDIT", value: "CREDIT" },
    { label: "DEBIT CARD", value: "DEBIT" },
    { label: "OTHER", value: "OTHER" },
  ]);
  const { customer } = route?.params || {};
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const currentlyOffline = !state.isConnected;

      setIsOffline((prev) => {
        if (prev !== currentlyOffline) {
          // Optional: Toast or Alert when going offline
          return currentlyOffline; // Only update if changed
        }
        return prev; // No update if same
      });
    });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
    if (customer) {
      setSelectedCustomer(customer.id);
    }
    getCustomers();
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

  const handleCustomerChange = (customerId) => {
    const customer = customerList.find((c) => c.value === customerId);
    setSelectedCustomer(customerId);
    setBalance(customer?.balance || 0);
    setSelectedCustomerName(customer?.label || "");
  };

  const addColletionOnline = async (newPayLoad) => {
    try {
      const data = await AsyncStorage.getItem("authTokens");
      const deviceInfo = await getDeviceInfo();
      if (!data) throw new Error("No auth token found");
      const { access_token, agent_id } = JSON.parse(data);

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/v1/collections/store`,
        {
          customer_id: newPayLoad.selectedCustomer,
          payment_method: newPayLoad.paymentMethod,
          amount: newPayLoad.collectionAmount,
          date: newPayLoad.currentDate,
          agent_id: agent_id,
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "X-Device-ID": deviceInfo.deviceId,
            "X-Device-Type": deviceInfo.deviceType,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        console.log("saved online");
        const storedData = await AsyncStorage.getItem("offlineCollections");
        if (storedData) {
          const parsedData = JSON.parse(storedData);

          // Filter out the object with the matching id
          const updatedData = parsedData.filter(
            (item) => item.id.toString() !== newPayLoad.id.toString()
          );

          // Save the updated array back to AsyncStorage
          await AsyncStorage.setItem(
            "offlineCollections",
            JSON.stringify(updatedData)
          );
          console.log("Deleted successfully from local.", updatedData);
          const check = await AsyncStorage.getItem("offlineCollections");
          console.log("After deletion, AsyncStorage:", JSON.parse(check));
        }
      }
    } catch (error) {
      console.error("Error adding collection:", error);
      console.log("not saved online");
    }
  };
  const handleAddCollection = async () => {
    setIsLoading(true);
    if (!paymentMethod) {
      Alert.alert("Error", "Please select a payment method");
      return;
    }
    if (!selectedCustomer) {
      Alert.alert("Error", "Please select a customer.");
      return;
    }
    if (!collectionAmount || isNaN(collectionAmount) || collectionAmount <= 0) {
      Alert.alert("Error", "Enter a valid collection amount.");
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
      if (!isOffline) {
        addColletionOnline(newPayLoad);
      }
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

      <TouchableOpacity style={styles.button} onPress={handleAddCollection}>
        <Text style={styles.buttonText}>Add Collection</Text>
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
    backgroundColor: colors.secondry,
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
