import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getDeviceInfo } from "../utlity/deviceInfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign } from "@expo/vector-icons";
import { colors } from "../assests/Colors";
import axios from "axios";
export default function UnsyncedCollections() {
  const [isOffline, setIsOffline] = useState(false);
  const [allCollections, setAllCollections] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterDate, setFilterDate] = useState(null);
  const navigation = useNavigation();
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
  // Load offline collections
  useFocusEffect(
    useCallback(() => {
      console.log("UnsyncedCollection screen focused");
      const loadCollections = async () => {
        const data = await AsyncStorage.getItem("offlineCollections");
        if (data) {
          setAllCollections(JSON.parse(data));
          // console.log("Loaded offline collections :", JSON.parse(data));
        } else {
          setAllCollections([]);
          console.log("no data");
        }
      };

      loadCollections();
    }, [navigation])
  );
  useEffect(() => {
    if (filterDate) {
      const formatted = filterDate.toLocaleDateString("en-CA");
      const filtered = allCollections.filter(
        (item) => item.currentDate === formatted
      );
      console.log(filtered);

      setFilteredCollections(filtered);
    } else {
      setFilteredCollections(allCollections);
    }
  }, [filterDate, allCollections]);
  const handleSelect = (id) => {
    console.log(selectedCustomer);

    setSelectedCustomer((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectAll = () => {
    const newStatus = !selectAll;
    setSelectAll(newStatus);
    const updated = {};
    filteredCollections.forEach((item) => {
      updated[item.id] = newStatus;
    });
    setSelectedCustomer(updated);
  };

  // Delete collection
  const deleteCollection = async (id) => {
    const newData = allCollections.filter((item) => item.id !== id);
    setAllCollections(newData);
    await AsyncStorage.setItem("offlineCollections", JSON.stringify(newData));
  };
  
  //sync collection
  const handleSync = async () => {
    if (isOffline) {
      Alert.alert("No Internet", "Please check your internet connection.");
      return;
    }
  
    const selectedCustomerToSync = allCollections.filter((item) => selectedCustomer[item.id]);
    setLoading(true);
  
    if (selectedCustomerToSync.length === 0) {
      Alert.alert("Error", "Please select at least one collection to sync.");
      setLoading(false);
      return;
    }
  
    const data = await AsyncStorage.getItem("authTokens");
    const deviceInfo = await getDeviceInfo();
    if (!data) return Alert.alert("Error", "Auth token missing");
  
    const { access_token, agent_id } = JSON.parse(data);
  
    let synced = 0;
    const unsynced = [];
  
    for (let item of allCollections) {
      const isSelected = selectedCustomer[item.id];
      if (!isSelected) {
        unsynced.push(item); // keep unselected as it is
        continue;
      }
  
      try {
        const res = await axios.post(
          `${process.env.EXPO_PUBLIC_BASE_URL}/api/v1/collections/store`,
          {
            customer_id: item.selectedCustomer,
            payment_method: item.paymentMethod,
            amount: item.collectionAmount,
            date: item.currentDate,
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
  
        if (res.status === 201) {
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
  
    // Update state and storage
    setAllCollections(unsynced);
    await AsyncStorage.setItem("offlineCollections", JSON.stringify(unsynced));
    setSelectedCustomer({});
    setSelectAll(false);
  
    Alert.alert("Sync Complete", `${synced} item(s) synced`);
    setLoading(false);
  };
  
 
  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={() => handleSelect(item.id)}
        style={styles.checkboxBox}
      >
        {selectedCustomer[item.id] && <Text style={styles.tick}>✓</Text>}
      </TouchableOpacity>
      <Text style={styles.cell}>{item.selectedCustomerName}</Text>
      <Text style={styles.cell}>₹{item.collectionAmount}</Text>
      <TouchableOpacity
        onPress={() =>
          Alert.alert("Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Yes", onPress: () => deleteCollection(item.id) },
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
        onPress={() => navigation.navigate("AddCollection", { item })}
      >
        <AntDesign name="edit" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
  if (loading) {
     return (
       <View style={styles.loaderContainer}>
         <ActivityIndicator size="large" color={colors.primary} />
       </View>
     );
   }

  return (
    <View style={styles.container}>
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
        data={filteredCollections}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No offline data.</Text>
        }
      />

      <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
        <Text style={styles.syncText}>Sync Selected</Text>
      </TouchableOpacity>
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
