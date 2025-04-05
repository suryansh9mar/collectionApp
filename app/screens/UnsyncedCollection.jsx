import React, { useEffect, useLayoutEffect, useState,useCallback  } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AntDesign from "react-native-vector-icons/AntDesign";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../assests/Colors";
import NetInfo from "@react-native-community/netinfo";
import { getDeviceInfo } from "../utlity/deviceInfo";
import { useFocusEffect } from "@react-navigation/native";

const UnsyncedCollection = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const currentlyOffline = !state.isConnected;
      setIsOffline((prev) => {
        if (prev !== currentlyOffline) {
          return currentlyOffline;
        }
        return prev; // No update needed
      });
    });

    return () => unsubscribe();
  }, []);

  // Load offline collections
  useFocusEffect(
    useCallback(() => {
      console.log("UnsyncedCollection screen focused");
      const loadCollections = async () => {
        const data = await AsyncStorage.getItem("offlineCollections");
        if (data) {
          setCollections(JSON.parse(data));
          console.log("Loaded offline collections:", JSON.parse(data));
        } else {
          setCollections([]);
        }
      };
  
      loadCollections();
    }, [navigation])
  );

  // Delete collection
  const deleteCollection = async (id) => {
    const newData = collections.filter((item) => item.id !== id);
    setCollections(newData);
    await AsyncStorage.setItem("offlineCollections", JSON.stringify(newData));
  };

  // Sync collections
  const syncCollections = async () => {
    if (isOffline) {
      Alert.alert("No Internet", "Please check your internet connection.");
      return;
    }
    setLoading(true);
    const newData = [...collections];
    console.log(newData);

    const data = await AsyncStorage.getItem("authTokens");
    const deviceInfo = await getDeviceInfo();
    if (!data) return Alert.alert("Error", "Auth token missing");

    const { access_token, agent_id } = JSON.parse(data);

    const unsynced = [];

    for (let item of newData) {
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

        if (res.status !== 201) {
          console.log("saving online failed");
          unsynced.push(item); // failed, keep it
        }
        if (res.status === 201) {
          console.log("saved online");
          deleteCollection(item.id);
          
        }
      } catch (error) {
        unsynced.push(item); // failed, keep it
      }
    }

    Alert.alert(
      "Sync Complete",
      `${collections.length - unsynced.length} synced`
    );
    await AsyncStorage.setItem("offlineCollections", JSON.stringify(unsynced));
    setCollections(unsynced);
    setLoading(false);
  };

  // Header button
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Unsynced Collections",
      headerRight: () => (
        <TouchableOpacity onPress={syncCollections} style={{ marginRight: 15 }}>
          <AntDesign name="sync" size={24} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [collections]);

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.currentDate}</Text>
      <Text style={styles.cell}>{item.selectedCustomerName || "N/A"}</Text>
      <Text style={styles.cell}>₹{item.collectionAmount}</Text>
      <TouchableOpacity
        onPress={() =>
          Alert.alert("Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Yes", onPress: () => deleteCollection(item.id) },
          ])
        }
      >
        <AntDesign name="delete" size={20} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>
          {collections.length === 0 ? (
            <Text style={styles.emptyText}>No unsynced collections found.</Text>
          ) : (
            <FlatList
              data={collections}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              ListHeaderComponent={() => (
                <View style={[styles.row, styles.headerRow]}>
                  <Text style={styles.headerCell}>Date</Text>
                  <Text style={styles.headerCell}>Customer</Text>
                  <Text style={styles.headerCell}>Amount</Text>
                  <Text style={styles.headerCell}>Action</Text>
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
    alignItems: "center",
  },
  headerRow: {
    borderBottomWidth: 1,
    borderColor: "#999",
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  headerCell: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold",
    color: colors.primary,
  },
  emptyText: {
    marginTop: 30,
    textAlign: "center",
    color: "#777",
    fontSize: 16,
  },
});

export default UnsyncedCollection;
