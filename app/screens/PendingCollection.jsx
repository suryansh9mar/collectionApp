import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { colors } from "../assests/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceInfo } from "../utlity/deviceInfo";

const PendingCollection = ({ navigation }) => {
  const [pendingData, setPendingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterAgentOnly, setFilterAgentOnly] = useState(false);
  const [id, setId] = useState(1);

  const fetchPendingCollections = useCallback(async () => {
    setLoading(true);
    try {
      const tokenData = await AsyncStorage.getItem("authTokens");
      const { access_token } = JSON.parse(tokenData);
      const deviceInfo = await getDeviceInfo();

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/v1/collections`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "X-Device-ID": deviceInfo.deviceId,
            "X-Device-Type": deviceInfo.deviceType,
          },
        }
      );

      if (response.status === 200) {
        const cleanedData = response.data.map((item) => ({
          id: item.id,
          date: item.date,
          agent_name: item.agent?.name || "N/A",
          customer_name: item.customer?.name || "N/A",
          amount: item.amount,
        }));
        setPendingData(cleanedData);
        setFilteredData(cleanedData);
        await AsyncStorage.setItem(
          "pendingCollections",
          JSON.stringify(cleanedData)
        );
      }
    } catch (error) {
      console.error(
        "Error fetching pending collections:",
        error.response?.data
      );
      Alert.alert("Offline Mode", "Showing saved data due to network error.");
      const offlineData = await AsyncStorage.getItem("pendingCollections");
      if (offlineData) {
        const parsed = JSON.parse(offlineData);
        setPendingData(parsed);
        setFilteredData(parsed);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingCollections();
  }, []);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

  const handleSearch = (text) => {
    setSearch(text);
    applyFilter(text, filterAgentOnly);
  };

  const applyFilter = async (searchText, filterAgent) => {
    const lowerText = searchText.toLowerCase();
    let filtered = pendingData;
    const data = await AsyncStorage.getItem("authTokens");
    console.log("Agent Name:", JSON.parse(data).agent_name);

    if (filterAgent) {
      filtered = filtered.filter((item) => {
        const agentName = item.agent_name?.toLowerCase() || "";
        const filterValue = JSON.parse(data)?.agent_name?.toLowerCase() || "";
        return agentName.includes(filterValue);
      });
    }

    if (lowerText) {
      filtered = filtered.filter(
        (item) =>
          item.customer_name.toLowerCase().includes(lowerText) ||
          item.agent_name.toLowerCase().includes(lowerText) ||
          item.amount.toString().includes(lowerText)
      );
    }

    setFilteredData(filtered);
  };

  const toggleAgentFilter = () => {
    const newValue = !filterAgentOnly;
    setFilterAgentOnly(newValue);
    applyFilter(search, newValue);
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.row}>
      {filterAgentOnly ? (
        <Text style={styles.cellId}>{index +1}</Text>
      ) : (
        <Text style={styles.cellId}>{item.id}</Text>
      )}
      <Text style={styles.cellDate}>{item.date}</Text>
      <Text style={styles.cellAgent}>{item.agent_name}</Text>
      <Text style={styles.cellCustomer}>{item.customer_name}</Text>
      <Text style={styles.cellAmount}>{item.amount}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={toggleAgentFilter}
        >
          <View
            style={[
              styles.checkboxBox,
              filterAgentOnly && styles.checkboxChecked,
            ]}
          >
            {filterAgentOnly && <Text style={styles.checkboxTick}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>My Collections Only</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Search by ID, Agent or Customer"
        placeholderTextColor="#aaa"
        style={styles.searchInput}
        value={search}
        onChangeText={handleSearch}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.headerRow}>
            <Text style={[styles.cellId, styles.headerCell]}>ID</Text>
            <Text style={[styles.cellDate, styles.headerCell]}>Date</Text>
            <Text style={[styles.cellAgent, styles.headerCell]}>Agent</Text>
            <Text style={[styles.cellCustomer, styles.headerCell]}>Customer</Text>
            <Text style={[styles.cellAmount, styles.headerCell]}>Amount</Text>
          </View>

          {loading ? (
            <ActivityIndicator
              color={colors.primary}
              size="large"
              style={{ marginTop: 20 }}
            />
          ) : (
            <FlatList
              data={filteredData}
              keyExtractor={(item , index) => item.id.toString() || index.toString()}
              renderItem={renderItem}
              ListEmptyComponent={
                <Text style={styles.noDataText}>
                  No pending collections found.
                </Text>
              }
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxLabel: {
    marginLeft: 8,
    color: colors.primary,
    fontWeight: "500",
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkboxTick: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  searchInput: {
    height: 45,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: colors.primary,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 4,
    paddingHorizontal: 10,
    // marginHorizontal:20,
    minWidth: 500,
  },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    marginBottom: 4,
    borderRadius: 8,
    // paddingHorizontal: 12,
    minWidth: 350,
  },
  cell: {
    fontSize: 14,
    color: colors.primary,
    paddingHorizontal: 4,
  },
  
  cellId: {
    flex: 0.5,
    textAlign: "left",paddingLeft: 10,
  },
  
  cellDate: {
    flex: 1.2,
    textAlign: "left",
  },
  
  cellAgent: {
    flex: 1.3,
    textAlign: "left",
  },
  
  cellCustomer: {
    flex: 1.7,
    textAlign: "left",
    minWidth: 150,
  },
  
  cellAmount: {
    flex: 1,
    textAlign: "right",
    paddingRight: 10,
  }, 
  headerCell: {
    color: "#fff",
    fontWeight: "bold",
    marginEnd:30,
  },
  noDataText: {
    marginTop: 20,
    textAlign: "center",
    color: "#888",
  },
});

export default PendingCollection;
