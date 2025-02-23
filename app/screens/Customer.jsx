import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../assests/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/AntDesign";
import { getDeviceInfo } from "../utlity/deviceInfo";
import axios from "axios";

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [online, setOnline] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem("authTokens");
      if (!data) throw new Error("No auth token found");

      const { access_token } = JSON.parse(data);
      console.log(access_token);

      const deviceInfo = await getDeviceInfo();
      // console.log(deviceInfo.deviceId);
      // console.log(deviceInfo.deviceType);
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

      if (response.status !== 200) {
        console.error(response.data.message || "Error getting response");
        setOnline(false);
        loadOfflineCustomerData();
        return;
      }

      if (response.data.success) {
        setCustomers(response.data.customers);
              
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      loadOfflineCustomerData(); 
    }
  }, []);
  const loadOfflineCustomerData = async () => {
    try {
      const storedCustomers = await AsyncStorage.getItem("customers");
      if (storedCustomers !== null) {
        setCustomers(JSON.parse(storedCustomers));
        console.log("Loaded customers from AsyncStorage:", JSON.parse(storedCustomers));
      }
    } catch (error) {
      console.error("Error loading offline customers:", error);
    }
  };
  useEffect(() => {
    if (customers.length > 0) {
      storeCustomers(customers);
    }
  }, [customers]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

 
  
  const storeCustomers = async (customers) => {
    try {
      await AsyncStorage.setItem("customers", JSON.stringify(customers));
      console.log("Customers stored successfully!");
    } catch (error) {
      console.error("Error storing customers:", error);
    }
  };

  const handleCustomerClick = (customer) => {
    navigation.navigate("CollectionScreen", { customer ,setOnline});
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={styles.customerCard}>
      <TouchableOpacity onPress={() => handleCustomerClick(item)}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.dueAmount}>Due Amount: {item.balance}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => handleDetails(item)}
      >
        <Text style={styles.detailsButtonText}>Details</Text>
      </TouchableOpacity>
    </View>
  );
  useEffect(() => {
    navigation.setOptions({
      title: "",
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrowleft" size={25} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleDetails = (customer) => {
    setSelectedCustomer(customer);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Customers</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Customers"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      {filteredCustomers.length === 0 ? (
        <Text style={styles.noResultsText}>No results found</Text>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}

      {/* Modal for Customer Details */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Customer Details</Text>
              {selectedCustomer && (
                <>
                  <Text style={styles.modalText}>
                    Name: {selectedCustomer.name}
                  </Text>
                  <Text style={styles.modalText}>
                    Phone: {selectedCustomer.phone}
                  </Text>
                  <Text style={styles.modalText}>
                    Address: {selectedCustomer.address}
                  </Text>
                  <Text style={styles.modalText}>
                    Balance: {selectedCustomer.balance}
                  </Text>
                </>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    height: 40,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  customerCard: {
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    color: "#FFF",
  },
  dueAmount: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 5,
  },
  detailsButton: {
    backgroundColor: colors.secondry,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    position: "absolute",
    right: 10,
    top: 15,
  },
  detailsButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 5,
  },
  closeButton: {
    backgroundColor: colors.error,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 30,
    left: 10,
    zIndex: 1,
  },
});

export default Customer;
