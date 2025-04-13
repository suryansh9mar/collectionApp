import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { colors } from "../assests/Colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AntDesign } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceInfo } from "../utlity/deviceInfo";

export default function UnsyncedOrders() {
  const [isOffline, setIsOffline] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterDate, setFilterDate] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState({});
  const [isDataEmpty, setIsDataEmpty] = useState(false);

  const navigation = useNavigation();
  //check if offline?
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const currentlyOffline = !state.isConnected;
      console.log("offline", currentlyOffline);

      setIsOffline((prev) => {
        if (prev !== currentlyOffline) {
          return currentlyOffline;
        }
        return prev; // No update needed
      });
    });

    return () => unsubscribe();
  }, [navigation]);
  //load all orders
  useFocusEffect(
    useCallback(() => {
      const loadOrders = async () => {
        try {
          const data = await AsyncStorage.getItem("offlineOrders");

          if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setIsDataEmpty(false);
              setAllOrders(parsed);
            } else {
              setIsDataEmpty(true);
              setAllOrders([]);
            }
          } else {
            // when data is null
            setIsDataEmpty(true);
            setAllOrders([]);
          }
          console.log(isDataEmpty);
        } catch (err) {
          console.error("Failed to load offlineOrders", err);
          setIsDataEmpty(true);
          setAllOrders([]);
        }
      };

      loadOrders();
    }, [setAllOrders])
  );
  // set  filltered orders on the basis of date selected
  useEffect(() => {
    if (filterDate) {
      const formatted = filterDate.toLocaleDateString("en-CA");
      const filtered = allOrders.filter(
        (item) => item.invoice_date === formatted
      );
      console.log(filtered);

      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(allOrders);
    }
  }, [filterDate, allOrders]);
  //handle select orders
  const handleSelect = (id) => {
    setSelectedOrder((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  //handle select all orders
  const handleSelectAll = () => {
    const newStatus = !selectAll;
    setSelectAll(newStatus);
    const updated = {};
    filteredOrders.forEach((item) => {
      updated[item.id] = newStatus;
    });
    setSelectedOrder(updated);
  };
  //delete orders
  const deleteOrder = async (id) => {
    const newData = allOrders.filter((item) => item.id !== id);
    setAllOrders(newData);
    await AsyncStorage.setItem("offlineOrders", JSON.stringify(newData));
  };
  //sync collections
  const handleSync = async () => {
    setLoading(true);
    if (isOffline) {
      Alert.alert("Error", "Please connect to internet");
      setLoading(false);
      return;
    }
    const selectedOrderToSync = allOrders.filter(
      (item) => selectedOrder[item.id]
    );
    if (selectedOrderToSync.length === 0) {
      Alert.alert("Error", "Please select at least one Order to sync.");
      setLoading(false);
      return;
    }
    let synced = 0;
    const unsynced = [];
    const authTokens = await AsyncStorage.getItem("authTokens");
    if (!authTokens) {
      throw new Error("No auth tokens found");
    }

    const { access_token, agent_id, warehouse_id } = JSON.parse(authTokens);
    const deviceInfo = await getDeviceInfo();

    for (let item of allOrders) {
      const isSelected = selectedOrder[item.id];
      if (!isSelected) {
        unsynced.push(item); // keep unselected as it is
        continue;
      }
      try {
        const payload = {
          agent_id: agent_id,
          customer_id: item.customer_id,
          payment_method: item.payment_method,
          warehouse_id: warehouse_id,
          invoice_date: item.invoice_date,
          due_date: item.due_date,
          fare: "0.00",
          narration: null,
          sales_value: item.sales_value.toFixed(2),
          bill_amount: item.bill_amount.toFixed(2),
          receipt_amount: "0.00",
          items: item.items.map((item) => ({
            item_id: item.item_id,
            quantity: item.quantity.toString(),
            unit_id: item.unit_id,
            unit_price: item.unit_price.toString(),
            conversion_rate: item.conversion_rate || "1.00",
            name: item.name,
            unitName: item.unitName,
          })),
        };
        console.log(payload);

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

        if (response.data.status) {
          console.log("Saved online:", item.id);
          synced++;
        } else {
          unsynced.push(item); // if not successful, keep it
        }
      } catch (error) {
        console.log("Sync error:", item.id, error);
        unsynced.push(item); // on error, keep the item
      }
    }
    setAllOrders(unsynced);
    await AsyncStorage.setItem("offlineOrders", JSON.stringify(unsynced));
    setSelectedOrder({});
    setSelectAll(false);

    Alert.alert("Sync Complete", `${synced} order(s) synced`);
    setLoading(false);
  };
  //render item
  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={() => handleSelect(item.id)}
        style={styles.checkboxBox}
      >
        {selectedOrder[item.id] && <Text style={styles.tick}>✓</Text>}
      </TouchableOpacity>
      <Text style={styles.cell}>{item.customer_name}</Text>
      <Text style={styles.cell}>₹{item.bill_amount}</Text>
      <TouchableOpacity
        onPress={() =>
          Alert.alert("Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Yes", onPress: () => deleteOrder(item.id) },
          ])
        }
      >
        <AntDesign
          name="delete"
          size={20}
          color="red"
          style={{ marginRight: 15, marginLeft: 0 }}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("OrderForm", { item })}
      >
        <AntDesign name="edit" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
  //ifLoading
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {!isDataEmpty && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButton}>
              {filterDate ? filterDate.toDateString() : "Select Date"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSelectAll}>
            <Text style={styles.selectAll}>
              {selectAll ? "Unselect All" : "Select All"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={filterDate || new Date()}
          mode="date"
          display="default"
          onChange={(e, date) => {
            setShowDatePicker(false);
            if (date) setFilterDate(date);
          }}
        />
      )}

      <FlatList
        data={filteredOrders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={() => {
          // setIsDataEmpty(true);
          return <Text style={styles.emptyText}>No offline data.</Text>;
        }}
      />

      {!isDataEmpty && Object.values(selectedOrder).some((value) => value) && (
        <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
          <Text style={styles.syncText}>Sync Selected</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f4f4f4" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  dateButton: { fontSize: 16, color: "#007bff" },
  selectAll: { fontSize: 16, color: "#28a745" },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 4,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  tick: { color: "#007bff", fontWeight: "bold" },
  cell: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
  },
  syncButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  syncText: { color: "#fff", fontWeight: "bold" },
  emptyText: { textAlign: "center", marginTop: 20, color: "#666" },
});
