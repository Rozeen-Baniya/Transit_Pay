import { Image, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { ArrowLeft, Link } from 'lucide-react-native';

const CardScreen = () => {
  return (
    <ScrollView className="flex-1 bg-white">
      <View>
        <View className="flex-row pt-4 pl-5 bg-blue-500 items-center">
          <ArrowLeft size={24} color="#FFFFFF" />
        </View>
        <View className="w-screen  h-28 bg-blue-500 rounded-b-[15%] relative px-6 pt-6">
          <View className="w-full flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg">
                <Text className="text-blue-500 text-lg font-bold">P</Text>
              </View>
              <View>
                <Text className="text-white text-xl font-bold ml-4">
                  Prashant Adhikari
                </Text>
                <Text className="text-white text-yellow-300 text-base ml-4 text-xs">
                  @pr4xnt
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View>
        {/* Link you bank account section */}
        <View className="px-6 mt-6 h-24 bg-blue-100 rounded-xl justify-center flex justify-center mx-5">
          <Text className="text-blue-500 font-semibold text-center ">
            Link Your Bank Account
          </Text>
          <View className="flex-row self-center items-center gap-2">
            <Text className="text-gray-500 text-center">Link</Text>
            <Link size={13} color="gray" />
          </View>
        </View>
      </View>
      <View className="px-6 mt-6">
        <Text className="text-gray-700 text-lg font-semibold mb-4">
          My Cards
        </Text>
        <View className="bg-white mb-4 relative">
          <Image
            source={require('../../assets/nfccard.png')}
            className="w-full h-52 rounded-lg"
          />
          <View className="absolute bottom-3 right-6 items-end">
            <Text className="text-yellow-300/70 text-xl  font-bold">GOLD</Text>
            <Text className="text-white text-sm ">Prashant Adhikari</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default CardScreen;
