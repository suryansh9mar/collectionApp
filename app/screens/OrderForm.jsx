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

const OrderForm = ({ route, navigation }) => {
  const { item } = route?.params || {};
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [unitName, setUnitName] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [baseUnitPrice, setBaseUnitPrice] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [unitPrice, setUnitPrice] = useState(null);
  const [conversionRate, setConversionRate] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState(null);
  const [priceCategoryId, setPriceCategoryId] = useState(null);
  const [addedItems, setAddedItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const [customerOpen, setCustomerOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);

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
    setUnitOpen(false);
  }, []);
  const onUnitOpen = useCallback(() => {
    setCustomerOpen(false);
    setPaymentOpen(false);
    setItemOpen(false);
    setUnitOpen(true);
  }, []);

  useEffect(() => {
    console.log(item);
    if (item) {
      // setAddedItems([item.items]);
      setSelectedCustomer(item.customer_id);
      setPaymentMethod(item.payment_method);
      setTotalPrice(item.bill_amount);
      item.items.map((item) => {
        const newItem = {
          id: item.item_id,
          name: item.name,
          quantity: item.quantity,
          unitName: item.unitName,
          unitPrice: parseFloat(item.unit_price),
          itemTotal: item.itemTotal,
          conversion_rate: item.conversion_rate,
          unit_id: item.unitName,
        };
        setAddedItems((prevItems) => [...prevItems, newItem]);
      });
    }
    fetchCustomers();
    fetchItems();
  }, []);
  useEffect(() => {
    navigation.setOptions({
      title: `${item?.id ? "Update Order" : "Create Order"}`,
      headerShown: true,
      
    });
  }, [navigation]);

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

      const { access_token, agent_id } = JSON.parse(authTokens);

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
          conversion_rate: item.conversion_rate,
          prices: Array.isArray(item.prices)
            ? item.prices
            : Object.values(item.prices),
          base_unit: item.base_unit?.name,
          secondary_unit: item.secondary_unit?.name,
          secondary_unit_id: item.secondary_unit_id,
          base_unit_id: item.base_unit_id,
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
  const handlePriceCategoryChange = (customerId) => {
    const customer = customers.find((c) => c.value === customerId);
    if (customer) {
      setPriceCategoryId(customer.price_category_id);
      setSelectedCustomerName(customer.label);
    }
    // console.log(customer.price_category_id);
  };

  const handleItemChange = (itemId) => {
    const selected = items.find((item) => item.value === itemId);
    console.log(selected);

    if (selected) {
      setSelectedItem(itemId);
      setBaseUnitPrice(
        selected.prices.find((p) => p.price_category_id === priceCategoryId)
          ?.sale_price
      );
      setConversionRate(selected.conversion_rate);
      const units = [
        {
          label: selected.base_unit,
          value: 1,
          id: selected.base_unit_id,
        },
        ...(selected.secondary_unit
          ? [
              {
                label: selected.secondary_unit,
                value: 2,
                id: selected.secondary_unit_id,
              },
            ]
          : []),
      ];
      // console.log(units);

      setUnitName(units);
    }
  };
  const handleUnitChange = (unitId) => {
    const newPrice = baseUnitPrice / conversionRate;

    if (unitId === 1) {
      setUnitPrice(baseUnitPrice);
      setSelectedUnitId(unitName.find((u) => u.value === unitId).id);
      // console.log("changed", unitName.find((u)=> u.value === unitId).id);
    }
    if (unitId == 2) {
      setUnitPrice(newPrice);
      setSelectedUnitId(unitName.find((u) => u.value === unitId)?.id);
      // console.log("changed", unitName.find((u)=> u.value === unitId).id);
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
      unitName: selectedUnit,
      unitPrice: parseFloat(unitPrice),
      itemTotal,
      conversion_rate: conversionRate,
      unit_id: selectedUnitId,
    };

    const updatedItems = [...addedItems, newItem];
    setAddedItems(updatedItems);
    setTotalPrice((prev) => prev + itemTotal);

    // Reset fields
    // setSelectedItem(null);
    setQuantity("");
    // setUnitPrice("");
    // setUnitName("");
  };

  const removeItem = (index) => {
    const itemToRemove = addedItems[index];
    const updatedItems = addedItems.filter((_, i) => i !== index);
    setAddedItems(updatedItems);
    setTotalPrice((prev) => prev - itemToRemove.itemTotal);
  };
  const saveOrderOffline = async () => {
    if (!selectedCustomer || !paymentMethod || addedItems.length === 0) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const today = new Date();
      const currentDate = today.toLocaleDateString("en-CA");
      const authTokens = await AsyncStorage.getItem("authTokens");
      if (!authTokens) {
        throw new Error("No auth tokens found");
      }
      const { agent_id, warehouse_id } = JSON.parse(authTokens);

      const newOrder = {
        id: Date.now().toString(), // unique local ID
        // agent_id: agent_id,
        customer_id: selectedCustomer,
        customer_name: selectedCustomerName,
        payment_method: paymentMethod,
        // warehouse_id: warehouse_id,
        invoice_date: currentDate,
        due_date: currentDate,
        // fare: "0.00",
        // narration: null,
        sales_value: totalPrice,
        bill_amount: totalPrice,
        // receipt_amount: "0.00",
        items: addedItems.map((item) => ({
          item_id: item.id,
          quantity: item.quantity.toString(),
          unit_id: item.unit_id,
          unit_price: item.unitPrice.toString(),
          conversion_rate: item.conversion_rate || "1.00",
          name: item.name,
          unitName: item.unitName,
          itemTotal: item.itemTotal,
        })),
      };

      const existingOrders = await AsyncStorage.getItem("offlineOrders");
      let orders = existingOrders ? JSON.parse(existingOrders) : [];

      orders.push(newOrder);
      await AsyncStorage.setItem("offlineOrders", JSON.stringify(orders));

      Alert.alert("Saved ", "Order saved for later sync.");
      setAddedItems([]);
      setTotalPrice(0);
    } catch (error) {
      console.log("Error saving order offline:", error);
      Alert.alert("Error", "Failed to save order .");
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateOrder = async () => {
    if (!selectedCustomer || !paymentMethod || addedItems.length === 0) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
  
    setLoading(true);
    try {
      const today = new Date();
      const currentDate = today.toLocaleDateString("en-CA");
      const authTokens = await AsyncStorage.getItem("authTokens");
      if (!authTokens) {
        throw new Error("No auth tokens found");
      }
  
      const { agent_id, warehouse_id } = JSON.parse(authTokens);
  
      const updatedOrder = {
        id: item.id, // Keep the same ID
        agent_id: agent_id,
        customer_id: selectedCustomer,
        customer_name: selectedCustomerName,
        payment_method: paymentMethod,
        warehouse_id: warehouse_id,
        invoice_date: currentDate,
        due_date: currentDate,
        fare: "0.00",
        narration: null,
        sales_value: totalPrice,
        bill_amount: totalPrice,
        receipt_amount: "0.00",
        items: addedItems.map((item) => ({
          item_id: item.id,
          quantity: item.quantity.toString(),
          unit_id: item.unit_id,
          unit_price: item.unitPrice.toString(),
          conversion_rate: item.conversion_rate || "1.00",
          name: item.name,
          unitName: item.unitName,
          itemTotal: item.itemTotal,
        })),
      };
  
      const existingOrders = await AsyncStorage.getItem("offlineOrders");
      let orders = existingOrders ? JSON.parse(existingOrders) : [];
  
      // Replace the order with the same id
      const updatedOrders = orders.map((order) =>
        order.id === item.id ? updatedOrder : order
      );
  
      await AsyncStorage.setItem("offlineOrders", JSON.stringify(updatedOrders));
  
      Alert.alert("Updated", "Order updated successfully.");
      setAddedItems([]);
      setTotalPrice(0);
      navigation.goBack();
    } catch (error) {
      console.log("Error updating order offline:", error);
      Alert.alert("Error", "Failed to update order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} keyboardVerticalOffset={80}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create </Text>

        {/* Customer Dropdown */}
        <View style={styles.dropdownWrapper}>
          <DropDownPicker
            open={customerOpen}
            setOpen={onCustomerOpen}
            value={selectedCustomer}
            setValue={setSelectedCustomer}
            onChangeValue={(value) => handlePriceCategoryChange(value)}
            items={customers}
            placeholder="Select Customer"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropDownContainer}
            zIndex={3000}
            zIndexInverse={1000}
            searchable
            searchPlaceholder="Search customer..."
            listMode="MODAL"
            modalProps={{ animationType: "slide" }}
            onClose={() => setCustomerOpen(false)}
          />
        </View>

        {/* Payment Method Dropdown */}
        <View style={styles.dropdownWrapper}>
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

        {/* Item Selection Box */}
        {selectedCustomer && (
          <View style={styles.box}>
            <Text style={styles.sectionTitle}>Add Item</Text>
            <DropDownPicker
              open={itemOpen}
              setOpen={onItemOpen}
              value={selectedItem}
              setValue={setSelectedItem}
              onChangeValue={(val) => {
                console.log("Selected Item:", val);

                setSelectedItem(val);
                handleItemChange(val);
                setSelectedUnit(1);
              }}
              items={items}
              placeholder="Select Item"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropDownContainer}
              zIndex={1000}
              zIndexInverse={3000}
              searchable
              searchPlaceholder="Search item..."
              listMode="MODAL"
              modalProps={{ animationType: "slide" }}
              onClose={() => setItemOpen(false)}
            />

            {selectedItem && (
              <DropDownPicker
                style={styles.input}
                placeholder="Unit Name"
                value={selectedUnit}
                open={unitOpen}
                setOpen={onUnitOpen}
                setValue={setSelectedUnit}
                onChangeValue={(val) => handleUnitChange(val)}
                items={unitName}
                listMode="SCROLLVIEW"
                onClose={() => setUnitOpen(false)}
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="Unit Price"
              value={unitPrice?.toString()}
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
        )}

        {/* Added Items Display */}
        {addedItems.length > 0 && (
          <>
            <Text style={styles.totalText}>
              Total: ₹{totalPrice.toFixed(2)}
            </Text>

            <View style={styles.itemsList}>
              {addedItems.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemText}>
                    {item.name} x {item.quantity} = ₹{item.itemTotal.toFixed(2)}
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

        {/* Place Order Button */}
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (!selectedCustomer || !paymentMethod || addedItems.length === 0) &&
              styles.disabledButton,
          ]}
          onPress={item?.id ? handleUpdateOrder : saveOrderOffline}
          disabled={
            !selectedCustomer ||
            !paymentMethod ||
            addedItems.length === 0 ||
            loading
          }
        >
          <Text style={styles.buttonText}>
            {item?.id
              ? "Update Order"
              : loading
              ? "Processing..."
              : "Place Order"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  dropdownWrapper: {
    marginBottom: 15,
    zIndex: 3000,
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
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: colors.primary,
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
