import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import axios from "axios";
import { colors } from "../assests/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceInfo } from "../utlity/deviceInfo";

const PendingCollection = () => {
  const [pendingData, setPendingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPendingCollections = useCallback(async () => {
    setLoading(true);
    try {
      const tokenData = await AsyncStorage.getItem("authTokens");
      console.log(tokenData);

      const { access_token } = JSON.parse(tokenData);
      const deviceInfo = await getDeviceInfo();
      console.log(deviceInfo);

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

      if (response.status == 200) {
        const cleanedData = response.data.map((item) => ({
          id: item.id,
          date: item.date,
          agent_name: item.agent?.name || "N/A",
          customer_name: item.customer?.name || "N/A",
          amount: item.amount,
        }));
        setPendingData(cleanedData);
        setFilteredData(cleanedData);
      }
    } catch (error) {
      console.error("Error fetching pending collections:", error.response.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingCollections();
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    const lowerText = text.toLowerCase();
    const filtered = pendingData.filter(
      (item) =>
        item.customer_name.toLowerCase().includes(lowerText) ||
        item.agent_name.toLowerCase().includes(lowerText) ||
        item.amount.toString().includes(lowerText)
    );
    setFilteredData(filtered);
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.id}</Text>
      <Text style={styles.cell}>{item.date}</Text>
      <Text style={styles.cell}>{item.agent_name}</Text>
      <Text style={styles.cell}>{item.customer_name}</Text>
      <Text style={styles.cell}>{item.amount}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Collections</Text>

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
            <Text style={[styles.cell, styles.headerCell]}>ID</Text>
            <Text style={[styles.cell, styles.headerCell]}>Date</Text>
            <Text style={[styles.cell, styles.headerCell]}>Agent</Text>
            <Text style={[styles.cell, styles.headerCell]}>Customer</Text>
            <Text style={[styles.cell, styles.headerCell]}>Amount</Text>
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
              keyExtractor={(item) => item.id.toString()}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 16,
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
    minWidth: 600,
  },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    marginBottom: 4,
    borderRadius: 8,
    minWidth: 600,
  },
  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    color: colors.primary,
    paddingHorizontal: 4,
  },
  headerCell: {
    color: "#fff",
    fontWeight: "bold",
  },
  noDataText: {
    marginTop: 20,
    textAlign: "center",
    color: "#888",
  },
});

export default PendingCollection;
