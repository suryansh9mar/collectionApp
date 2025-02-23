import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import OTPTextInput from "react-native-otp-textinput";
import { colors } from "../assests/Colors";
import { getDeviceInfo } from "../utlity/deviceInfo";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OTPScreen = ({ route, navigation, onLogin }) => {
  const { phoneNumber, requestId } = route.params;

  const [otpInput, setOtp] = useState("");

  const handleVerifyOTP = async () => {
    const deviceInfo = await getDeviceInfo();
    // console.log(deviceInfo.deviceId);
    // console.log("Request ID:", requestId);
    // console.log("OTP:", otpInput);
    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/v1/auth/otp/verify`,
        {
          request_id: requestId,
          otp: otpInput,
          device_id: deviceInfo.deviceId,
          device_type: deviceInfo.deviceType,
        }
      );
      if (!response.data.success) {
        Alert.alert("Error", response.data.message);
        return;
      }
      if (response.data.success) {
        const { access_token, refresh_token, token_type, expires_in } =
          response.data;
        await AsyncStorage.setItem(
          "authTokens",
          JSON.stringify({
            access_token,
            refresh_token,
            token_type,
            expires_in,
          })
        );
        // console.log("Tokens saved successfully!", response.data);
        onLogin();
      }
    } catch (error) {
      console.error("OTP Verification Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again later.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Enter the 4-digit OTP sent to {phoneNumber}
      </Text>

      <OTPTextInput
        handleTextChange={(text) => setOtp(text)}
        inputCount={4}
        tintColor={colors.accent}
        offTintColor={colors.primary}
        containerStyle={styles.otpInputContainer}
        textInputStyle={styles.otpInput}
      />

      <TouchableOpacity style={styles.button} onPress={handleVerifyOTP}>
        <Text style={styles.buttonText}>Verify OTP</Text>
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
    textAlign: "center",
    marginBottom: 30,
  },
  otpInputContainer: {
    marginBottom: 20,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderColor: colors.accent,
    borderWidth: 2,
    borderRadius: 10,
    fontSize: 20,
    color: colors.primary,
    backgroundColor: "#FFF",
    textAlign: "center",
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

export default OTPScreen;
