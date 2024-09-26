import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Login, OTPScreen, Home, Customer, Collection } from './app/screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';



const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedInStatus = await AsyncStorage.getItem('isLogged');
      setIsLoggedIn(loggedInStatus === 'true');  // Set login status based on AsyncStorage
    }; checkLoginStatus();
  }, []);
  if (isLoggedIn === null) {

    return null;
  }
  const handleLogin = async () => {
    setIsLoggedIn(true);
    await AsyncStorage.setItem('isLogged', 'true');

  };

  const handleLogout = async () => {
    try {
      setIsLoggedIn(false);
      await AsyncStorage.setItem('isLogged', 'false');
      await AsyncStorage.clear()
    } catch (error) {
      console.error('Error during logout:', error);
    }

  };
  return (
    <SafeAreaProvider>
      <StatusBar/>
      <NavigationContainer>
        <Stack.Navigator >
          {isLoggedIn ? (
            <>
              <Stack.Screen name="Home" options={{ headerShown: false }}>
                {(props) => <Home {...props} onLogOut={handleLogout} />}
              </Stack.Screen>
              <Stack.Screen name="Customer" component={Customer} options={{ headerShown: false }} />
              <Stack.Screen name="Collection" component={Collection} options={{ headerShown: false }} />

            </>
          ) : (
            <>

              <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
              <Stack.Screen name="OTPScreen" options={{headerShown:false}}>
                {(props) => <OTPScreen {...props} onLogin={handleLogin} />}

              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}