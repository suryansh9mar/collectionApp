import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Login, OTPScreen ,Home,Customer,Collection} from './app/screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';



const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="OTPScreen" component={OTPScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
        <Stack.Screen name="Customer" component={Customer} options={{ headerShown: false }} />
        <Stack.Screen name="Collection" component={Collection} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}