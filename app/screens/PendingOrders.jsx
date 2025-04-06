import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { getDeviceInfo } from "../utlity/deviceInfo";


const PendingOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchText, setSearchText] = useState("");

  const fetchPendingOrders = async () => {
    setLoading(true);
    try {
      const authTokens = await AsyncStorage.getItem("authTokens");
      const { access_token } = JSON.parse(authTokens);
      const deviceInfo = await getDeviceInfo();

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/v1/sales-order/`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "X-Device-ID": deviceInfo.deviceId,
            "X-Device-Type": deviceInfo.deviceType,
          },
        }
      );

      setOrders(response.data || []);
      setFilteredOrders(response.data || []);
    } catch (error) {
      console.error("Fetch Error:", error);
      Alert.alert("Error", "Failed to fetch pending orders.");
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId) => {
    console.log("Delete Order ID:", orderId);
    
    Alert.alert("Confirm", "Are you sure you want to delete this order?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const authTokens = await AsyncStorage.getItem("authTokens");
            const { access_token } = JSON.parse(authTokens);
            const deviceInfo = await getDeviceInfo();

            await axios.delete(
              `${process.env.EXPO_PUBLIC_BASE_URL}/api/v1/sales-order/${orderId}`,
              {
                headers: {
                  Authorization: `Bearer ${access_token}`,
                  "X-Device-ID": deviceInfo.deviceId,
                  "X-Device-Type": deviceInfo.deviceType,
                },
              }
            );

            Alert.alert("Deleted", "Order deleted successfully.");
            fetchPendingOrders();
          } catch (error) {
            console.error("Delete Error:", error);
            Alert.alert("Error", "Failed to delete the order.");
          }
        },
      },
    ]);
  };
  const handleSearch = (text) => {
    setSearchText(text);
    const filtered = orders.filter((order) => {
      const customerName = order.customer?.name?.toLowerCase() || "";
      const payment = order.payment_method?.toLowerCase() || "";
      const warehouse = order.warehouse?.name?.toLowerCase() || "";
      return (
        customerName.includes(text.toLowerCase()) ||
        payment.includes(text.toLowerCase()) ||
        warehouse.includes(text.toLowerCase())
      );
    });
    setFilteredOrders(filtered);
  };


  useEffect(() => {
    if (isFocused) {
      fetchPendingOrders();
    }
  }, [isFocused,]);

  const renderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <Text style={styles.customerText}>Customer: {item.customer?.name}</Text>
      <Text>Warehouse: {item.warehouse?.name}</Text>
      <Text>Payment Method: {item.payment_method}</Text>
      <Text>Total Amount: ₹{item.bill_amount}</Text>
      <Text>Order Date: {item.due_date}</Text>
      

      <FlatList
        data={item.items}
        keyExtractor={(itm, idx) => `${itm.item_id}-${idx}`}
        renderItem={({ item: prod }) => (
          <Text style={styles.itemText}>
            • {prod.name} | Qty: {prod.quantity} {prod.unit_name} |
          </Text>
        )}
        scrollEnabled={false}
        style={{ marginTop: 8 }}
      />

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteOrder(item.id.toString())}
      >
        <Text style={styles.deleteButtonText}>Delete Order</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by customer or payment method"
        value={searchText}
        onChangeText={handleSearch}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={<Text>No pending orders found.</Text>}
        />
      )}
    </View>
  );
};

export default PendingOrders;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  customerText: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  itemText: {
    fontSize: 14,
    marginLeft: 8,
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
