import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import DropDownPicker from "react-native-dropdown-picker";
import { colors } from "../assests/Colors"; // Assuming you have a colors file
import { getDeviceInfo } from "../utlity/deviceInfo";

export default function AddCollection() {
  const [customerList, setCustomerList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [balance, setBalance] = useState(0);
  const [collectionAmount, setCollectionAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    getCustomers();
  }, []);

  const getCustomers = async () => {
    try {
      setIsOffline(false);
      const data = await AsyncStorage.getItem("authTokens");
      if (!data) throw new Error("No auth token found");
      const { access_token } = JSON.parse(data);
      const deviceInfo = await getDeviceInfo();
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/v1/customers`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "X-Device-ID": deviceInfo.deviceId,
            "X-Device-Type": deviceInfo.deviceType,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 && response.data.success) {
        const formattedCustomers = response.data.customers.map((customer) => ({
          label: `${customer.name} (₹${customer.balance})`,
          value: customer.id,
          balance: customer.balance,
        }));
        setCustomerList(formattedCustomers);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      Alert.alert("Error", "Failed to fetch customers.");
      setIsOffline(true);
    }
  };

  const handleCustomerChange = (customerId) => {
    const customer = customerList.find((c) => c.value === customerId);
    setSelectedCustomer(customerId);
    setBalance(customer?.balance || 0);
  };

  const handleAddCollection = async () => {
    if (!selectedCustomer) {
      Alert.alert("Error", "Please select a customer.");
      return;
    }
    if (!collectionAmount || isNaN(collectionAmount) || collectionAmount <= 0) {
      Alert.alert("Error", "Enter a valid collection amount.");
      return;
    }

    try {
      const data = await AsyncStorage.getItem("authTokens");
      if (!data) throw new Error("No auth token found");

      const { access_token } = JSON.parse(data);
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/v1/add-collection`,
        {
          customer_id: selectedCustomer,
          amount: parseFloat(collectionAmount),
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200 && response.data.success) {
        Alert.alert("Success", "Collection added successfully.");
        setCollectionAmount("");
        setBalance((prevBalance) => prevBalance - parseFloat(collectionAmount));
      } else {
        Alert.alert("Error", "Failed to add collection.");
      }
    } catch (error) {
      console.error("Error adding collection:", error);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  return (
    <View style={styles.container}>
      {isOffline ? (
        <Text style={styles.offlineText}>You are offline</Text>
      ) : (
        <>
          <Text style={styles.label}>Select Customer:</Text>
          <DropDownPicker
            open={open}
            value={selectedCustomer}
            items={customerList}
            setOpen={setOpen}
            setValue={setSelectedCustomer}
            setItems={setCustomerList}
            placeholder="Choose a customer"
            searchable={true}
            searchPlaceholder="Search customers..."
            containerStyle={styles.dropdownContainer}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownBox}
            onChangeValue={handleCustomerChange}
          />

          {selectedCustomer && (
            <Text style={styles.balanceText}>Balance: ₹{balance}</Text>
          )}

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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
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
    color: colors.primary,
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
