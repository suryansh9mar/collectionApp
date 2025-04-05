import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AntDesign from "react-native-vector-icons/AntDesign";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceInfo } from "../utlity/deviceInfo";
import { colors } from "../assests/Colors";

const Home = ({ navigation, onLogOut }) => {
  const [loading, setLoading] = useState(true);
  const [agentName, setAgentName] = useState("");
  const [warehouseName, setWarehouseName] = useState("");

  const fetchCustomers = async () => {
    try {
      const data = await AsyncStorage.getItem("authTokens");
      if (!data) throw new Error("No auth token found");
      const { access_token,agent_name,warehouse_name } = JSON.parse(data);
      const deviceInfo = await getDeviceInfo();
      setAgentName(agent_name || "N/A");
      setWarehouseName(warehouse_name || "N/A");
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

      if (response.data.success) {
        await AsyncStorage.setItem(
          "customers",
          JSON.stringify(response.data.customers)
        );
      }

      const userInfo = await AsyncStorage.getItem("userInfo");
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        setAgentName(parsed.agent_name || "N/A");
        setWarehouseName(parsed.warehouse_name || "N/A");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleLogout = async () => {
    onLogOut();
  };

  useEffect(() => {
    navigation.setOptions({
      title: "Home",
      headerShown: true,
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <AntDesign name="logout" size={25} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const menuItems = [
    {
      icon: "profile",
      label: "Customers",
      onPress: () => navigation.navigate("Customer"),
    },
    {
      icon: "wallet",
      label: "Add Collection",
      onPress: () => navigation.navigate("AddCollection"),
    },
    {
      icon: "clockcircleo",
      label: "Pending Collection",
      onPress: () => navigation.navigate("PendingCollection"),
    },
    {
      icon: "form",
      label: "Sales Order",
      onPress: () => navigation.navigate("OrderForm"),
    },
    {
      icon: "sync",
      label: "Unsynced Collections",
      onPress: () => navigation.navigate("UnsyncedCollections"), // screen you define
      red: true,
    },
    {
      icon: "sync",
      label: "Unsynced Orders",
      // onPress: () => navigation.navigate("UnsyncedOrders"),
      red: true,
    },
  ];

  const renderBox = ({ item }) => (
    <TouchableOpacity
      style={[styles.boxButton, item.red && styles.redBox]}
      onPress={item.onPress}
    >
      <AntDesign name={item.icon} size={30} color={item.red ? "#fff" : colors.primary} />
      <Text style={[styles.buttonText, item.red && styles.redText]}>{item.label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerInfo}>
        <Text style={styles.infoText}>👤 Agent: <Text style={styles.infoValue}>{agentName}</Text></Text>
        <Text style={styles.infoText}>🏬 Warehouse: <Text style={styles.infoValue}>{warehouseName}</Text></Text>
      </View>

      <FlatList
        data={menuItems}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderBox}
        numColumns={2}
        columnWrapperStyle={styles.rowWrapper}
        contentContainerStyle={styles.buttonsContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  headerInfo: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom:20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 6,
    color: "#555",
  },
  infoValue: {
    fontWeight: "bold",
    color: colors.primary,
  },
  logoutButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f1f1f1",
  },
  buttonsContainer: {
    padding: 25,
  },
  rowWrapper: {
    justifyContent: "space-between",
    marginBottom: 30,
  },
  boxButton: {
    flex: 0.48,
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginHorizontal: 2,
    paddingHorizontal: 15,
    paddingVertical:35,
  },
  redBox: {
    backgroundColor: "#ff4d4f", 
  },
  redText: {
    color: "#fff",
  },
  buttonText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
});

export default Home;
