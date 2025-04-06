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
    <SafeAreaView style={styles.container}>
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
    paddingTop: 0,
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
  },
  collectionCard: {
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  collectionText: {
    fontSize: 16,
    color: "#FFF",
  },
});

export default InvoiceScreen;
