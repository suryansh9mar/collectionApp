import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../assests/Colors";

const InvoiceScreen = ({ invoices, navigation }) => {
  const handleClick = (invoiceData) => {
    
    if (navigation) {
      navigation.replace("Invoice", { invoiceData });
    } 
  };
  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleClick(item)}>
      <View style={styles.collectionCard}>
        <Text style={styles.collectionText}>invoice_id: {item.invoice_id}</Text>
        <Text style={styles.collectionText}>
          Date: {new Date(item.invoice_date).toLocaleDateString()}
        </Text>
        <Text style={styles.collectionText}>
          bill_amount: ₹{item.bill_amount}
        </Text>
        <Text style={styles.collectionText}>
          Payment Method: {item.payment_method}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <FlatList
        data={invoices || []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyListText}>No invoices yet.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: "bold",
  },
  collectionCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  collectionText: {
    fontSize: 14,
    // color: "#FFF",
  },
});

export default InvoiceScreen;
