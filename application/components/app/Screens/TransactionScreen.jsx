import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import React, { useEffect } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions } from '../../../Redux/Reducers/transactionSlice';

const TransactionScreen = () => {
  const navigation = useNavigation();

  const dispatch = useDispatch();
  const { userId } = useSelector(state => state.wallet);
  const { transactions } = useSelector(state => state.transaction);

  useEffect(() => {
    dispatch(fetchTransactions(userId));
  }, [userId]);

  console.log('transactions', transactions);

  const data = transactions;
  return (
    <ScrollView className="flex-1 bg-white">
      <View>
        <Pressable
          onPress={() => navigation.goBack()}
          className="flex-row pt-4 pl-5 bg-blue-500 items-center"
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </Pressable>
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
      <View className="w-screen mt-6">
        <View>
          <Text className="px-6 font-bold pb-2">Recent transactions</Text>
        </View>
        <View className="mx-5 border border-t rounded-lg border-gray-200">
          {data.map(item => (
            <View
              key={item._id}
              className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200"
            >
              <View>
                <Text className="text-sm font-semibold">{item.type}</Text>
                <Text className="text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
                <Text className="text-xs text-gray-500">{item.remarks}</Text>
              </View>
              <Text
                className={`text-sm font-bold ${
                  item.amount.startsWith('+')
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {item.amount}
              </Text>
            </View>
          ))}
        </View>
        <View></View>
      </View>
    </ScrollView>
  );
};

export default TransactionScreen;
