import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../assests/Colors";
import { getDeviceInfo } from "../utlity/deviceInfo";

const OrderForm = () => {
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [unitName, setUnitName] = useState("");

  const [addedItems, setAddedItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const [customerOpen, setCustomerOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const paymentOptions = [
    { label: "CASH", value: "CASH" },
    { label: "UPI", value: "UPI" },
    { label: "CHEQUE", value: "CHEQUE" },
    { label: "BANK TRANSFER", value: "BANK_TRANSFER" },
    { label: "CREDIT", value: "CREDIT" },
    { label: "DEBIT CARD", value: "DEBIT" },
    { label: "OTHER", value: "OTHER" },
  ];

  const onCustomerOpen = useCallback(() => {
    setPaymentOpen(false);
    setItemOpen(false);
    setCustomerOpen(true);
  }, []);

  const onPaymentOpen = useCallback(() => {
    setCustomerOpen(false);
    setItemOpen(false);
    setPaymentOpen(true);
  }, []);

  const onItemOpen = useCallback(() => {
    setCustomerOpen(false);
    setPaymentOpen(false);
    setItemOpen(true);
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchItems();
  }, []);

  const fetchCustomers = async () => {
    try {
      const storedCustomers = await AsyncStorage.getItem("customers");
      if (!storedCustomers) {
        throw new Error("No stored customers found");
      }

      const customers = JSON.parse(storedCustomers);
      const customerList = customers.map((cust) => ({
        label: cust.name,
        value: cust.id,
        price_category_id: cust.price_category_id,
      }));
      setCustomers(customerList);
    } catch (error) {
      console.error("Error loading customers:", error);
      Alert.alert("Error", "Failed to load customers.");
    }
  };

  const fetchItems = async () => {
    try {
      const authTokens = await AsyncStorage.getItem("authTokens");
      if (!authTokens) {
        throw new Error("No auth tokens found");
      }

      const { access_token ,agent_id} = JSON.parse(authTokens);
      
      console.log("Access Token:", agent_id);
      
      const deviceInfo = await getDeviceInfo();

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/v1/get-items/${agent_id}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "X-Device-ID": deviceInfo.deviceId,
            "X-Device-Type": deviceInfo.deviceType,
          },
        }
      );

      if (response.status === 200) {
        // console.log("Success:",JSON.stringify( response.data.items));
       
        const itemList = response.data.items.map((item) => ({
          label: item.name,
          value: item.id,
          // stock: item.current_stock,
          conversion_rate: item.conversion_rate,
          prices:  Array.isArray(item.prices) ? item.prices : Object.values(item.prices),
          base_unit: item.base_unit?.name,
          secondary_unit: item.secondary_unit?.name,
        }));
        console.log(itemList);
        
        // console.log(itemList.base_unit);
        
        setItems(itemList);
        await AsyncStorage.setItem("salesItems", JSON.stringify(itemList));
      } else {
        Alert.alert("Error", response.data.message || "Failed to fetch items");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      try {
        const storedItems = await AsyncStorage.getItem("salesItems");
        if (storedItems !== null) {
          setItems(JSON.parse(storedItems));
        } else {
          Alert.alert("Error", "No items available offline");
        }
      } catch (storageError) {
        console.error("Error loading items from storage:", storageError);
      }
    }
  };

  const handleItemChange = (itemId) => {
    const selected = items.find((item) => item.value === itemId);
    if (selected) {
      setSelectedItem(itemId);
      setUnitPrice(
        selected.prices.find(
          (p) => p.price_category_id === selectedCustomer.price_category_id
        )?.sale_price
      );
      setUnitName(selected.base_unit);
    }
  };

  const addItemToOrder = () => {
    Keyboard.dismiss();

    if (!selectedItem || !quantity) {
      Alert.alert("Error", "Please select an item and enter quantity");
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    const item = items.find((i) => i.value === selectedItem);
    if (!item) {
      Alert.alert("Error", "Selected item not found");
      return;
    }

    const itemTotal = quantityNum * parseFloat(unitPrice);
    const newItem = {
      id: selectedItem,
      name: item.label,
      quantity: quantityNum,
      unitName,
      unitPrice: parseFloat(unitPrice),
      itemTotal,
    };

    const updatedItems = [...addedItems, newItem];
    setAddedItems(updatedItems);
    setTotalPrice((prev) => prev + itemTotal);

    // Reset fields
    setSelectedItem(null);
    setQuantity("");
    setUnitPrice("");
    setUnitName("");
  };

  const removeItem = (index) => {
    const itemToRemove = addedItems[index];
    const updatedItems = addedItems.filter((_, i) => i !== index);
    setAddedItems(updatedItems);
    setTotalPrice((prev) => prev - itemToRemove.itemTotal);
  };

  const handlePlaceOrder = async () => {
    if (!selectedCustomer || !paymentMethod || addedItems.length === 0) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const authTokens = await AsyncStorage.getItem("authTokens");
      if (!authTokens) {
        throw new Error("No auth tokens found");
      }

      const { access_token } = JSON.parse(authTokens);
      const deviceInfo = await getDeviceInfo();

      const payload = {
        customer_id: selectedCustomer,
        payment_method: paymentMethod,
        items: addedItems.map((item) => ({
          item_id: item.id,
          quantity: item.quantity,
        })),
      };

      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/v1/sales-order/store`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "X-Device-ID": deviceInfo.deviceId,
            "X-Device-Type": deviceInfo.deviceType,
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Order placed successfully");
        setAddedItems([]);
        setTotalPrice(0);
        setSelectedCustomer(null);
        setPaymentMethod(null);
      } else {
        Alert.alert("Error", response.data.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Place Order Error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to place order"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Create Order</Text>

      <View style={styles.dropdownContainer}>
        <DropDownPicker
          open={customerOpen}
          setOpen={onCustomerOpen}
          value={selectedCustomer}
          setValue={setSelectedCustomer}
          items={customers}
          placeholder="Select Customer"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropDownContainer}
          zIndex={3000}
          zIndexInverse={1000}
          searchable={true}
          searchPlaceholder="Search customer..."
          listMode="MODAL"
          modalProps={{
            animationType: "slide",
          }}
          onClose={() => setCustomerOpen(false)}
        />
      </View>

      <View style={styles.dropdownContainer}>
        <DropDownPicker
          open={paymentOpen}
          setOpen={onPaymentOpen}
          value={paymentMethod}
          setValue={setPaymentMethod}
          items={paymentOptions}
          placeholder="Select Payment Method"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropDownContainer}
          zIndex={2000}
          zIndexInverse={2000}
          listMode="MODAL"
          onClose={() => setPaymentOpen(false)}
        />
      </View>

      <View style={styles.box}>
        <View style={styles.dropdownContainer}>
          <DropDownPicker
            open={itemOpen}
            setOpen={onItemOpen}
            value={selectedItem}
            setValue={(val) => {
              setSelectedItem(val);
              handleItemChange(val);
            }}
            items={items}
            placeholder="Select Item"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropDownContainer}
            zIndex={1000}
            zIndexInverse={3000}
            searchable={true}
            searchPlaceholder="Search item..."
            listMode="MODAL"
            modalProps={{
              animationType: "slide",
            }}
            onClose={() => setItemOpen(false)}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Unit Price"
          value={unitPrice}
          editable={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Unit Name"
          value={unitName}
          editable={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Quantity"
          keyboardType="numeric"
          value={quantity}
          onChangeText={(text) => setQuantity(text.replace(/[^0-9.]/g, ""))}
          onSubmitEditing={addItemToOrder}
        />

        <TouchableOpacity
          style={[
            styles.addButton,
            (!selectedItem || !quantity) && styles.disabledButton,
          ]}
          onPress={addItemToOrder}
          disabled={!selectedItem || !quantity}
        >
          <Text style={styles.buttonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {addedItems.length > 0 && (
        <>
          <Text style={styles.totalText}>Total: ₹{totalPrice.toFixed(2)}</Text>

          <View style={styles.itemsList}>
            {addedItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemText}>
                  {item.name} x {item.quantity} {item.unitName} = ₹
                  {item.itemTotal.toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeItem(index)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity
        style={[
          styles.placeOrderButton,
          (!selectedCustomer || !paymentMethod || addedItems.length === 0) &&
            styles.disabledButton,
        ]}
        onPress={handlePlaceOrder}
        disabled={
          !selectedCustomer ||
          !paymentMethod ||
          addedItems.length === 0 ||
          loading
        }
      >
        <Text style={styles.buttonText}>
          {loading ? "Processing..." : "Place Order"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.background,
    flexGrow: 1,
    marginHorizontal: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  dropdownContainer: {
    marginBottom: 15,
    zIndex: 1000,
  },
  dropdown: {
    borderColor: colors.primary,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  dropDownContainer: {
    borderColor: colors.primary,
    backgroundColor: "#fff",
  },
  box: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    backgroundColor: "#FFF",
    zIndex: 1000,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  addButton: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    marginVertical: 15,
    textAlign: "center",
  },
  itemsList: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
    color: colors.primary,
    flex: 1,
  },
  removeButton: {
    padding: 5,
    marginLeft: 10,
  },
  removeButtonText: {
    color: "red",
    fontSize: 20,
    fontWeight: "bold",
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default OrderForm;
