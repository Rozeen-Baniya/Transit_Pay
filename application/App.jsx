import { View, ActivityIndicator, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './global.css';
import NavigationHandler from './components/Root/NavigationHandler';
import MainAppNavigation from './components/Root/MainAppNavigation';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './Redux/store';
import { checkInternetConnection } from './Redux/Reducers/appSlice'; 
import InitialLogoScreen from './components/app/InitialLogoScreen';
import NoInternetScreen from './components/app/NoInternetScreen'

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const dispatch = useDispatch();
  const [timePassed, setTimePassed] = useState(false);

  

  // Timer for initial logo
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimePassed(true);
    }, 2000); // 4 seconds

    return () => clearTimeout(timer);
  }, [timePassed]);

  const onRetry = () => {
    setTimePassed(false)
  }

  // Read internet connection state from Redux
  const isConnected = useSelector(state => state.app.isInternetConnected);

  // Check internet connection
  useEffect(() => {
    dispatch(checkInternetConnection());
  }, [timePassed]);

  // Show loading while auth is loading
  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  // Show InitialLogoScreen if 4 seconds haven't passed yet
  if (!timePassed) {
    return <InitialLogoScreen />;
  }

  if(!isConnected) {
    return <NoInternetScreen onRetry={onRetry}/>
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1">
          {isAuthenticated ? <MainAppNavigation /> : <NavigationHandler />}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Provider>
  );
};

export default App;
