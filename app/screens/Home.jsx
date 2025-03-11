import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AntDesign from "react-native-vector-icons/AntDesign";

import { colors } from "../assests/Colors";

const Home = ({ navigation, onLogOut }) => {
  const handleLogout = async () => {
    onLogOut();
  };
  useEffect(() => {
    navigation.setOptions({
      title: "",
      headerShown: true,
      headerRight: () => (
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <AntDesign name="logout" size={25} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Logout Button */}

      {/* Box Buttons for Navigation */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.boxButton}
          onPress={() => navigation.navigate("Customer")}
        >
          <AntDesign
            name="profile"
            size={40}
            color={colors.primary}
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Customers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.boxButton}
          onPress={() => navigation.navigate("AddCollection")}
        >
          <AntDesign
            name="form"
            size={40}
            color={colors.primary}
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Add Collection</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.boxButton}
          onPress={() => navigation.navigate("OrderForm")}
        >
          <AntDesign
            name="plussquareo"
            size={40}
            color={colors.primary}
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    marginHorizontal: 10,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: colors.accent,
    borderRadius: 15,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  boxButton: {
    width: "80%",
    backgroundColor: colors.accent,
    paddingVertical: 30,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // For Android shadow effect
  },
  buttonText: {
    fontSize: 18,
    color: "#FFF",
    fontWeight: "bold",
    marginTop: 10,
  },
  icon: {
    marginBottom: 10,
  },
});

export default Home;
