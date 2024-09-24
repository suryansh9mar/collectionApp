import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { colors } from '../assests/Colors';

const OTPScreen = ({ route,navigation }) => {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState('');

  const handleVerifyOTP = () => {
    if (otp.length === 4 || otp === 1234) {
      Alert.alert('Success', 'OTP Verified!');
      navigation.navigate('Customer')
    } else {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>Enter the 4-digit OTP sent to {phoneNumber}</Text>


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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
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
    backgroundColor: '#FFF',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
 
});

export default OTPScreen;
