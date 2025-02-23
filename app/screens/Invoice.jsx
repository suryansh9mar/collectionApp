import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const Invoice = ({ route }) => {
  const { invoiceData } = route.params || {};

  // Function to generate invoice PDF
  const generatePDF = async () => {
    try {
      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; font-size: 22px; font-weight: bold; margin-bottom: 20px; }
              .info { margin: 10px 0; }
              .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              .table, .table th, .table td { border: 1px solid black; padding: 10px; text-align: left; }
              .total { font-weight: bold; font-size: 18px; }
            </style>
          </head>
          <body>
            <div class="header">Invoice - ${invoiceData.invoice_id}</div>

            <div class="info">
              <p><strong>Customer:</strong> ${invoiceData.customer.name}</p>
              <p><strong>Email:</strong> ${invoiceData.email}</p>
              <p><strong>Warehouse:</strong> ${invoiceData.warehouse.name}</p>
              <p><strong>Invoice Date:</strong> ${invoiceData.invoice_date}</p>
              <p><strong>Due Date:</strong> ${invoiceData.due_date}</p>
            </div>

            <table class="table">
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
              ${invoiceData.items
                .map(
                  (item) => `
                  <tr>
                    <td>${item.item.name}</td>
                    <td>${Math.abs(item.quantity)}</td>
                    <td>₹${item.unit_price}</td>
                    <td>₹${Math.abs(item.quantity) * item.unit_price}</td>
                  </tr>
                `
                )
                .join("")}
            </table>

            <div class="info">
              <p class="total">Sales Value: ₹${invoiceData.sales_value}</p>
              <p class="total">Bill Amount: ₹${invoiceData.bill_amount}</p>
              <p class="total">Receipt Amount: ₹${invoiceData.receipt_amount}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      return uri;
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to generate PDF.");
    }
  };

  // Function to share PDF
  const sharePDF = async () => {
    const pdfUri = await generatePDF();
    if (pdfUri) {
      await Sharing.shareAsync(pdfUri);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Invoice</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Invoice ID: {invoiceData.invoice_id}</Text>
        <Text style={styles.label}>Customer: {invoiceData.customer.name}</Text>
        <Text style={styles.label}>Email: {invoiceData.email}</Text>
        <Text style={styles.label}>Warehouse: {invoiceData.warehouse.name}</Text>
        <Text style={styles.label}>Invoice Date: {invoiceData.invoice_date}</Text>
        <Text style={styles.label}>Due Date: {invoiceData.due_date}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.subTitle}>Items:</Text>
        {invoiceData.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text>{item.item.name}</Text>
            <Text>Qty: {Math.abs(item.quantity)}</Text>
            <Text>₹{item.unit_price}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Sales Value: ₹{invoiceData.sales_value}</Text>
        <Text style={styles.label}>Bill Amount: ₹{invoiceData.bill_amount}</Text>
        <Text style={styles.label}>Receipt Amount: ₹{invoiceData.receipt_amount}</Text>
      </View>

      {/* Buttons */}
      <TouchableOpacity style={styles.button} onPress={sharePDF}>
        <Text style={styles.buttonText}>Generate & Share PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  button: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default Invoice;
