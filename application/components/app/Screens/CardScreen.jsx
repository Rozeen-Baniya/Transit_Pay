import { Image, StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { ArrowLeft, Link } from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getCards } from '../../../Redux/Reducers/WalletSlice';

const CardScreen = () => {
  const { cards, userId, error, loading } = useSelector(state => state.wallet);
  const dispatch = useDispatch();

  useEffect(() => {
    if (userId) dispatch(getCards(userId));
  }, [userId]);

  console.log(cards);
  

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>Loading cards...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View>
        <View className="flex-row pt-4 pl-5 bg-blue-500 items-center">
          <ArrowLeft size={24} color="#FFFFFF" />
        </View>
        <View className="w-screen h-28 bg-blue-500 rounded-b-[15%] relative px-6 pt-6">
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

      {/* Link Bank Account */}
      <View className="px-6 mt-6 h-24 bg-blue-100 rounded-xl justify-center flex justify-center mx-5">
        <Text className="text-blue-500 font-semibold text-center">
          Link Your Bank Account
        </Text>
        <View className="flex-row self-center items-center gap-2">
          <Text className="text-gray-500 text-center">Link</Text>
          <Link size={13} color="gray" />
        </View>
      </View>

      {/* Cards Section */}
      <View className="px-6 mt-6">
        <Text className="text-gray-700 text-lg font-semibold mb-4">
          My Cards
        </Text>

        {cards && cards.length > 0 ? (
          cards.map((item, index) => (
            <View key={index} className="bg-white mb-4 relative">
              <Image
                source={require('../../assets/nfccard.png')}
                className="w-full h-52 rounded-lg"
              />
              <View className="absolute bottom-3 right-6 items-end">
                <Text className="text-yellow-300/70 text-xl font-bold">
                  {item.card.cardType.toUpperCase()}
                </Text>
                <Text className="text-white text-sm">
                  {item.name} {item.lastName}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text className="text-gray-500">No cards found.</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default CardScreen;
