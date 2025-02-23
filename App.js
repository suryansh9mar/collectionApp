import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import {
  Login,
  OTPScreen,
  Home,
  Customer,
  Collection,
  Invoice,
  AddCollection,
} from "./app/screens";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-gesture-handler";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { getDeviceInfo, saveDeviceInfo } from "./app/utlity/deviceInfo";

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    saveDeviceInfo();
    const checkLoginStatus = async () => {
      const loggedInStatus = await AsyncStorage.getItem("isLogged");
      setIsLoggedIn(loggedInStatus === "true");
    };
    checkLoginStatus();
  }, []);

  if (isLoggedIn === null) {
    return null;
  }

  const handleLogin = async () => {
    setIsLoggedIn(true);
    await AsyncStorage.setItem("isLogged", "true");
  };

  const handleLogout = async () => {
    try {
      setIsLoggedIn(false);
      await AsyncStorage.setItem("isLogged", "false");
      await AsyncStorage.clear();
      await saveDeviceInfo()
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: "#4CAF50",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 20,
            },
          }}
        >
          {isLoggedIn ? (
            <>
              <Stack.Screen name="Home" options={{ headerShown: false }}>
                {(props) => <Home {...props} onLogOut={handleLogout} />}
              </Stack.Screen>
              <Stack.Screen
                name="AddCollection"
                component={AddCollection}
                options={{ headerShown: true }}
              />
              <Stack.Screen
                name="Customer"
                component={Customer}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="CollectionScreen"
                options={{ headerShown: true }}
                component={Collection}
              />
              <Stack.Screen
                name="Invoice"
                options={{ headerShown: true }}
                component={Invoice}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="Login"
                component={Login}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="OTPScreen" options={{ headerShown: false }}>
                {(props) => <OTPScreen {...props} onLogin={handleLogin} />}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
