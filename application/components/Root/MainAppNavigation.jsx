import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../app/WelcomeScreen';
import Login from '../form/Login';
import { Home, CreditCard, User } from 'lucide-react-native';
import WalletScreen from '../app/Screens/WalletScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Tab Screen


// Cards Tab Screen - placeholder for cards management
const CardsTab = () => {
    return (
        <View className="flex-1 items-center justify-center bg-white">
            <CreditCard size={48} color="#3B82F6" />
            <Text className="mt-4 text-xl font-semibold text-gray-700">My Cards</Text>
            <Text className="mt-2 text-gray-500">Manage your transit and payment cards</Text>
        </View>
    );
};

const HomeTab = () => {
    return (
        <View className="flex-1 items-center justify-center bg-white">
            <Home size={48} color="#3B82F6" />
            <Text className="mt-4 text-xl font-semibold text-gray-700">My Home</Text>
            <Text className="mt-2 text-gray-500">Manage your transit and payment cards</Text>
        </View>
    );
};

const ProfileTab = () => {
    return (
        <View className="flex-1 items-center justify-center bg-white">
            <User size={48} color="#3B82F6" />
            <Text className="mt-4 text-xl font-semibold text-gray-700">My Profile</Text>
            <Text className="mt-2 text-gray-500">Edit your profile</Text>
        </View>
    );
};


// Profile Tab Screen


// Main Tab Navigator with bottom dock
const TabNavigator = () => {
    return (
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
                component={HomeTab}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Home size={size} color={color} />
                    ),
                    tabBarLabel: 'Home',
                }}
            />
            <Tab.Screen
                name="Cards"
                component={CardsTab}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <CreditCard size={size} color={color} />
                    ),
                    tabBarLabel: 'Cards',
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileTab}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <User size={size} color={color} />
                    ),
                    tabBarLabel: 'Profile',
                }}
            />
        </Tab.Navigator>
    );
};

const MainAppNavigation = () => {
    return (
        <NavigationContainer >
            <Stack.Navigator  screenOptions={{ headerShown: false }}>
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen name="Login" component={Login} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default MainAppNavigation

const styles = StyleSheet.create({})