import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, NativeModules } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loadToken } from '../../Redux/Reducers/WalletSlice';

const NoInternetScreen = ({ onRetry }) => {

    const {HCEModule} = NativeModules;
    
  const dispatch = useDispatch();

  const {token} = useSelector(state=> state.wallet)

  useEffect(() => {
    dispatch(loadToken())
    if(token !== null){
            HCEModule.sendPayload(token);}
  },[token]);

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Image
        source={require('../assets/apppicon.png')}
        className="w-40 h-40 mb-6"
        resizeMode="contain"
      />
      <Text className="text-red-500 text-2xl font-bold mb-3 text-center">
        No Internet Connection
      </Text>
      <Text className="text-gray-700 text-center mb-6 text-base leading-6">
        Your device is not connected to the internet, but you can still use the tap-to-pay system. 
        Some features may be limited until connection is restored.
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        className="bg-blue-500 px-6 py-3 rounded-lg"
      >
        <Text className="text-white text-lg font-semibold">Retry Connection</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NoInternetScreen;
