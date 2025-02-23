import React, { useEffect, useState } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import InvoiceScreen from "./InvoiceTab"; // Create this file for invoices
import { colors } from "../assests/Colors";
import CollectionTab from "./CollectionTab";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceInfo } from "../utlity/deviceInfo";
import axios from "axios";

const Tab = createMaterialTopTabNavigator();

const Collection = ({ route,navigation }) => {
  const { customer,setOnline} = route.params;
  const [collectionData, setCollectionData] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [totalPaidAmt, setTotalPaidAmt] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  
  const fetchData = async () => {
    try {
      const authTokens = await AsyncStorage.getItem("authTokens");
      const { access_token } = JSON.parse(authTokens);
      const deviceInfo = await getDeviceInfo();
      const formdata = new FormData();
      formdata.append("customer_id", customer.id);
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/v1/customer-invoices`,
        formdata,
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
        loadOffline();
        return;
      }
      if (response.status === 200) {
        console.log("success--", response.data);
        setTotalPaidAmt(response.data.totalPaymentAmount);
        setCollectionData(response.data.paymentTransactions);
        setCurrentBalance(response.data.balance);
        setInvoiceData(response.data.invoices);
      }
    } catch (error) {
      console.error("error:", error);
      loadOffline();
      setOnline(false)
    }
  };

  //storing offlline
  const storeCollectionData = async (collectionData) => {
    try {
      await AsyncStorage.setItem(
        `collectionData${customer.id}`,
        JSON.stringify(collectionData)
      );
      console.log("collectionData stored successfully!");
    } catch (error) {
      console.error("Error storing collectionData:", error);
    }
  };
  const storeInvoiceData = async (invoiceData) => {
    try {
      await AsyncStorage.setItem(`invoiceData${customer.id}`, JSON.stringify(invoiceData));
      console.log("invoiceData stored successfully!");
    } catch (error) {
      console.error("Error storing invoiceData:", error);
    }
  };
  useEffect(() => {
    if (collectionData.length > 0) {
      storeCollectionData(collectionData);
    }
    if (invoiceData.length > 0) {
      storeInvoiceData(invoiceData);
    }
  }, [invoiceData, collectionData,navigation]);

  ///stored offline
  //load offlline
  const loadOffline = async () => {
    try {
      const storedCollectionData = await AsyncStorage.getItem("collectionData");
      const storedInvoiceData = await AsyncStorage.getItem("invoiceData");
      if (storedCollectionData !== null) {
        setCollectionData(JSON.parse(storedCollectionData));
        console.log(
          "Loaded storedCollectionData from AsyncStorage:",
          JSON.parse(storedCollectionData)
        );
      }

      if (storedInvoiceData !== null) {
        setInvoiceData(JSON.parse(storedInvoiceData));
        console.log(
          "Loaded storedInvoiceData from AsyncStorage:",
          JSON.parse(storedInvoiceData)
        );
      }
    } catch (error) {
      console.error("Error loading offline data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    navigation.setOptions({
      title:customer.name,
    })
  }, [navigation]);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: colors.background },
        tabBarLabelStyle: { fontSize: 16, fontWeight: "bold" },
        tabBarActiveTintColor: colors.primary,
        tabBarIndicatorStyle: { backgroundColor: colors.primary },
        tabBarBounces: true,
        swipeEnabled: false,
      }}
      tabBarPosition="bottom"
    >
      <Tab.Screen
        name="CollectionTab"
        options={{ title: "Collection" }}
        initialParams={{ customer ,setCollectionData}}
      >
        {(props) => <CollectionTab {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Invoice" options={{ title: "Invoice" }}>
        {(props) => <InvoiceScreen {...props} invoices={invoiceData} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default Collection;
