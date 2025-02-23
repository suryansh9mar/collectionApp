import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const saveDeviceInfo = async () => {
  try {
    const deviceId = Device.osBuildId || "Unknown_ID";  // Get a unique device identifier
    const deviceType = Platform.OS; 

    const deviceData = { deviceId, deviceType };

    await AsyncStorage.setItem('deviceInfo', JSON.stringify(deviceData));
  } catch (error) {
    console.error("Error saving device info:", error);
  }
};

export const getDeviceInfo = async () => {
  try {
    const data = await AsyncStorage.getItem('deviceInfo');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error retrieving device info:", error);
  }
};
