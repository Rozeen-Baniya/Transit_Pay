import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Text,
  ViewBase,
  Image,
} from 'react-native';
import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import {
  Building,
  ChevronLeft,
  ChevronRight,
  Search,
  Wallet,
} from 'lucide-react-native';

const WalletScreen = () => {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="w-screen pt-14 h-60 bg-blue-500 rounded-b-[15%] relative px-6 pt-10">
        <View className="w-full flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-bold">
              Hello, Prashant
            </Text>
            <Text className="text-white text-base mt-2">
              Welcome back to TransitPAY
            </Text>
          </View>
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg">
            <Text className="text-blue-500 text-lg font-bold">P</Text>
          </View>
        </View>
        <View className=" w-full mt-3">
          <View className="flex-row mt-6 items-center">
            <Text className="text-xs text-yellow-300 font-bold">Travelled</Text>{' '}
          </View>
          <Text className="text-white text-xs m">
            <Text className="text-yellow-300 font-bold text-lg">120</Text> km
          </Text>

        </View>
        <View className="absolute flex-row items-center h-12 w-[80%] bg-white -bottom-6 left-[17%] shadow-2xl rounded-xl px-3">
          <TextInput
            placeholder="Search for buses..."
            className="flex-1 text-base text-gray-700"
            placeholderTextColor="#999"
          />
          <TouchableOpacity className="p-2 rounded-full bg-blue-500">
            <Search color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
      <View className="mt-12 bg-blue-500 mx-5  rounded-lg">
        {' '}
        <View className=" p-4 flex-row justify-between ">
          <View className="">
            <Text className="text-xs text-gray-300 mt-1">Balance (NPR)</Text>
            <Text className="text-2xl text-white font-semibold ">250.00</Text>
          </View>
          <View className=" flex-row items-center h-10 self-center px-2 py-2 gap-2 bg-gray-500/50 border-white border rounded-lg">
            <Wallet size={20} color="gold" />
            <Text className="text-white text-sm font-semibold text-gray-700">
              Topup
            </Text>
          </View>
        </View>
        <View className="h-[1px] w-[90%] mx-auto bg-gray-500"></View>
       <View className=" w-full mt-3 px-5 pb-4 flex-row justify-between items-center">
          <Text className="text-white text-xs">
            <Text className="text-yellow-300 font-bold text-lg">12</Text> TC
          </Text>
          <View className="flex-row items-center">
            <Text className="text-xs text-purple-800 font-bold">Exchange</Text>{' '}
            <ChevronRight size={12} color={'purple'} />
          </View>
        </View>
        </View>
   
    </ScrollView>
  );
};

export default WalletScreen;

const styles = StyleSheet.create({});
