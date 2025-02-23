// LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { colors } from "../assests/Colors";
import axios from "axios";
import { getDeviceInfo } from "../utlity/deviceInfo";




const LoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
   
  const handleSendOTP = async () => {
    const deviceInfo = await getDeviceInfo();
    console.log(deviceInfo);
    
    if (phoneNumber.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number.");
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/v1/auth/otp/request`,
        {
          phone_number: phoneNumber,
          device_id: deviceInfo.deviceId,
          device_type: deviceInfo.deviceType,
          app_version: "1.0.0",
        }
      );
      if (!response.data.success) {
        Alert.alert("Error", response.data.message);
      }
      if (response.data.success) {
        navigation.navigate("OTPScreen", {
          phoneNumber,
          requestId: response.data.request_id,
        });
        // console.log(response.data);
        
        
      }
    } catch (error) {
      console.error("OTP Request Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again later.");
  }};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.subtitle}>Enter your phone number</Text>

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        keyboardType="numeric"
        maxLength={10}
        value={phoneNumber}
        onChangeText={(text) => setPhoneNumber(text)}
      />

      <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
        <Text style={styles.buttonText}>Send OTP</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#6B7280",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: colors.accent,
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 18,
    backgroundColor: "#FFF",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LoginScreen;
