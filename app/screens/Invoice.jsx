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
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }
            .header { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .details-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px 40px;
            }
            .detail-row { margin-bottom: 5px; }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 13px;
            }
             .table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .table th {
              background-color: #f0f0f0;
              border: 1px solid #ddd;
              padding: 8px;
              text-align: center;
            }
            .summary-layout {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
            }
            .narration-box {
              width: 48%;
              padding: 10px;
              border: 1px solid #ccc;
              font-size: 13px;
              background-color: #fafafa;
            }
            .amount-summary {
              width: 48%;
            }
            .amount-summary table {
              width: 100%;
              font-size: 14px;
              border-collapse: collapse;
            }
            .amount-summary td {
              padding: 8px;
            }
            .summary-label {
              text-align: right;
              font-weight: bold;
              width: 60%;
            }
            .summary-value {
              text-align: left;
              width: 40%;
            }
          </style>
        </head>
        <body>
          <div class="header">Sales Invoice</div>

          <div class="section">
            <div class="section-title">Basic Details</div>
            <div class="details-grid">
              <div class="detail-row"><strong>Invoice No:</strong> ${invoiceData.invoice_id}</div>
              <div class="detail-row"><strong>Invoice Date:</strong> ${invoiceData.invoice_date}</div>
              <div class="detail-row"><strong>Customer:</strong> ${invoiceData.customer.name}</div>
              <div class="detail-row"><strong>Due Date:</strong> ${invoiceData.due_date}</div>
              <div class="detail-row"><strong>Warehouse:</strong> ${invoiceData.warehouse.name}</div>
              <div class="detail-row"><strong>Email:</strong> ${invoiceData.email}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Items</div>
            <table class="table">
              <thead>
                <tr>
                  <th>SN</th>
                  <th>Item Name</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items
                  .map(
                    (item, index) => ` 
                    <tr>
                      <td>${index + 1}</td>
                      <td>${item.item.name}</td>
                      <td>${Math.abs(item.quantity)}</td>
                      <td>₹${item.unit_price}/${item.unit.name}</td>
                      <td style="text-align: right;">₹${Math.abs(item.quantity) * item.unit_price}</td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Summary</div>
            <div class="summary-layout">
              <div class="narration-box">
                <strong>Narration:</strong><br/>
                ${invoiceData.narration ? invoiceData.narration : "—"}
              </div>

              <div class="amount-summary">
                <table>
                  <tr>
                    <td class="summary-label">Sale Value:</td>
                    <td class="summary-value">₹${invoiceData.sales_value}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Bill Amount:</td>
                    <td class="summary-value">₹${invoiceData.bill_amount}</td>
                  </tr>
                  <tr>
                    <td class="summary-label">Receipt Amount:</td>
                    <td class="summary-value">₹${invoiceData.receipt_amount}</td>
                  </tr>
                </table>
              </div>
            </div>
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
