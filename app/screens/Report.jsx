import { View, Text, StyleSheet } from "react-native";
import React, { useState } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import UnsyncedCollections from "../components/UnsyncedCollections";
import UnsyncedOrders from "../components/UnsyncedOrders";
import { colors } from "../assests/Colors";

const Tab = createMaterialTopTabNavigator();
export default function Report() {
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
      <Tab.Screen name="CollectionTab" options={{ title: "Collection" }}>
        {(props) => <UnsyncedCollections {...props} />}
      </Tab.Screen>
      <Tab.Screen name="Invoice" options={{ title: "Invoice" }}>
        {(props) => <UnsyncedOrders {...props} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
