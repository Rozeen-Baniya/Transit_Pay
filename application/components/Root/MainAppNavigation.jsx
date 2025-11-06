import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import WelcomeScreen from '../app/WelcomeScreen';
import Login from '../form/Login';
import WalletScreen from '../app/Screens/WalletScreen';
import CardScreen from '../app/Screens/CardScreen';
import TransactionScreen from '../app/Screens/TransactionScreen';
import { Home, CreditCard, User, Receipt, Bus } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ✅ Wrapping Tabs with Stack for proper navigation
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="WalletScreen" component={WalletScreen} />
  </Stack.Navigator>
);

const TripStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="WalletScreen" component={WalletScreen} />
  </Stack.Navigator>
);


const CardsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CardScreen" component={CardScreen} />
  </Stack.Navigator>
);

const TransactionStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TransactionScreen" component={TransactionScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name="Profile"
      component={() => (
        <View className="flex-1 items-center justify-center bg-white">
          <User size={48} color="#3B82F6" />
          <Text className="mt-4 text-xl font-semibold text-gray-700">
            My Profile
          </Text>
          <Text className="mt-2 text-gray-500">Edit your profile</Text>
        </View>
      )}
    />
  </Stack.Navigator>
);

// ✅ Tabs - Labels unchanged ✅
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#3B82F6',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        height: 70,
        paddingBottom: 6,
        paddingTop: 6,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeStack}
      options={{
        tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        tabBarLabel: 'Home',
      }}
    />
    
    <Tab.Screen
      name="Cards"
      component={CardsStack}
      options={{
        tabBarIcon: ({ color, size }) => (
          <CreditCard size={size} color={color} />
        ),
        tabBarLabel: 'Cards',
      }}
    />
    
    <Tab.Screen
      name="Transactions"
      component={TransactionStack}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Receipt size={size} color={color} /> // ✅ Better icon
        ),
        tabBarLabel: 'Transactions',
      }}
    />
    <Tab.Screen
      name="Trips"
      component={TripStack}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Bus size={size} color={color} /> // ✅ Better icon
        ),
        tabBarLabel: 'Trips',
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileStack}
      options={{
        tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        tabBarLabel: 'Profile',
      }}
    />
  </Tab.Navigator>
);

const MainAppNavigation = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Login" component={Login} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default MainAppNavigation;

const styles = StyleSheet.create({});
